// ============================================================
// BANCO DE RECETAS — FitJourney España
// Cocina mediterránea española
// ============================================================

const RECIPES = {

  // ─────────────────────────────────────────
  // DESAYUNOS (30 opciones)
  // ─────────────────────────────────────────
  desayunos: [
    {
      id: "d001",
      nombre: "Tostada con aceite de oliva y tomate",
      calorias: 220,
      planos: ["A","B","C","D"],
      tags: ["vegetariano", "vegano", "mediterraneo"],
      ingredientes: ["1 rebanada de pan integral", "1 tomate maduro rallado", "1 cdta aceite de oliva virgen extra", "sal al gusto"],
      sustituible_por: ["d002","d005"]
    },
    {
      id: "d002",
      nombre: "Tortilla española de claras",
      calorias: 260,
      planos: ["A","B","C","D"],
      tags: ["vegetariano", "alto-proteina", "sin-gluten"],
      ingredientes: ["3 claras de huevo", "1 huevo entero", "1/2 patata pequeña", "1/4 cebolla", "aceite de oliva", "sal"],
      sustituible_por: ["d003","d001"]
    },
    {
      id: "d003",
      nombre: "Yogur griego con frutas del bosque y nueces",
      calorias: 230,
      planos: ["A","B","C","D"],
      tags: ["vegetariano", "sin-gluten", "alto-proteina"],
      ingredientes: ["150g yogur griego 0%", "80g fresas o arándanos", "15g nueces", "1 cdta miel (opcional)"],
      sustituible_por: ["d004","d008"]
    },
    {
      id: "d004",
      nombre: "Porridge de avena con canela y manzana",
      calorias: 280,
      planos: ["A","B","D"],
      tags: ["vegetariano", "vegano", "fibra-alta"],
      ingredientes: ["50g copos de avena", "200ml leche vegetal o desnatada", "1/2 manzana rallada", "1/2 cdta canela", "stevia al gusto"],
      sustituible_por: ["d003","d009"]
    },
    {
      id: "d005",
      nombre: "Huevos revueltos con espinacas",
      calorias: 240,
      planos: ["A","B","C","D"],
      tags: ["vegetariano", "sin-gluten", "alto-proteina"],
      ingredientes: ["2 huevos", "50g espinacas baby", "1 cdta aceite de oliva", "sal", "pimienta negra"],
      sustituible_por: ["d002","d006"]
    },
    {
      id: "d006",
      nombre: "Batido verde con proteína",
      calorias: 200,
      planos: ["B","C"],
      tags: ["vegetariano", "vegano", "sin-gluten", "alto-proteina"],
      ingredientes: ["1 plátano pequeño", "1 puñado espinacas", "200ml leche vegetal", "1 cdta semillas de chía", "proteína vegetal opcional"],
      sustituible_por: ["d003","d007"]
    },
    {
      id: "d007",
      nombre: "Pan integral con aguacate y huevo pochado",
      calorias: 310,
      planos: ["A","D"],
      tags: ["vegetariano", "grasas-saludables"],
      ingredientes: ["1 rebanada pan integral", "1/2 aguacate", "1 huevo pochado", "limón", "sal", "pimienta"],
      sustituible_por: ["d001","d005"]
    },
    {
      id: "d008",
      nombre: "Requesón con membrillo y almendras",
      calorias: 210,
      planos: ["A","B","D"],
      tags: ["vegetariano", "sin-gluten", "calcio"],
      ingredientes: ["150g requesón bajo en grasa", "30g membrillo sin azúcar", "15g almendras laminadas"],
      sustituible_por: ["d003","d010"]
    },
    {
      id: "d009",
      nombre: "Tostadas con pavo y queso fresco",
      calorias: 250,
      planos: ["A","B","C","D"],
      tags: ["alto-proteina", "bajo-grasa"],
      ingredientes: ["2 rebanadas pan integral", "60g pechuga pavo en lonchas", "2 lonchas queso fresco light", "tomate en rodajas"],
      sustituible_por: ["d001","d011"]
    },
    {
      id: "d010",
      nombre: "Muesli con leche desnatada y frutas",
      calorias: 290,
      planos: ["A","D"],
      tags: ["vegetariano", "fibra-alta"],
      ingredientes: ["40g muesli sin azúcar", "150ml leche desnatada", "1/2 plátano en rodajas", "5 fresas"],
      sustituible_por: ["d004","d003"]
    },
    {
      id: "d011",
      nombre: "Claras de huevo con champiñones salteados",
      calorias: 180,
      planos: ["B","C"],
      tags: ["vegetariano", "sin-gluten", "muy-bajo-calorias", "alto-proteina"],
      ingredientes: ["4 claras de huevo", "100g champiñones", "1/2 diente ajo", "perejil", "aceite de oliva"],
      sustituible_por: ["d005","d002"]
    },
    {
      id: "d012",
      nombre: "Crema de queso fresco con frutos rojos",
      calorias: 195,
      planos: ["A","B","C","D"],
      tags: ["vegetariano", "sin-gluten", "bajo-calorias"],
      ingredientes: ["150g queso fresco batido 0%", "60g frutos rojos mixtos", "stevia al gusto", "menta fresca"],
      sustituible_por: ["d003","d008"]
    },
    {
      id: "d013",
      nombre: "Tostada de centeno con salmón ahumado",
      calorias: 270,
      planos: ["A","B","D"],
      tags: ["omega3", "alto-proteina", "mediterraneo"],
      ingredientes: ["1 rebanada pan de centeno", "50g salmón ahumado", "1 cdta queso crema light", "eneldo", "limón"],
      sustituible_por: ["d009","d001"]
    },
    {
      id: "d014",
      nombre: "Fruta de temporada con nueces",
      calorias: 160,
      planos: ["C"],
      tags: ["vegetariano", "vegano", "sin-gluten", "muy-bajo-calorias"],
      ingredientes: ["1 naranja o manzana o pera", "20g nueces o almendras"],
      sustituible_por: ["d006","d012"]
    },
    {
      id: "d015",
      nombre: "Pancakes de avena y plátano",
      calorias: 300,
      planos: ["A","D"],
      tags: ["vegetariano", "sin-gluten", "fibra-alta"],
      ingredientes: ["50g avena molida", "1 plátano maduro", "1 huevo", "canela", "aceite de coco"],
      sustituible_por: ["d004","d010"]
    },
    {
      id: "d016",
      nombre: "Infusión con tostada de aceite",
      calorias: 150,
      planos: ["C"],
      tags: ["vegetariano", "vegano", "muy-bajo-calorias"],
      ingredientes: ["1 rebanada pequeña pan integral", "1/2 cdta aceite de oliva", "tomate rallado", "infusión verde sin azúcar"],
      sustituible_por: ["d001","d014"]
    },
    {
      id: "d017",
      nombre: "Granola casera con yogur y kiwi",
      calorias: 285,
      planos: ["A","D"],
      tags: ["vegetariano", "fibra-alta"],
      ingredientes: ["30g granola sin azúcar", "120g yogur 0%", "1 kiwi", "canela"],
      sustituible_por: ["d010","d003"]
    },
    {
      id: "d018",
      nombre: "Tortitas de espinacas con queso",
      calorias: 245,
      planos: ["B","C"],
      tags: ["vegetariano", "alto-proteina", "bajo-calorias"],
      ingredientes: ["100g espinacas trituradas", "1 huevo", "30g harina de avena", "30g queso fresco", "sal", "ajo en polvo"],
      sustituible_por: ["d005","d011"]
    },
    {
      id: "d019",
      nombre: "Café con leche desnatada y fruta",
      calorias: 120,
      planos: ["C"],
      tags: ["vegetariano", "muy-bajo-calorias"],
      ingredientes: ["café solo o cortado", "100ml leche desnatada", "1 pieza de fruta"],
      sustituible_por: ["d016","d014"]
    },
    {
      id: "d020",
      nombre: "Bol de cacao con plátano y almendras",
      calorias: 310,
      planos: ["A","D"],
      tags: ["vegetariano", "vegano"],
      ingredientes: ["1 plátano", "200ml leche vegetal", "1 cdta cacao puro sin azúcar", "20g almendras", "1 cdta semillas lino"],
      sustituible_por: ["d004","d015"]
    },
    {
      id: "d021",
      nombre: "Revuelto de tofu y verduras",
      calorias: 220,
      planos: ["A","B","C","D"],
      tags: ["vegano", "sin-gluten", "alto-proteina"],
      ingredientes: ["100g tofu firme", "1/4 pimiento rojo", "1/4 cebolla", "cúrcuma", "sal", "pimienta", "aceite oliva"],
      sustituible_por: ["d005","d002"]
    },
    {
      id: "d022",
      nombre: "Pan de molde integral con mantequilla de cacahuete",
      calorias: 290,
      planos: ["A","D"],
      tags: ["vegetariano", "vegano", "proteina-vegetal"],
      ingredientes: ["2 rebanadas pan integral", "1 cdta mantequilla cacahuete natural sin azúcar"],
      sustituible_por: ["d007","d001"]
    },
    {
      id: "d023",
      nombre: "Gazpacho con huevo duro",
      calorias: 175,
      planos: ["B","C"],
      tags: ["vegetariano", "sin-gluten", "muy-bajo-calorias"],
      ingredientes: ["200ml gazpacho casero sin pan", "1 huevo duro", "pepino", "perejil"],
      sustituible_por: ["d012","d019"]
    }
  ],

  // ─────────────────────────────────────────
  // ALMUERZOS (50 opciones)
  // ─────────────────────────────────────────
  almuerzos: [
    {
      id: "a001",
      nombre: "Merluza al horno con verduras",
      calorias: 320,
      planos: ["A","B","C","D"],
      tags: ["sin-gluten", "bajo-grasa", "alto-proteina", "mediterraneo"],
      ingredientes: ["200g merluza", "1/2 pimiento", "1 tomate", "1/2 cebolla", "aceite oliva", "limón", "perejil", "sal"],
      sustituible_por: ["a002","a010"]
    },
    {
      id: "a002",
      nombre: "Pollo al ajillo con ensalada",
      calorias: 350,
      planos: ["A","B","C","D"],
      tags: ["sin-gluten", "alto-proteina", "bajo-grasa"],
      ingredientes: ["180g pechuga pollo", "4 dientes ajo", "perejil", "vino blanco", "aceite oliva", "ensalada verde", "tomate cherry"],
      sustituible_por: ["a001","a003"]
    },
    {
      id: "a003",
      nombre: "Lentejas estofadas con verduras",
      calorias: 380,
      planos: ["A","B","D"],
      tags: ["vegetariano", "vegano", "fibra-alta", "hierro"],
      ingredientes: ["100g lentejas cocidas", "1 zanahoria", "1 patata pequeña", "1/4 cebolla", "1 diente ajo", "pimentón", "aceite oliva"],
      sustituible_por: ["a004","a015"]
    },
    {
      id: "a004",
      nombre: "Ensalada niçoise con atún",
      calorias: 310,
      planos: ["A","B","C","D"],
      tags: ["sin-gluten", "alto-proteina", "omega3"],
      ingredientes: ["1 lata atún en agua", "1 huevo duro", "judías verdes", "tomate", "aceitunas negras", "lechuga", "aceite oliva", "vinagre"],
      sustituible_por: ["a005","a009"]
    },
    {
      id: "a005",
      nombre: "Salmón a la plancha con patatas al vapor",
      calorias: 400,
      planos: ["A","B","D"],
      tags: ["sin-gluten", "omega3", "alto-proteina"],
      ingredientes: ["180g salmón fresco", "150g patatas", "limón", "eneldo", "aceite oliva", "sal"],
      sustituible_por: ["a001","a013"]
    },
    {
      id: "a006",
      nombre: "Pisto manchego con huevo",
      calorias: 290,
      planos: ["A","B","C","D"],
      tags: ["vegetariano", "sin-gluten", "mediterraneo", "bajo-calorias"],
      ingredientes: ["1/2 calabacín", "1/2 pimiento", "1 tomate", "1/4 berenjena", "1/4 cebolla", "1 huevo pochado", "aceite oliva"],
      sustituible_por: ["a007","a021"]
    },
    {
      id: "a007",
      nombre: "Espinacas con garbanzos al estilo sevillano",
      calorias: 340,
      planos: ["A","B","D"],
      tags: ["vegetariano", "vegano", "hierro", "fibra-alta"],
      ingredientes: ["100g garbanzos cocidos", "150g espinacas", "2 dientes ajo", "comino", "pimentón", "vinagre de jerez", "pan frito (opcional)"],
      sustituible_por: ["a003","a008"]
    },
    {
      id: "a008",
      nombre: "Menestra de verduras con jamón serrano",
      calorias: 280,
      planos: ["A","B","C","D"],
      tags: ["sin-gluten", "bajo-calorias", "fibra-alta"],
      ingredientes: ["mix verduras: alcachofas, judías, zanahorias, guisantes", "30g jamón serrano sin grasa", "aceite oliva", "ajo"],
      sustituible_por: ["a006","a016"]
    },
    {
      id: "a009",
      nombre: "Dorada al horno con limón y hierbas",
      calorias: 300,
      planos: ["A","B","C","D"],
      tags: ["sin-gluten", "bajo-grasa", "alto-proteina"],
      ingredientes: ["200g dorada entera o filete", "limón", "romero", "tomillo", "ajo", "aceite oliva", "sal"],
      sustituible_por: ["a001","a013"]
    },
    {
      id: "a010",
      nombre: "Gazpacho con pollo a la plancha",
      calorias: 270,
      planos: ["B","C"],
      tags: ["sin-gluten", "muy-bajo-calorias", "alto-proteina"],
      ingredientes: ["250ml gazpacho tradicional", "150g pechuga pollo a la plancha", "pepino", "cebollino"],
      sustituible_por: ["a002","a011"]
    },
    {
      id: "a011",
      nombre: "Ensalada de garbanzos con verduras asadas",
      calorias: 330,
      planos: ["A","B","C","D"],
      tags: ["vegetariano", "vegano", "sin-gluten", "fibra-alta"],
      ingredientes: ["100g garbanzos cocidos", "1/2 pimiento rojo asado", "calabacín asado", "rúcula", "tomate cherry", "aceite oliva", "limón"],
      sustituible_por: ["a007","a003"]
    },
    {
      id: "a012",
      nombre: "Bacalao al pil-pil ligero",
      calorias: 310,
      planos: ["A","B","D"],
      tags: ["sin-gluten", "alto-proteina", "mediterráneo"],
      ingredientes: ["180g bacalao desalado", "4 dientes ajo", "guindilla (opcional)", "aceite oliva", "perejil"],
      sustituible_por: ["a001","a009"]
    },
    {
      id: "a013",
      nombre: "Lubina a la sal con verduras",
      calorias: 290,
      planos: ["A","B","C","D"],
      tags: ["sin-gluten", "bajo-grasa", "alto-proteina"],
      ingredientes: ["200g lubina", "sal gorda", "200g verduras mix", "aceite oliva", "limón"],
      sustituible_por: ["a009","a001"]
    },
    {
      id: "a014",
      nombre: "Judías blancas con verduras y chorizo light",
      calorias: 390,
      planos: ["A","D"],
      tags: ["fibra-alta", "hierro"],
      ingredientes: ["100g judías blancas cocidas", "1 zanahoria", "1 puerro", "30g chorizo bajo en grasa", "pimentón de la vera", "laurel"],
      sustituible_por: ["a003","a007"]
    },
    {
      id: "a015",
      nombre: "Crema de verduras con picatostes integrales",
      calorias: 250,
      planos: ["B","C"],
      tags: ["vegetariano", "vegano", "bajo-calorias"],
      ingredientes: ["1/2 calabaza", "1 zanahoria", "1/2 cebolla", "caldo vegetal", "1 rebanada pan integral tostado", "aceite oliva"],
      sustituible_por: ["a006","a016"]
    },
    {
      id: "a016",
      nombre: "Revuelto de champiñones con gambas",
      calorias: 280,
      planos: ["A","B","C","D"],
      tags: ["sin-gluten", "alto-proteina", "bajo-calorias"],
      ingredientes: ["150g champiñones", "100g gambas peladas", "2 huevos", "ajo", "perejil", "aceite oliva"],
      sustituible_por: ["a006","a021"]
    },
    {
      id: "a017",
      nombre: "Ensalada de atún con aguacate",
      calorias: 350,
      planos: ["A","B","C","D"],
      tags: ["sin-gluten", "omega3", "grasas-saludables"],
      ingredientes: ["1 lata atún en agua", "1/2 aguacate", "tomate", "cebolla morada", "maíz", "lechuga romana", "limón", "aceite oliva"],
      sustituible_por: ["a004","a011"]
    },
    {
      id: "a018",
      nombre: "Pollo al limón con arroz integral",
      calorias: 420,
      planos: ["A","D"],
      tags: ["sin-gluten", "alto-proteina", "fibra-alta"],
      ingredientes: ["180g pechuga pollo", "100g arroz integral cocido", "limón", "romero", "ajo", "aceite oliva"],
      sustituible_por: ["a002","a005"]
    },
    {
      id: "a019",
      nombre: "Berenjenas rellenas de verduras y queso",
      calorias: 300,
      planos: ["A","B","D"],
      tags: ["vegetariano", "sin-gluten", "mediterraneo"],
      ingredientes: ["1 berenjena mediana", "1/4 pimiento", "tomate", "cebolla", "queso fresco", "orégano", "aceite oliva"],
      sustituible_por: ["a006","a022"]
    },
    {
      id: "a020",
      nombre: "Caldo de pollo con verduras y fideos integrales",
      calorias: 260,
      planos: ["B","C"],
      tags: ["bajo-calorias", "reconfortante"],
      ingredientes: ["500ml caldo pollo casero", "50g fideos integrales", "zanahoria", "apio", "perejil"],
      sustituible_por: ["a015","a010"]
    },
    {
      id: "a021",
      nombre: "Tofu salteado con verduras al wok",
      calorias: 270,
      planos: ["A","B","C","D"],
      tags: ["vegano", "sin-gluten", "alto-proteina"],
      ingredientes: ["150g tofu firme", "1/2 pimiento", "brócoli", "zanahoria", "salsa de soja baja sal", "jengibre", "aceite sésamo"],
      sustituible_por: ["a011","a016"]
    },
    {
      id: "a022",
      nombre: "Calabacín relleno de carne magra",
      calorias: 320,
      planos: ["A","B","C","D"],
      tags: ["sin-gluten", "alto-proteina", "bajo-grasa"],
      ingredientes: ["1 calabacín grande", "150g carne picada magra", "tomate frito casero", "cebolla", "queso light rallado", "ajo"],
      sustituible_por: ["a019","a006"]
    },
    {
      id: "a023",
      nombre: "Ensalada de quinoa mediterránea",
      calorias: 360,
      planos: ["A","B","D"],
      tags: ["vegetariano", "vegano", "sin-gluten", "proteina-vegetal"],
      ingredientes: ["80g quinoa cocida", "tomate cherry", "pepino", "aceitunas negras", "perejil", "limón", "aceite oliva"],
      sustituible_por: ["a011","a004"]
    },
    {
      id: "a024",
      nombre: "Rape con salsa verde",
      calorias: 290,
      planos: ["A","B","D"],
      tags: ["sin-gluten", "bajo-grasa", "alto-proteina"],
      ingredientes: ["200g rape", "perejil fresco", "caldo pescado", "ajo", "aceite oliva", "guisantes"],
      sustituible_por: ["a001","a012"]
    },
    {
      id: "a025",
      nombre: "Potaje de garbanzos y espinacas",
      calorias: 370,
      planos: ["A","B","D"],
      tags: ["vegetariano", "vegano", "hierro", "fibra-alta"],
      ingredientes: ["100g garbanzos cocidos", "100g espinacas", "1 tomate", "cebolla", "comino", "pimentón", "aceite oliva"],
      sustituible_por: ["a007","a003"]
    },
    {
      id: "a026",
      nombre: "Sardinas al horno con tomates cherry",
      calorias: 280,
      planos: ["A","B","C","D"],
      tags: ["sin-gluten", "omega3", "calcio"],
      ingredientes: ["200g sardinas frescas", "tomates cherry", "ajo", "limón", "perejil", "aceite oliva"],
      sustituible_por: ["a001","a009"]
    },
    {
      id: "a027",
      nombre: "Crema de calabacín con gambas",
      calorias: 250,
      planos: ["B","C"],
      tags: ["sin-gluten", "bajo-calorias", "alto-proteina"],
      ingredientes: ["2 calabacines", "100g gambas peladas", "1/2 cebolla", "caldo vegetal", "aceite oliva", "sal"],
      sustituible_por: ["a015","a010"]
    },
    {
      id: "a028",
      nombre: "Pechuga de pavo con champiñones",
      calorias: 310,
      planos: ["A","B","C","D"],
      tags: ["sin-gluten", "muy-bajo-grasa", "alto-proteina"],
      ingredientes: ["180g pechuga pavo", "150g champiñones", "ajo", "vino blanco", "tomillo", "aceite oliva"],
      sustituible_por: ["a002","a016"]
    },
    {
      id: "a029",
      nombre: "Fideuá de verduras",
      calorias: 340,
      planos: ["A","D"],
      tags: ["vegetariano", "vegano", "mediterraneo"],
      ingredientes: ["80g fideos finos", "1/2 pimiento", "tomate", "ajo", "pimentón", "azafrán", "caldo vegetal", "aceite oliva"],
      sustituible_por: ["a018","a023"]
    },
    {
      id: "a030",
      nombre: "Ensalada de pollo con mango y nueces",
      calorias: 370,
      planos: ["A","D"],
      tags: ["sin-gluten", "grasas-saludables", "alto-proteina"],
      ingredientes: ["150g pechuga pollo", "1/4 mango", "lechuga", "nueces", "cebollino", "aceite oliva", "vinagre balsámico"],
      sustituible_por: ["a002","a017"]
    },
    {
      id: "a031",
      nombre: "Boquerones en vinagre con ensalada",
      calorias: 260,
      planos: ["A","B","C"],
      tags: ["sin-gluten", "omega3", "muy-bajo-calorias"],
      ingredientes: ["150g boquerones en vinagre", "lechuga romana", "tomate", "pepino", "aceitunas", "aceite oliva"],
      sustituible_por: ["a004","a026"]
    },
    {
      id: "a032",
      nombre: "Pollo al curry suave con verduras",
      calorias: 350,
      planos: ["A","B","D"],
      tags: ["sin-gluten", "alto-proteina"],
      ingredientes: ["180g pollo", "1/2 pimiento", "cebolla", "1 cdta curry", "150ml leche de coco light", "cilantro", "aceite oliva"],
      sustituible_por: ["a002","a028"]
    },
    {
      id: "a033",
      nombre: "Gazpacho andaluz clásico con jamón",
      calorias: 220,
      planos: ["C"],
      tags: ["sin-gluten", "muy-bajo-calorias"],
      ingredientes: ["250ml gazpacho sin pan", "30g jamón serrano", "pepino", "pimiento verde"],
      sustituible_por: ["a010","a015"]
    },
    {
      id: "a034",
      nombre: "Bacalao con tomate y aceitunas",
      calorias: 310,
      planos: ["A","B","D"],
      tags: ["sin-gluten", "omega3", "mediterraneo"],
      ingredientes: ["180g bacalao", "2 tomates maduros", "aceitunas negras", "ajo", "perejil", "aceite oliva"],
      sustituible_por: ["a012","a001"]
    },
    {
      id: "a035",
      nombre: "Sopa de ajo castellana ligera",
      calorias: 230,
      planos: ["B","C"],
      tags: ["vegetariano", "muy-bajo-calorias"],
      ingredientes: ["4 dientes ajo", "1 rebanada pequeña pan integral", "pimentón de la vera", "1 huevo", "caldo vegetal", "aceite oliva"],
      sustituible_por: ["a015","a020"]
    },
    {
      id: "a036",
      nombre: "Sepia a la plancha con pisto",
      calorias: 270,
      planos: ["A","B","C","D"],
      tags: ["sin-gluten", "bajo-grasa", "alto-proteina"],
      ingredientes: ["200g sepia limpia", "pisto (calabacín, tomate, pimiento)", "ajo", "perejil", "aceite oliva"],
      sustituible_por: ["a001","a016"]
    },
    {
      id: "a037",
      nombre: "Ensalada de legumbres variadas",
      calorias: 340,
      planos: ["A","B","D"],
      tags: ["vegetariano", "vegano", "sin-gluten", "proteina-vegetal"],
      ingredientes: ["mix de garbanzos, lentejas y alubias cocidas", "tomate", "cebolla morada", "pimiento", "aceitunas", "aceite oliva", "limón"],
      sustituible_por: ["a011","a007"]
    },
    {
      id: "a038",
      nombre: "Pollo en salsa de yogur y especias",
      calorias: 330,
      planos: ["A","B","D"],
      tags: ["sin-gluten", "alto-proteina"],
      ingredientes: ["180g pollo", "100g yogur 0%", "comino", "cúrcuma", "ajo", "cilantro", "aceite oliva"],
      sustituible_por: ["a002","a032"]
    },
    {
      id: "a039",
      nombre: "Verduras asadas con huevo",
      calorias: 260,
      planos: ["B","C","D"],
      tags: ["vegetariano", "sin-gluten", "bajo-calorias"],
      ingredientes: ["berenjena, pimiento, calabacín, cebolla al horno", "2 huevos estrellados", "aceite oliva", "sal", "romero"],
      sustituible_por: ["a006","a019"]
    },
    {
      id: "a040",
      nombre: "Ceviche de gambas con aguacate",
      calorias: 290,
      planos: ["A","D"],
      tags: ["sin-gluten", "alto-proteina", "grasas-saludables"],
      ingredientes: ["150g gambas cocidas", "1/2 aguacate", "limón", "tomate", "cilantro", "cebolla morada", "sal"],
      sustituible_por: ["a017","a004"]
    },
    {
      id: "a041",
      nombre: "Brócoli con ajo y anchoas",
      calorias: 210,
      planos: ["B","C"],
      tags: ["sin-gluten", "muy-bajo-calorias", "omega3"],
      ingredientes: ["250g brócoli al vapor", "3 filetes anchoa", "3 dientes ajo", "guindilla", "aceite oliva", "limón"],
      sustituible_por: ["a008","a015"]
    },
    {
      id: "a042",
      nombre: "Almejas a la marinera",
      calorias: 250,
      planos: ["A","B","D"],
      tags: ["sin-gluten", "bajo-grasa", "alto-proteina"],
      ingredientes: ["300g almejas", "ajo", "perejil", "vino blanco", "aceite oliva"],
      sustituible_por: ["a016","a036"]
    },
    {
      id: "a043",
      nombre: "Ensalada campera",
      calorias: 290,
      planos: ["A","B","D"],
      tags: ["sin-gluten", "mediterráneo"],
      ingredientes: ["2 patatas medianas cocidas", "tomate", "cebolla", "pimiento verde", "atún", "aceitunas", "aceite oliva"],
      sustituible_por: ["a004","a017"]
    },
    {
      id: "a044",
      nombre: "Pez espada a la plancha con salsa romesco",
      calorias: 320,
      planos: ["A","B","D"],
      tags: ["sin-gluten", "omega3", "alto-proteina"],
      ingredientes: ["180g pez espada", "salsa romesco: tomate, pimiento, almendras", "limón", "aceite oliva"],
      sustituible_por: ["a005","a009"]
    },
    {
      id: "a045",
      nombre: "Sopa minestrone de verduras",
      calorias: 240,
      planos: ["B","C"],
      tags: ["vegetariano", "vegano", "fibra-alta", "bajo-calorias"],
      ingredientes: ["zanahoria, apio, tomate, judías verdes, cebolla", "50g pasta integral", "caldo vegetal", "albahaca", "aceite oliva"],
      sustituible_por: ["a015","a020"]
    },
    {
      id: "a046",
      nombre: "Muslitos de pollo al horno con especias",
      calorias: 360,
      planos: ["A","B","D"],
      tags: ["sin-gluten", "alto-proteina"],
      ingredientes: ["2 muslitos pollo sin piel", "pimentón", "orégano", "ajo", "aceite oliva", "limón"],
      sustituible_por: ["a002","a038"]
    },
    {
      id: "a047",
      nombre: "Alcachofas rehogadas con jamón",
      calorias: 230,
      planos: ["B","C"],
      tags: ["sin-gluten", "bajo-calorias", "antioxidante"],
      ingredientes: ["4 alcachofas", "40g jamón serrano", "ajo", "vino blanco", "aceite oliva"],
      sustituible_por: ["a008","a041"]
    },
    {
      id: "a048",
      nombre: "Arroz con verduras y azafrán",
      calorias: 350,
      planos: ["A","D"],
      tags: ["vegetariano", "vegano", "sin-gluten"],
      ingredientes: ["80g arroz integral", "pimiento, tomate, cebolla", "azafrán", "pimentón", "caldo vegetal", "aceite oliva"],
      sustituible_por: ["a018","a029"]
    },
    {
      id: "a049",
      nombre: "Caballa en escabeche con ensalada",
      calorias: 290,
      planos: ["A","B","C"],
      tags: ["sin-gluten", "omega3", "calcio"],
      ingredientes: ["180g caballa", "vinagre de vino", "ajo", "laurel", "zanahoria", "ensalada verde", "aceite oliva"],
      sustituible_por: ["a026","a031"]
    },
    {
      id: "a050",
      nombre: "Berberechos al vapor con verduras",
      calorias: 200,
      planos: ["B","C"],
      tags: ["sin-gluten", "muy-bajo-calorias", "hierro"],
      ingredientes: ["300g berberechos", "limón", "perejil", "ensalada verde con tomate"],
      sustituible_por: ["a042","a041"]
    }
  ],

  // ─────────────────────────────────────────
  // MERIENDAS (30 opciones)
  // ─────────────────────────────────────────
  meriendas: [
    {
      id: "m001",
      nombre: "Fruta de temporada",
      calorias: 80,
      planos: ["A","B","C","D"],
      tags: ["vegetariano", "vegano", "sin-gluten", "muy-bajo-calorias"],
      ingredientes: ["1 pieza de fruta: manzana, pera, naranja, kiwi o melocotón"],
      sustituible_por: ["m002","m003"]
    },
    {
      id: "m002",
      nombre: "Yogur natural con semillas de chía",
      calorias: 110,
      planos: ["A","B","C","D"],
      tags: ["vegetariano", "sin-gluten", "probiotico"],
      ingredientes: ["125g yogur natural 0%", "1 cdta semillas chía", "stevia opcional"],
      sustituible_por: ["m001","m005"]
    },
    {
      id: "m003",
      nombre: "Puñado de almendras",
      calorias: 120,
      planos: ["A","B","C","D"],
      tags: ["vegetariano", "vegano", "sin-gluten", "grasas-saludables"],
      ingredientes: ["20g almendras naturales sin sal"],
      sustituible_por: ["m004","m001"]
    },
    {
      id: "m004",
      nombre: "Nueces con una onza de chocolate negro",
      calorias: 150,
      planos: ["A","D"],
      tags: ["vegetariano", "vegano", "sin-gluten", "antioxidante"],
      ingredientes: ["15g nueces", "15g chocolate negro 85%"],
      sustituible_por: ["m003","m010"]
    },
    {
      id: "m005",
      nombre: "Queso fresco con tomate cherry",
      calorias: 100,
      planos: ["A","B","C","D"],
      tags: ["vegetariano", "sin-gluten", "calcio"],
      ingredientes: ["80g queso fresco 0%", "6 tomates cherry", "orégano", "aceite oliva"],
      sustituible_por: ["m002","m001"]
    },
    {
      id: "m006",
      nombre: "Infusión con tostada de centeno",
      calorias: 90,
      planos: ["B","C"],
      tags: ["vegetariano", "vegano", "muy-bajo-calorias"],
      ingredientes: ["1 rebanada pequeña pan centeno", "infusión de manzanilla o tila sin azúcar"],
      sustituible_por: ["m001","m007"]
    },
    {
      id: "m007",
      nombre: "Batido de proteínas vegetal",
      calorias: 130,
      planos: ["A","B","C"],
      tags: ["vegano", "sin-gluten", "alto-proteina"],
      ingredientes: ["200ml leche vegetal", "1 cdta proteína vegetal", "canela"],
      sustituible_por: ["m002","m005"]
    },
    {
      id: "m008",
      nombre: "Palitos de zanahoria y apio con hummus",
      calorias: 110,
      planos: ["A","B","C","D"],
      tags: ["vegetariano", "vegano", "fibra-alta"],
      ingredientes: ["1 zanahoria en palitos", "2 tallos apio", "2 cdas hummus sin sal"],
      sustituible_por: ["m005","m001"]
    },
    {
      id: "m009",
      nombre: "Macedonia de frutas",
      calorias: 100,
      planos: ["A","B","C","D"],
      tags: ["vegetariano", "vegano", "sin-gluten", "vitaminas"],
      ingredientes: ["mix: fresa, kiwi, naranja, manzana", "zumo de naranja natural"],
      sustituible_por: ["m001","m002"]
    },
    {
      id: "m010",
      nombre: "Tortitas de arroz con aguacate",
      calorias: 130,
      planos: ["A","B","D"],
      tags: ["vegetariano", "vegano", "sin-gluten"],
      ingredientes: ["2 tortitas arroz sin sal", "1/4 aguacate aplastado", "limón", "sal"],
      sustituible_por: ["m008","m005"]
    },
    {
      id: "m011",
      nombre: "Pepino con sal y limón",
      calorias: 30,
      planos: ["C"],
      tags: ["vegetariano", "vegano", "sin-gluten", "muy-bajo-calorias"],
      ingredientes: ["1/2 pepino en rodajas", "limón", "sal"],
      sustituible_por: ["m001","m006"]
    },
    {
      id: "m012",
      nombre: "Té verde con fruta seca",
      calorias: 85,
      planos: ["B","C","D"],
      tags: ["vegetariano", "vegano", "antioxidante"],
      ingredientes: ["té verde sin azúcar", "30g dátiles o ciruelas (1-2 piezas)"],
      sustituible_por: ["m001","m006"]
    },
    {
      id: "m013",
      nombre: "Edamame ligeramente salado",
      calorias: 100,
      planos: ["A","B","C","D"],
      tags: ["vegetariano", "vegano", "sin-gluten", "proteina-vegetal"],
      ingredientes: ["80g edamame cocido", "sal marina en escamas"],
      sustituible_por: ["m003","m008"]
    },
    {
      id: "m014",
      nombre: "Mini bocadillo de pavo",
      calorias: 140,
      planos: ["A","B","D"],
      tags: ["alto-proteina", "bajo-grasa"],
      ingredientes: ["1 panecillo integral pequeño", "40g pechuga pavo", "lechuga", "tomate"],
      sustituible_por: ["m010","m005"]
    },
    {
      id: "m015",
      nombre: "Requesón con canela y nueces",
      calorias: 120,
      planos: ["A","B","D"],
      tags: ["vegetariano", "sin-gluten", "calcio"],
      ingredientes: ["100g requesón", "canela", "10g nueces", "stevia opcional"],
      sustituible_por: ["m002","m005"]
    }
  ],

  // ─────────────────────────────────────────
  // CENAS (40 opciones)
  // ─────────────────────────────────────────
  cenas: [
    {
      id: "c001",
      nombre: "Crema de verduras de temporada",
      calorias: 180,
      planos: ["A","B","C","D"],
      tags: ["vegetariano", "vegano", "sin-gluten", "bajo-calorias"],
      ingredientes: ["calabacín o calabaza o zanahoria", "caldo vegetal", "cebolla", "ajo", "aceite oliva"],
      sustituible_por: ["c002","c015"]
    },
    {
      id: "c002",
      nombre: "Pechuga de pollo a la plancha con ensalada verde",
      calorias: 250,
      planos: ["A","B","C","D"],
      tags: ["sin-gluten", "muy-bajo-grasa", "alto-proteina"],
      ingredientes: ["150g pechuga pollo", "lechuga", "tomate", "pepino", "aceite oliva", "limón"],
      sustituible_por: ["c003","c001"]
    },
    {
      id: "c003",
      nombre: "Revuelto de verduras y huevo",
      calorias: 220,
      planos: ["A","B","C","D"],
      tags: ["vegetariano", "sin-gluten", "alto-proteina"],
      ingredientes: ["2 huevos", "espárragos o espinacas o champiñones", "ajo", "aceite oliva", "sal"],
      sustituible_por: ["c002","c004"]
    },
    {
      id: "c004",
      nombre: "Ensalada de lechuga con atún y huevo",
      calorias: 240,
      planos: ["A","B","C","D"],
      tags: ["sin-gluten", "omega3", "alto-proteina"],
      ingredientes: ["1 lata atún agua", "1 huevo duro", "lechuga romana", "tomate", "cebolla", "aceite oliva"],
      sustituible_por: ["c002","c008"]
    },
    {
      id: "c005",
      nombre: "Sopa de verduras con pollo",
      calorias: 200,
      planos: ["A","B","C","D"],
      tags: ["sin-gluten", "bajo-calorias"],
      ingredientes: ["500ml caldo pollo casero", "100g pechuga pollo desmechada", "zanahoria", "apio", "perejil"],
      sustituible_por: ["c001","c006"]
    },
    {
      id: "c006",
      nombre: "Merluza al vapor con limón",
      calorias: 200,
      planos: ["A","B","C","D"],
      tags: ["sin-gluten", "muy-bajo-grasa", "alto-proteina"],
      ingredientes: ["180g merluza", "limón", "perejil", "aceite oliva light"],
      sustituible_por: ["c007","c002"]
    },
    {
      id: "c007",
      nombre: "Gambas a la plancha con ajo y limón",
      calorias: 190,
      planos: ["A","B","C","D"],
      tags: ["sin-gluten", "muy-bajo-calorias", "alto-proteina"],
      ingredientes: ["150g gambas", "3 dientes ajo", "limón", "perejil", "aceite oliva"],
      sustituible_por: ["c006","c010"]
    },
    {
      id: "c008",
      nombre: "Tortilla francesa con espárragos",
      calorias: 230,
      planos: ["A","B","D"],
      tags: ["vegetariano", "sin-gluten", "alto-proteina"],
      ingredientes: ["2 huevos", "6 espárragos", "aceite oliva", "sal"],
      sustituible_por: ["c003","c004"]
    },
    {
      id: "c009",
      nombre: "Gazpacho con gambas cocidas",
      calorias: 190,
      planos: ["B","C"],
      tags: ["sin-gluten", "muy-bajo-calorias"],
      ingredientes: ["200ml gazpacho sin pan", "80g gambas cocidas", "pepino", "cebollino"],
      sustituible_por: ["c007","c001"]
    },
    {
      id: "c010",
      nombre: "Mejillones al vapor",
      calorias: 170,
      planos: ["A","B","C","D"],
      tags: ["sin-gluten", "muy-bajo-calorias", "hierro", "omega3"],
      ingredientes: ["300g mejillones", "limón", "perejil", "vino blanco"],
      sustituible_por: ["c007","c006"]
    },
    {
      id: "c011",
      nombre: "Ensalada de tomate con mozarella light",
      calorias: 210,
      planos: ["A","B","D"],
      tags: ["vegetariano", "sin-gluten", "calcio"],
      ingredientes: ["2 tomates maduros", "80g mozarella light", "albahaca fresca", "aceite oliva", "sal"],
      sustituible_por: ["c004","c015"]
    },
    {
      id: "c012",
      nombre: "Tortilla de claras con pisto",
      calorias: 200,
      planos: ["B","C"],
      tags: ["vegetariano", "sin-gluten", "muy-bajo-calorias"],
      ingredientes: ["4 claras de huevo", "pisto: calabacín, tomate, pimiento", "aceite oliva"],
      sustituible_por: ["c003","c008"]
    },
    {
      id: "c013",
      nombre: "Filete de ternera a la plancha con verduras",
      calorias: 300,
      planos: ["A","B","D"],
      tags: ["sin-gluten", "alto-proteina", "hierro"],
      ingredientes: ["150g filete ternera magra", "verduras a la plancha", "ajo", "aceite oliva", "sal"],
      sustituible_por: ["c002","c006"]
    },
    {
      id: "c014",
      nombre: "Ensalada de pepino con menta y yogur",
      calorias: 110,
      planos: ["B","C"],
      tags: ["vegetariano", "sin-gluten", "muy-bajo-calorias"],
      ingredientes: ["1 pepino grande", "100g yogur 0%", "menta fresca", "limón", "sal"],
      sustituible_por: ["c001","c015"]
    },
    {
      id: "c015",
      nombre: "Crema de puerros",
      calorias: 150,
      planos: ["B","C","D"],
      tags: ["vegetariano", "vegano", "sin-gluten", "muy-bajo-calorias"],
      ingredientes: ["2 puerros", "1 patata pequeña", "caldo vegetal", "aceite oliva", "sal"],
      sustituible_por: ["c001","c014"]
    },
    {
      id: "c016",
      nombre: "Salmón a la plancha con espárragos",
      calorias: 300,
      planos: ["A","B","D"],
      tags: ["sin-gluten", "omega3", "alto-proteina"],
      ingredientes: ["150g salmón", "8 espárragos verdes", "limón", "eneldo", "aceite oliva"],
      sustituible_por: ["c006","c013"]
    },
    {
      id: "c017",
      nombre: "Ensalada templada de lentejas",
      calorias: 240,
      planos: ["A","B","D"],
      tags: ["vegetariano", "vegano", "sin-gluten", "hierro"],
      ingredientes: ["80g lentejas cocidas", "zanahoria rallada", "espinacas baby", "cebolla morada", "aceite oliva", "vinagre jerez"],
      sustituible_por: ["c004","c011"]
    },
    {
      id: "c018",
      nombre: "Pechuga de pavo a la plancha con tomate",
      calorias: 220,
      planos: ["A","B","C","D"],
      tags: ["sin-gluten", "muy-bajo-grasa", "alto-proteina"],
      ingredientes: ["160g pechuga pavo", "1 tomate en rodajas", "orégano", "aceite oliva", "sal"],
      sustituible_por: ["c002","c006"]
    },
    {
      id: "c019",
      nombre: "Espárragos blancos con vinagreta suave",
      calorias: 120,
      planos: ["C"],
      tags: ["vegetariano", "vegano", "sin-gluten", "muy-bajo-calorias"],
      ingredientes: ["8 espárragos blancos", "aceite oliva", "limón", "sal", "perejil"],
      sustituible_por: ["c014","c015"]
    },
    {
      id: "c020",
      nombre: "Bacalao con pimientos asados",
      calorias: 270,
      planos: ["A","B","D"],
      tags: ["sin-gluten", "alto-proteina", "mediterraneo"],
      ingredientes: ["160g bacalao", "2 pimientos rojos asados", "ajo", "aceite oliva", "perejil"],
      sustituible_por: ["c006","c016"]
    },
    {
      id: "c021",
      nombre: "Sopa de tomate con albahaca",
      calorias: 140,
      planos: ["B","C"],
      tags: ["vegetariano", "vegano", "sin-gluten", "muy-bajo-calorias"],
      ingredientes: ["4 tomates maduros", "caldo vegetal", "1 diente ajo", "albahaca fresca", "aceite oliva"],
      sustituible_por: ["c001","c015"]
    },
    {
      id: "c022",
      nombre: "Caballa al horno con limón",
      calorias: 260,
      planos: ["A","B","C"],
      tags: ["sin-gluten", "omega3", "alto-proteina"],
      ingredientes: ["180g caballa fresca", "limón", "tomillo", "ajo", "aceite oliva"],
      sustituible_por: ["c006","c016"]
    },
    {
      id: "c023",
      nombre: "Ensalada de rúcula con parmesano light",
      calorias: 160,
      planos: ["A","B","D"],
      tags: ["vegetariano", "sin-gluten"],
      ingredientes: ["60g rúcula", "virutas parmesano (10g)", "tomate cherry", "aceite oliva", "limón"],
      sustituible_por: ["c011","c004"]
    },
    {
      id: "c024",
      nombre: "Sepia a la plancha con limón",
      calorias: 185,
      planos: ["A","B","C","D"],
      tags: ["sin-gluten", "muy-bajo-calorias", "alto-proteina"],
      ingredientes: ["200g sepia limpia", "limón", "perejil", "ajo", "aceite oliva"],
      sustituible_por: ["c007","c010"]
    },
    {
      id: "c025",
      nombre: "Berenjenas al horno con tomate",
      calorias: 160,
      planos: ["B","C","D"],
      tags: ["vegetariano", "vegano", "sin-gluten", "bajo-calorias"],
      ingredientes: ["1 berenjena", "2 tomates", "ajo", "orégano", "aceite oliva", "sal"],
      sustituible_por: ["c001","c003"]
    },
    {
      id: "c026",
      nombre: "Lenguado al horno con hierbas",
      calorias: 210,
      planos: ["A","B","C","D"],
      tags: ["sin-gluten", "muy-bajo-grasa", "alto-proteina"],
      ingredientes: ["200g lenguado", "perejil", "limón", "ajo", "aceite oliva"],
      sustituible_por: ["c006","c024"]
    },
    {
      id: "c027",
      nombre: "Ensalada de espinacas con fresas",
      calorias: 130,
      planos: ["B","C"],
      tags: ["vegetariano", "vegano", "sin-gluten", "muy-bajo-calorias"],
      ingredientes: ["100g espinacas baby", "80g fresas", "aceite oliva", "vinagre balsámico", "nueces 10g"],
      sustituible_por: ["c023","c014"]
    },
    {
      id: "c028",
      nombre: "Pollo en escabeche ligero",
      calorias: 250,
      planos: ["A","B","D"],
      tags: ["sin-gluten", "alto-proteina"],
      ingredientes: ["150g pollo", "vinagre vino blanco", "ajo", "laurel", "zanahoria", "aceite oliva"],
      sustituible_por: ["c002","c018"]
    },
    {
      id: "c029",
      nombre: "Crema de guisantes con menta",
      calorias: 180,
      planos: ["A","B","D"],
      tags: ["vegetariano", "vegano", "sin-gluten"],
      ingredientes: ["200g guisantes", "caldo vegetal", "menta fresca", "cebolla", "aceite oliva"],
      sustituible_por: ["c001","c015"]
    },
    {
      id: "c030",
      nombre: "Dorada al vapor con verduras",
      calorias: 240,
      planos: ["A","B","C","D"],
      tags: ["sin-gluten", "bajo-grasa", "alto-proteina"],
      ingredientes: ["180g dorada", "zanahoria", "apio", "cebolla", "limón", "aceite oliva"],
      sustituible_por: ["c006","c026"]
    }
  ]
};

