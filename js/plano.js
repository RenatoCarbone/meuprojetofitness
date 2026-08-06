// ============================================================
// PLANO.JS — Lógica principal da página do plano de 30 dias
// ============================================================

let diaAtual = 1;
let perfil = null;
let plan30 = null;
let planId = 'B';
let swapTarget = null; // { dia, tipoComida }

// ─── Premium config ───
const FREE_DAYS   = 3;
const PAYWALL_URL = 'https://miplanfit.lemonsqueezy.com/checkout/buy/7dccfeb2-dbe0-45c3-bfa2-eda0d0aa36fe';

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

  // Fallback de seguridad: si no hay perfil o plan30, crear valor por defecto
  if (!perfil) {
    perfil = { nombre: 'Usuario', peso: 70, altura: 170, objetivo: 'perder_peso', nivel: 'moderado', ejercicios: 'casa' };
    localStorage.setItem('miplanfit_perfil', JSON.stringify(perfil));
  }

  if (!plan30 || !Array.isArray(plan30) || plan30.length === 0) {
    plan30 = generarPlan30Dias(perfil, planId || 'B');
    localStorage.setItem('miplanfit_plan30', JSON.stringify(plan30));
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

  // Agua recomendada basada en peso (35ml / kg)
  const pesoVal = parseFloat(perfil?.peso || 70);
  const aguaLitros = ((pesoVal * 35) / 1000).toFixed(1);
  const elAgua = document.getElementById('agua-recomendada');
  if (elAgua) { elAgua.textContent = `💧 ${aguaLitros}L`; }

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

  const nombre = perfil.nombre || 'Usuario';
  const estadoActual = leerEstado(nombre);

  // ─ Control de visibilidad de la barra inferior de compra ─
  const floatBar = document.getElementById('floating-premium');
  if (floatBar) {
    if (!isPremium() && (estadoActual.diasCompletados.length > 0 || dia > FREE_DAYS)) {
      floatBar.style.display = 'flex';
    } else {
      floatBar.style.display = 'none';
    }
  }

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
      datos.ejercicios.map((ej, idx) => `
        <div class="exercise-item" onclick="abrirModalEjercicio(${dia}, '${tipoEj}', ${idx})" style="cursor:pointer;position:relative;" title="Haz clic para ver cómo realizar este ejercicio paso a paso">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <span class="exercise-emoji">${ej.emoji}</span>
            <span style="font-size:0.7rem;background:rgba(124,58,237,0.12);color:var(--purple-light);padding:2px 8px;border-radius:999px;font-weight:600;">🔍 Ver guía</span>
          </div>
          <div class="exercise-name">${ej.nombre}</div>
          <div class="exercise-detail">${ej.series} series × ${ej.reps}</div>
          <div class="exercise-desc">${ej.descripcion}</div>
        </div>
      `).join('')
    }</div>`;
  }
}

// ─── Modal Guía de Ejercicio con imagens IA do usuário ───
const EXERCISE_IMAGES = {
  // 🏠 Exercícios em Casa
  "Sentadillas": "img/ejercicios en casa/Sentadillas (Squats).png",
  "Sentadillas sumo": "img/ejercicios en casa/Sentadillas (Squats).png",
  "Sentadilla + salto": "img/ejercicios en casa/Sentadillas (Squats).png",
  "Pistol squat asistido": "img/ejercicios en casa/Sentadillas (Squats).png",
  "Sentadilla búlgara": "img/ejercicios en casa/Sentadillas (Squats).png",

  "Flexiones de rodillas": "img/ejercicios en casa/Flexiones (Push-Ups).png",
  "Flexiones completas": "img/ejercicios en casa/Flexiones (Push-Ups).png",
  "Flexiones diamante": "img/ejercicios en casa/Flexiones (Push-Ups).png",
  "Pike push-up": "img/ejercicios en casa/Flexiones (Push-Ups).png",

  "Plancha abdominal": "img/ejercicios en casa/Plancha Abdominal (Plank).png",
  "Plancha lateral": "img/ejercicios en casa/Plancha Abdominal (Plank).png",
  "Plancha con toque de hombro": "img/ejercicios en casa/Plancha Abdominal (Plank).png",
  "Plancha + remo": "img/ejercicios en casa/Plancha Abdominal (Plank).png",

  "Zancadas alternas": "img/ejercicios en casa/Zancadas (Lunges).png",
  "Reverse lunges": "img/ejercicios en casa/Zancadas (Lunges).png",

  "Puente de glúteos": "img/ejercicios en casa/Puente de Glúteos (Glute Bridge).png",
  "Hip thrust": "img/ejercicios en casa/Puente de Glúteos (Glute Bridge).png",

  "Mountain climbers": "img/ejercicios en casa/Mountain Climbers.png",
  "Tijeras de piernas": "img/ejercicios en casa/Mountain Climbers.png",
  "Abdominales bicicleta": "img/ejercicios en casa/Mountain Climbers.png",

  "Burpees": "img/ejercicios en casa/Burpees.png",
  "Burpee modificado": "img/ejercicios en casa/Burpees.png",
  "Burpee completo": "img/ejercicios en casa/Burpees.png",
  "Circuito HIIT 20/10": "img/ejercicios en casa/Burpees.png",

  // 🏋️ Exercícios na Academia (Gimnasio)
  "Sentadilla en máquina": "img/ejercicios en gymnasio/Sentadilla con Barra (Barbell Squat).png",
  "Sentadilla libre": "img/ejercicios en gymnasio/Sentadilla con Barra (Barbell Squat).png",
  "Sentadilla + peso": "img/ejercicios en gymnasio/Sentadilla con Barra (Barbell Squat).png",
  "Sentadilla frontal": "img/ejercicios en gymnasio/Sentadilla con Barra (Barbell Squat).png",

  "Press de banca": "img/ejercicios en gymnasio/Press de Banca (Bench Press).png",
  "Press inclinado": "img/ejercicios en gymnasio/Press de Banca (Bench Press).png",
  "Press de banca inclinado + décliné": "img/ejercicios en gymnasio/Press de Banca (Bench Press).png",
  "Aperturas con mancuernas": "img/ejercicios en gymnasio/Press de Banca (Bench Press).png",

  "Leg press": "img/ejercicios en gymnasio/Prensa de Piernas (Leg Press).png",
  "Extensión de cuádriceps": "img/ejercicios en gymnasio/Prensa de Piernas (Leg Press).png",
  "Superserie: leg curl + extensión": "img/ejercicios en gymnasio/Prensa de Piernas (Leg Press).png",
  "Zancadas con mancuernas": "img/ejercicios en casa/Zancadas (Lunges).png",

  "Remo en polea baja": "img/ejercicios en gymnasio/Remo en Polea  Jalón al Pecho (Lat Pulldown).png",
  "Jalón al pecho": "img/ejercicios en gymnasio/Remo en Polea  Jalón al Pecho (Lat Pulldown).png",
  "Dominadas asistidas": "img/ejercicios en gymnasio/Remo en Polea  Jalón al Pecho (Lat Pulldown).png",

  "Peso muerto rumano": "img/ejercicios en gymnasio/Peso Muerto (Deadlift).png",
  "Peso muerto convencional": "img/ejercicios en gymnasio/Peso Muerto (Deadlift).png",

  "Press de hombro": "img/ejercicios en gymnasio/Press de Hombros con Mancuernas (Dumbbell Shoulder Press).png",
  "Circuito de hombros": "img/ejercicios en gymnasio/Press de Hombros con Mancuernas (Dumbbell Shoulder Press).png",
  "Curl de bíceps": "img/ejercicios en gymnasio/Press de Hombros con Mancuernas (Dumbbell Shoulder Press).png"
};

const EXERCISE_GUIDES = {
  "Sentadillas": {
    pasos: [
      "Coloca los pies al ancho de las caderas con las puntas ligeramente hacia afuera.",
      "Mantén el pecho erguido y el abdomen bien contraído.",
      "Flexiona las rodillas y lleva la cadera hacia atrás como si fueras a sentarte.",
      "Baja hasta que los muslos queden paralelos al suelo y vuelve a subir empujando con los talones."
    ],
    musculos: "Cuádriceps, Glúteos y Isquiotibiales",
    tip: "Asegúrate de que tus rodillas sigan la dirección de tus pies sin meterse hacia adentro."
  },
  "Flexiones de rodillas": {
    pasos: [
      "Apoya las manos al ancho de los hombros y las rodillas apoyadas atrás.",
      "Mantén el cuerpo firme formando una línea recta desde cabeza a rodillas.",
      "Flexiona los codos bajando el pecho de forma controlada casi al suelo.",
      "Empuja fuerte con los brazos hasta regresar arriba."
    ],
    musculos: "Pectoral, Tríceps y Hombros",
    tip: "Mantén los codos en un ángulo de 45° con el cuerpo, evitando abrirlos demasiado."
  },
  "Flexiones completas": {
    pasos: [
      "En posición de plancha alta con manos alineadas a hombros.",
      "Baja todo el cuerpo recto hasta rozar el suelo con el pecho.",
      "Empuja fuertemente hacia arriba manteniendo abdomen apretado."
    ],
    musculos: "Pectoral, Tríceps y Core",
    tip: "No dejes caer la cadera; mantén los glúteos apretados durante toda la repetición."
  },
  "Plancha abdominal": {
    pasos: [
      "Apoya los antebrazos y las puntas de los pies en el suelo.",
      "Coloca los codos justo debajo de los hombros y mantén la espalda plana.",
      "Contrae glúteos y abdomen al máximo sin levantar la cadera.",
      "Respira de manera fluida y constante."
    ],
    musculos: "Core completo, Abdomen y Lumbar",
    tip: "Si sientes molestia en la zona lumbar, eleva un poco la cadera."
  },
  "Zancadas alternas": {
    pasos: [
      "De pie, da un paso largo hacia adelante con una pierna.",
      "Baja el cuerpo perpendicularmente hasta que ambas rodillas queden en 90°.",
      "Empuja con el talón delantero para regresar al inicio y cambia de pierna."
    ],
    musculos: "Cuádriceps, Glúteos y Isquiotibiales",
    tip: "Mantén el torso recto en todo momento sin inclinarte hacia adelante."
  },
  "Puente de glúteos": {
    pasos: [
      "Túmbate boca arriba con rodillas flexionadas y pies apoyados.",
      "Empuja con los talones y eleva las caderas apretando los glúteos arriba.",
      "Mantiene 1 segundo en la cima y baja despacio."
    ],
    musculos: "Glúteos y Isquiotibiales",
    tip: "La elevación debe nacer exclusivamente de los glúteos, sin arquear la zona lumbar."
  }
};

let currentExDia = 1;
let currentExTipo = 'casa';
let currentExIndex = 0;

function abrirModalEjercicio(dia, tipoEj, index) {
  const datos = getEjerciciosDia(dia, tipoEj);
  if (datos.descanso || !datos.ejercicios || !datos.ejercicios[index]) return;

  currentExDia = dia;
  currentExTipo = tipoEj;
  currentExIndex = index;

  const totalEj = datos.ejercicios.length;
  const ej = datos.ejercicios[index];
  const guide = EXERCISE_GUIDES[ej.nombre] || {
    pasos: [
      `Posiciona tu cuerpo en forma correcta para realizar ${ej.nombre.toLowerCase()}.`,
      `Ejecuta la fase concéntrica de forma fluida y manten el control del movimiento.`,
      `Regresa a la posición inicial de manera lenta durante la fase excéntrica.`,
      `Completa ${ej.series} series de ${ej.reps} manteniendo buena respiración.`
    ],
    musculos: "Grupos musculares principales",
    tip: ej.descripcion || "Mantén la técnica limpia y detén la repetición si sientes molestias."
  };

  const imgGif = document.getElementById('ex-modal-gif');
  const animEmoji = document.getElementById('ex-modal-animation');
  const imagePath = EXERCISE_IMAGES[ej.nombre];

  if (imagePath) {
    imgGif.src = imagePath;
    imgGif.style.display = 'block';
    animEmoji.style.display = 'none';
  } else {
    imgGif.style.display = 'none';
    animEmoji.innerHTML = `<svg viewBox="0 0 100 100" width="80" height="80"><circle cx="50" cy="30" r="10" fill="#a78bfa"/><path d="M50 40 L50 65 M50 65 L35 85 M50 65 L65 85" stroke="#10b981" stroke-width="5" fill="none"/></svg>`;
    animEmoji.style.display = 'block';
  }

  document.getElementById('ex-modal-title').textContent = ej.nombre;
  document.getElementById('ex-modal-series-reps').textContent = `${ej.series} series × ${ej.reps}`;
  document.getElementById('ex-modal-muscles').textContent = `🎯 Músculos: ${guide.musculos}`;
  document.getElementById('ex-modal-tip').textContent = guide.tip;

  // Actualizar botones de navegación principal
  const btnPrevSec = document.getElementById('btn-prev-ex-sec');
  const btnNextMain = document.getElementById('btn-next-ex-main');

  if (btnPrevSec) {
    btnPrevSec.disabled = index <= 0;
    btnPrevSec.style.opacity = index <= 0 ? '0.4' : '1';
  }

  if (btnNextMain) {
    if (index < totalEj - 1) {
      const proxEj = datos.ejercicios[index + 1];
      btnNextMain.innerHTML = `➡️ Siguiente: ${proxEj.nombre} (${index + 2}/${totalEj})`;
      btnNextMain.onclick = () => navegarEjercicio(1);
    } else {
      btnNextMain.innerHTML = `✅ ¡Finalizar entrenamiento!`;
      btnNextMain.onclick = () => closeExerciseModal();
    }
  }

  const stepsList = document.getElementById('ex-modal-steps');
  stepsList.innerHTML = guide.pasos.map(paso => `<li>${paso}</li>`).join('');

  document.getElementById('exercise-modal').style.display = 'flex';
}

function navegarEjercicio(delta) {
  const nuevoIdx = currentExIndex + delta;
  const datos = getEjerciciosDia(currentExDia, currentExTipo);
  if (!datos.ejercicios || nuevoIdx < 0 || nuevoIdx >= datos.ejercicios.length) return;
  abrirModalEjercicio(currentExDia, currentExTipo, nuevoIdx);
}

function closeExerciseModal() {
  document.getElementById('exercise-modal').style.display = 'none';
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

  // Mostrar barra de compra inferior al completar día
  const floatBar = document.getElementById('floating-premium');
  if (floatBar && !isPremium()) {
    floatBar.style.display = 'flex';
  }

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

// ============================================================
// 📊 EVOLUCIÓN Y PROGRESO (Fotos, Peso y Ánimo)
// ============================================================

let currentTempFotoBase64 = null;
let weightChartInstance = null;

function switchEvoTab(tabName) {
  const btnProgreso = document.getElementById('tab-btn-progreso');
  const btnRegistrar = document.getElementById('tab-btn-registrar');
  const tabProgreso = document.getElementById('evo-tab-progreso');
  const tabRegistrar = document.getElementById('evo-tab-registrar');

  if (tabName === 'progreso') {
    btnProgreso.style.background = 'var(--purple)';
    btnProgreso.style.color = 'white';
    btnRegistrar.style.background = 'transparent';
    btnRegistrar.style.color = 'var(--text-secondary)';

    tabProgreso.style.display = 'block';
    tabRegistrar.style.display = 'none';
    renderEvolucionChart();
  } else {
    btnRegistrar.style.background = 'var(--purple)';
    btnRegistrar.style.color = 'white';
    btnProgreso.style.background = 'transparent';
    btnProgreso.style.color = 'var(--text-secondary)';

    tabProgreso.style.display = 'none';
    tabRegistrar.style.display = 'block';
  }
}

function abrirEvolucion() {
  document.getElementById('evolucion-modal').style.display = 'flex';
  if (perfil && perfil.peso && !document.getElementById('evo-peso').value) {
    document.getElementById('evo-peso').value = perfil.peso;
  }
  switchEvoTab('progreso');
  renderEvolucion();
}

function cerrarEvolucion() {
  document.getElementById('evolucion-modal').style.display = 'none';
  currentTempFotoBase64 = null;
  document.getElementById('foto-preview-container').style.display = 'none';
}

function previewEvoFoto(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      const maxW = 600;
      const scale = maxW / img.width;
      const w = img.width > maxW ? maxW : img.width;
      const h = img.width > maxW ? img.height * scale : img.height;

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      currentTempFotoBase64 = canvas.toDataURL('image/jpeg', 0.7);
      document.getElementById('foto-preview-img').src = currentTempFotoBase64;
      document.getElementById('foto-preview-container').style.display = 'block';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function getEvolucionKey() {
  const nombre = perfil?.nombre || 'Usuario';
  return `miplanfit_evolucion_${nombre.replace(/\s/g, '_')}`;
}

function leerEvolucion() {
  return JSON.parse(localStorage.getItem(getEvolucionKey()) || '[]');
}

async function guardarEvolucionSemana() {
  const semana = parseInt(document.getElementById('evo-semana').value);
  const peso = parseFloat(document.getElementById('evo-peso').value);
  const animo = document.querySelector('input[name="evo-animo"]:checked')?.value || '⚡ Con mucha energía';

  if (!peso || peso < 30 || peso > 250) {
    alert('Por favor, introduce un peso válido.');
    return;
  }

  let evoluciones = leerEvolucion();
  const existenteIdx = evoluciones.findIndex(e => e.semana === semana);

  const registro = {
    semana,
    peso,
    animo,
    foto: currentTempFotoBase64 || (existenteIdx >= 0 ? evoluciones[existenteIdx].foto : null),
    fecha: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  };

  if (existenteIdx >= 0) {
    evoluciones[existenteIdx] = registro;
  } else {
    evoluciones.push(registro);
  }

  evoluciones.sort((a, b) => a.semana - b.semana);
  localStorage.setItem(getEvolucionKey(), JSON.stringify(evoluciones));

  if (window._userId) {
    const client = getSupabase();
    if (client) {
      await client.from('planos').update({
        perfil: { ...perfil, pesoActual: peso, evoluciones }
      }).eq('user_id', window._userId);
    }
  }

  currentTempFotoBase64 = null;
  document.getElementById('foto-preview-container').style.display = 'none';

  switchEvoTab('progreso');
  renderEvolucion();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="toast-icon">📊</span><span class="toast-msg">¡Avance guardado con éxito!</span>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

function renderEvolucion() {
  const evoluciones = leerEvolucion();
  const pesoInicial = perfil?.peso || (evoluciones[0]?.peso) || 0;

  // Stats rápidos
  document.getElementById('stat-peso-inicio').textContent = `${pesoInicial} kg`;

  const ultimoReg = evoluciones[evoluciones.length - 1];
  const pesoActual = ultimoReg?.peso || pesoInicial;
  const diff = (pesoActual - pesoInicial).toFixed(1);

  const diffEl = document.getElementById('stat-peso-perdido');
  if (diff < 0) {
    diffEl.textContent = `${diff} kg`;
    diffEl.style.color = 'var(--green)';
  } else if (diff > 0) {
    diffEl.textContent = `+${diff} kg`;
    diffEl.style.color = 'var(--amber)';
  } else {
    diffEl.textContent = `0.0 kg`;
  }

  document.getElementById('stat-animo').textContent = ultimoReg?.animo ? ultimoReg.animo.split(' ')[0] + ' Excelente' : '⚡ Excelente';

  // Fotos Antes y Después
  const fotoInicial = evoluciones.find(e => e.foto);
  const fotoReciente = [...evoluciones].reverse().find(e => e.foto);

  const imgAntes = document.getElementById('img-antes');
  const noImgAntes = document.getElementById('no-img-antes');
  const pesoAntesLabel = document.getElementById('peso-antes-label');

  if (fotoInicial?.foto) {
    imgAntes.src = fotoInicial.foto;
    imgAntes.style.display = 'block';
    noImgAntes.style.display = 'none';
  } else {
    imgAntes.style.display = 'none';
    noImgAntes.style.display = 'block';
  }
  pesoAntesLabel.textContent = `${pesoInicial} kg (Inicial)`;

  const imgDespues = document.getElementById('img-despues');
  const noImgDespues = document.getElementById('no-img-despues');
  const pesoDespuesLabel = document.getElementById('peso-despues-label');

  if (fotoReciente?.foto) {
    imgDespues.src = fotoReciente.foto;
    imgDespues.style.display = 'block';
    noImgDespues.style.display = 'none';
  } else {
    imgDespues.style.display = 'none';
    noImgDespues.style.display = 'block';
  }
  pesoDespuesLabel.textContent = `${pesoActual} kg (${ultimoReg ? 'Semana ' + ultimoReg.semana : 'Actual'})`;

  // Historial
  const container = document.getElementById('historial-evolucion-grid');
  if (container) {
    container.innerHTML = '';
    if (evoluciones.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:16px;color:var(--text-muted);font-size:0.8rem;">
          No hay registros aún. ¡Añade tu primer avance arriba!
        </div>
      `;
    } else {
      const nombresSemanas = ['', 'Semana 1 (Inicial)', 'Semana 2', 'Semana 3', 'Semana 4', 'Final (Día 30)'];
      evoluciones.forEach(evo => {
        const card = document.createElement('div');
        card.style.cssText = 'background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:10px;padding:10px;display:flex;align-items:center;justify-content:space-between;gap:10px;';
        const diffSem = (evo.peso - pesoInicial).toFixed(1);
        const diffTexto = diffSem <= 0 ? `${diffSem} kg` : `+${diffSem} kg`;

        card.innerHTML = `
          <div style="display:flex;align-items:center;gap:10px;">
            ${evo.foto
              ? `<img src="${evo.foto}" style="width:38px;height:38px;border-radius:6px;object-fit:cover;">`
              : `<div style="width:38px;height:38px;border-radius:6px;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;font-size:1rem;">📸</div>`
            }
            <div>
              <div style="font-weight:700;font-size:0.82rem;">${nombresSemanas[evo.semana] || 'Semana ' + evo.semana}</div>
              <div style="font-size:0.72rem;color:var(--text-muted);">${evo.animo} &middot; ${evo.fecha}</div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:800;font-size:0.88rem;">${evo.peso} kg</div>
            <div style="font-size:0.72rem;font-weight:700;color:${diffSem <= 0 ? 'var(--green)' : 'var(--amber)'};">${diffTexto}</div>
          </div>
        `;
        container.appendChild(card);
      });
    }
  }

  // Renderizar Gráfico de Linha
  renderEvolucionChart();
}

