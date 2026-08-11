// ============================================================
// MIPLANFIT — CENTRAL DE INTELIGÊNCIA E PERSONA BI 4.0
// ============================================================

let todosOsUsuariosAdmin = [];
let usuarioSelecionadoDrawer = null;

// Instâncias dos gráficos Chart.js
let chartGenderInstance = null;
let chartAgeInstance = null;
let chartGoalInstance = null;
let chartDietInstance = null;

function categoriaObjetivo(perfil = {}) {
  const objetivoKg = Number(perfil.objetivo_kg);
  if (Number.isFinite(objetivoKg)) return objetivoKg <= 0 ? 'mantener' : 'perder';

  const objetivo = String(perfil.objetivo || '').toLowerCase();
  if (objetivo.includes('mantener')) return 'mantener';
  if (objetivo.includes('musculo') || objetivo.includes('massa')) return 'musculo';
  return 'perder';
}

function textoObjetivo(perfil = {}) {
  const objetivoKg = Number(perfil.objetivo_kg);
  if (Number.isFinite(objetivoKg)) {
    return objetivoKg <= 0 ? '⚖️ Manter peso' : `📉 Perder ${objetivoKg} kg`;
  }

  const objetivoMap = {
    perder_peso: '📉 Perder Peso',
    mantener: '⚖️ Manter Peso',
    ganar_musculo: '💪 Ganhar Massa'
  };
  return objetivoMap[perfil.objetivo] || perfil.objetivo || 'Personalizado';
}

document.addEventListener('DOMContentLoaded', async function() {
  await verificarAccesoAdmin();
});

const MASTER_PINS = ['RenatoLindo123'];

// ─── 1. Segurança: Verificar Acesso do Administrador ───
async function verificarAccesoAdmin() {
  const lockScreen = document.getElementById('admin-lock-screen');
  const lockError = document.getElementById('lock-error-msg');

  if (sessionStorage.getItem('miplanfit_admin_logged') === 'true') {
    if (lockScreen) lockScreen.style.display = 'none';
    const emailSpan = document.getElementById('admin-user-email');
    if (emailSpan) emailSpan.innerText = '👑 Administrador Master';
    await cargarDatosAdmin();
    return;
  }

  const client = getSupabase();
  if (!client) {
    if (lockScreen) lockScreen.style.display = 'flex';
    return;
  }

  try {
    const { data: { session } } = await client.auth.getSession();
    if (session && session.user) {
      const userEmail = (session.user.email || '').toLowerCase();
      if (lockScreen) lockScreen.style.display = 'none';
      const emailSpan = document.getElementById('admin-user-email');
      if (emailSpan) emailSpan.innerText = userEmail;
      await cargarDatosAdmin();
      return;
    } else {
      if (lockScreen) lockScreen.style.display = 'flex';
    }
  } catch(e) {
    console.error('Erro ao verificar sessão admin:', e);
  }
}

function loginAdminConPin() {
  const inputPin = (document.getElementById('admin-pin-input')?.value || '').trim();
  const lockError = document.getElementById('lock-error-msg');

  if (MASTER_PINS.includes(inputPin)) {
    sessionStorage.setItem('miplanfit_admin_logged', 'true');
    const lockScreen = document.getElementById('admin-lock-screen');
    if (lockScreen) lockScreen.style.display = 'none';
    const emailSpan = document.getElementById('admin-user-email');
    if (emailSpan) emailSpan.innerText = '👑 Administrador Master';
    cargarDatosAdmin();
  } else {
    if (lockError) {
      lockError.innerText = '❌ Chave Master incorreta. Tente novamente.';
      lockError.style.display = 'block';
    }
  }
}

async function loginAdminConGoogle() {
  const client = getSupabase();
  if (!client) return;
  const adminUrl = window.location.origin + '/admin.html';
  await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: adminUrl }
  });
}

async function logoutAdmin() {
  sessionStorage.removeItem('miplanfit_admin_logged');
  const client = getSupabase();
  if (client) await client.auth.signOut();
  window.location.reload();
}

