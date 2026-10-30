// Todo lo que dice la obra está aquí, para poder cambiarlo sin
// tocar lo demás.

export const TITULO = 'Why Bother?';
export const SUBTITULO = '¿para qué tomarte el trabajo?';
export const EMPEZAR = 'haz clic para empezar';
export const CONTINUAR = 'clic para continuar';

// Capítulos. Cada uno abre con un número romano y un título, como
// en un libro antiguo; luego las frases se escriben solas.
export const CAPITULOS = {
  1: {
    numero: 'I',
    titulo: 'los que deciden',
    frases: ['al principio nadie sabe hacia dónde ir.', 'así que cada uno inventa su camino, y lo deja en el suelo.'],
  },
  2: {
    numero: 'II',
    titulo: 'los que copian',
    frases: ['del otro lado, algo aprendió a imitarlos.', 'rápido. ordenado. sin dejar huella.'],
  },
  3: {
    numero: 'III',
    titulo: 'el atajo',
    frases: ['y entonces llegó la pregunta:', '¿para qué esforzarse, si alguien más puede hacerlo?', 'uno a uno, dejaron de decidir.'],
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

// Epílogo: la pregunta, y la respuesta.
export const PREGUNTA = '¿para qué tomarte el trabajo?';
export const RESPUESTA = 'porque lo que uno hace, se le queda.';
export const REINICIAR = 'clic para volver a empezar';

// Si quieres usar una canción propia en el clímax (capítulo VI y el
// epílogo), pon el archivo en la carpeta audio/ de tu computador.
// Esa carpeta no se sube al repositorio.
export const PISTA_PROPIA = 'audio/cancion.mp3';