// ─────────────────────────────────────────
// Función: obtener receta por ID
// ─────────────────────────────────────────
function getRecetaById(id) {
  const tipo = id.startsWith('d') ? 'desayunos' :
               id.startsWith('a') ? 'almuerzos' :
               id.startsWith('m') ? 'meriendas' : 'cenas';
  return RECIPES[tipo].find(r => r.id === id) || null;
}

// ─────────────────────────────────────────
// Función: obtener alternativa para una receta
// ─────────────────────────────────────────
function getSustituto(receta, alimentosExcluidos = [], planActual = 'A') {
  const tipo = receta.id.startsWith('d') ? 'desayunos' :
               receta.id.startsWith('a') ? 'almuerzos' :
               receta.id.startsWith('m') ? 'meriendas' : 'cenas';

  // Primero intentar con las sustituciones sugeridas
  for (const altId of receta.sustituible_por) {
    const alt = getRecetaById(altId);
    if (alt && alt.planos.includes(planActual)) {
      const tieneExcluido = alimentosExcluidos.some(alim =>
        alt.ingredientes.some(ing => ing.toLowerCase().includes(alim.toLowerCase()))
      );
      if (!tieneExcluido) return alt;
    }
  }

  // Si no, buscar en el banco completo
  return RECIPES[tipo].find(r =>
    r.id !== receta.id &&
    r.planos.includes(planActual) &&
    !alimentosExcluidos.some(alim =>
      r.ingredientes.some(ing => ing.toLowerCase().includes(alim.toLowerCase()))
    )
  ) || receta;
}
