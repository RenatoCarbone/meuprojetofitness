// ============================================================
// BANCO DE EJERCICIOS — FitJourney España
// ============================================================

const EXERCISES = {

  casa: {
    semana1: [
      { nombre: "Sentadillas", series: 3, reps: "12", emoji: "🦵", descripcion: "Pies al ancho de caderas, baja controlado" },
      { nombre: "Flexiones de rodillas", series: 3, reps: "10", emoji: "💪", descripcion: "Manos al ancho de hombros, cuerpo recto" },
      { nombre: "Plancha abdominal", series: 3, reps: "20 seg", emoji: "🧘", descripcion: "Cuerpo en línea recta, abdomen contraído" },
      { nombre: "Zancadas alternas", series: 3, reps: "10 c/lado", emoji: "🏃", descripcion: "Paso largo adelante, rodilla no pasa del pie" },
      { nombre: "Elevación de talones", series: 3, reps: "15", emoji: "👟", descripcion: "De puntillas lentamente, baja controlado" },
      { nombre: "Puente de glúteos", series: 3, reps: "15", emoji: "🍑", descripcion: "Tumbado, levanta caderas contrayendo glúteos" },
      { nombre: "Superman", series: 3, reps: "12", emoji: "🦸", descripcion: "Boca abajo, eleva brazos y piernas a la vez" }
    ],
    semana2: [
      { nombre: "Sentadillas sumo", series: 3, reps: "15", emoji: "🦵", descripcion: "Pies más abiertos, punta hacia fuera" },
      { nombre: "Flexiones completas", series: 3, reps: "8", emoji: "💪", descripcion: "Cuerpo recto, baja hasta casi tocar el suelo" },
      { nombre: "Plancha lateral", series: 3, reps: "20 seg c/lado", emoji: "🧘", descripcion: "Apoyo en un brazo, cuerpo recto lateral" },
      { nombre: "Sentadilla + salto", series: 3, reps: "10", emoji: "⬆️", descripcion: "Baja como sentadilla normal, sube con salto" },
      { nombre: "Mountain climbers", series: 3, reps: "20 total", emoji: "🧗", descripcion: "En plancha, alterna rodillas al pecho rápido" },
      { nombre: "Tijeras de piernas", series: 3, reps: "20 total", emoji: "✂️", descripcion: "Tumbado, cruza piernas en el aire" },
      { nombre: "Burpee modificado", series: 3, reps: "8", emoji: "🔄", descripcion: "Sin salto final: plancha + levantarse + sentadilla" }
    ],
    semana3: [
      { nombre: "Pistol squat asistido", series: 3, reps: "8 c/lado", emoji: "🦵", descripcion: "Sentadilla a una pierna con apoyo de pared" },
      { nombre: "Flexiones diamante", series: 3, reps: "8", emoji: "💎", descripcion: "Manos formando un triángulo, tríceps al máximo" },
      { nombre: "Plancha con toque de hombro", series: 3, reps: "16 total", emoji: "✋", descripcion: "En plancha, toca el hombro contrario sin oscilar" },
      { nombre: "Reverse lunges", series: 3, reps: "12 c/lado", emoji: "🔙", descripcion: "Zancada hacia atrás, más énfasis en glúteo" },
      { nombre: "Burpee completo", series: 3, reps: "10", emoji: "🔄", descripcion: "Plancha + flexión + salto con manos arriba" },
      { nombre: "Abdominales bicicleta", series: 3, reps: "20 total", emoji: "🚴", descripcion: "Alterna codo con rodilla opuesta" },
      { nombre: "Hip thrust", series: 3, reps: "15", emoji: "🍑", descripcion: "Hombros en sofá/silla, empuja caderas arriba" }
    ],
    semana4: [
      { nombre: "Sentadilla búlgara", series: 3, reps: "10 c/lado", emoji: "🦵", descripcion: "Pie trasero elevado, baja con la pierna delantera" },
      { nombre: "Pike push-up", series: 3, reps: "10", emoji: "💪", descripcion: "En V invertida, baja la cabeza hacia el suelo" },
      { nombre: "Plancha + remo", series: 3, reps: "12 c/lado", emoji: "🧘", descripcion: "En plancha, lleva codo arriba alternando" },
      { nombre: "Saltos al cajón (imaginario)", series: 3, reps: "12", emoji: "⬆️", descripcion: "Salto explosivo arriba, aterrizaje suave" },
      { nombre: "Circuito HIIT 20/10", series: 4, reps: "4 ejercicios", emoji: "🔥", descripcion: "20s ejercicio / 10s descanso: sentadilla, plancha, zancada, flex" },
      { nombre: "Superman + extensión", series: 3, reps: "12", emoji: "🦸", descripcion: "Boca abajo, extiende brazos y piernas completamente" },
      { nombre: "Sprint en sitio", series: 4, reps: "30 seg", emoji: "🏃", descripcion: "Corre sin moverte rápido, rodillas altas" }
    ],
    descanso: { nombre: "Día de descanso activo", emoji: "🧘‍♀️", descripcion: "Camina 30 min suave o haz estiramientos" }
  },

  gimnasio: {
    semana1: [
      { nombre: "Sentadilla en máquina", series: 3, reps: "12", emoji: "🏋️", descripcion: "Ajusta el respaldo, baja a 90 grados" },
      { nombre: "Press de banca", series: 3, reps: "10", emoji: "💪", descripcion: "Barra o mancuernas, baja controlado al pecho" },
      { nombre: "Remo en polea baja", series: 3, reps: "12", emoji: "🎯", descripcion: "Espalda recta, jala hacia el ombligo" },
      { nombre: "Leg press", series: 3, reps: "12", emoji: "🦵", descripcion: "Pies al ancho de caderas, baja sin bloquear rodillas" },
      { nombre: "Jalón al pecho", series: 3, reps: "12", emoji: "⬇️", descripcion: "Barra ancha, jala hasta la clavícula" },
      { nombre: "Cardio elíptica", series: 1, reps: "20 min", emoji: "🏃", descripcion: "Intensidad moderada, ritmo constante" }
    ],
    semana2: [
      { nombre: "Sentadilla libre", series: 4, reps: "10", emoji: "🏋️", descripcion: "Barra en trapecios, baja paralelo al suelo" },
      { nombre: "Press inclinado", series: 3, reps: "10", emoji: "💪", descripcion: "Banco a 45°, trabaja la parte alta del pecho" },
      { nombre: "Peso muerto rumano", series: 3, reps: "10", emoji: "🎯", descripcion: "Baja la barra por las piernas manteniendo espalda recta" },
      { nombre: "Extensión de cuádriceps", series: 3, reps: "15", emoji: "🦵", descripcion: "En máquina, extensión completa y descenso lento" },
      { nombre: "Curl de bíceps", series: 3, reps: "12", emoji: "💪", descripcion: "Con barra EZ o mancuernas, codo fijo" },
      { nombre: "Cardio bicicleta", series: 1, reps: "25 min", emoji: "🚴", descripcion: "Resistencia media-alta, intervalos opcionales" }
    ],
    semana3: [
      { nombre: "Sentadilla + peso", series: 4, reps: "8", emoji: "🏋️", descripcion: "Aumenta el peso respecto a semana 1" },
      { nombre: "Aperturas con mancuernas", series: 3, reps: "12", emoji: "🦅", descripcion: "Banco plano, arco con los brazos bajando" },
      { nombre: "Dominadas asistidas", series: 3, reps: "8", emoji: "🎯", descripcion: "Con banda elástica, lleva el pecho a la barra" },
      { nombre: "Zancadas con mancuernas", series: 3, reps: "10 c/lado", emoji: "🦵", descripcion: "Mantén torso recto en todo el movimiento" },
      { nombre: "Press de hombro", series: 3, reps: "10", emoji: "🔼", descripcion: "Mancuernas a 90°, empuja hacia arriba sin bloquear" },
      { nombre: "HIIT en cinta", series: 1, reps: "20 min", emoji: "🏃", descripcion: "1 min al 90% + 2 min suave, repetir" }
    ],
    semana4: [
      { nombre: "Sentadilla frontal", series: 4, reps: "8", emoji: "🏋️", descripcion: "Barra en clavículas, más cuádriceps" },
      { nombre: "Press de banca inclinado + décliné", series: 3, reps: "10 c/u", emoji: "💪", descripcion: "Trabaja todo el pecho" },
      { nombre: "Peso muerto convencional", series: 4, reps: "6", emoji: "🎯", descripcion: "El rey de los ejercicios, espalda recta siempre" },
      { nombre: "Superserie: leg curl + extensión", series: 3, reps: "12+12", emoji: "🦵", descripcion: "Sin descanso entre ambos ejercicios" },
      { nombre: "Circuito de hombros", series: 3, reps: "10 c/u", emoji: "🔼", descripcion: "Elevaciones lat. + frontales + press" },
      { nombre: "Cardio intenso", series: 1, reps: "30 min", emoji: "🏃", descripcion: "Ritmo alto sostenido o HIIT avanzado" }
    ],
    descanso: { nombre: "Día de recuperación", emoji: "🧘‍♀️", descripcion: "Camina suave o sesión de estiramientos 20 min" }
  }
};

// Días de descanso: día 3, 6, 10, 13, 17, 20, 24, 27 (patrón 2 días trabajo + 1 descanso aprox.)
const DIAS_DESCANSO = [3, 6, 10, 13, 17, 20, 24, 27, 30];

function getDiaDescanso(tipo) {
  return EXERCISES[tipo]?.descanso || EXERCISES.casa.descanso;
}

function getSemana(dia) {
  if (dia <= 7) return "semana1";
  if (dia <= 14) return "semana2";
  if (dia <= 21) return "semana3";
  return "semana4";
}

function getEjerciciosDia(dia, tipo = "casa") {
  if (DIAS_DESCANSO.includes(dia)) {
    return { descanso: true, ejercicio: getDiaDescanso(tipo) };
  }
  const semana = getSemana(dia);
  const ejercicios = EXERCISES[tipo][semana] || EXERCISES[tipo]["semana1"];
  return { descanso: false, ejercicios };
}