// ─── 2. Carregar Dados Completos do Supabase ───
async function cargarDatosAdmin() {
  const client = getSupabase();
  const tableBody = document.getElementById('admin-users-table-body');

  if (!client) return;

  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding:40px; color:var(--text-muted);">
          ⏳ Carregando cockpit de inteligência do Supabase...
        </td>
      </tr>`;
  }

  try {
    const { data: planosData, error: planosErr } = await client
      .from('planos')
      .select('*')
      .order('updated_at', { ascending: false });

    if (planosErr) {
      console.error('Erro ao consultar planos:', planosErr.message);
      if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:#ef4444;">⚠️ Erro: ${planosErr.message}</td></tr>`;
      }
      return;
    }

    todosOsUsuariosAdmin = planosData || [];

    const elDebug = document.getElementById('admin-raw-debug');
    if (elDebug) {
      elDebug.innerText = JSON.stringify(todosOsUsuariosAdmin, null, 2);
    }

    // 2. Consultar eventos de analytics (Visitas e Quiz Starts)
    let visitasContador = parseInt(localStorage.getItem('miplanfit_stat_visita') || '0');
    let quizStartsContador = parseInt(localStorage.getItem('miplanfit_stat_quiz_start') || '0');

    // Asegurar que las visitas reflejen los datos reales
    if (visitasContador < todosOsUsuariosAdmin.length) visitasContador = todosOsUsuariosAdmin.length;
    if (quizStartsContador < todosOsUsuariosAdmin.length) quizStartsContador = todosOsUsuariosAdmin.length;

    renderizarMeticasKPI(todosOsUsuariosAdmin);
    renderizarGraficosDemograficos(todosOsUsuariosAdmin);
    renderizarResumoPersona(todosOsUsuariosAdmin);
    renderizarFunilConversao(visitasContador, quizStartsContador, todosOsUsuariosAdmin);
    renderizarTablaAdmin(todosOsUsuariosAdmin);

  } catch(e) {
    console.error('Exceção ao carregar dados admin:', e);
  }
}

// ─── 3. Renderizar Métricas KPI ───
function renderizarMeticasKPI(usuarios) {
  const totalUsers = usuarios.length;
  const hoyStr = new Date().toISOString().split('T')[0];
  const creadosHoy = usuarios.filter(u => {
    const dateStr = u.updated_at || u.created_at || '';
    return dateStr.startsWith(hoyStr);
  }).length;

  const premiumUsers = usuarios.filter(u => u.is_premium === true).length;
  const tasaConversion = totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : '0.0';

  let totalKgLost = 0;
  usuarios.forEach(u => {
    const perfil = u.perfil || {};
    const pesoInit = parseFloat(perfil.peso || 70);
    const pesoActual = parseFloat(perfil.pesoActual || pesoInit);
    if (pesoInit > pesoActual) {
      totalKgLost += (pesoInit - pesoActual);
    } else {
      const dias = (u.dias_completados || []).length;
      totalKgLost += (dias * 0.15);
    }
  });

  document.getElementById('kpi-total-users').innerText = totalUsers;
  document.getElementById('kpi-plans-today').innerText = creadosHoy;
  document.getElementById('kpi-premium-users').innerText = premiumUsers;
  document.getElementById('kpi-conversion-rate').innerText = `${tasaConversion}% Conversão Global`;
  document.getElementById('kpi-total-kg-lost').innerText = `💪 ${totalKgLost.toFixed(1)} kg`;
}

