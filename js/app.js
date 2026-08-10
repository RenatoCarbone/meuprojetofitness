// ============================================================
// APP.JS — Lógica del formulario de onboarding
// ============================================================

let currentStep = 1;

// ─── Navegación del wizard ───
function nextStep(from) {
  if (!validateStep(from)) return;

  if (from === 2) {
    actualizarOpcionesPaso3();
  }

  const current = document.getElementById(`step-${from}`);
  const next = document.getElementById(`step-${from + 1}`);
  const dot = document.getElementById(`dot-${from}`);
  const line = document.getElementById(`line-${from}`);
  const nextDot = document.getElementById(`dot-${from + 1}`);

  current.classList.remove('active');
  next.classList.add('active');
  dot.classList.remove('active');
  dot.classList.add('done');
  dot.textContent = '✓';
  if (line) line.classList.add('done');
  if (nextDot) nextDot.classList.add('active');

  currentStep = from + 1;
  window.scrollTo({ top: document.getElementById('formulario').offsetTop - 80, behavior: 'smooth' });
}

function actualizarOpcionesPaso3() {
  const pref = document.querySelector('input[name="preferencia"]:checked')?.value || 'omnivoro';

  const meatIds = ['f-carne', 'f-pollo', 'f-pavo', 'f-pescado', 'f-salmon', 'f-atun', 'f-gambas'];
  const dairyEggIds = ['f-huevo', 'f-lacteos', 'f-yogur', 'f-queso'];

  // Mostrar todos los tags por defecto
  document.querySelectorAll('.food-tag').forEach(tag => tag.style.display = 'inline-flex');

  if (pref === 'vegetariano') {
    // Ocultar carnes y pescados
    meatIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.checked = false;
        const tag = el.closest('.food-tag');
        if (tag) tag.style.display = 'none';
      }
    });
  } else if (pref === 'vegano') {
    // Ocultar carnes, pescados, lácteos y huevos
    [...meatIds, ...dairyEggIds].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.checked = false;
        const tag = el.closest('.food-tag');
        if (tag) tag.style.display = 'none';
      }
    });
  }
}

function prevStep(from) {
  const current = document.getElementById(`step-${from}`);
  const prev = document.getElementById(`step-${from - 1}`);
  const dot = document.getElementById(`dot-${from}`);
  const prevDot = document.getElementById(`dot-${from - 1}`);
  const line = document.getElementById(`line-${from - 1}`);

  current.classList.remove('active');
  prev.classList.add('active');
  dot.classList.remove('active');
  prevDot.classList.remove('done');
  prevDot.classList.add('active');
  prevDot.textContent = from - 1;
  if (line) line.classList.remove('done');

  currentStep = from - 1;
  window.scrollTo({ top: document.getElementById('formulario').offsetTop - 80, behavior: 'smooth' });
}

// ─── Validación ───
function validateStep(step) {
  if (step === 1) {
    const nombre = document.getElementById('nombre').value.trim();
    const edad = document.getElementById('edad').value;
    const altura = document.getElementById('altura').value;
    const peso = document.getElementById('peso').value;

    if (!nombre) { showError('Por favor, escribe tu nombre.'); return false; }
    if (!edad || edad < 16 || edad > 80) { showError('Introduce una edad válida (16-80).'); return false; }
    if (!altura || altura < 140 || altura > 220) { showError('Introduce una altura válida (140-220 cm).'); return false; }
    if (!peso || peso < 40 || peso > 200) { showError('Introduce un peso válido (40-200 kg).'); return false; }
  }
  return true;
}

