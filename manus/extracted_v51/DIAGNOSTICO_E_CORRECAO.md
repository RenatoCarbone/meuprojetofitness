# MiPlanFit — diagnóstico e correção da persistência do perfil

**Data da revisão:** 10 de agosto de 2026  
**Escopo inspecionado:** `index.html`, `plano.html`, `admin.html`, `js/app.js`, `js/auth.js`, `js/plano.js`, `js/admin.js` e `test-db.html`.

## Conclusão

O questionário **cria corretamente** o objeto `perfil` e o grava em `localStorage`, `sessionStorage` e cookie. A perda ocorre depois, no retorno do OAuth, porque `plano.js` consulta a linha do Supabase antes de recuperar o perfil local e deixa toda a recuperação local dentro do bloco que só roda se a nuvem já tiver um perfil **e** um plano válidos. Uma linha com `perfil: {}` torna essa condição falsa; logo, o navegador não usa o perfil do quiz para reparar a linha vazia.

> A recuperação do perfil local precisa ocorrer **antes** da decisão “nuvem ou navegador”, e um perfil de quiz recém-enviado precisa ter prioridade sobre uma linha incompleta no banco.

| Ponto | Estado anterior | Consequência | Correção aplicada |
|---|---|---|---|
| `js/app.js` | O perfil era salvo localmente, mas não havia um marcador explícito de sincronização pendente. | O retorno do OAuth podia tratar a linha vazia como fonte de dados sem saber que havia um quiz novo. | Incluído `miplanfit_quiz_pending_sync = true` ao concluir o formulário. |
| `js/plano.js` | Leitura de `pdata`/`localStorage`/backups e reparo no Supabase estavam aninhados em `if (cloudHasValidPerfil && cloudHasValidPlan)`. | Quando a nuvem contém `{}` ou não contém plano, o reparo não acontece. | Perfil local é resolvido primeiro; o quiz pendente é sincronizado antes de usar a nuvem. |
| `js/auth.js` | O payload podia omitir `perfil`; a função reportava sucesso mesmo após erro de insert/update. | Uma linha vazia continuava vazia e o problema ficava silencioso. | Perfil inválido é bloqueado; perfil válido é sempre enviado; erros retornam `false`. |
| Gravação no banco | Fluxo “buscar, depois inserir ou atualizar” não era atômico. | Maior risco de corrida e tratamento inconsistente de falhas. | Uma operação `upsert(..., { onConflict: 'user_id' })` passa a criar ou atualizar a mesma linha. |
| `js/admin.js` | Os gráficos classificavam objetivo por `perfil.objetivo`, mas o quiz grava principalmente `objetivo_kg`. | O gráfico de objetivo e a persona podiam ficar incorretos mesmo com perfil válido. | Normalização central de objetivo a partir de `objetivo_kg`, com fallback ao campo legado. |
| `test-db.html` | O botão público simulava gravação com `user_id` como `test_user_1234` (não UUID) e usava `upsert`. | Essa é a origem encontrada para a requisição `POST .../planos?on_conflict=user_id 400`; esse ID viola a coluna `uuid`. | Escrita simulada foi desativada. Valide com o fluxo real do quiz e um usuário autenticado. |

## Origem precisa do `perfil: {}`

O fluxo atual apresentava dois defeitos que se reforçavam. Primeiro, `salvarPlanoNaNuvem` só acrescentava `payload.perfil` quando recebia um objeto não vazio. Assim, se uma chamada posterior chegasse sem um perfil válido, ela atualizava outras colunas e não reparava a linha já existente com `{}`. Segundo, `plano.js` só recuperava o `perfil` preservado no navegador dentro do caminho em que a própria nuvem já era válida. Esse caminho é logicamente impossível quando a linha tem `perfil: {}`.

A correção resolve o impasse desta forma: o perfil pendente do quiz é lido de `localStorage`, `sessionStorage` e, apenas para compatibilidade com links antigos, do parâmetro legado `pdata`; o código então o valida, acrescenta `pesoActual` se necessário, gera ou recupera `plan30`, grava tudo no Supabase e só remove o marcador de pendência após sucesso.

## Origem precisa do erro `400` com `on_conflict=user_id`

A rotina normal publicada em `js/auth.js?v=4.9` não usava `upsert`; ela fazia uma consulta e depois `insert`/`update`. A única chamada com `onConflict: 'user_id'` encontrada no repositório estava em `test-db.html`. Ela criava `test_user_` seguido de números, mas a coluna `public.planos.user_id` é `uuid`; esse valor de teste não pode ser gravado. Portanto, se o erro observado veio da página de diagnóstico, ele é esperado e não prova falha no fluxo do quiz.

Para um `upsert`, a coluna informada em `onConflict` deve possuir chave primária ou restrição `UNIQUE`, e a chave deve estar no payload. O `user_id` descrito para a tabela já é PK, portanto é a chave correta para a operação. [1]

## Alterações entregues

O pacote inclui os seguintes arquivos revisados:

| Arquivo | Alteração principal |
|---|---|
| `js/app.js` | Sinaliza que o quiz precisa ser sincronizado depois do OAuth. |
| `js/auth.js` | Centraliza validação/recuperação do perfil; troca o fluxo não atômico por `upsert`; deixa de declarar sucesso em erro; remove dados de saúde da URL OAuth. |
| `js/plano.js` | Corrige a ordem de prioridade: quiz pendente/local válido → nuvem válida → redirecionamento ao quiz. |
| `js/admin.js` | Lê objetivo a partir de `objetivo_kg` nos gráficos, persona, tabela e CSV. |
| `test-db.html` | Remove o teste de escrita inválido que causava o 400. |
| `supabase_preflight_and_guard.sql` | Consulta de pré-validação, inventário dos legados `{}` e restrição para bloquear novos perfis vazios. |
| `test_persistence_flow.js` | Cinco testes automatizados para o fluxo crítico. |

Também foi preservada compatibilidade temporária com URLs OAuth antigas que já carreguem `pdata`. Contudo, novos logins não inserem mais o perfil no endereço. O perfil inclui dados de saúde e preferências alimentares; Base64 não é criptografia, portanto não é apropriado para uma query string.

## Validação realizada

Os scripts modificados passaram por validação sintática com `node --check`. O teste automatizado passou nos cinco cenários abaixo.

| Cenário | Resultado esperado | Resultado |
|---|---|---|
| Tentativa de salvar `{}` | Bloqueia a escrita e retorna `false`. | Aprovado. |
| Perfil completo | Executa um único upsert com `onConflict: 'user_id'`, `pesoActual` e dados do Google. | Aprovado. |
| Erro do banco/RLS | Propaga falha como `false`; não registra falso sucesso. | Aprovado. |
| Recuperação pós-OAuth | Recupera o perfil completo do armazenamento local. | Aprovado. |
| Redirecionamento OAuth | Redireciona ao plano sem parâmetro `pdata`. | Aprovado. |

Esses testes simulam o cliente Supabase; não validam permissões ou dados reais do seu projeto. A verificação final deve ser feita no navegador após publicar e com uma conta Google de teste.

## Como publicar e validar

1. Aplique os arquivos modificados do pacote ao repositório e faça o deploy na Cloudflare Pages. Em seguida, confirme que os scripts carregados pela página têm um novo versionamento de cache. Recomendo mudar `?v=4.9` para uma nova versão, por exemplo `?v=5.0`, em `index.html`, `plano.html`, `resultado.html` e `admin.html`; isso evita o navegador reutilizar JavaScript antigo.
2. No SQL Editor do Supabase, execute primeiro as consultas 1–3 de `supabase_preflight_and_guard.sql`. Elas confirmam a chave de conflito, listam linhas com perfil vazio e mostram o estado de RLS. Depois de conferir os resultados, aplique a etapa 4 para impedir que novos `{}` sejam aceitos.
3. Abra uma janela anônima, complete o quiz com valores reconhecíveis, faça login Google e espere o redirecionamento para `plano.html`.
4. Em `public.planos`, confirme que a linha do usuário contém `perfil.nombre`, `sexo`, `edad`, `altura`, `peso`, `pesoActual`, `objetivo_kg`, `preferencia` e as listas do quiz. Confirme também que `plan30` não é vazio.
5. Abra o painel e confirme que a tabela não mostra `Quiz Pendente`, a gaveta traz peso inicial/atual/meta e os quatro gráficos possuem os números esperados.

| Checagem no DevTools | Resultado correto após a publicação |
|---|---|
| Requisição de persistência | `POST /rest/v1/planos?on_conflict=user_id` pode existir e deve retornar **201/200**, nunca 400. |
| Corpo enviado | Deve conter `user_id` UUID do usuário autenticado e `perfil` com dados completos; jamais `{}`. |
| Retorno de `salvarPlanoNaNuvem` | `true` somente se o Supabase não retornar `error`. |
| Página de diagnóstico | Não deve mais emitir uma escrita com `test_user_*`. |

## Observação de segurança prioritária

O painel administrativo atual tem um PIN exposto em `js/admin.js` e consulta `select('*')` da tabela diretamente do navegador. Qualquer pessoa pode ler o código entregue pela página e encontrar o PIN; além disso, se RLS estiver desativado ou permissivo, os dados de todos os clientes podem ficar acessíveis pelo cliente público. A documentação do Supabase recomenda habilitar RLS em tabelas expostas e usar políticas limitadas ao usuário autenticado. [2]

Não aplique uma política pública de leitura em `planos` apenas para manter o painel funcionando. O caminho seguro é: restringir `planos` para o próprio usuário com RLS e mover os dados agregados/administração para uma Edge Function ou outro backend que mantenha a credencial de serviço fora do navegador. A própria documentação alerta que chaves de serviço não devem ser expostas a clientes. [2]

## Referências

[1]: https://supabase.com/docs/reference/javascript/upsert "Supabase JavaScript — upsert"
[2]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase — Row Level Security"