// ─── 4. Renderizar Gráficos de Demografia e Persona (Chart.js Style Google Cloud / Vertex) ───
function renderizarGraficosDemograficos(usuarios) {
  let mujeres = 0, hombres = 0;
  let edadGroup = { '<25': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0 };
  let objetivos = { perder: 0, mantener: 0, musculo: 0 };
  let dietas = { omnivoro: 0, vegetariano: 0, vegano: 0 };
  let treino = { casa: 0, gym: 0, no: 0 };

  usuarios.forEach(u => {
    const perfil = u.perfil || {};
    const tienePerfil = perfil && typeof perfil === 'object' && Object.keys(perfil).length > 0;
    if (!tienePerfil) return;

    // Gênero
    const sexo = (perfil.sexo || 'mujer').toLowerCase();
    if (sexo === 'hombre' || sexo === 'masculino') hombres++;
    else mujeres++;

    // Idade
    const edad = parseInt(perfil.edad || 30);
    if (edad < 25) edadGroup['<25']++;
    else if (edad <= 34) edadGroup['25-34']++;
    else if (edad <= 44) edadGroup['35-44']++;
    else if (edad <= 54) edadGroup['45-54']++;
    else edadGroup['55+']++;

    // Objetivo
    const categoria = categoriaObjetivo(perfil);
    if (categoria === 'perder') objetivos.perder++;
    else if (categoria === 'mantener') objetivos.mantener++;
    else objetivos.musculo++;

    // Dieta
    const pref = (perfil.preferencia || 'omnivoro').toLowerCase();
    if (pref.includes('vegano')) dietas.vegano++;
    else if (pref.includes('vegetariano')) dietas.vegetariano++;
    else dietas.omnivoro++;

    // Treino
    const ej = (perfil.ejercicios || 'casa').toLowerCase();
    if (ej.includes('casa')) treino.casa++;
    else if (ej.includes('gym') || ej.includes('gimnasio')) treino.gym++;
    else treino.no++;
  });

  // 1. Gráfico de Gênero (Donut Chart)
  const ctxGender = document.getElementById('chart-gender')?.getContext('2d');
  if (ctxGender) {
    if (chartGenderInstance) chartGenderInstance.destroy();
    chartGenderInstance = new Chart(ctxGender, {
      type: 'doughnut',
      data: {
        labels: ['Mulheres', 'Homens'],
        datasets: [{
          data: [mujeres, hombres],
          backgroundColor: ['#ec4899', '#06b6d4'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#9ca3af', font: { size: 11 } } } }
      }
    });
  }

  // 2. Gráfico de Idade (Bar Chart)
  const ctxAge = document.getElementById('chart-age')?.getContext('2d');
  if (ctxAge) {
    if (chartAgeInstance) chartAgeInstance.destroy();
    chartAgeInstance = new Chart(ctxAge, {
      type: 'bar',
      data: {
        labels: ['< 25', '25-34', '35-44', '45-54', '55+'],
        datasets: [{
          label: 'Usuários',
          data: [edadGroup['<25'], edadGroup['25-34'], edadGroup['35-44'], edadGroup['45-54'], edadGroup['55+']],
          backgroundColor: '#8b5cf6',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#9ca3af' }, grid: { display: false } },
          y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  }

  // 3. Gráfico de Objetivo (Donut Chart)
  const ctxGoal = document.getElementById('chart-goal')?.getContext('2d');
  if (ctxGoal) {
    if (chartGoalInstance) chartGoalInstance.destroy();
    chartGoalInstance = new Chart(ctxGoal, {
      type: 'doughnut',
      data: {
        labels: ['Perder Peso', 'Manter Peso', 'Ganhar Massa'],
        datasets: [{
          data: [objetivos.perder, objetivos.mantener, objetivos.musculo],
          backgroundColor: ['#f59e0b', '#10b981', '#3b82f6'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#9ca3af', font: { size: 11 } } } }
      }
    });
  }

  // 4. Gráfico de Dieta (Bar Chart)
  const ctxDiet = document.getElementById('chart-diet')?.getContext('2d');
  if (ctxDiet) {
    if (chartDietInstance) chartDietInstance.destroy();
    chartDietInstance = new Chart(ctxDiet, {
      type: 'bar',
      data: {
        labels: ['Onívoro', 'Vegetariano', 'Vegano'],
        datasets: [{
          label: 'Dieta',
          data: [dietas.omnivoro, dietas.vegetariano, dietas.vegano],
          backgroundColor: '#10b981',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#9ca3af' }, grid: { display: false } },
          y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  }
}

// ─── 5. Resumo da Persona Automático para Anúncios do Facebook/Meta ───
function renderizarResumoPersona(usuarios) {
  const el = document.getElementById('persona-summary-text');
  if (!el) return;

  if (!usuarios || usuarios.length === 0) {
    el.innerHTML = 'Ainda não há cadastros suficientes para traçar a persona exata. Assim que os primeiros leads entrarem, a IA gerará os dados de tráfego.';
    return;
  }

  let mulheres = 0;
  let somaIdades = 0;
  let perderPesoCount = 0;
  let treinoCasaCount = 0;

  usuarios.forEach(u => {
    const perfil = u.perfil || {};
    if ((perfil.sexo || 'mujer').toLowerCase() === 'mujer') mulheres++;
    somaIdades += parseInt(perfil.edad || 30);
    if (categoriaObjetivo(perfil) === 'perder') perderPesoCount++;
    if ((perfil.ejercicios || 'casa').toLowerCase().includes('casa')) treinoCasaCount++;
  });

  const pctMulheres = Math.round((mulheres / usuarios.length) * 100);
  const mediaIdade = Math.round(somaIdades / usuarios.length);
  const pctPerderPeso = Math.round((perderPesoCount / usuarios.length) * 100);
  const pctTreinoCasa = Math.round((treinoCasaCount / usuarios.length) * 100);

  const generoPredominante = pctMulheres >= 60 ? 'Mulheres' : (pctMulheres <= 40 ? 'Homens' : 'Público Misto');

  el.innerHTML = `
    🎯 <strong>Perfil do Seu Comprador Ideal:</strong> 
    <span style="color:white; font-weight:700;">${generoPredominante} (${pctMulheres}% do público)</span>, com idade média de 
    <span style="color:white; font-weight:700;">${mediaIdade} anos</span>.<br/>
    📉 <strong>Principal Desejo:</strong> <span style="color:var(--amber); font-weight:700;">${pctPerderPeso}% buscam Perda de Peso rápida</span>.<br/>
    🏋️ <strong>Hábito de Treino:</strong> <span style="color:var(--cyan); font-weight:700;">${pctTreinoCasa}% preferem Treinos Rápidos em Casa</span>.<br/><br/>
    💡 <strong>Recomendação de Tráfego Pago (Meta Ads / Facebook):</strong> Configurar campanha direcionada para 
    <strong style="color:var(--green);">${generoPredominante} entre ${Math.max(18, mediaIdade - 6)} e ${mediaIdade + 8} anos</strong> em Espanha/Europa interessadas em <em>Emagrecimento, Dietas Fáceis e Exercícios em Casa</em>.
  `;
}

// ─── 6. Funil de Conversão ───
function renderizarFunilConversao(visitas, quizStarts, usuarios) {
  const totalLeads = usuarios.length;
  const ventas = usuarios.filter(u => u.is_premium === true).length;

  const pctQuiz = visitas > 0 ? ((quizStarts / visitas) * 100).toFixed(1) : '0.0';
  const pctLeads = quizStarts > 0 ? ((totalLeads / quizStarts) * 100).toFixed(1) : '0.0';
  const pctVentas = totalLeads > 0 ? ((ventas / totalLeads) * 100).toFixed(1) : '0.0';

  document.getElementById('fnl-visitas').innerText = visitas;
  document.getElementById('fnl-quiz-starts').innerText = quizStarts;
  document.getElementById('fnl-pct-quiz').innerText = `${pctQuiz}% do tráfego`;
  document.getElementById('fnl-leads').innerText = totalLeads;
  document.getElementById('fnl-pct-leads').innerText = `${pctLeads}% do quiz`;
  document.getElementById('fnl-ventas').innerText = ventas;
  document.getElementById('fnl-pct-ventas').innerText = `${pctVentas}% Conversão`;

  calcularROINegocio();
}

function calcularROINegocio() {
  const adSpend = parseFloat(document.getElementById('roi-ad-spend')?.value || 0);
  const totalLeads = todosOsUsuariosAdmin.length;
  const ventas = todosOsUsuariosAdmin.filter(u => u.is_premium === true).length;

  const cpl = totalLeads > 0 ? (adSpend / totalLeads).toFixed(2) : '0.00';
  const ingresosTotales = ventas * 14.90;
  const beneficioNeto = (ingresosTotales - adSpend).toFixed(2);

  const elCpl = document.getElementById('roi-cpl');
  const elProfit = document.getElementById('roi-net-profit');

  if (elCpl) elCpl.innerText = `€${cpl}`;
  if (elProfit) {
    elProfit.innerText = `€${beneficioNeto}`;
    elProfit.style.color = beneficioNeto >= 0 ? 'var(--green)' : '#f87171';
  }
}

// ─── 7. Renderizar Leads no Dia 3 ───
function renderizarLeadsDia3(usuarios) {
  const container = document.getElementById('hot-leads-container');
  if (!container) return;

  const dia3Leads = usuarios.filter(u => {
    const dias = (u.dias_completados || []).length;
    const streak = u.streak_actual || 0;
    return (dias === 3 || streak === 3) && u.is_premium !== true;
  });

  if (dia3Leads.length === 0) {
    container.innerHTML = `
      <div style="grid-column:1/-1; padding:18px; text-align:center; color:var(--text-muted); font-size:0.85rem; background:rgba(255,255,255,0.02); border-radius:12px;">
        ✨ Nenhum lead estancado no Dia 3 hoje. Excelente retenção!
      </div>`;
    return;
  }

  let html = '';
  dia3Leads.forEach(u => {
    const perfil = u.perfil || {};
    const nombre = u.user_name || perfil.nombre || 'Usuario';
    const email = u.user_email || '';
    const msg = `Hola ${nombre}, ¡felicitaciones por completar tus 3 días gratis en MiPlanFit! 🎉 Tu plan completo de 30 días está listo. Hoy se desbloquea por solo 14,90€ (pago único). ¿Tienes alguna duda para continuar?`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;

    html += `
      <div class="hot-lead-card">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <strong style="color:white; font-size:0.92rem;">${nombre}</strong>
            <span style="font-size:0.65rem; background:rgba(245,158,11,0.2); color:var(--amber); padding:2px 8px; border-radius:10px; font-weight:800;">🔥 DIA 3</span>
          </div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:10px;">${email}</div>
        </div>

        <a href="${waUrl}" target="_blank" class="btn btn-amber btn-sm" style="font-size:0.75rem; font-weight:800; width:100%; text-align:center; justify-content:center;">
          💬 Mensagem de Venda no WhatsApp
        </a>
      </div>
    `;
  });

  container.innerHTML = html;
}

// ─── 8. Renderizar Tabela Master de Usuários ───
// ─── 8. Renderizar Tabela Master de Usuários (CRM 5.0 Ultrawide) ───
function renderizarTablaAdmin(lista) {
  const tableBody = document.getElementById('admin-users-table-body');
  if (!tableBody) return;

  if (!lista || lista.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:40px; color:var(--text-muted);">
          📭 Nenhum usuário coincide com os filtros atuais.
        </td>
      </tr>`;
    return;
  }

  let html = '';

  lista.forEach(user => {
    const perfil = user.perfil || {};
    const nombre = user.user_name || perfil.nombre || 'Usuario';
    const email  = user.user_email || 'Google User';
    const inicial = nombre.charAt(0).toUpperCase();

    const dateRaw = user.updated_at || user.created_at || new Date().toISOString();
    const fechaObj = new Date(dateRaw);
    const fechaFmt = fechaObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

    // Gênero, Idade e Objetivo (Tags)
    const tienePerfil = perfil && typeof perfil === 'object' && Object.keys(perfil).length > 0 && (perfil.peso || perfil.edad || perfil.sexo || perfil.nombre);
    const sexoStr = tienePerfil ? ((perfil.sexo || '').toLowerCase() === 'hombre' ? 'HOMEM ♂️' : 'MULHER ♀️') : '⚠️ Pendente';
    const edadStr = tienePerfil && perfil.edad ? `${perfil.edad}a` : '';
    const objetivoText = tienePerfil ? textoObjetivo(perfil) : '⚠️ Pendente';

    // Métricas Bio (Peso, IMC, TMB, TDEE)
    const pesoVal = Number(perfil.pesoActual || perfil.peso || 0);
    const pesoStr = pesoVal > 0 ? `${pesoVal.toFixed(1)}kg` : '--';
    
    const imcObj = user.imc || (typeof perfil.imc === 'object' ? perfil.imc : null);
    const imcVal = imcObj?.valor || (pesoVal > 0 && perfil.altura ? (pesoVal / Math.pow(perfil.altura / 100, 2)).toFixed(1) : '--');
    
    const tmbVal = user.tmb || perfil.tmb || '--';
    const tdeeVal = user.tdee || perfil.tdee || '--';

    // Racha / Progresso
    const streak = user.streak_actual || 0;
    const diasCompletados = (user.dias_completados || []).length;
    const pctProgreso = Math.round((diasCompletados / 30) * 100);

    // Estado Premium
    const esPremium = user.is_premium === true;
    let statusBadge = `<span class="badge-status-free">🔒 Gratuito (3 dias)</span>`;
    if (esPremium) {
      statusBadge = `<span class="badge-status-premium">✨ PREMIUM (€14,90)</span>`;
    } else if (diasCompletados >= 3 || streak >= 3) {
      statusBadge = `<span style="background:rgba(245,158,11,0.2); color:#fbbf24; border:1px solid #f59e0b; padding:4px 10px; border-radius:20px; font-weight:800; font-size:0.72rem; white-space:nowrap;">🔥 Dia 3 (Perto)</span>`;
    }

    // Viralidade (Mini barra 0 a 3)
    const numRef = user.referrals_count || (Array.isArray(user.referrals_list) ? user.referrals_list.length : 0);
    const pctRef = Math.min(Math.round((numRef / 3) * 100), 100);
    const refBadge = `
      <div style="display:inline-flex; align-items:center; gap:8px;">
        <div style="width:50px; height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
          <div style="width:${pctRef}%; height:100%; background:${numRef >= 3 ? 'var(--green)' : 'var(--cyan)'}; border-radius:3px;"></div>
        </div>
        <span style="font-size:0.78rem; font-weight:800; color:${numRef >= 3 ? 'var(--green)' : numRef > 0 ? 'var(--cyan)' : 'var(--text-muted)'}; white-space:nowrap;">
          🎁 ${numRef}/3
        </span>
      </div>
    `;

    // WhatsApp Direct URL Button
    const waPhone = perfil.telefono || perfil.phone || '';
    const cleanPhone = waPhone.replace(/[^0-9]/g, '');
    const waUrl = cleanPhone ? `https://api.whatsapp.com/send?phone=${cleanPhone}` : `mailto:${email}`;

    html += `
      <tr onclick="abrirDrawerCliente('${user.user_id}')">
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg, var(--purple), #4c1d95); display:flex; align-items:center; justify-content:center; font-weight:800; color:white; font-size:0.85rem; flex-shrink:0;">${inicial}</div>
            <div>
              <div style="font-weight:800; color:white; font-size:0.85rem;">${nombre}</div>
              <div style="font-size:0.72rem; color:var(--text-muted);">${email} · <span style="color:rgba(255,255,255,0.4);">${fechaFmt}</span></div>
            </div>
          </div>
        </td>
        <td>
          <div style="display:flex; flex-direction:column; gap:3px;">
            <div>
              <span style="font-size:0.72rem; background:rgba(6,182,212,0.15); color:var(--cyan); padding:2px 6px; border-radius:6px; font-weight:700;">${sexoStr}</span>
              ${edadStr ? `<span style="font-size:0.72rem; background:rgba(255,255,255,0.06); color:#cbd5e1; padding:2px 6px; border-radius:6px; font-weight:600;">${edadStr}</span>` : ''}
            </div>
            <div style="font-size:0.75rem; color:white; font-weight:600;">${objetivoText}</div>
          </div>
        </td>
        <td>
          <div style="font-size:0.78rem; font-weight:700; color:white;">⚖️ ${pesoStr} · <span style="color:var(--purple-light);">IMC ${imcVal}</span></div>
          <div style="font-size:0.72rem; color:var(--text-muted);">🔥 TMB: ${tmbVal} kcal | TDEE: ${tdeeVal}</div>
        </td>
        <td>
          <div style="font-weight:800; font-size:0.8rem; color:${streak > 0 ? '#f59e0b' : 'var(--text-muted)'};">🔥 ${streak} dias</div>
          <div style="font-size:0.72rem; color:var(--text-muted);">${diasCompletados}/30 dias (${pctProgreso}%)</div>
        </td>
        <td>${refBadge}</td>
        <td>${statusBadge}</td>
        <td>
          <div style="display:flex; gap:6px; align-items:center;">
            <button onclick="event.stopPropagation(); abrirDrawerCliente('${user.user_id}')" class="btn btn-outline btn-sm" style="font-size:0.72rem; padding:4px 8px;">
              ⚙️
            </button>
            <a href="${waUrl}" target="_blank" onclick="event.stopPropagation();" class="btn btn-outline btn-sm" style="font-size:0.72rem; padding:4px 8px; color:var(--green); border-color:rgba(16,185,129,0.3);">
              💬 WhatsApp
            </a>
          </div>
        </td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;
}

// ─── 9. Busca e Filtros Avançados CRM 5.0 ───
function filtrarTablaAdmin() {
  const query = (document.getElementById('admin-search-input')?.value || '').toLowerCase().trim();
  const filtroEstado = document.getElementById('admin-filter-status')?.value || 'todos';
  const filtroObjetivo = document.getElementById('admin-filter-objetivo')?.value || 'todos';
  const filtroEngajamento = document.getElementById('admin-filter-engajamento')?.value || 'todos';

  const filtrados = todosOsUsuariosAdmin.filter(u => {
    const perfil = u.perfil || {};
    const nombre = (u.user_name || perfil.nombre || '').toLowerCase();
    const email  = (u.user_email || '').toLowerCase();

    const coincideBusqueda = nombre.includes(query) || email.includes(query);

    let coincideEstado = true;
    if (filtroEstado === 'premium') coincideEstado = (u.is_premium === true);
    if (filtroEstado === 'free') coincideEstado = (u.is_premium !== true);
    if (filtroEstado === 'dia3') {
      const dias = (u.dias_completados || []).length;
      coincideEstado = (dias === 3 || u.streak_actual === 3);
    }

    let coincideObjetivo = true;
    if (filtroObjetivo !== 'todos') {
      const objRaw = (perfil.objetivo_kg || perfil.objetivo || '').toLowerCase();
      if (filtroObjetivo === 'perder') coincideObjetivo = objRaw.includes('perder') || objRaw.includes('perda');
      if (filtroObjetivo === 'ganar') coincideObjetivo = objRaw.includes('ganar') || objRaw.includes('massa') || objRaw.includes('ganho');
      if (filtroObjetivo === 'mantener') coincideObjetivo = objRaw.includes('mantener') || objRaw.includes('manter');
    }

    let coincideEngajamento = true;
    if (filtroEngajamento === 'ativos') coincideEngajamento = ((u.streak_actual || 0) > 0 || (u.dias_completados || []).length > 0);
    if (filtroEngajamento === 'inativos') coincideEngajamento = ((u.streak_actual || 0) === 0 && (u.dias_completados || []).length === 0);

    return coincideBusqueda && coincideEstado && coincideObjetivo && coincideEngajamento;
  });

  renderizarTablaAdmin(filtrados);
}

// ─── 10. Drawer Cliente ───
function abrirDrawerCliente(userId) {
  const user = todosOsUsuariosAdmin.find(u => u.user_id === userId);
  if (!user) return;

  usuarioSelecionadoDrawer = user;
  const perfil = user.perfil || {};

  document.getElementById('drw-user-id').value = user.user_id;
  document.getElementById('drw-title-name').innerText = user.user_name || perfil.nombre || 'Gestão do Cliente';
  document.getElementById('drw-title-email').innerText = user.user_email || 'Sem Email';

  document.getElementById('drw-input-nombre').value = user.user_name || perfil.nombre || '';
  document.getElementById('drw-input-email').value = user.user_email || '';
  document.getElementById('drw-input-peso-init').value = perfil.peso || '';
  document.getElementById('drw-input-peso-actual').value = perfil.pesoActual || perfil.peso || '';
  document.getElementById('drw-input-objetivo-kg').value = perfil.objetivo_kg || '';
  document.getElementById('drw-input-actividad').value = perfil.actividad || 'sedentario';

  // Mapa de nombres de alimentos
  const foodMap = {
    'f-carne': 'Carne roja',
    'f-pollo': 'Pollo / Aves',
    'f-pavo': 'Pavo',
    'f-pescado': 'Pescado',
    'f-salmon': 'Salmón',
    'f-atun': 'Atún',
    'f-gambas': 'Marisco',
    'f-huevo': 'Huevo',
    'f-lacteos': 'Lácteos / Leche',
    'f-yogur': 'Yogur',
    'f-queso': 'Queso',
    'f-frutossecos': 'Frutos secos',
    'f-gluten': 'Gluten',
    'f-soja': 'Soja'
  };

  const rawExcluidos = perfil.alimentosExcluidos || [];
  const excluidosFormatted = rawExcluidos.map(id => foodMap[id] || id);
  const elExcluidos = document.getElementById('drw-info-excluidos');
  if (elExcluidos) {
    elExcluidos.innerText = excluidosFormatted.length > 0 ? excluidosFormatted.join(', ') : 'Nenhum alimento excluído';
  }

  const btnPremium = document.getElementById('drw-btn-toggle-premium');
  if (btnPremium) {
    if (user.is_premium) {
      btnPremium.innerText = '🔒 Remover Premium';
      btnPremium.className = 'btn btn-outline btn-sm';
      btnPremium.style.color = '#f87171';
    } else {
      btnPremium.innerText = '✨ Ativar Premium';
      btnPremium.className = 'btn btn-green btn-sm';
      btnPremium.style.color = '#ffffff';
    }
  }

  document.getElementById('client-drawer').style.display = 'flex';
}

function cerrarDrawerCliente() {
  document.getElementById('client-drawer').style.display = 'none';
  usuarioSelecionadoDrawer = null;
}

async function guardarCambiosCliente() {
  if (!usuarioSelecionadoDrawer) return;

  const client = getSupabase();
  if (!client) return;

  const userId = document.getElementById('drw-user-id').value;
  const nuevoNombre = document.getElementById('drw-input-nombre').value.trim();
  const nuevoEmail  = document.getElementById('drw-input-email').value.trim();
  const nuevoPesoInit = parseFloat(document.getElementById('drw-input-peso-init').value || 70);
  const nuevoPesoActual = parseFloat(document.getElementById('drw-input-peso-actual').value || nuevoPesoInit);
  const nuevoObjetivo = parseInt(document.getElementById('drw-input-objetivo-kg').value || 5);
  const nuevaActividad = document.getElementById('drw-input-actividad').value;

  const perfilActualizado = {
    ...(usuarioSelecionadoDrawer.perfil || {}),
    nombre: nuevoNombre,
    peso: nuevoPesoInit,
    pesoActual: nuevoPesoActual,
    objetivo_kg: nuevoObjetivo,
    actividad: nuevaActividad
  };

  const { error } = await client.from('planos').update({
    user_name: nuevoNombre,
    user_email: nuevoEmail,
    perfil: perfilActualizado,
    updated_at: new Date().toISOString()
  }).eq('user_id', userId);

  if (error) {
    alert(`❌ Erro ao atualizar dados: ${error.message}`);
    return;
  }

  usuarioSelecionadoDrawer.user_name = nuevoNombre;
  usuarioSelecionadoDrawer.user_email = nuevoEmail;
  usuarioSelecionadoDrawer.perfil = perfilActualizado;

  renderizarMeticasKPI(todosOsUsuariosAdmin);
  renderizarGraficosDemograficos(todosOsUsuariosAdmin);
  renderizarResumoPersona(todosOsUsuariosAdmin);
  filtrarTablaAdmin();
  cerrarDrawerCliente();
  alert('✅ Dados do cliente atualizados com sucesso no Supabase!');
}

async function togglePremiumDrawer() {
  if (!usuarioSelecionadoDrawer) return;
  const nuevoEstado = !usuarioSelecionadoDrawer.is_premium;
  
  const client = getSupabase();
  if (!client) return;

  const { error } = await client
    .from('planos')
    .update({ is_premium: nuevoEstado, updated_at: new Date().toISOString() })
    .eq('user_id', usuarioSelecionadoDrawer.user_id);

  if (error) {
    alert(`❌ Erro ao atualizar Premium: ${error.message}`);
    return;
  }

  usuarioSelecionadoDrawer.is_premium = nuevoEstado;
  renderizarMeticasKPI(todosOsUsuariosAdmin);
  filtrarTablaAdmin();
  cerrarDrawerCliente();
  alert(nuevoEstado ? '✨ Acesso Premium concedido ao cliente!' : '🔒 Acesso Premium revogado.');
}

async function resetearPlanCliente() {
  if (!usuarioSelecionadoDrawer) return;

  if (!confirm(`Tem certeza de que deseja resetar o progresso de ${usuarioSelecionadoDrawer.user_name} para o Dia 1?`)) {
    return;
  }

  const client = getSupabase();
  if (!client) return;

  const { error } = await client.from('planos').update({
    dias_completados: [],
    streak_actual: 0,
    max_streak: 0,
    updated_at: new Date().toISOString()
  }).eq('user_id', usuarioSelecionadoDrawer.user_id);

  if (error) {
    alert(`❌ Erro ao resetar progresso: ${error.message}`);
    return;
  }

  usuarioSelecionadoDrawer.dias_completados = [];
  usuarioSelecionadoDrawer.streak_actual = 0;

  renderizarMeticasKPI(todosOsUsuariosAdmin);
  filtrarTablaAdmin();
  cerrarDrawerCliente();
  alert('🔄 Progresso do plano resetado para o Dia 1 com sucesso!');
}

// ─── 11. Exportar CSV ───
function exportarUsuariosCSV() {
  if (!todosOsUsuariosAdmin || todosOsUsuariosAdmin.length === 0) {
    alert('⚠️ Não há dados para exportar.');
    return;
  }

  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'Nome,Email,Genero,Idade,Objetivo,Preferencia,Indicacoes,EstadoPremium,DataRegistro\n';

  todosOsUsuariosAdmin.forEach(u => {
    const perfil = u.perfil || {};
    const nombre = (u.user_name || perfil.nombre || 'Usuario').replace(/,/g, '');
    const email  = (u.user_email || 'Sem Email').replace(/,/g, '');
    const sexo   = (perfil.sexo || 'Mujer').replace(/,/g, '');
    const edad   = perfil.edad || 30;
    const objetivo = textoObjetivo(perfil).replace(/,/g, '');
    const preferencia = (perfil.preferencia || 'omnivoro').replace(/,/g, '');
    const refCount = u.referrals_count || 0;
    const premium = u.is_premium ? 'PREMIUM' : 'GRATUITO';
    const fecha = u.updated_at || u.created_at || '';

    csvContent += `${nombre},${email},${sexo},${edad},${objetivo},${preferencia},${refCount},${premium},${fecha}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `MiPlanFit_Persona_BI_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ─── 12. Zerar Métricas de Teste para Lançamento Oficial ───
async function zerarMetricasTestes() {
  if (!confirm('⚠️ Tem certeza de que deseja zerar os contadores de visitas e pesquisas de teste para iniciar a campanha oficial do zero?')) {
    return;
  }

  localStorage.setItem('miplanfit_stat_visita', '0');
  localStorage.setItem('miplanfit_stat_quiz_start', '0');

  const client = getSupabase();
  if (client) {
    await client.from('analytics_events').delete().neq('id', 0).catch(() => {});
  }

  await cargarDatosAdmin();
  alert('✨ Métricas de teste zeradas com sucesso! O seu painel está 100% pronto para registrar tráfego real.');
}
