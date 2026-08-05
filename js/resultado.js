// ============================================================
// RESULTADO.JS — Página de resultado con autenticación Supabase
// ============================================================

document.addEventListener('DOMContentLoaded', async function() {

  // ─── 1. Verificar sesión ───
  const usuario = await getUsuarioAtual();

  if (!usuario) {
    // Sin sesión → volver al inicio
    window.location.href = 'index.html';
    return;
  }

  // ─── 2. Mostrar info del usuario en navbar ───
  const userInfo = document.getElementById('user-info');
  if (userInfo) {
    const avatar  = document.getElementById('user-avatar');
    const nameEl  = document.getElementById('user-name');
    const picture = usuario.user_metadata?.avatar_url || usuario.user_metadata?.picture;
    const nombre  = usuario.user_metadata?.full_name   || usuario.user_metadata?.name || '';

    if (picture) { avatar.src = picture; }
    if (nombre)  { nameEl.textContent = nombre; }
    userInfo.style.display = 'flex';
  }

  // ─── 3. Cargar datos: nuvem primero, localStorage como fallback ───
  let perfil, imc, tmb, tdee, planId;

  const planNuvem = await carregarPlanoNaNuvem(usuario.id);

  if (planNuvem && planNuvem.perfil && planNuvem.plan30) {
    // ✅ Hay plan guardado en la nube
    perfil  = planNuvem.perfil;
    imc     = planNuvem.imc;
    tmb     = planNuvem.tmb;
    tdee    = planNuvem.tdee;
    planId  = planNuvem.plan_id || 'B';

    // Sincronizar a localStorage para otras páginas
    localStorage.setItem('miplanfit_perfil',  JSON.stringify(perfil));
    localStorage.setItem('miplanfit_plan30',  JSON.stringify(planNuvem.plan30));
    localStorage.setItem('miplanfit_plan_id', planId);
    localStorage.setItem('miplanfit_imc',     JSON.stringify(imc));
    localStorage.setItem('miplanfit_tmb',     String(tmb));
    localStorage.setItem('miplanfit_tdee',    String(tdee));

  } else {
    // ⚠️ No hay plan en la nube → cargar de localStorage y subir
    perfil = JSON.parse(localStorage.getItem('miplanfit_perfil') || 'null');
    imc    = JSON.parse(localStorage.getItem('miplanfit_imc')    || 'null');
    tmb    = localStorage.getItem('miplanfit_tmb');
    tdee   = localStorage.getItem('miplanfit_tdee');
    planId = localStorage.getItem('miplanfit_plan_id') || 'B';
    const plan30 = JSON.parse(localStorage.getItem('miplanfit_plan30') || 'null');

    if (!perfil) {
      window.location.href = 'index.html';
      return;
    }

    // Guardar en la nube en segundo plano
    if (plan30) {
      salvarPlanoNaNuvem(usuario.id, { perfil, plan30, planId, imc, tmb, tdee });
    }
  }

  // ─── 4. Renderizar resultado ───
  const nombreMostrado = usuario.user_metadata?.full_name || perfil.nombre || 'Usuario';
  document.getElementById('welcome-msg').textContent = `¡Hola, ${nombreMostrado}! Tu análisis está listo 🎉`;

  // Métricas
  document.getElementById('metric-imc').textContent   = imc?.valor          || '—';
  document.getElementById('metric-imc-class').textContent = imc?.clasificacion || '—';
  document.getElementById('metric-tmb').textContent   = tmb  ? `${tmb} kcal`  : '—';
  document.getElementById('metric-tdee').textContent  = tdee ? `${tdee} kcal` : '—';

  // Marcador IMC
  if (imc?.valor) {
    const imcVal = parseFloat(imc.valor);
    const pct = Math.min(Math.max(((imcVal - 15) / 25) * 100, 0), 100);
    setTimeout(() => { document.getElementById('imc-marker').style.left = `${pct}%`; }, 500);
  }

  // Renderizar plan recomendado
  renderPlan(planId);
  renderOtherPlans(planId);

  // Botón aceptar → ir al plan de 30 días
  document.getElementById('btn-aceptar').addEventListener('click', async () => {
    localStorage.setItem('miplanfit_plan_id', planId);

    // Actualizar plan_id en la nube si cambió
    const client = getSupabase();
    if (client) {
      const plan30 = JSON.parse(localStorage.getItem('miplanfit_plan30') || 'null');
      await salvarPlanoNaNuvem(usuario.id, { perfil, plan30, planId, imc, tmb, tdee });
    }

    window.location.href = 'plano.html';
  });
});

// ─── Render del plan seleccionado ───
function renderPlan(planId) {
  const plan = PLANES[planId];
  if (!plan) return;

  document.getElementById('plan-title').textContent    = plan.nombre;
  document.getElementById('plan-emoji').textContent    = plan.emoji;
  document.getElementById('plan-name').textContent     = plan.nombre;
  document.getElementById('plan-subtitle').textContent = plan.subtitulo;
  document.getElementById('plan-desc').textContent     = plan.descripcion;

  const badge = document.getElementById('plan-badge');
  badge.textContent    = `Plan ${plan.id} — ${plan.nombre}`;
  badge.style.color    = plan.color;
  badge.style.borderColor = plan.color;
  badge.style.background  = `${plan.color}20`;

  document.getElementById('plan-features').innerHTML =
    plan.caracteristicas.map(c => `<li>${c}</li>`).join('');

  document.getElementById('plan-showcase').style.setProperty('--plan-grad', plan.colorGrad);
}

// ─── Render de otros planes ───
function renderOtherPlans(selectedId) {
  const grid = document.getElementById('plans-grid');
  grid.innerHTML = '';

  Object.values(PLANES).forEach(plan => {
    const card = document.createElement('div');
    card.className = `mini-plan-card ${plan.id === selectedId ? 'selected' : ''}`;
    card.id = `plan-card-${plan.id}`;
    card.innerHTML = `
      <div class="mini-plan-header">
        <span class="mini-plan-emoji">${plan.emoji}</span>
        <div>
          <div class="mini-plan-name" style="color:${plan.color}">${plan.nombre}</div>
          <div class="mini-plan-sub">${plan.subtitulo}</div>
        </div>
      </div>
      <p style="font-size:0.82rem;color:var(--text-muted);line-height:1.5;">${plan.descripcion.substring(0, 100)}...</p>
      <div style="margin-top:12px;">
        <span class="badge" style="background:${plan.color}20;color:${plan.color};border:1px solid ${plan.color}40;font-size:0.75rem;">${plan.deficitObjetivo}</span>
      </div>
    `;
    card.addEventListener('click', () => selectPlan(plan.id));
    grid.appendChild(card);
  });
}

function selectPlan(planId) {
  document.querySelectorAll('.mini-plan-card').forEach(c => c.classList.remove('selected'));
  document.getElementById(`plan-card-${planId}`)?.classList.add('selected');

  renderPlan(planId);
  localStorage.setItem('miplanfit_plan_id', planId);

  // Regenerar plan de 30 días con nuevo planId
  const perfil = JSON.parse(localStorage.getItem('miplanfit_perfil') || 'null');
  if (perfil) {
    const plan30 = generarPlan30Dias(perfil, planId);
    localStorage.setItem('miplanfit_plan30', JSON.stringify(plan30));
  }
}
