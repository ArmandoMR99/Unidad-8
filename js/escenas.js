// ESCENAS
// Cada tecla (0–7) es un momento de la obra. Una escena solo dice
// qué "perillas" del mundo están encendidas y qué frase aparece.
//
//   0  Portada
//   1  Lado humano
//   2  Lado IA (copias rígidas y genéricas)
//   3  El atajo
//   4  Tomarse el trabajo (rescate con el mouse)
//   5  Final A: nadie hace nada
//   6  Final B: alguien se toma el trabajo (pasar el cursor)
//   7  La pregunta y la respuesta

import { TITULO, SUBTITULO, FRASES, PREGUNTA, RESPUESTA, PAUSA_RESPUESTA, FIRMA } from './guion.js';

const $ = (id) => document.getElementById(id);
export const TOTAL = 8;

function configuracion(n) {
  return {
    n,
    visibles: n >= 1,
    humanos: n >= 1,
    copias: n >= 2 && n <= 5,
    atajo: [0, 0, 0, 0.007, 0.007, 0.05, 0, 0][n],
    ventana: n === 5 ? 3 : 55, // segundos en los que todos terminan tentados
    rescate: n === 4,
    cursorAprende: n === 6,
    frontera: n <= 5,
    modo: n === 5 ? 'sinAyuda' : n === 6 ? 'conAyuda' : n === 7 ? 'mensaje' : null,
  };
}

export class Escenas {
  constructor(mundo, sonido) {
    this.m = mundo;
    this.sonido = sonido;
    this.actual = -1;
    this.t = 0;
    this.temporizadores = [];

    $('titulo').textContent = TITULO;
    $('subtitulo').textContent = SUBTITULO;
    $('pregunta').textContent = PREGUNTA;
    $('respuesta').textContent = RESPUESTA;
    $('firma').textContent = FIRMA;
    this.ir(0);
  }

  ir(n, reiniciar = false) {
    n = Math.max(0, Math.min(TOTAL - 1, n));
    if (n === this.actual && !reiniciar) { this.repetir(n); return; }
    // Ir hacia atrás reinicia el mundo: el tiempo invertido no se devuelve.
    if (reiniciar || n < this.actual) this.m.reiniciar();
    this.actual = n;
    this.m.configurar(configuracion(n));
    this.actualizarTextos(n);
  }

  siguiente() { this.ir(this.actual + 1); }
  anterior() { this.ir(this.actual - 1); }

  repetir(n) {
    if (n === 6) this.m.iniciarBarrido();
  }

  despues(seg, fn) {
    this.temporizadores.push(setTimeout(fn, seg * 1000));
  }

  // Escribe la frase letra por letra.
  escribir(texto) {
    const el = $('frase');
    el.classList.remove('oculto');
    el.textContent = '';
    const letras = document.createElement('span');
    const caret = document.createElement('span');
    caret.className = 'caret';
    caret.innerHTML = '&nbsp;';
    el.append(letras, caret);
    [...texto].forEach((c, i) => {
      // pausas un poco más largas después de un punto o una coma
      const extra = texto.slice(0, i).split(/[.,]/).length - 1;
      this.despues(i * 0.045 + extra * 0.35, () => { letras.textContent += c; });
    });
    this.despues(texto.length * 0.045 + 2.5, () => caret.remove());
  }

  actualizarTextos(n) {
    this.temporizadores.forEach(clearTimeout);
    this.temporizadores = [];

    $('portada').classList.toggle('oculto', n !== 0);
    $('etq-humano').classList.toggle('oculto', n === 0 || n > 5);
    $('etq-ia').classList.toggle('oculto', n < 2 || n > 5);
    document.body.classList.toggle('unido', n >= 6);
    document.body.classList.toggle('escena-activa', n > 0);

    const frase = $('frase');
    frase.classList.add('oculto');
    if (FRASES[n]) this.despues(1.4, () => this.escribir(FRASES[n]));

    $('pregunta').classList.toggle('visible', n === 7);
    $('respuesta').classList.remove('visible');
    if (n === 7) {
      this.despues(PAUSA_RESPUESTA, () => {
        $('respuesta').classList.add('visible');
        this.sonido.acorde();
      });
    }

    $('contador').textContent = `escena ${n} de ${TOTAL - 1}`;
  }

  // El cursor cambia según la escena: en la 4 se llena con el esfuerzo,
  // en la 6 muestra hasta dónde alcanza a "enseñar".
  actualizar(dt, t) {
    this.t = t;
    const cursor = $('cursor');
    const punto = cursor.firstElementChild;
    const pxPorUnidad = window.innerHeight / 100;
    let anillo = 26;
    let centro = 4;
    if (this.actual === 4) {
      anillo = 26 + this.m.esfuerzo * 40;
      centro = 4 + this.m.esfuerzo * 22;
    } else if (this.actual === 6 && !this.m.jardin) {
      anillo = 22 * pxPorUnidad;
    }
    cursor.style.width = cursor.style.height = anillo + 'px';
    cursor.style.margin = `${-anillo / 2}px 0 0 ${-anillo / 2}px`;
    punto.style.width = punto.style.height = centro + 'px';
    cursor.classList.toggle('grande', this.actual === 6);
  }
}
