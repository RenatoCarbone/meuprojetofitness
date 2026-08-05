// ============================================================
// CONFIGURACIÓN DE PLANES — MiPlanFit España
// ============================================================

const PLANES = {
  A: {
    id: "A",
    nombre: "Plan Equilibrio",
    subtitulo: "Pérdida gradual y sostenible sin sacrificios",
    descripcion: "Diseñado para quienes buscan perder hasta 5 kg de forma cómoda y duradera. Alimentación mediterránea variada y deliciosa, sin pasar hambre ni renunciar al placer de comer.",
    emoji: "🥗",
    color: "#10b981",
    colorGrad: "linear-gradient(135deg, #10b981, #059669)",
    caloriasBase: { hombre: 1800, mujer: 1500 },
    deficitObjetivo: "300-400 kcal/día",
    caracteristicas: [
      "5 comidas saciantes al día",
      "Déficit suave: 300-400 kcal",
      "Máxima variedad de alimentos mediterráneos",
      "100% sostenible a largo plazo"
    ],
    restricciones: { maxCalDesayuno: 320, maxCalAlmuerzo: 420, maxCalMerienda: 160, maxCalCena: 320 }
  },
  B: {
    id: "B",
    nombre: "Plan Transformación",
    subtitulo: "Tu cambio real empieza aquí",
    descripcion: "El plan estrella para perder entre 5 y 10 kg con resultados visibles desde la primera semana. Alto en proteínas para preservar músculo mientras eliminas grasa de forma eficaz.",
    emoji: "🔥",
    color: "#7c3aed",
    colorGrad: "linear-gradient(135deg, #7c3aed, #5b21b6)",
    caloriasBase: { hombre: 1600, mujer: 1300 },
    deficitObjetivo: "500-600 kcal/día",
    caracteristicas: [
      "5 comidas estratégicas al día",
      "Déficit efectivo: 500-600 kcal",
      "Alto en proteínas para conservar músculo",
      "Carbohidratos inteligentes y controlados"
    ],
    restricciones: { maxCalDesayuno: 280, maxCalAlmuerzo: 380, maxCalMerienda: 130, maxCalCena: 260 }
  },
  C: {
    id: "C",
    nombre: "Plan Intensivo",
    subtitulo: "Resultados rápidos con método científico",
    descripcion: "Para quienes tienen más de 10 kg que perder y quieren ver cambios reales y rápidos. Déficit calórico elevado basado en alimentos de alta saciedad y bajo índice glucémico.",
    emoji: "⚡",
    color: "#ef4444",
    colorGrad: "linear-gradient(135deg, #ef4444, #b91c1c)",
    caloriasBase: { hombre: 1400, mujer: 1200 },
    deficitObjetivo: "700-800 kcal/día",
    caracteristicas: [
      "5 comidas de alta saciedad al día",
      "Déficit potente: 700-800 kcal",
      "Máximo en proteínas y vegetales",
      "Sin carbohidratos refinados"
    ],
    restricciones: { maxCalDesayuno: 250, maxCalAlmuerzo: 350, maxCalMerienda: 100, maxCalCena: 220 }
  },
  D: {
    id: "D",
    nombre: "Plan Mantenimiento",
    subtitulo: "Protege lo que tanto te costó conseguir",
    descripcion: "Para quienes ya alcanzaron su peso ideal y quieren conservarlo para siempre. Sin restricciones severas, con toda la riqueza de la dieta mediterránea y plena libertad para disfrutar.",
    emoji: "🛡️",
    color: "#f59e0b",
    colorGrad: "linear-gradient(135deg, #f59e0b, #d97706)",
    caloriasBase: { hombre: 2000, mujer: 1700 },
    deficitObjetivo: "Equilibrio total",
    caracteristicas: [
      "5 comidas completas y variadas",
      "Sin déficit: calorías de mantenimiento",
      "Máxima variedad mediterránea",
      "Estilo de vida sostenible para siempre"
    ],
    restricciones: { maxCalDesayuno: 350, maxCalAlmuerzo: 450, maxCalMerienda: 180, maxCalCena: 380 }
  }
};

// ─────────────────────────────────────────
// Algoritmo de recomendación de plan
// ─────────────────────────────────────────
function recomendarPlan(perfil) {
  const { objetivo_kg, actividad, sexo, edad, peso, altura, condiciones } = perfil;

  // Calcular IMC
  const alturaM = altura / 100;
  const imc = peso / (alturaM * alturaM);

  // Si quiere mantener o perder muy poco
  if (objetivo_kg <= 0) return 'D';

  // Reglas de recomendación
  if (objetivo_kg <= 5) {
    if (actividad === 'alto' || actividad === 'moderado') return 'A';
    return 'B';
  }

  if (objetivo_kg <= 10) {
    if (actividad === 'alto') return 'A';
    if (actividad === 'moderado') return 'B';
    return 'B';
  }

  // Más de 10 kg
  if (objetivo_kg > 10) {
    if (actividad === 'sedentario') return 'C';
    return 'B';
  }

  return 'B'; // Default
}

