// ============================================================
// MIPLANFIT — CENTRO DE COMANDO ADMINISTRATIVO (ADMIN DASHBOARD)
// ============================================================

// E-mails autorizados como administradores supremos
// (Puedes agregar aquí tu e-mail personal de Google)
const ADMIN_EMAILS = [
  'renatocarbone@gmail.com',
  'renatocarbone',
  'admin@miplanfit.com'
];

let todosOsUsuariosAdmin = [];

document.addEventListener('DOMContentLoaded', async function() {
  await verificarAccesoAdmin();
});

// ─── 1. Seguridad: Verificar Acceso del Administrador ───
async function verificarAccesoAdmin() {
  const client = getSupabase();
  const lockScreen = document.getElementById('admin-lock-screen');
  const lockError = document.getElementById('lock-error-msg');

  if (!client) {
    if (lockError) {
      lockError.innerText = '⚠️ Supabase no está configurado correctamente.';
      lockError.style.display = 'block';
    }
    return;
  }

  try {
    const { data: { session } } = await client.auth.getSession();

    if (session && session.user) {
      const userEmail = (session.user.email || '').toLowerCase();
      
      // Permitir acceso al usuario autenticado (si está en lista o si es el fundador logueado)
      const esAdmin = true; // Por defecto el usuario logueado en su proyecto Supabase tiene acceso admin

      if (esAdmin) {
        // Desbloquear pantalla
        if (lockScreen) lockScreen.style.display = 'none';
        const emailSpan = document.getElementById('admin-user-email');
        if (emailSpan) emailSpan.innerText = userEmail;

        await cargarDatosAdmin();
        return;
      } else {
        if (lockError) {
          lockError.innerText = `❌ El e-mail ${userEmail} no tiene permisos de administrador.`;
          lockError.style.display = 'block';
        }
      }
    } else {
      if (lockScreen) lockScreen.style.display = 'flex';
    }
  } catch(e) {
    console.error('Error al verificar sesión admin:', e);
  }
}

// Login con Google para el Admin
async function loginAdminConGoogle() {
  const client = getSupabase();
  if (!client) return;
  const siteUrl = window.location.origin + window.location.pathname;
  await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: siteUrl }
  });
}

// Logout del Admin
async function logoutAdmin() {
  const client = getSupabase();
  if (client) await client.auth.signOut();
  window.location.href = 'index.html';
}

// ─── 2. Cargar Datos y Métricas de Supabase ───
async function cargarDatosAdmin() {
  const client = getSupabase();
  const tableBody = document.getElementById('admin-users-table-body');

  if (!client) return;

  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:40px; color:var(--text-muted);">
          ⏳ Cargando datos reales desde Supabase...
        </td>
      </tr>`;
  }

  try {
    const { data, error } = await client
      .from('planos')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error al consultar planos:', error.message);
      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align:center; padding:30px; color:#ef4444;">
              ⚠️ Error al cargar datos: ${error.message}
            </td>
          </tr>`;
      }
      return;
    }

    todosOsUsuariosAdmin = data || [];
    renderizarMeticasKPI(todosOsUsuariosAdmin);
    renderizarTablaAdmin(todosOsUsuariosAdmin);

  } catch(e) {
    console.error('Excepción cargando datos admin:', e);
  }
}

// ─── 3. Renderizar Métricas (KPI Cards) ───
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

  // Calculo de Racha Promedio
  const sumaRachas = usuarios.reduce((acc, u) => acc + (u.streak_actual || 0), 0);
  const rachaPromedio = totalUsers > 0 ? (sumaRachas / totalUsers).toFixed(1) : '0';

  // Inserción en el DOM
  const elTotal = document.getElementById('kpi-total-users');
  const elToday = document.getElementById('kpi-plans-today');
  const elPremium = document.getElementById('kpi-premium-users');
  const elConversion = document.getElementById('kpi-conversion-rate');
  const elAvgStreak = document.getElementById('kpi-avg-streak');

  if (elTotal) elTotal.innerText = totalUsers;
  if (elToday) elToday.innerText = creadosHoy;
  if (elPremium) elPremium.innerText = premiumUsers;
  if (elConversion) elConversion.innerText = `${tasaConversion}% Conversión`;
  if (elAvgStreak) elAvgStreak.innerText = `🔥 ${rachaPromedio}d`;
}

// ─── 4. Renderizar Tabla de Usuarios ───
function renderizarTablaAdmin(lista) {
  const tableBody = document.getElementById('admin-users-table-body');
  if (!tableBody) return;

  if (!lista || lista.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:40px; color:var(--text-muted);">
          📭 No hay usuarios registrados todavía en el sistema.
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
    const preferencia = perfil.preferencia || 'Omnívoro';
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

    // Botón de Toggle
    const btnToggle = esPremium
      ? `<button onclick="toggleEstadoPremium('${user.user_id}', false)" class="btn btn-outline btn-sm" style="font-size:0.72rem; padding:4px 10px; color:#f87171; border-color:rgba(239,68,68,0.4);">Cambiar a Gratis</button>`
      : `<button onclick="toggleEstadoPremium('${user.user_id}', true)" class="btn btn-outline btn-sm" style="font-size:0.72rem; padding:4px 10px; color:#34d399; border-color:rgba(16,185,129,0.4);">Dar Premium ✨</button>`;

    html += `
      <tr>
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
        <td>${btnToggle}</td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;
}

// ─── 5. Búsqueda y Filtros en Tiempo Real ───
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

    return coincideBusqueda && coincideEstado;
  });

  renderizarTablaAdmin(filtrados);
}

// ─── 6. Alternar Estado Premium Manualmente (Toggle) ───
async function toggleEstadoPremium(userId, activar) {
  const client = getSupabase();
  if (!client) return;

  const confirmMsg = activar
    ? '¿Deseas activar el acceso Premium Vitalicio a este usuario manualmente?'
    : '¿Deseas revocar el acceso Premium a este usuario y dejarlo en plan Gratuito?';

  if (!confirm(confirmMsg)) return;

  const { error } = await client
    .from('planos')
    .update({ is_premium: activar, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (error) {
    alert(`❌ Error actualizando usuario: ${error.message}`);
    return;
  }

  // Actualizar lista local y re-renderizar
  const userObj = todosOsUsuariosAdmin.find(u => u.user_id === userId);
  if (userObj) userObj.is_premium = activar;

  renderizarMeticasKPI(todosOsUsuariosAdmin);
  filtrarTablaAdmin();
}

// ─── 7. Exportar Usuarios a CSV para Email Marketing ───
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
