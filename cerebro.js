// ============================ LÉXICO ============================
// Cada palabra tiene un puntaje: positivo si es amable, negativo si es grosera

const LEXICO = {
  // positivas
  gracias: 1, genial: 2, increible: 3, fabuloso: 3, magnifico: 4, estupendo: 3, lindo: 2, bello: 2, hermoso: 3, poderoso: 3,
  valiente: 2, fuerte: 3, inteligente: 2, admiro: 3, adoro: 2, amigo: 3, quiero: 1, capaz: 2, unico: 4, maravilloso: 3, asombroso: 3,
  // positivas propias del troll
  enorme: 3, gigante: 2, leal: 3, amable: 3, generoso: 3, delicioso: 3, banquete: 3, respeto: 3, sabio: 3, imponente: 3,
  // negativas
  feo: -3, tonto: -3, idiota: -4, odio: -4, cobarde: -3, basura: -4, bobo: -3, inutil: -5, estupido: -5, malo: -2,
  imbecil: -3, aburrido: -2, absurdo: -2, cruel: -2, incapaz: -4, maldito: -3,
  // negativas propias del troll
  pequeno: -2, debil: -3, hediondo: -3, asqueroso: -4, bruto: -3, torpe: -3, lento: -2, mugroso: -3
};


// Deja el texto limpio para poder compararlo con el léxico
function normalizar(texto) {
  return texto
    .toLowerCase()                                      // todo a minúscula
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")   // quita tildes
    .replace(/[^a-zñ\s]/g, " ")                         // quita signos
    .trim();
}


// ============================ NEGADORES ============================

const NEGADORES = ["no", "nunca", "jamas", "tampoco"];


// Recibe un texto y devuelve un número: positivo si fue amable, negativo si fue grosero
function analizarSentimiento(texto) {
  const palabras = normalizar(texto).split(/\s+/);   // separa en palabras
  let puntaje = 0;

  palabras.forEach((palabra, i) => {
    let valor = LEXICO[palabra] || 0;                // puntaje de la palabra (0 si no existe)

    // "no eres feo": la negación invierte el valor
    if (valor !== 0 && (NEGADORES.includes(palabras[i - 1]) || NEGADORES.includes(palabras[i - 2]))) {
      valor = -valor;
    }
    puntaje += valor;
  });

  if (texto.includes("!") && puntaje < 0) puntaje -= 1;   // gritar empeora el insulto
  return puntaje;
}


// ============================ INTENCIONES ============================
// Cada intención tiene palabras clave. Gana la primera que aparezca en el mensaje

const INTENCIONES = [
  { nombre: "saludo",       claves: ["hola", "buenas", "saludos", "hey"] },
  { nombre: "llave",        claves: ["llave", "puerta", "abrir", "tesoro", "porton"] },
  { nombre: "nombre",       claves: ["nombre", "llamas", "quien"] },
  { nombre: "chiste",       claves: ["chiste", "gracioso", "risa", "broma"] },
  { nombre: "comida",       claves: ["comida", "hambre", "comer", "sopa", "cabra"] },
  { nombre: "puente",       claves: ["puente", "peaje", "pagar", "cruzar", "oro"] },
  { nombre: "olor",         claves: ["olor", "huele", "apesta", "bano", "banarse"] },
  { nombre: "despedida",    claves: ["adios", "chao", "bye", "hasta"] }
];


// Recibe un texto y devuelve el nombre de la intención que detecta
function detectarIntencion(texto) {
  const palabras = normalizar(texto).split(/\s+/);
  for (const intencion of INTENCIONES) {
    if (intencion.claves.some(c => palabras.includes(c))) return intencion.nombre;
  }
  return "desconocida";          // si no entendió nada
}


// ============================ RESPUESTAS ============================
// Para cada intención hay una respuesta de buen humor (bien) y otra de mal humor (mal)

const RESPUESTAS = {
  saludo: {
    bien: "¡Grrr, hola, pequeño humano! Soy Grumbo, el troll del puente. Hoy no tengo hambre, así que estás de suerte.",
    mal:  "¿Quién pisa mi puente? ¡GRRR! Retrocede o te uso de palillo de dientes."
  },
  llave: {
    bien: "¿Quieres la llave del portón? Hum... me caes bien, pero todavía no te la doy, humano.",
    mal:  "¡La llave es MÍA! Nadie la toca. ¡Fuera de mi puente!"
  },
  nombre: {
    bien: "Me llamo Grumbo, hijo de Grumba, nieto de Grumbón. ¿Y tú, humano simpático?",
    mal:  "Mi nombre es 'la última cosa que verás en tu vida'. ¡GRRR!"
  },
  chiste: {
    bien: "¿Por qué el troll no usa reloj? ¡Porque siempre es hora de comer! ¡JA JA JA! 🪨",
    mal:  "¿Un chiste? Tu cara es el chiste, y ya me dio hambre."
  },
  comida: {
    bien: "¡Comida! Mi sopa de cabra con musgo es la mejor del reino. Quizás te dé un poquito, humano amable.",
    mal:  "¿Quieres comida? ¡Tú eres la comida! ¡GRRR!"
  },
  puente: {
    bien: "Cruzar mi puente cuesta una moneda, pero a ti te dejo pasar gratis... casi. Eres amable.",
    mal:  "¡Para cruzar mi puente tendrás que pagar con algo más que insultos!"
  },
  olor: {
    bien: "Dicen que huelo mal, pero es mi perfume: eau de pantano. Gracias por no quejarte.",
    mal:  "¿Dices que huelo mal? ¡Es perfume de pantano, ignorante! ¡GRRR!"
  },
  despedida: {
    bien: "Vuelve pronto, humano. Grumbo casi nunca tiene visitas que no quieran pelear.",
    mal:  "¡Largo de mi puente! Y no vuelvas, o te lanzo al río."
  },
  desconocida: {
    bien: "Grumbo no entiende palabras difíciles... ¿puedes decirlo más simple, humano? Me caes bien.",
    mal:  "¡Grrr! No entiendo nada. Habla claro o te lanzo al río."
  }
};


// ============================ IA EN LA NUBE ============================

// Le pide la respuesta al SERVIDOR (nunca a NVIDIA directo, porque la clave es secreta).
// Si algo falla devuelve null y el juego usa el diccionario como plan B
async function consultarIA(texto, historial) {
  try {
    const respuesta = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensaje: texto, historial }),
      signal: AbortSignal.timeout(20000)
    });
    if (!respuesta.ok) return null;
    return await respuesta.json();     // { sentimiento: -10..10, respuesta: "..." }
  } catch (error) {
    return null;
  }
}