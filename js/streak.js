// ============================================================
// STREAK.JS — Sistema de gamificação estilo Duolingo
// ============================================================

const LOGROS_CONFIG = [
  {
    id: "primer_dia",
    nombre: "¡Primer Paso!",
    desc: "Completaste tu primer día",
    emoji: "🌱",
    condicion: (estado) => estado.diasCompletados.length >= 1
  },
  {
    id: "tres_dias",
    nombre: "Constancia",
    desc: "3 días seguidos completados",
    emoji: "⚡",
    condicion: (estado) => estado.streakActual >= 3
  },
  {
    id: "semana_1",
    nombre: "Primera Semana",
    desc: "7 días completados",
    emoji: "🔥",
    condicion: (estado) => estado.diasCompletados.length >= 7
  },
  {
    id: "racha_7",
    nombre: "Racha de Fuego",
    desc: "7 días seguidos sin fallar",
    emoji: "🏅",
    condicion: (estado) => estado.streakActual >= 7
  },
  {
    id: "semana_2",
    nombre: "Imparable",
    desc: "15 días completados",
    emoji: "💪",
    condicion: (estado) => estado.diasCompletados.length >= 15
  },
  {
    id: "racha_15",
    nombre: "Máquina",
    desc: "15 días seguidos sin fallar",
    emoji: "🤖",
    condicion: (estado) => estado.streakActual >= 15
  },
  {
    id: "mes_completo",
    nombre: "¡30 Días Completados!",
    desc: "Completaste el plan entero",
    emoji: "🏆",
    condicion: (estado) => estado.diasCompletados.length >= 30
  },
  {
    id: "perfecto",
    nombre: "Perfeccionista",
    desc: "Sin saltarte ningún día",
    emoji: "⭐",
    condicion: (estado) => estado.maxStreak >= 30
  }
];

// ─── Obtener clave de localStorage según usuario ───
function getStreakKey(nombre) {
  return `miplanfit_streak_${(nombre || 'usuario').replace(/\s/g,'_')}`;
}

// ─── Leer estado ───
function leerEstado(nombre) {
  const key = getStreakKey(nombre);
  const raw = localStorage.getItem(key);
  if (!raw) {
    return {
      diasCompletados: [],
      streakActual: 0,
      maxStreak: 0,
      logros: [],
      fechaInicio: new Date().toISOString()
    };
  }
  return JSON.parse(raw);
}

// ─── Guardar estado ───
function guardarEstado(nombre, estado) {
  const key = getStreakKey(nombre);
  localStorage.setItem(key, JSON.stringify(estado));
}

// ─── Marcar día como completado ───
function marcarDiaCompletado(nombre, dia) {
  const estado = leerEstado(nombre);

  if (estado.diasCompletados.includes(dia)) {
    return { yaCompletado: true, estado };
  }

  estado.diasCompletados.push(dia);
  estado.diasCompletados.sort((a, b) => a - b);

  // Recalcular streak actual acumulando rachas de ciclos anteriores
  const rachaBase = estado.rachaAcumulada || 0;
  const streakCiclo = calcularStreakActual(estado.diasCompletados);
  estado.streakActual = rachaBase + streakCiclo;
  estado.maxStreak = Math.max(estado.maxStreak || 0, estado.streakActual);

  // Verificar nuevos logros
  const novosLogros = [];
  LOGROS_CONFIG.forEach(logro => {
    if (!estado.logros.includes(logro.id) && logro.condicion(estado)) {
      estado.logros.push(logro.id);
      novosLogros.push(logro);
    }
  });

  guardarEstado(nombre, estado);
  return { yaCompletado: false, estado, novosLogros };
}

// ─── Calcular racha actual ───
function calcularStreakActual(diasCompletados) {
  if (!diasCompletados.length) return 0;

  const sorted = [...diasCompletados].sort((a, b) => a - b);
  let streak = 1;
  let maxConsec = 1;

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      streak++;
      maxConsec = Math.max(maxConsec, streak);
    } else {
      streak = 1;
    }
  }

  // La racha actual son los últimos días consecutivos
  let streakActual = 1;
  for (let i = sorted.length - 1; i > 0; i--) {
    if (sorted[i] === sorted[i - 1] + 1) {
      streakActual++;
    } else {
      break;
    }
  }

  return streakActual;
}

// ─── Verificar si un día está completado ───
function isDiaCompletado(nombre, dia) {
  const estado = leerEstado(nombre);
  return estado.diasCompletados.includes(dia);
}

// ─── Reiniciar plan ───
function reiniciarPlanStreak(nombre) {
  const estado = leerEstado(nombre);
  estado.diasCompletados = [];
  estado.streakActual = 0;
  estado.fechaInicio = new Date().toISOString();
  guardarEstado(nombre, estado);
}

// ─── Mostrar notificación de logro ───
function mostrarNotificacionLogro(logro) {
  const notif = document.createElement('div');
  notif.style.cssText = `
    position: fixed; top: 80px; right: 24px; z-index: 9999;
    background: linear-gradient(135deg, #f59e0b20, #f59e0b10);
    border: 1px solid #f59e0b60;
    border-radius: 14px; padding: 14px 18px;
    display: flex; align-items: center; gap: 12px;
    backdrop-filter: blur(20px);
    animation: fadeInUp 0.4s ease;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    max-width: 280px;
  `;
  notif.innerHTML = `
    <span style="font-size:1.8rem;">${logro.emoji}</span>
    <div>
      <div style="font-weight:700;font-size:0.9rem;color:#f1f0f9;">🏆 ¡Logro desbloqueado!</div>
      <div style="font-weight:600;font-size:0.85rem;color:#f59e0b;">${logro.nombre}</div>
      <div style="font-size:0.75rem;color:#9ca3b4;">${logro.desc}</div>
    </div>
  `;
  document.body.appendChild(notif);
  setTimeout(() => notif.style.opacity = '0', 3500);
  setTimeout(() => notif.remove(), 4000);
}