function showError(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="toast-icon">⚠️</span><span class="toast-msg">${msg}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ─── Analytics Tracker (Métricas de Funil en Supabase) ───
async function registrarEventoAnalytics(tipoEvento) {
  try {
    const countKey = `miplanfit_stat_${tipoEvento}`;
    const cur = parseInt(localStorage.getItem(countKey) || '0');
    localStorage.setItem(countKey, (cur + 1).toString());

    const client = getSupabase();
    if (client) {
      await client.from('analytics_events').insert([{
        evento: tipoEvento,
        created_at: new Date().toISOString()
      }]).catch(() => {});
    }
  } catch(e) {}
}

// ─── Auto-detectar errores o plan existente al cargar index.html ───
document.addEventListener('DOMContentLoaded', async function() {
  // Registrar visita única a la página de landing
  if (!sessionStorage.getItem('miplanfit_visited_session')) {
    sessionStorage.setItem('miplanfit_visited_session', 'true');
    registrarEventoAnalytics('visita');
  }

  const urlParams = new URLSearchParams(window.location.search);
  
  // Capturar código de invitación (?ref=...) si el usuario viene recomendado por alguien
  const refCode = urlParams.get('ref');
  const isReferralLink = !!refCode;

  if (refCode) {
    const cleanRef = refCode.trim().toLowerCase();
    localStorage.setItem('miplanfit_ref_by', cleanRef);
    sessionStorage.setItem('miplanfit_ref_by', cleanRef);
    
    // Si viene por un enlace de referido, limpiar datos locales anteriores para que el amigo cree su propio plan
    ['miplanfit_perfil','miplanfit_plan30','miplanfit_plan_id',
     'miplanfit_imc','miplanfit_tmb','miplanfit_tdee'].forEach(k => localStorage.removeItem(k));
  }

  const hasNoPlanError = urlParams.get('error') === 'no_plan_found';

  if (hasNoPlanError) {
    showError('⚠️ No encontramos un plan registrado para esta cuenta. Por favor, responde al cuestionario de 2 min.');
    setTimeout(() => {
      const form = document.getElementById('formulario');
      if (form) form.scrollIntoView({ behavior: 'smooth' });
    }, 500);
    return;
  }

  // Detectar si el usuario está regresando de un login con Google (OAuth callback) o si ya tiene sesión activa
  const hash = window.location.hash;
  const search = window.location.search;
  const isAuthCallback = hash.includes('access_token=') || search.includes('code=');

  // Si NO es un enlace de referido de invitación, ir directo a plano.html si ya hay sesión activa
  if (!isReferralLink) {
    const client = getSupabase();
    if (client) {
      try {
        const { data: { session } } = await client.auth.getSession();

        if (session || isAuthCallback) {
          // ¡SI EL USUARIO TIENE SESIÓN O VIENE DE GOOGLE, IR DIRECTO A PLANO.HTML!
          window.location.href = 'plano.html';
          return;
        }
      } catch(e) {
        console.warn('Auth check error:', e);
      }
    }
  }

  // Si no hay sesión activa pero hay datos locales en el navegador, mostrar el banner de continuar
  const perfilGuardado = localStorage.getItem('miplanfit_perfil');
  if (perfilGuardado) {
    try {
      const perfil = JSON.parse(perfilGuardado);
      mostrarBannerPlanExistente(perfil.nombre || 'Usuario');
    } catch(e) {}
  }
});

function mostrarBannerPlanExistente(nombre) {
  const banner = document.createElement('div');
  banner.style.cssText = `
    background: linear-gradient(135deg, rgba(124,58,237,0.2), rgba(16,185,129,0.2));
    border-bottom: 1px solid rgba(124,58,237,0.4);
    padding: 12px 24px; text-align: center; font-size: 0.95rem;
    display: flex; align-items: center; justify-content: center; gap: 14px;
    flex-wrap: wrap; backdrop-filter: blur(12px);
  `;
  banner.innerHTML = `
    <span>👋 ¡Hola, <strong>${nombre}</strong>! Tienes tu plan de 30 días activo.</span>
    <a href="plano.html" class="btn btn-green btn-sm" style="padding: 6px 16px;">▶ Continuar mi plan</a>
  `;
  document.body.insertBefore(banner, document.body.firstChild);
}

// ─── Envío del formulario ───
document.getElementById('main-form').addEventListener('submit', async function(e) {
  e.preventDefault();

  // Recopilar datos
  const perfil = {
    nombre: document.getElementById('nombre').value.trim(),
    sexo: document.querySelector('input[name="sexo"]:checked')?.value || 'hombre',
    edad: parseInt(document.getElementById('edad').value),
    altura: parseInt(document.getElementById('altura').value),
    peso: parseFloat(document.getElementById('peso').value),
    objetivo_kg: parseInt(document.querySelector('input[name="objetivo_kg"]:checked')?.value || 5),
    actividad: document.querySelector('input[name="actividad"]:checked')?.value || 'sedentario',
    ejercicios: document.querySelector('input[name="ejercicios"]:checked')?.value || 'no',
    refeicoesDia: parseInt(document.querySelector('input[name="refeicoes"]:checked')?.value || 5),
    preferencia: document.querySelector('input[name="preferencia"]:checked')?.value || 'omnivoro',
    esVegetariano: document.querySelector('input[name="preferencia"]:checked')?.value !== 'omnivoro',
    esDiabetico: document.getElementById('cond-diab')?.checked || false,
    tieneHipertension: document.getElementById('cond-hiper')?.checked || false,
    condiciones: Array.from(document.querySelectorAll('input[name="condiciones"]:checked')).map(i => i.value),
    alimentosExcluidos: Array.from(document.querySelectorAll('input[name="excluir"]:checked')).map(i => i.value)
  };

  // Calcular métricas
  const imc = calcularIMC(perfil.peso, perfil.altura);
  const tmb = calcularTMB(perfil);
  const tdee = calcularTDEE(perfil);
  const planRecomendado = recomendarPlan(perfil);
  const plan30dias = generarPlan30Dias(perfil, planRecomendado);

  // Guardar en localStorage (persistente) y garantizar que la nueva cuenta inicie como Gratuito (3 días)
  localStorage.removeItem('miplanfit_premium');
  localStorage.setItem('miplanfit_premium', 'false');
  localStorage.setItem('miplanfit_perfil', JSON.stringify(perfil));
  localStorage.setItem('miplanfit_imc', JSON.stringify(imc));
  localStorage.setItem('miplanfit_tmb', tmb);
  localStorage.setItem('miplanfit_tdee', tdee);
  localStorage.setItem('miplanfit_plan_id', planRecomendado);
  localStorage.setItem('miplanfit_plan30', JSON.stringify(plan30dias));

  // También guardamos en sessionStorage por compatibilidad
  sessionStorage.setItem('miplanfit_perfil', JSON.stringify(perfil));
  sessionStorage.setItem('miplanfit_imc', JSON.stringify(imc));
  sessionStorage.setItem('miplanfit_tmb', tmb);
  sessionStorage.setItem('miplanfit_tdee', tdee);
  sessionStorage.setItem('miplanfit_plan_id', planRecomendado);
  sessionStorage.setItem('miplanfit_plan30', JSON.stringify(plan30dias));

  // Inicializar streak si no existe
  const streakKey = `miplanfit_streak_${perfil.nombre.replace(/\s/g,'_')}`;
  if (!localStorage.getItem(streakKey)) {
    localStorage.setItem(streakKey, JSON.stringify({
      diasCompletados: [],
      streakActual: 0,
      maxStreak: 0,
      logros: [],
      fechaInicio: new Date().toISOString()
    }));
  }

  // ─── Pantalla de análisis visual (3.8s) para alto valor percibido ───
  const overlay = document.getElementById('analyzing-overlay');
  if (overlay) {
    overlay.classList.add('show');
  }

  const usuario = await getUsuarioAtual();

  if (usuario) {
    await salvarPlanoNaNuvem(usuario.id, {
      perfil, plan30: plan30dias, planId: planRecomendado, imc, tmb, tdee
    });

    setTimeout(() => { window.location.href = 'plano.html'; }, 3800);
  } else {
    // Esperar 3.8s viendo la generación del plan antes de mostrar el modal
    setTimeout(() => {
      if (overlay) overlay.classList.remove('show');
      const loginModal = document.getElementById('login-modal');
      if (loginModal) loginModal.style.display = 'flex';
    }, 3800);
  }
});

function toggleGimOptions() {
  // Puede usarse para mostrar opciones adicionales según gym o casa
}