// ─────────────────────────────────────────
// Cálculo de TMB (Harris-Benedict)
// ─────────────────────────────────────────
function calcularTMB(perfil) {
  const { sexo, edad, peso, altura } = perfil;
  if (sexo === 'hombre') {
    return Math.round(88.362 + (13.397 * peso) + (4.799 * altura) - (5.677 * edad));
  } else {
    return Math.round(447.593 + (9.247 * peso) + (3.098 * altura) - (4.330 * edad));
  }
}

// ─────────────────────────────────────────
// Factor de actividad para TDEE
// ─────────────────────────────────────────
const FACTORES_ACTIVIDAD = {
  sedentario: 1.2,
  poco: 1.375,
  moderado: 1.55,
  alto: 1.725
};

function calcularTDEE(perfil) {
  const tmb = calcularTMB(perfil);
  const factor = FACTORES_ACTIVIDAD[perfil.actividad] || 1.2;
  return Math.round(tmb * factor);
}

// ─────────────────────────────────────────
// Cálculo de IMC con clasificación
// ─────────────────────────────────────────
function calcularIMC(peso, altura) {
  const alturaM = altura / 100;
  const imc = peso / (alturaM * alturaM);
  let clasificacion, color;

  if (imc < 18.5) { clasificacion = "Bajo peso"; color = "#3b82f6"; }
  else if (imc < 25) { clasificacion = "Peso normal"; color = "#10b981"; }
  else if (imc < 30) { clasificacion = "Sobrepeso"; color = "#f59e0b"; }
  else if (imc < 35) { clasificacion = "Obesidad I"; color = "#ef4444"; }
  else { clasificacion = "Obesidad II+"; color = "#7f1d1d"; }

  return { valor: imc.toFixed(1), clasificacion, color };
}

// ─────────────────────────────────────────
// Generador del plan de 30 días
// ─────────────────────────────────────────
function generarPlan30Dias(perfil, planId) {
  const plan = PLANES[planId];
  const { alimentosExcluidos = [], esVegetariano = false, esDiabetico = false, refeicoesDia = 5 } = perfil;

  // Filtros de tags a excluir
  const tagsExcluir = [];
  if (esVegetariano) tagsExcluir.push('carne', 'jamon', 'serrano', 'chorizo', 'pavo', 'pollo', 'ternera', 'atun', 'salmon', 'merluza', 'bacalao', 'gambas', 'sardinas', 'sepia', 'mejillones', 'berberechos', 'almejas', 'boqueron', 'caballa', 'pez espada', 'dorada', 'lubina', 'rape', 'lenguado');
  if (esDiabetico) tagsExcluir.push('membrillo', 'miel', 'datiles', 'muesli', 'granola', 'platano', 'maiz');

  // Función que filtra recetas válidas para el plan
  const filtrar = (lista) => lista.filter(r => {
    if (!r.planos.includes(planId)) return false;
    const exclAlim = alimentosExcluidos.some(alim =>
      r.ingredientes.some(ing => ing.toLowerCase().includes(alim.toLowerCase()))
    );
    if (exclAlim) return false;
    const exclTag = tagsExcluir.some(tag =>
      r.ingredientes.some(ing => ing.toLowerCase().includes(tag.toLowerCase()))
    );
    return !exclTag;
  });

  const desayunosValidos = filtrar(RECIPES.desayunos);
  const almuerzoValidos = filtrar(RECIPES.almuerzos);
  const meriendasValidas = filtrar(RECIPES.meriendas);
  const cenasValidas = filtrar(RECIPES.cenas);

  const dias = [];

  for (let dia = 1; dia <= 30; dia++) {
    // Rotar las recetas para evitar repetición en días cercanos
    const dIdx = (dia - 1) % desayunosValidos.length;
    const aIdx = (dia - 1) % almuerzoValidos.length;
    const m1Idx = ((dia - 1) * 2) % meriendasValidas.length;
    const m2Idx = ((dia - 1) * 2 + 1) % meriendasValidas.length;
    const cIdx = (dia - 1) % cenasValidas.length;

    const comidas = {
      desayuno: desayunosValidos[dIdx] || RECIPES.desayunos[0],
      meriendaManana: meriendasValidas[m1Idx] || RECIPES.meriendas[0],
      almuerzo: almuerzoValidos[aIdx] || RECIPES.almuerzos[0],
      meriendaTarde: meriendasValidas[m2Idx] || RECIPES.meriendas[1],
      cena: cenasValidas[cIdx] || RECIPES.cenas[0]
    };

    // Si solo hace 3 comidas, eliminar meriendas
    if (refeicoesDia === 3) {
      delete comidas.meriendaManana;
      delete comidas.meriendaTarde;
    } else if (refeicoesDia === 4) {
      delete comidas.meriendaManana;
    }

    const calTotal = Object.values(comidas).reduce((sum, c) => sum + (c?.calorias || 0), 0);

    dias.push({ dia, comidas, caloriasTotal: calTotal });
  }

  return dias;
}