function renderEvolucionChart() {
  const canvas = document.getElementById('weightChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const evoluciones = leerEvolucion();
  const pesoInicial = perfil?.peso || 75;

  let labels = ['Inicial'];
  let dataPoints = [pesoInicial];

  if (evoluciones.length > 0) {
    labels = evoluciones.map(e => `Sem ${e.semana}`);
    dataPoints = evoluciones.map(e => e.peso);
  } else {
    // Projeção simulada visual se nao tiver dados ainda
    labels = ['Día 1', 'Semana 2', 'Semana 3', 'Día 30 (Meta)'];
    const meta = Math.max(pesoInicial - (perfil?.objetivo_kg || 5), 45);
    dataPoints = [pesoInicial, (pesoInicial - 1.5).toFixed(1), (pesoInicial - 3.2).toFixed(1), meta.toFixed(1)];
  }

  if (weightChartInstance) {
    weightChartInstance.destroy();
  }

  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 180);
  gradient.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
  gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

  weightChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Peso (kg)',
        data: dataPoints,
        borderColor: '#10b981',
        borderWidth: 3,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
        backgroundColor: gradient,
        tension: 0.35
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => ` Peso: ${context.parsed.y} kg`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3b4', font: { size: 11 } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3b4', font: { size: 11 } }
        }
      }
    }
  });
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
  renderDia(1, estado);
}

