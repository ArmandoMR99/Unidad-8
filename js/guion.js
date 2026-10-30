// Todo lo que dice la obra está aquí, para poder cambiarlo sin
// tocar lo demás.

export const TITULO = 'Why Bother?';
export const SUBTITULO = '¿para qué tomarte el trabajo?';
export const EMPEZAR = 'haz clic para empezar';
export const CONTINUAR = 'clic para continuar';

// Capítulos. Cada uno tiene un título (aparece como en el cine)
// y las frases que se escriben letra por letra.
export const CAPITULOS = {
  1: {
    numero: 'I',
    titulo: 'los que deciden',
    frases: ['aquí nadie les dice qué figura hacer.', 'cada paso que dan queda en el suelo.'],
  },
  2: {
    numero: 'II',
    titulo: 'los que copian',
    frases: ['del otro lado alguien mira y copia.', 'lo deja en orden. pero no deja huella.'],
  },
  3: {
    numero: 'III',
    titulo: 'el atajo',
    frases: ['cruzar es más fácil.', 'siguen teniendo su color, pero ya no deciden.'],
  },
  4: {
    numero: 'IV',
    titulo: 'tomarse el trabajo',
    frases: ['mantén presionado sobre ellos y tráelos de vuelta.'],
    alRescatar: 'cuesta. pero los que vuelven ya no son los mismos.',
  },
  5: {
    numero: 'V',
    titulo: 'si nadie lo hace',
    frases: ['si nadie hace nada, todo queda en orden.', 'y quieto.'],
  },
  6: {
    numero: 'VI',
    titulo: 'si alguien lo hace',
    frases: ['pasa sobre ellos.'],
    alTerminar: 'nadie les entregó el camino. lo hicieron sus pasos.',
  },
};

// Final
export const NOMBRE = 'Juan Franco';
export const PREGUNTA = '¿Debería tomarme el trabajo?';
export const RESPUESTA = `Sí, deberías, ${NOMBRE}.`;

export const CREDITOS = [
  'una obra de Armando',
  'Simulación · Unidad 8 · 2026-20',
  'música original generada en el navegador',
  'código escrito con Claude a partir de mi diseño',
];
export const REINICIAR = 'clic para volver a empezar';

// Si quieres usar una canción propia en el clímax (capítulos VI y
// final), pon el archivo en la carpeta audio/ de tu computador y
// escribe aquí su ruta, por ejemplo 'audio/cancion.mp3'.
// No subas canciones con derechos de autor al repositorio público.
export const PISTA_PROPIA = 'audio/cancion.mp3';
