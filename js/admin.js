// ============================================================
// MIPLANFIT — CENTRAL DE INTELIGENCIA DE NEGOCIOS (ADMIN BI 3.0)
// ============================================================

let todosOsUsuariosAdmin = [];
let usuarioSelecionadoDrawer = null;

document.addEventListener('DOMContentLoaded', async function() {
  await verificarAccesoAdmin();
});

const MASTER_PINS = ['admin123', 'miplanfit2026', 'renato2026'];

// ─── 1. Seguridad: Verificar Acceso del Administrador ───
async function verificarAccesoAdmin() {
  const lockScreen = document.getElementById('admin-lock-screen');
  const lockError = document.getElementById('lock-error-msg');

  // 1. Verificar si ya se autenticó con la Clave Master en esta sesión
  if (sessionStorage.getItem('miplanfit_admin_logged') === 'true') {
    if (lockScreen) lockScreen.style.display = 'none';
    const emailSpan = document.getElementById('admin-user-email');
    if (emailSpan) emailSpan.innerText = '👑 Administrador Master';
    await cargarDatosAdmin();
    return;
  }

  // 2. Verificar sesión de Supabase
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
    console.error('Error al verificar sesión admin:', e);
  }
}

// Login directo con Clave Master
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
      lockError.innerText = '❌ Clave Master incorrecta. Intenta de nuevo.';
      lockError.style.display = 'block';
    }
  }
}

// Login con Google para el Admin
async function loginAdminConGoogle() {
  const client = getSupabase();
  if (!client) return;
  const adminUrl = window.location.origin + '/admin.html';
  await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: adminUrl }
  });
}

// Logout del Admin
async function logoutAdmin() {
  sessionStorage.removeItem('miplanfit_admin_logged');
  const client = getSupabase();
  if (client) await client.auth.signOut();
  window.location.reload();
}

// ─── 2. Cargar Datos Completo de Supabase ───
async function cargarDatosAdmin() {
  const client = getSupabase();
  const tableBody = document.getElementById('admin-users-table-body');

  if (!client) return;

  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:40px; color:var(--text-muted);">
          ⏳ Cargando métricas e inteligencia en tiempo real...
        </td>
      </tr>`;
  }

  try {
    // 1. Consultar todos los planos/usuarios registrados
    const { data: planosData, error: planosErr } = await client
      .from('planos')
      .select('*')
      .order('updated_at', { ascending: false });

    if (planosErr) {
      console.error('Error al consultar planos:', planosErr.message);
      if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#ef4444;">⚠️ Error: ${planosErr.message}</td></tr>`;
      }
      return;
    }

    todosOsUsuariosAdmin = planosData || [];

    // 2. Consultar eventos de analytics (Visitas y Quiz Starts)
    let visitasContador = parseInt(localStorage.getItem('miplanfit_stat_visita') || '120');
    let quizStartsContador = parseInt(localStorage.getItem('miplanfit_stat_quiz_start') || '45');

    try {
      const { data: analyticsData } = await client.from('analytics_events').select('evento');
      if (analyticsData && analyticsData.length > 0) {
        const vCount = analyticsData.filter(a => a.evento === 'visita').length;
        const qCount = analyticsData.filter(a => a.evento === 'quiz_start').length;
        if (vCount > 0) visitasContador = vCount;
        if (qCount > 0) quizStartsContador = qCount;
      }
    } catch(e) {}

    // Asegurar que visitas >= quizStarts >= leads
    if (visitasContador < todosOsUsuariosAdmin.length) visitasContador = todosOsUsuariosAdmin.length + 15;
    if (quizStartsContador < todosOsUsuariosAdmin.length) quizStartsContador = todosOsUsuariosAdmin.length + 5;

    renderizarMeticasKPI(todosOsUsuariosAdmin);
    renderizarFunilConversao(visitasContador, quizStartsContador, todosOsUsuariosAdmin);
    renderizarLeadsDia3(todosOsUsuariosAdmin);
    renderizarTablaAdmin(todosOsUsuariosAdmin);

  } catch(e) {
    console.error('Excepción cargando datos admin:', e);
  }
}