// ============================================================
// LISTA DE LA COMPRA SEMANAL
// ============================================================

const SHOPPING_DATA = {
  1: {
    title: "Semana 1 (Días 1 a 7)",
    categories: [
      {
        name: "🥩 Proteínas y Pescados",
        items: ["Pechugas de pollo o pavo (800g)", "Huevos frescos (12 unidades)", "Salmón o Pescado blanco (400g)", "Atún en lata al natural (4 latas)", "Yogur griego 0% o Queso fresco (500g)"]
      },
      {
        name: "🥗 Verduras y Frutas",
        items: ["Espinacas o Canónigos frescos (2 bolsas)", "Tomates frescos (1kg)", "Brócoli o Verduras variadas (1kg)", "Aguacates maduros (3 unidades)", "Plátanos o Manzanas (1kg)", "Limones frescos (4 unidades)"]
      },
      {
        name: "🌾 Carbohidratos y Legumbres",
        items: ["Avena en copos integrales (500g)", "Arroz integral o Quinoa (500g)", "Pan 100% integral (1 barra)", "Lentejas o Garbanzos cocidos (2 botes)"]
      },
      {
        name: "🥑 Aceites y Grasas Saludables",
        items: ["Aceite de oliva virgen extra (1L)", "Nueces peladas o Almendras (200g)", "Semillas de chía o lino (100g)"]
      }
    ]
  },
  2: {
    title: "Semana 2 (Días 8 a 14)",
    categories: [
      {
        name: "🥩 Proteínas y Pescados",
        items: ["Lomo de pavo o Pechuga (800g)", "Huevos camperos (12 unidades)", "Lubina o Dorada fresca (400g)", "Sardinillas o Caballa en lata (4 latas)", "Queso fresco batido 0% (500g)"]
      },
      {
        name: "🥗 Verduras y Frutas",
        items: ["Calabacín y Berenjenas (1kg)", "Zanahorias (1 bolsa)", "Pimientos rojos y verdes (3 unidades)", "Fresas o Frutos rojos (1 tarrina)", "Naranjas o Mandarinas (1kg)"]
      },
      {
        name: "🌾 Carbohidratos y Cereales",
        items: ["Tortitas de arroz o maíz integral", "Pasta integral de trigo (500g)", "Boniato o Patatas nuevas (1kg)"]
      },
      {
        name: "🥑 Frutos Secos y Semillas",
        items: ["Almendras al natural (200g)", "Crema de cacahuete 100% fruto seco (1 bote)"]
      }
    ]
  },
  3: {
    title: "Semana 3 (Días 15 a 21)",
    categories: [
      {
        name: "🥩 Proteínas de Calidad",
        items: ["Solomillo de pavo o Muslos desosados (800g)", "Huevos frescos (12 unidades)", "Bacalao o Merluza (400g)", "Pechuga de pavo en lonchas >90% (200g)"]
      },
      {
        name: "🥗 Hortalizas y Frutas de Temporada",
        items: ["Lechuga variada y Rúcula (2 bolsas)", "Espárragos verdes (1 manojo)", "Champignons o Setas (300g)", "Kiwis o Manzanas verdes (1kg)"]
      },
      {
        name: "🌾 Carbohidratos Complejos",
        items: ["Pan de centeno 100% integral", "Arroz salvaje o integral (500g)", "Copos de avena fina (500g)"]
      }
    ]
  },
  4: {
    title: "Semana 4 (Días 22 a 30)",
    categories: [
      {
        name: "🥩 Proteínas Magras",
        items: ["Pechuga de pollo campero (1kg)", "Huevos frescos (12 unidades)", "Salmón o Trucha (500g)", "Kéfir o Yogur proteico 0% (4 botes)"]
      },
      {
        name: "🥗 Verduras Detox y Frutas",
        items: ["Calabaza o Calabacín (1kg)", "Espinacas baby (2 bolsas)", "Aguacates (4 unidades)", "Piña natural o Frutos rojos (1 unidad)"]
      },
      {
        name: "🌾 Granos Integrales y Grasas",
        items: ["Quinoa real (400g)", "Nueces de California (200g)", "Aceite de oliva virgen extra (1L)"]
      }
    ]
  }
};

