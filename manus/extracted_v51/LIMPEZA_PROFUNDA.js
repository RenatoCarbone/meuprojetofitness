/**
 * MIPLANFIT — LIMPEZA PROFUNDA E RESET DE SESSÃO
 * Copie e cole este código no Console do Navegador (F12)
 * em qualquer página do site (index.html ou plano.html)
 */

(async function() {
  console.log("🧹 Iniciando limpeza profunda...");

  // 1. Limpar todos os dados locais que podem estar corrompidos
  const keysParaLimpar = [
    'miplanfit_perfil',
    'miplanfit_perfil_backup',
    'miplanfit_plan30',
    'miplanfit_plan_id',
    'miplanfit_imc',
    'miplanfit_tmb',
    'miplanfit_tdee',
    'miplanfit_quiz_pending_sync',
    'miplanfit_premium',
    'miplanfit_admin_logged'
  ];

  keysParaLimpar.forEach(k => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });

  // 2. Limpar Cookies
  document.cookie = "miplanfit_perfil_ck=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

  console.log("✅ Armazenamento local limpo.");

  // 3. Fazer Logout do Supabase (se possível)
  if (typeof getSupabase === 'function') {
    try {
      const client = getSupabase();
      await client.auth.signOut();
      console.log("✅ Sessão do Supabase encerrada.");
    } catch (e) {
      console.warn("Aviso: Não foi possível encerrar a sessão do Supabase.", e);
    }
  }

  alert("Limpeza concluída! O navegador foi resetado.\n\nAgora você será redirecionado para a página inicial para fazer o quiz DO ZERO. Isso garantirá que o novo código (v5.0) crie seu perfil corretamente no banco.");

  // 4. Redirecionar para o index limpo
  window.location.href = "index.html";
})();
