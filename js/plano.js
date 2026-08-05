// ============================================================
// PLANO.JS — Lógica principal da página do plano de 30 dias
// ============================================================

let diaAtual = 1;
let perfil = null;
let plan30 = null;
let planId = 'B';
let swapTarget = null; // { dia, tipoComida }

// ─── Premium config ───
const FREE_DAYS  = 3;
const PAYWALL_URL = 'https://miplanfit.lemonsqueezy.com/buy/placeholder';

function isPremium() {
  return localStorage.getItem('miplanfit_premium') === 'true';
}

document.addEventListener('DOMContentLoaded', async function () {

  // ─── 1. Verificar sesión ───
  const usuario = await getUsuarioAtual();
  if (!usuario) {
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
  const planNuvem = await carregarPlanoNaNuvem(usuario.id);

  if (planNuvem && planNuvem.perfil && planNuvem.plan30) {
    perfil  = planNuvem.perfil;
    plan30  = planNuvem.plan30;
    planId  = planNuvem.plan_id || 'B';

    // Sincronizar progreso de la nube al localStorage
    const nombre    = perfil.nombre || 'Usuario';
    const streakKey = `miplanfit_streak_${nombre.replace(/\s/g,'_')}`;
    const estadoNuvem = {
      diasCompletados: planNuvem.dias_completados || [],
      streakActual   : planNuvem.streak_actual    || 0,
      maxStreak      : planNuvem.max_streak       || 0,
      logros         : planNuvem.logros           || [],
      fechaInicio    : planNuvem.fecha_inicio
    };
    localStorage.setItem(streakKey, JSON.stringify(estadoNuvem));
    localStorage.setItem('miplanfit_perfil',  JSON.stringify(perfil));
    localStorage.setItem('miplanfit_plan30',  JSON.stringify(plan30));
    localStorage.setItem('miplanfit_plan_id', planId);
  } else {
    // Fallback a localStorage
    perfil  = JSON.parse(localStorage.getItem('miplanfit_perfil') || 'null');
    plan30  = JSON.parse(localStorage.getItem('miplanfit_plan30') || 'null');
    planId  = localStorage.getItem('miplanfit_plan_id') || 'B';
  }

  if (!perfil || !plan30) {
    window.location.href = 'index.html';
    return;
  }

  // Guardar userId globalmente para sincronizar progreso
  window._userId = usuario.id;

  const plan   = PLANES[planId];
  const nombre = perfil.nombre || 'Usuario';

  // Header
  document.getElementById('header-nombre').textContent = `${nombre},`;
  document.getElementById('header-objetivo').textContent =
    `${plan.emoji} ${plan.nombre} — ${plan.subtitulo}`;
  document.getElementById('nav-plan-badge').textContent =
    `${plan.emoji} ${plan.nombre}`;
  document.getElementById('nav-plan-badge').style.background  = `${plan.color}20`;
  document.getElementById('nav-plan-badge').style.color       = plan.color;
  document.getElementById('nav-plan-badge').style.borderColor = `${plan.color}50`;

  // Determinar día activo: el primero no completado
  const estado             = leerEstado(nombre);
  const primerNoCompletado = encontrarPrimerDiaPendiente(estado.diasCompletados);
  diaAtual = primerNoCompletado;

  renderStreak(estado, nombre);
  renderCalendario(estado, nombre);
  renderDia(diaAtual);
  renderLogros(estado);

  // Mostrar CTA flotante si no es premium
  if (!isPremium()) {
    document.getElementById('floating-premium').style.display = 'flex';
    // Ajustar padding do body para nao ficar atras do CTA
    document.body.style.paddingBottom = '70px';
  }
});

// ─── Primer día pendiente ───
function encontrarPrimerDiaPendiente(diasCompletados) {
  for (let d = 1; d <= 30; d++) {
    if (!diasCompletados.includes(d)) return d;
  }
  return 30;
}

// ─── Render streak panel ───
function renderStreak(estado, nombre) {
  document.getElementById('streak-actual').textContent = estado.streakActual;
  document.getElementById('dias-completados').textContent = estado.diasCompletados.length;
  document.getElementById('max-streak').textContent = estado.maxStreak;

  const pct = Math.round((estado.diasCompletados.length / 30) * 100);
  document.getElementById('progress-pct').textContent = `${pct}%`;
  document.getElementById('progress-bar').style.width = `${pct}%`;

  const restantes = 30 - estado.diasCompletados.length;
  document.getElementById('dias-restantes').textContent =
    restantes > 0 ? `${restantes} días restantes` : '¡Plan completado! 🏆';
}

// ─── Render calendario ───
function renderCalendario(estado, nombre) {
  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';

  const emojisSemanales = ['🥗','🔥','💪','⚡'];

  for (let d = 1; d <= 30; d++) {
    const cell = document.createElement('div');
    const completado = estado.diasCompletados.includes(d);
    const esDiaActual = d === diaAtual;
    const esBloqueado = d > FREE_DAYS && !isPremium();

    cell.className = `day-cell ${completado ? 'completed' : ''} ${esDiaActual ? 'active' : ''} ${esBloqueado ? 'locked' : ''}`;
    cell.id = `day-cell-${d}`;

    const semanaIdx = Math.floor((d - 1) / 7);
    const emojiSem = emojisSemanales[semanaIdx % emojisSemanales.length];

    cell.innerHTML = `
      <span class="day-num">${d}</span>
      <span class="day-emoji">${completado ? '✅' : esBloqueado ? '🔒' : emojiSem}</span>
    `;
    cell.addEventListener('click', () => irDia(d));
    grid.appendChild(cell);
  }
}

// ─── Ir a un día específico ───
function irDia(dia) {
  diaAtual = dia;
  renderDia(dia);

  // Actualizar calendario
  document.querySelectorAll('.day-cell').forEach(c => c.classList.remove('active'));
  document.getElementById(`day-cell-${dia}`)?.classList.add('active');

  // Scroll suave al contenido del día
  document.querySelector('.current-day-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Cambiar día con flechas ───
function changeDay(delta) {
  const nuevo = diaAtual + delta;
  if (nuevo < 1 || nuevo > 30) return;
  irDia(nuevo);
}

// ─── Render del día ───
function renderDia(dia) {
  const diaPlan = plan30[dia - 1];
  if (!diaPlan) return;

  // ─ Ocultar paywall / restaurar meals ─
  document.getElementById('paywall-section').style.display = 'none';
  const mealsEl = document.getElementById('meals-container');
  mealsEl.classList.remove('meals-blurred');
  mealsEl.style.pointerEvents = '';

  // ─ Verificar si el día está bloqueado ─
  if (dia > FREE_DAYS && !isPremium()) {
    mostrarPaywall(dia, diaPlan);
    return;
  }

  const semanaNum = Math.ceil(dia / 7);
  const nombre = perfil.nombre || 'Usuario';
  const completado = isDiaCompletado(nombre, dia);

  // Título
  document.getElementById('day-title').textContent = `Día ${dia} de 30`;
  document.getElementById('day-emoji-title').textContent =
    completado ? '✅' : (dia % 5 === 0 ? '🔥' : '🍽️');
  document.getElementById('semana-badge').textContent = `Semana ${semanaNum}`;

  // Calorías totales
  const calTotal = diaPlan.caloriasTotal || 0;
  document.getElementById('cal-total-badge').textContent = `~${calTotal} kcal este día`;

  // Botones de nav
  document.getElementById('btn-prev-day').disabled = dia <= 1;
  document.getElementById('btn-next-day').disabled = dia >= 30;

  // Comidas
  renderComidas(diaPlan.comidas, dia);

  // Ejercicios
  if (perfil.ejercicios && perfil.ejercicios !== 'no') {
    renderEjercicios(dia, perfil.ejercicios);
    document.getElementById('exercise-section').style.display = 'block';
  } else {
    document.getElementById('exercise-section').style.display = 'none';
  }

  // Botón marcar día
  const btnMark = document.getElementById('btn-mark-day');
  const msgComp = document.getElementById('day-completed-msg');
  document.getElementById('mark-day-section').style.display = 'block';

  if (completado) {
    btnMark.style.display = 'none';
    msgComp.style.display = 'block';
    const estado = leerEstado(nombre);
    document.getElementById('racha-msg').textContent = estado.streakActual;
  } else {
    btnMark.style.display = 'inline-flex';
    msgComp.style.display = 'none';
  }
}

// ─── Mostrar paywall para dia bloqueado ───
function mostrarPaywall(dia, diaPlan) {
  const semanaNum = Math.ceil(dia / 7);

  // Atualizar cabeçalho do dia
  document.getElementById('day-title').textContent = `Día ${dia} de 30`;
  document.getElementById('day-emoji-title').textContent = '🔒';
  document.getElementById('semana-badge').textContent = `Semana ${semanaNum}`;
  document.getElementById('cal-total-badge').textContent = `~${diaPlan?.caloriasTotal || 1450} kcal este día`;
  document.getElementById('btn-prev-day').disabled = dia <= 1;
  document.getElementById('btn-next-day').disabled = dia >= 30;

  // Renderizar comidas MAS borradas
  if (diaPlan?.comidas) {
    renderComidas(diaPlan.comidas, dia);
    const mealsEl = document.getElementById('meals-container');
    mealsEl.classList.add('meals-blurred');
    mealsEl.style.pointerEvents = 'none';
  }

  // Esconder seccóes de acción
  document.getElementById('exercise-section').style.display = 'none';
  document.getElementById('mark-day-section').style.display = 'none';

  // Mostrar paywall
  document.getElementById('paywall-section').style.display = 'block';
  document.getElementById('paywall-section').scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Atualizar links de compra com URL correto
  document.getElementById('btn-comprar-paywall').href = PAYWALL_URL;
  document.getElementById('btn-comprar-float').href  = PAYWALL_URL;
}

// ─── Render comidas ───
const MEAL_LABELS = {
  desayuno: { label: 'Desayuno', emoji: '🌅' },
  meriendaManana: { label: 'Media Mañana', emoji: '🍎' },
  almuerzo: { label: 'Almuerzo', emoji: '🍽️' },
  meriendaTarde: { label: 'Merienda', emoji: '🍊' },
  cena: { label: 'Cena', emoji: '🌙' }
};

function renderComidas(comidas, dia) {
  const container = document.getElementById('meals-container');
  container.innerHTML = '';

  const orden = ['desayuno', 'meriendaManana', 'almuerzo', 'meriendaTarde', 'cena'];

  orden.forEach(tipo => {
    const receta = comidas[tipo];
    if (!receta) return;

    const info = MEAL_LABELS[tipo];
    const esCompleta = tipo === 'almuerzo' || tipo === 'cena';

    const card = document.createElement('div');
    card.className = `meal-card ${esCompleta ? '' : ''}`;
    card.id = `meal-card-${tipo}`;

    const ingredientesHTML = receta.ingredientes
      .map(ing => `<li>${ing}</li>`)
      .join('');

    const tagsHTML = receta.tags
      .slice(0, 2)
      .map(tag => `<span style="font-size:0.7rem;background:rgba(124,58,237,0.1);color:#a78bfa;padding:2px 8px;border-radius:999px;">${tag}</span>`)
      .join('');

    card.innerHTML = `
      <div class="meal-header">
        <div class="meal-type">
          <span>${info.emoji}</span>
          <span>${info.label}</span>
        </div>
        <span class="meal-cal">${receta.calorias} kcal</span>
      </div>
      <div class="meal-name">${receta.nombre}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">${tagsHTML}</div>
      <ul class="meal-ingredients">${ingredientesHTML}</ul>
      <button class="meal-swap-btn" onclick="abrirSwap(${dia}, '${tipo}', '${receta.id}')">
        🔄 Cambiar alimento
      </button>
    `;

    container.appendChild(card);
  });
}

// ─── Render ejercicios ───
function renderEjercicios(dia, tipoEj) {
  const container = document.getElementById('exercise-container');
  const badge = document.getElementById('exercise-type-badge');

  badge.textContent = tipoEj === 'gimnasio' ? '🏋️ Gimnasio' : '🏠 En casa';

  const datos = getEjerciciosDia(dia, tipoEj);

  if (datos.descanso) {
    container.innerHTML = `
      <div class="rest-day">
        <span class="rest-day-emoji">${datos.ejercicio.emoji}</span>
        <h3>${datos.ejercicio.nombre}</h3>
        <p style="color:var(--text-muted);margin-top:8px;">${datos.ejercicio.descripcion}</p>
      </div>
    `;
  } else {
    container.innerHTML = `<div class="exercise-list">${
      datos.ejercicios.map(ej => `
        <div class="exercise-item">
          <span class="exercise-emoji">${ej.emoji}</span>
          <div class="exercise-name">${ej.nombre}</div>
          <div class="exercise-detail">${ej.series} series × ${ej.reps}</div>
          <div class="exercise-desc">${ej.descripcion}</div>
        </div>
      `).join('')
    }</div>`;
  }
}

// ─── Marcar día como completado ───
function marcarDia() {
  const nombre    = perfil.nombre || 'Usuario';
  const resultado = marcarDiaCompletado(nombre, diaAtual);

  if (resultado.yaCompletado) return;

  // Actualizar UI del botón
  const btnMark = document.getElementById('btn-mark-day');
  const msgComp = document.getElementById('day-completed-msg');
  btnMark.style.display = 'none';
  msgComp.style.display = 'block';
  document.getElementById('racha-msg').textContent = resultado.estado.streakActual;

  // Actualizar calendario
  const cell = document.getElementById(`day-cell-${diaAtual}`);
  if (cell) {
    cell.classList.add('completed');
    cell.innerHTML = `<span class="day-num">${diaAtual}</span><span class="day-emoji">✅</span>`;
  }

  // Actualizar streak panel
  renderStreak(resultado.estado, nombre);

  // Mostrar logros nuevos
  resultado.nuevosLogros?.forEach((logro, i) => {
    setTimeout(() => mostrarNotificacionLogro(logro), i * 1200);
  });
  renderLogros(resultado.estado);

  // Animación
  document.getElementById('day-emoji-title').textContent = '✅';

  // ☁️ Sincronizar progreso en la nube
  if (window._userId) {
    salvarProgressoNaNuvem(window._userId, resultado.estado);
  }

  // ¿Plan completo?
  if (resultado.estado.diasCompletados.length >= 30) {
    setTimeout(() => mostrarCelebracion(), 1000);
  }
}

// ─── Render logros ───
function renderLogros(estado) {
  const grid = document.getElementById('logros-grid');
  if (!grid) return;

  grid.innerHTML = LOGROS_CONFIG.map(logro => {
    const desbloqueado = estado.logros.includes(logro.id);
    return `
      <div class="logro-card ${desbloqueado ? 'unlocked' : 'locked'}">
        <span class="logro-emoji">${logro.emoji}</span>
        <div class="logro-name">${logro.nombre}</div>
        <div class="logro-desc">${logro.desc}</div>
        ${desbloqueado ? '<div style="font-size:0.7rem;color:#f59e0b;margin-top:4px;font-weight:700;">¡Desbloqueado!</div>' : ''}
      </div>
    `;
  }).join('');
}

// ─── Swap de alimentos ───
function abrirSwap(dia, tipoComida, recetaActualId) {
  swapTarget = { dia, tipoComida };
  const diaPlan = plan30[dia - 1];
  const recetaActual = diaPlan.comidas[tipoComida];

  // Obtener el tipo del banco
  const tipo = recetaActualId.startsWith('d') ? 'desayunos' :
               recetaActualId.startsWith('a') ? 'almuerzos' :
               recetaActualId.startsWith('m') ? 'meriendas' : 'cenas';

  const alternativas = RECIPES[tipo].filter(r =>
    r.id !== recetaActualId &&
    r.planos.includes(planId) &&
    !perfil.alimentosExcluidos?.some(alim =>
      r.ingredientes.some(ing => ing.toLowerCase().includes(alim.toLowerCase()))
    )
  ).slice(0, 6);

  const optionsContainer = document.getElementById('swap-options');
  optionsContainer.innerHTML = alternativas.map(r => `
    <div class="swap-option" onclick="aplicarSwap('${tipo}', '${r.id}')">
      <div class="swap-option-name">${r.nombre}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
        <div style="font-size:0.82rem;color:var(--text-secondary);">${r.ingredientes.slice(0,3).join(', ')}...</div>
        <div class="swap-option-cal">🔥 ${r.calorias} kcal</div>
      </div>
    </div>
  `).join('') || '<p style="color:var(--text-secondary);font-size:0.9rem;">No hay más alternativas disponibles.</p>';

  document.getElementById('swap-modal').classList.add('show');
}

function closeSwapModal() {
  document.getElementById('swap-modal').classList.remove('show');
  swapTarget = null;
}

function aplicarSwap(tipo, nuevaRecetaId) {
  if (!swapTarget) return;

  const { dia, tipoComida } = swapTarget;
  const nuevaReceta = RECIPES[tipo].find(r => r.id === nuevaRecetaId);
  if (!nuevaReceta) return;

  // Actualizar el plan
  plan30[dia - 1].comidas[tipoComida] = nuevaReceta;

  // Recalcular calorías
  const calTotal = Object.values(plan30[dia - 1].comidas)
    .reduce((sum, c) => sum + (c?.calorias || 0), 0);
  plan30[dia - 1].caloriasTotal = calTotal;

  // Guardar localmente
  localStorage.setItem('miplanfit_plan30', JSON.stringify(plan30));

  // ☁️ Sincronizar plan actualizado en la nube
  if (window._userId && perfil) {
    const imc   = JSON.parse(localStorage.getItem('miplanfit_imc')  || '{}');
    const tmb   = localStorage.getItem('miplanfit_tmb')  || 0;
    const tdee  = localStorage.getItem('miplanfit_tdee') || 0;
    salvarPlanoNaNuvem(window._userId, { perfil, plan30, planId, imc, tmb, tdee });
  }

  closeSwapModal();
  renderDia(dia);

  // Toast de confirmación
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="toast-icon">✅</span><span class="toast-msg">Alimento cambiado con éxito</span>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// ─── Celebración al terminar 30 días ───
function mostrarCelebracion() {
  const overlay = document.getElementById('celebration-overlay');
  overlay.classList.add('show');
  lanzarConfetti();
}

function lanzarConfetti() {
  const colores = ['#7c3aed','#10b981','#f59e0b','#ef4444','#3b82f6','#ec4899'];
  for (let i = 0; i < 80; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.cssText = `
      left: ${Math.random() * 100}%;
      width: ${Math.random() * 12 + 6}px;
      height: ${Math.random() * 12 + 6}px;
      background: ${colores[Math.floor(Math.random() * colores.length)]};
      animation-duration: ${Math.random() * 2 + 2}s;
      animation-delay: ${Math.random() * 1.5}s;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
    `;
    document.getElementById('celebration-overlay').appendChild(c);
  }
}

function reiniciarPlan() {
  const nombre = perfil.nombre || 'Usuario';
  reiniciarPlanStreak(nombre);

  // Regenerar plan
  const nuevoPlan = generarPlan30Dias(perfil, planId);
  sessionStorage.setItem('fitjourney_plan30', JSON.stringify(nuevoPlan));
  plan30 = nuevoPlan;
  diaAtual = 1;

  document.getElementById('celebration-overlay').classList.remove('show');

  const estado = leerEstado(nombre);
  renderStreak(estado, nombre);
  renderCalendario(estado, nombre);
  renderDia(1);
  renderLogros(estado);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}