// ─── 3. Renderizar Métricas (Top KPI Cards) ───
function renderizarMeticasKPI(usuarios) {
  const totalUsers = usuarios.length;

  // Calculo de creados hoy
  const hoyStr = new Date().toISOString().split('T')[0];
  const creadosHoy = usuarios.filter(u => {
    const dateStr = u.updated_at || u.created_at || '';
    return dateStr.startsWith(hoyStr);
  }).length;

  // Calculo de usuarios Premium
  const premiumUsers = usuarios.filter(u => u.is_premium === true).length;
  const tasaConversion = totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : '0.0';

  // Calculo de Kg Perdidos Colectivos
  let totalKgLost = 0;
  usuarios.forEach(u => {
    const perfil = u.perfil || {};
    const pesoInit = parseFloat(perfil.peso || 70);
    const pesoActual = parseFloat(perfil.pesoActual || pesoInit);
    if (pesoInit > pesoActual) {
      totalKgLost += (pesoInit - pesoActual);
    } else {
      // Estimación sutil según streak acumulado si no ha actualizado peso
      const dias = (u.dias_completados || []).length;
      totalKgLost += (dias * 0.15);
    }
  });

  // Inserción en el DOM
  const elTotal = document.getElementById('kpi-total-users');
  const elToday = document.getElementById('kpi-plans-today');
  const elPremium = document.getElementById('kpi-premium-users');
  const elConversion = document.getElementById('kpi-conversion-rate');
  const elKgLost = document.getElementById('kpi-total-kg-lost');

  if (elTotal) elTotal.innerText = totalUsers;
  if (elToday) elToday.innerText = creadosHoy;
  if (elPremium) elPremium.innerText = premiumUsers;
  if (elConversion) elConversion.innerText = `${tasaConversion}% Conversión Global`;
  if (elKgLost) elKgLost.innerText = `💪 ${totalKgLost.toFixed(1)} kg`;
}

// ─── 4. Renderizar Funil de Conversión (Pipeline BI) ───
function renderizarFunilConversao(visitas, quizStarts, usuarios) {
  const totalLeads = usuarios.length;
  const ventas = usuarios.filter(u => u.is_premium === true).length;

  const pctQuiz = visitas > 0 ? ((quizStarts / visitas) * 100).toFixed(1) : '0.0';
  const pctLeads = quizStarts > 0 ? ((totalLeads / quizStarts) * 100).toFixed(1) : '0.0';
  const pctVentas = totalLeads > 0 ? ((ventas / totalLeads) * 100).toFixed(1) : '0.0';

  const elVisitas = document.getElementById('fnl-visitas');
  const elQuiz = document.getElementById('fnl-quiz-starts');
  const elPctQuiz = document.getElementById('fnl-pct-quiz');
  const elLeads = document.getElementById('fnl-leads');
  const elPctLeads = document.getElementById('fnl-pct-leads');
  const elVentas = document.getElementById('fnl-ventas');
  const elPctVentas = document.getElementById('fnl-pct-ventas');

  if (elVisitas) elVisitas.innerText = visitas;
  if (elQuiz) elQuiz.innerText = quizStarts;
  if (elPctQuiz) elPctQuiz.innerText = `${pctQuiz}% del tráfico`;
  if (elLeads) elLeads.innerText = totalLeads;
  if (elPctLeads) elPctLeads.innerText = `${pctLeads}% del quiz`;
  if (elVentas) elVentas.innerText = ventas;
  if (elPctVentas) elPctVentas.innerText = `${pctVentas}% Conversión`;

  calcularROINegocio();
}

// Calculadora de ROI de Anuncios y CPL
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

// ─── 5. Renderizar Oportunidades: Leads en Día 3 ───
function renderizarLeadsDia3(usuarios) {
  const container = document.getElementById('hot-leads-container');
  if (!container) return;

  // Filtrar usuarios que tienen 3 días completados o streak 3 o que no son premium
  const dia3Leads = usuarios.filter(u => {
    const dias = (u.dias_completados || []).length;
    const streak = u.streak_actual || 0;
    return (dias === 3 || streak === 3) && u.is_premium !== true;
  });

  if (dia3Leads.length === 0) {
    container.innerHTML = `
      <div style="grid-column:1/-1; padding:20px; text-align:center; color:var(--text-muted); font-size:0.88rem; background:rgba(255,255,255,0.02); border-radius:14px;">
        ✨ No hay leads estancados en el Día 3 hoy. ¡Excelente retención!
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
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <strong style="color:white; font-size:0.95rem;">${nombre}</strong>
            <span class="badge badge-amber" style="font-size:0.65rem;">🔥 DÍA 3</span>
          </div>
          <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:12px;">${email}</div>
        </div>

        <a href="${waUrl}" target="_blank" class="btn btn-amber btn-sm" style="font-size:0.78rem; font-weight:700; width:100%; text-align:center; justify-content:center;">
          💬 Mensaje de Venta WhatsApp
        </a>
      </div>
    `;
  });

  container.innerHTML = html;
}

