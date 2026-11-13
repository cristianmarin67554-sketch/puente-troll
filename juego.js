// =====================================================
//  LÓGICA DEL JUEGO  (usa las funciones de cerebro.js)
// =====================================================

// Datos del personaje: emojis, mensajes, colores de la barra y voz
const PERSONAJE = {
  emojiNormal: "🧌",
  emojiFeliz: "😄",
  emojiEnojado: "😡",
  palabraMagica: "musgo",
  mensajeMagico: "¡MUSGO! ¡La palabra secreta de los trolls! ¿Cómo la sabes, humano? Grumbo te respeta... ✨",
  bienvenida: "Un enorme troll bloquea el puente de piedra. Gruñe: «¿Quién osa cruzar mi puente?»",
  mensajeGanar: "🗝️ Grumbo te entrega la llave y se seca una lágrima: «Nadie había sido tan amable conmigo». ¡GANASTE!",
  mensajePerder: "💀 Grumbo ruge, te lanza al río y guarda la llave bajo el puente. GAME OVER.",
  colorBajo: "#ff3d00",
  colorMedio: "#ffd600",
  colorAlto: "#76ff03",
  vozTono: 0.2,
  vozVelocidad: 0.8
};

// Reglas generales: cuántos mensajes se pueden enviar y cuánta confianza se necesita para ganar
const MAX_TURNOS = 10;
const META = 100;

// Estado del juego: la confianza arranca en 40 y los turnos van bajando
let confianza = 40;
let turnos = MAX_TURNOS;
let terminado = false;

// Guarda los últimos mensajes de la charla para que la IA tenga contexto
const historial = [];

// Elementos de la página que el juego necesita modificar
const chat = document.getElementById("chat");
const formulario = document.getElementById("formulario");
const entrada = document.getElementById("entrada");
const cara = document.getElementById("personaje");
const barra = document.getElementById("confianza");
const estado = document.getElementById("estado");
const marcadorTurnos = document.getElementById("turnos");

// Después de cada turno revisa si el juego terminó: gana si llega a la meta,
// pierde si la confianza llega a 0 o se acaban los turnos. Si no, vuelve a habilitar el formulario
function revisarFinal() {
  if (confianza >= META) terminar(true);
  else if (confianza <= 0 || turnos === 0) terminar(false);
  else {
    entrada.disabled = false;
    formulario.querySelector("button").disabled = false;
    entrada.focus();
  }
}

// Crea una burbuja de chat con el mensaje. Si habla el personaje, además lo lee en voz alta
// con el texto a voz del navegador
function agregarMensaje(texto, clase) {
  const div = document.createElement("div");
  div.className = "msg " + clase;
  div.textContent = texto;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;   // baja el chat hasta el último mensaje

  if (clase === "personaje-msg") {
    const voz = new SpeechSynthesisUtterance(texto);
    voz.lang = "es-ES";
    voz.pitch = PERSONAJE.vozTono;         // qué tan grave o aguda suena la voz
    voz.rate = PERSONAJE.vozVelocidad;     // qué tan rápido habla
    speechSynthesis.cancel();              // corta la voz anterior para que no se acumulen
    speechSynthesis.speak(voz);
  }
}


// =====================================================
//  SONIDO DE GANAR O PERDER
// =====================================================

// Genera una melodía corta con el navegador, sin archivos de audio.
// Si ganas las notas suben, y si pierdes bajan
function sonido(gano) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const notas = gano ? [523, 659, 784, 1047] : [392, 330, 262, 196];
  notas.forEach((frecuencia, i) => {
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.frequency.value = frecuencia;
    osc.type = gano ? "triangle" : "sawtooth";   // sonido suave al ganar, áspero al perder
    vol.gain.value = 0.15;
    osc.connect(vol);
    vol.connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.2);        // cada nota empieza 0.2 segundos después de la anterior
    osc.stop(ctx.currentTime + i * 0.2 + 0.18);
  });
}