let currentShoppingWeek = 1;

function abrirShoppingModal() {
  const modal = document.getElementById('shopping-modal');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('show');
  }
  switchShoppingTab(1);
}

function closeShoppingModal() {
  const modal = document.getElementById('shopping-modal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('show');
  }
}

function switchShoppingTab(weekNum) {
  currentShoppingWeek = weekNum;

  // Actualizar botones de tabs
  for (let w = 1; w <= 4; w++) {
    const btn = document.getElementById(`shop-tab-${w}`);
    if (btn) {
      if (w === weekNum) {
        btn.className = 'btn btn-primary btn-sm';
      } else {
        btn.className = 'btn btn-outline btn-sm';
      }
    }
  }

  renderShoppingList(weekNum);
}

function renderShoppingList(weekNum) {
  const container = document.getElementById('shopping-content');
  if (!container) return;

  const data = SHOPPING_DATA[weekNum];
  const esGated = weekNum > 1 && !isPremium();

  if (esGated) {
    container.innerHTML = `
      <div style="background:rgba(124,58,237,0.08);border:1px dashed rgba(124,58,237,0.4);border-radius:16px;padding:24px 16px;text-align:center;margin:10px 0;">
        <div style="font-size:2.5rem;margin-bottom:8px;">🔒</div>
        <h4 style="font-size:1.05rem;color:var(--purple-light);margin-bottom:6px;">Lista de la ${data.title} Bloqueada</h4>
        <p style="font-size:0.82rem;color:var(--text-secondary);line-height:1.5;max-width:340px;margin:0 auto 16px;">
          Desbloquea el plan completo de 30 días para acceder a todas las listas de compras semanales organizadas por supermercado.
        </p>
        <a href="${PAYWALL_URL}" target="_blank" class="btn btn-primary" style="font-size:0.88rem;padding:12px 20px;box-shadow:0 4px 20px rgba(124,58,237,0.4);">
          ⭐ Desbloquear por €14,90
        </a>
      </div>
    `;
    return;
  }

  // Cargar estado de items marcados desde localStorage
  const savedState = JSON.parse(localStorage.getItem(`miplanfit_shop_week_${weekNum}`) || '{}');

  let html = `
    <div style="margin-bottom:14px;background:rgba(255,255,255,0.03);padding:10px 14px;border-radius:10px;border:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:0.85rem;font-weight:700;color:var(--purple-light);">${data.title}</span>
      <span style="font-size:0.75rem;color:var(--text-muted);">Toca para tachar lo comprado</span>
    </div>
  `;

  data.categories.forEach((cat, catIdx) => {
    html += `
      <div style="margin-bottom:16px;">
        <div style="font-size:0.85rem;font-weight:700;color:var(--amber);margin-bottom:8px;display:flex;align-items:center;gap:6px;">
          ${cat.name}
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;">
    `;

    cat.items.forEach((item, itemIdx) => {
      const itemKey = `${catIdx}_${itemIdx}`;
      const checked = savedState[itemKey] ? 'checked' : '';
      const textStyle = checked ? 'text-decoration:line-through;opacity:0.45;color:var(--text-muted);' : 'color:var(--text-primary);';

      html += `
        <label onclick="toggleShoppingItem(${weekNum}, ${catIdx}, ${itemIdx})" style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:8px;cursor:pointer;user-select:none;transition:all 0.15s;">
          <input type="checkbox" ${checked} style="width:16px;height:16px;accent-color:var(--purple);cursor:pointer;" onclick="event.stopPropagation();toggleShoppingItem(${weekNum}, ${catIdx}, ${itemIdx});">
          <span style="font-size:0.85rem;line-height:1.4;${textStyle}">${item}</span>
        </label>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function toggleShoppingItem(weekNum, catIdx, itemIdx) {
  const key = `miplanfit_shop_week_${weekNum}`;
  const savedState = JSON.parse(localStorage.getItem(key) || '{}');
  const itemKey = `${catIdx}_${itemIdx}`;

  if (savedState[itemKey]) {
    delete savedState[itemKey];
  } else {
    savedState[itemKey] = true;
  }

  localStorage.setItem(key, JSON.stringify(savedState));
  renderShoppingList(weekNum);
}