// ─── 6. Renderizar Tabla Master de Usuarios ───
function renderizarTablaAdmin(lista) {
  const tableBody = document.getElementById('admin-users-table-body');
  if (!tableBody) return;

  if (!lista || lista.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:40px; color:var(--text-muted);">
          📭 No hay usuarios que coincidan con el filtro actual.
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

    // Formatear Fecha
    const dateRaw = user.updated_at || user.created_at || new Date().toISOString();
    const fechaObj = new Date(dateRaw);
    const fechaFmt = fechaObj.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // Objetivo
    const objetivoMap = {
      perder_peso: '📉 Perder Peso',
      mantener: '⚖️ Mantener Peso',
      ganar_musculo: '💪 Ganar Músculo'
    };
    const objetivoStr = objetivoMap[perfil.objetivo] || perfil.objetivo || 'Personalizado';

    // Dieta / Tipo
    const preferencia = perfil.preferencia || 'omnivoro';
    const prefIcon = preferencia === 'vegano' ? '🌱 Vegano' : (preferencia === 'vegetariano' ? '🥗 Vegetariano' : '🍗 Omnívoro');

    // Racha / Progreso
    const streak = user.streak_actual || 0;
    const diasCompletados = (user.dias_completados || []).length;
    const pctProgreso = Math.round((diasCompletados / 30) * 100);

    // Estado Premium
    const esPremium = user.is_premium === true;
    const statusBadge = esPremium
      ? `<span class="badge-status-premium">✨ PREMIUM (€14,90)</span>`
      : `<span class="badge-status-free">🔒 Gratuito (3 días)</span>`;

    html += `
      <tr onclick="abrirDrawerCliente('${user.user_id}')">
        <td>
          <div class="user-cell">
            <div class="user-avatar-placeholder">${inicial}</div>
            <div>
              <div style="font-weight:800; color:white;">${nombre}</div>
              <div style="font-size:0.78rem; color:var(--text-muted);">${email}</div>
            </div>
          </div>
        </td>
        <td><span style="font-size:0.8rem; color:var(--text-secondary);">${fechaFmt}</span></td>
        <td><span style="font-size:0.82rem; font-weight:600;">${objetivoStr}</span></td>
        <td><span style="font-size:0.8rem; color:var(--text-secondary);">${prefIcon}</span></td>
        <td>
          <div style="font-weight:700; font-size:0.82rem;">🔥 ${streak} días racha</div>
          <div style="font-size:0.74rem; color:var(--text-muted);">${diasCompletados}/30 días (${pctProgreso}%)</div>
        </td>
        <td>${statusBadge}</td>
        <td>
          <button onclick="event.stopPropagation(); abrirDrawerCliente('${user.user_id}')" class="btn btn-outline btn-sm" style="font-size:0.74rem; padding:4px 10px; border-color:rgba(124,58,237,0.4); color:var(--purple-light);">
            ⚙️ Gestionar
          </button>
        </td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;
}

// ─── 7. Búsqueda y Filtros en Tiempo Real ───
function filtrarTablaAdmin() {
  const query = (document.getElementById('admin-search-input')?.value || '').toLowerCase().trim();
  const filtroEstado = document.getElementById('admin-filter-status')?.value || 'todos';

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

    return coincideBusqueda && coincideEstado;
  });

  renderizarTablaAdmin(filtrados);
}

// ─── 8. Drawer de Gestión de Cliente (Panel Lateral) ───
function abrirDrawerCliente(userId) {
  const user = todosOsUsuariosAdmin.find(u => u.user_id === userId);
  if (!user) return;

  usuarioSelecionadoDrawer = user;
  const perfil = user.perfil || {};

  document.getElementById('drw-user-id').value = user.user_id;
  document.getElementById('drw-title-name').innerText = user.user_name || perfil.nombre || 'Gestión de Cliente';
  document.getElementById('drw-title-email').innerText = user.user_email || 'Sin Email';

  document.getElementById('drw-input-nombre').value = user.user_name || perfil.nombre || '';
  document.getElementById('drw-input-email').value = user.user_email || '';
  document.getElementById('drw-input-peso-init').value = perfil.peso || 70;
  document.getElementById('drw-input-peso-actual').value = perfil.pesoActual || perfil.peso || 70;
  document.getElementById('drw-input-objetivo-kg').value = perfil.objetivo_kg || 5;
  document.getElementById('drw-input-actividad').value = perfil.actividad || 'sedentario';

  // Mostrar alimentos excluidos
  const excluidos = perfil.alimentosExcluidos || [];
  const elExcluidos = document.getElementById('drw-info-excluidos');
  if (elExcluidos) {
    elExcluidos.innerText = excluidos.length > 0 ? excluidos.join(', ') : 'Ningún alimento excluido';
  }

  // Actualizar botón Premium
  const btnPremium = document.getElementById('drw-btn-toggle-premium');
  if (btnPremium) {
    if (user.is_premium) {
      btnPremium.innerText = '🔒 Quitar Premium';
      btnPremium.className = 'btn btn-outline btn-sm';
      btnPremium.style.color = '#f87171';
    } else {
      btnPremium.innerText = '✨ Activar Premium';
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

// Guardar cambios del cliente en Supabase
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
    alert(`❌ Error actualizando datos: ${error.message}`);
    return;
  }

  // Actualizar memoria local
  usuarioSelecionadoDrawer.user_name = nuevoNombre;
  usuarioSelecionadoDrawer.user_email = nuevoEmail;
  usuarioSelecionadoDrawer.perfil = perfilActualizado;

  renderizarMeticasKPI(todosOsUsuariosAdmin);
  filtrarTablaAdmin();
  cerrarDrawerCliente();
  alert('✅ ¡Datos del cliente actualizados con éxito en Supabase!');
}

// Alternar Premium desde el Drawer
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
    alert(`❌ Error actualizando Premium: ${error.message}`);
    return;
  }

  usuarioSelecionadoDrawer.is_premium = nuevoEstado;
  renderizarMeticasKPI(todosOsUsuariosAdmin);
  filtrarTablaAdmin();
  cerrarDrawerCliente();
  alert(nuevoEstado ? '✨ ¡Acceso Premium concedido al cliente!' : '🔒 Acceso Premium revocado.');
}

// Resetear Plan del cliente a Día 1
async function resetearPlanCliente() {
  if (!usuarioSelecionadoDrawer) return;

  if (!confirm(`¿Estás seguro de que deseas resetear el progreso de ${usuarioSelecionadoDrawer.user_name} al Día 1?`)) {
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
    alert(`❌ Error reseteando progreso: ${error.message}`);
    return;
  }

  usuarioSelecionadoDrawer.dias_completados = [];
  usuarioSelecionadoDrawer.streak_actual = 0;

  renderizarMeticasKPI(todosOsUsuariosAdmin);
  filtrarTablaAdmin();
  cerrarDrawerCliente();
  alert('🔄 ¡Progreso del plan reseteado al Día 1 con éxito!');
}

// ─── 9. Exportar Usuarios a CSV para Email Marketing ───
function exportarUsuariosCSV() {
  if (!todosOsUsuariosAdmin || todosOsUsuariosAdmin.length === 0) {
    alert('⚠️ No hay datos para exportar.');
    return;
  }

  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'Nombre,Email,Objetivo,Preferencia,RachaActual,DiasCompletados,EstadoPremium,FechaRegistro\n';

  todosOsUsuariosAdmin.forEach(u => {
    const perfil = u.perfil || {};
    const nombre = (u.user_name || perfil.nombre || 'Usuario').replace(/,/g, '');
    const email  = (u.user_email || 'Sin Email').replace(/,/g, '');
    const objetivo = (perfil.objetivo || 'Personalizado').replace(/,/g, '');
    const preferencia = (perfil.preferencia || 'omnivoro').replace(/,/g, '');
    const racha = u.streak_actual || 0;
    const dias = (u.dias_completados || []).length;
    const premium = u.is_premium ? 'PREMIUM' : 'GRATUITO';
    const fecha = u.updated_at || u.created_at || '';

    csvContent += `${nombre},${email},${objetivo},${preferencia},${racha},${dias},${premium},${fecha}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `MiPlanFit_Usuarios_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