// Actualiza la barra de confianza, su color, los textos y la cara del personaje
// según cuánta confianza tiene
function actualizarPantalla() {
  confianza = Math.max(0, Math.min(META, confianza));   // la confianza siempre queda entre 0 y 100
  barra.style.width = confianza + "%";
  // Color de la barra según el nivel: uno para confianza baja, otro para media y otro para alta
  barra.style.background = confianza < 25 ? PERSONAJE.colorBajo : confianza < 60 ? PERSONAJE.colorMedio : PERSONAJE.colorAlto;
  estado.textContent = `Confianza: ${confianza} / ${META}`;
  marcadorTurnos.textContent = `Turnos restantes: ${turnos}`;

  // Con confianza alta el personaje se ve contento, con confianza baja se ve furioso
  cara.className = "personaje";
  if (confianza >= 60) { cara.textContent = PERSONAJE.emojiFeliz; cara.classList.add("feliz"); }
  else if (confianza < 25) { cara.textContent = PERSONAJE.emojiEnojado; cara.classList.add("enojado"); }
  else { cara.textContent = PERSONAJE.emojiNormal; }
}

// Cierra la partida: reproduce el sonido, bloquea el formulario y muestra el mensaje final
function terminar(gano) {
  terminado = true;
  sonido(gano);
  entrada.disabled = true;
  formulario.querySelector("button").disabled = true;
  agregarMensaje(gano ? PERSONAJE.mensajeGanar : PERSONAJE.mensajePerder, "personaje-msg");
}

// Ciclo principal: se ejecuta cada vez que el jugador envía un mensaje
formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();   // evita que la página se recargue al enviar
  if (terminado) return;

  // Lee el mensaje y lo muestra en el chat. Si está vacío, no hace nada
  const texto = entrada.value.trim();
  if (!texto) return;
  entrada.value = "";
  agregarMensaje(texto, "jugador");

  // 1) Mientras la IA piensa se bloquea el formulario, para que no se envíen dos mensajes a la vez
  entrada.disabled = true;
  formulario.querySelector("button").disabled = true;

  // Palabra mágica: si el mensaje la contiene, suma 50 de confianza y se salta la IA
  if (normalizar(texto).split(/\s+/).includes(PERSONAJE.palabraMagica)) {
    confianza += 50;
    turnos--;
    agregarMensaje(PERSONAJE.mensajeMagico, "personaje-msg");
    actualizarPantalla();
    revisarFinal();
    return;
  }

  // 2) Se le pide a la IA en la nube el puntaje y la respuesta.
  // Si falla (devuelve null), se usa el diccionario como plan B
  const ia = await consultarIA(texto, historial);
  const intencion = detectarIntencion(texto);
  let sentimiento, cambio, respuesta;

  if (ia && ia.sentimiento !== null) {
    sentimiento = ia.sentimiento;            // la IA da un puntaje de -10 a 10
    cambio = sentimiento * 2.5;
    respuesta = ia.respuesta;
  } else if (ia) {                           // la IA respondió pero sin puntaje: lo calcula el diccionario
    sentimiento = analizarSentimiento(texto);
    cambio = sentimiento * 6;
    respuesta = ia.respuesta;
  } else {                                   // la IA falló: todo lo resuelve el diccionario
    sentimiento = analizarSentimiento(texto);
    cambio = sentimiento * 6;
  }

  // 3) El sentimiento sube o baja la confianza, con un máximo de ±25 por mensaje
  confianza += Math.round(Math.max(-25, Math.min(25, cambio)));
  turnos--;

  // 4) El personaje responde. Con la IA usa su respuesta; con el diccionario elige una respuesta
  // de RESPUESTAS según la intención y su humor (bien si fuiste amable y tiene confianza, mal si no)
  if (!ia) {
    const humor = sentimiento >= 0 && confianza >= 25 ? "bien" : "mal";
    respuesta = RESPUESTAS[intencion][humor];
  }
  agregarMensaje(respuesta, "personaje-msg");
  historial.push({ role: "user", content: texto }, { role: "assistant", content: respuesta });

  actualizarPantalla();

  // 5) Se revisa si ganaste, perdiste o sigue el juego
  revisarFinal();
});

// Al cargar la página se dibuja el estado inicial y el personaje da la bienvenida
actualizarPantalla();
agregarMensaje(PERSONAJE.bienvenida, "personaje-msg");