// Todo lo que dice la obra está aquí, para poder cambiarlo sin
// tocar lo demás.

export const TITULO = 'Why Bother?';
export const SUBTITULO = '¿para qué tomarte el trabajo?';
export const EMPEZAR = 'haz clic para empezar';
export const CONTINUAR = 'clic para continuar';

// Capítulos. Cada uno abre con un sello rojo (hanko) con un kanji,
// un trazo de pincel y su título; luego las frases se escriben solas.
//   道 camino · 写 copiar · 楽 lo cómodo · 努 esforzarse · 静 quietud · 咲 florecer
export const CAPITULOS = {
  1: {
    kanji: '道',
    titulo: 'el camino',
    frases: ['al principio nadie sabe hacia dónde ir.', 'así que cada uno inventa su propio camino.'],
  },
  2: {
    kanji: '写',
    titulo: 'la copia',
    frases: ['del otro lado, algo aprendió a imitarlos.', 'rápido. perfecto. igual cada vez.'],
  },
  3: {
    kanji: '楽',
    titulo: 'lo cómodo',
    frases: ['y apareció la pregunta:', '¿para qué esforzarse, si alguien más puede hacerlo?', 'uno a uno, dejaron de decidir.'],
  },
  4: {
    kanji: '努',
    titulo: 'el esfuerzo',
    frases: ['mantén presionado sobre ellos y tráelos de vuelta.'],
    alRescatar: 'cuesta. pero lo que vuelve ya no es lo mismo.',
  },
  5: {
    kanji: '静',
    titulo: 'el silencio',
    frases: ['si nadie lo hace, todo queda en orden.', 'y nada vuelve a moverse.'],
  },
  6: {
    kanji: '咲',
    titulo: 'florecer',
    frases: ['pasa sobre ellos.'],
    alTerminar: 'la IA no hizo esto sola. yo tampoco.',
  },
};

// La reflexión final. Cada línea aparece sola, en el centro.
export const REFLEXION = [
  'empecé este curso para aprobar.',
  'y en el camino, algo se me quedó.',
  'la IA puede escribir el código.',
  'pero no sabe por qué lo hago.',
  'lo que juego, lo que veo, lo que entreno,',
  'eso no se delega.',
];
export const PREGUNTA_FINAL = '¿para qué tomarse el trabajo?';
export const RESPUESTA_FINAL = 'para que el camino sea mío.';
export const REINICIAR = 'clic para volver a empezar';

// Si quieres usar una canción propia en el clímax (capítulo 咲 y la
// reflexión), pon el archivo en la carpeta audio/ de tu computador.
// Esa carpeta no se sube al repositorio.
export const PISTA_PROPIA = 'audio/cancion.mp3';
