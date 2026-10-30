// CAPÍTULOS
// La obra avanza con clics, como una película:
//
//   0    portada
//   I    los que deciden
//   II   los que copian
//   III  el atajo
//   IV   tomarse el trabajo   (rescatar con el mouse)
//   V    si nadie lo hace
//   VI   si alguien lo hace   (pasar el cursor)
//   7    epílogo: la pregunta y la respuesta
//
// Entre capítulos hay un fundido a negro. Mientras la pantalla está
// negra la cámara se coloca en su posición de inicio, y cuando vuelve
// la imagen hace su propio movimiento (acercarse, recorrer, alejarse).

import {
  TITULO, SUBTITULO, EMPEZAR, CONTINUAR, CAPITULOS,
  PREGUNTA, RESPUESTA, REINICIAR,
} from './guion.js';

const $ = (id) => document.getElementById(id);
export const TOTAL = 8;

// Movimiento de cámara de cada capítulo: desde -> hasta, en `dur` segundos.
// mx: hacia dónde mira (fracción del ancho) · g: giro horizontal (rad)
// d: distancia (fracción) · h: altura · dur: segundos del movimiento
const PLANOS = [
  { desde: { mx: 0, g: 0, d: 1.3, h: 0 }, hasta: { mx: 0, g: 0, d: 1.15, h: 0 }, dur: 20 },
  // I: empieza muy cerca y bajo, entre ellos, y se aleja despacio
  { desde: { mx: -0.55, g: -0.42, d: 0.42, h: -8 }, hasta: { mx: -0.4, g: 0.06, d: 0.85, h: -2 }, dur: 26 },
  // II: un paneo largo que descubre el otro lado
  { desde: { mx: -0.3, g: -0.12, d: 0.82, h: 0 }, hasta: { mx: 0.36, g: 0.22, d: 0.86, h: 3 }, dur: 22 },
  // III: desde la cuadrícula, girando hacia el centro
  { desde: { mx: 0.45, g: 0.38, d: 0.7, h: 6 }, hasta: { mx: 0.02, g: -0.06, d: 1.0, h: -2 }, dur: 30 },
  // IV: se acomoda de frente para poder jugar
  { desde: { mx: 0.12, g: 0.16, d: 1.15, h: 0 }, hasta: { mx: 0, g: 0, d: 1.0, h: 0 }, dur: 6 },
  // V: se aleja, solo, como quien se va
  { desde: { mx: 0.05, g: 0, d: 0.9, h: 0 }, hasta: { mx: 0.22, g: 0.2, d: 1.45, h: 10 }, dur: 34 },
  // VI: de frente, un poco lejos
  { desde: { mx: 0, g: -0.1, d: 1.12, h: 0 }, hasta: { mx: 0, g: 0, d: 1.0, h: 0 }, dur: 8 },
  // Epílogo: desde arriba y lejos, entrando lento a la espiral
  { desde: { mx: 0, g: 0, d: 1.75, h: -70 }, hasta: { mx: 0, g: 0.12, d: 1.0, h: -30 }, dur: 46 },
];

function configuracion(n) {
  return {
    n,
    visibles: n >= 1,
    humanos: n >= 1,
    copias: n >= 2 && n <= 5,
    atajo: [0, 0, 0, 0.007, 0.007, 0.05, 0, 0][n],
    ventana: n === 5 ? 3 : 45,
    rescate: n === 4,
    cursorAprende: n === 6,
    frontera: n <= 5,
    modo: n === 5 ? 'sinAyuda' : n === 6 ? 'conAyuda' : n === 7 ? 'mensaje' : null,
    plano: PLANOS[n],
    camino: [0, 0.95, 0.8, 0.9, 1, 0.4, 1, 0.45][n],
    cuadricula: [0, 0, 0.16, 0.2, 0.18, 0.28, 0, 0][n],
    flujo: [0, 0.75, 0.6, 0.5, 0.5, 0.3, 0.6, 0][n],
  };
}

export class Escenas {
  constructor(mundo, sonido) {
    this.m = mundo;
    this.sonido = sonido;
    this.actual = -1;
    this.t = 0;
    this.inicioCapitulo = 0;
    this.temporizadores = [];
    this.escribiendo = null;
    this.listo = false;
    this.enTransicion = false;

    $('titulo').textContent = TITULO;
    $('subtitulo').textContent = SUBTITULO;
    $('empezar').textContent = EMPEZAR;
    $('pista').textContent = CONTINUAR;
    $('pregunta').textContent = PREGUNTA;
    $('respuesta').textContent = RESPUESTA;
    $('final-titulo').textContent = TITULO;
    $('reiniciar').textContent = REINICIAR;
    $('continuar').textContent = 'continuar';
    $('continuar').addEventListener('click', (e) => { e.stopPropagation(); this.siguiente(); });
    this.cambiar(0, false, true);
  }

  get interactivo() { return this.actual === 4 || this.actual === 6; }

  // Ir a un capítulo, con fundido a negro.
  ir(n, reiniciar = false) {
    n = Math.max(0, Math.min(TOTAL - 1, n));
    if ((n === this.actual && !reiniciar) || this.enTransicion) return;
    this.enTransicion = true;
    this.limpiar();
    this.mostrarPista(false);
    $('frase').classList.add('oculto');
    document.body.classList.add('fundido');
    const espera = n === 1 && this.actual === 0 ? 1.6 : 1.1;
    setTimeout(() => this.cambiar(n, reiniciar), espera * 1000);
  }

  cambiar(n, reiniciar, inmediato = false) {
    if (reiniciar || n < this.actual) this.m.reiniciar();
    this.actual = n;
    this.inicioCapitulo = this.t;
    this.m.configurar(configuracion(n), this.t);
    this.sonido.capitulo(n);
    this.montar(n);
    setTimeout(() => {
      document.body.classList.remove('fundido');
      this.enTransicion = false;
    }, inmediato ? 0 : 250);
  }

  siguiente() {
    if (this.actual === TOTAL - 1) { if (this.listo) this.ir(0, true); return; }
    this.ir(this.actual + 1);
  }
  anterior() { this.ir(this.actual - 1); }

  clic() {
    if (this.interactivo || this.enTransicion) return;
    if (this.escribiendo) { this.completar(); return; }
    if (this.listo || this.actual === 0) this.siguiente();
  }

  despues(seg, fn) {
    const id = setTimeout(fn, seg * 1000);
    this.temporizadores.push(id);
    return id;
  }

  limpiar() {
    this.temporizadores.forEach(clearTimeout);
    this.temporizadores = [];
    this.escribiendo = null;
    this.listo = false;
  }

  escribir(texto, alTerminar) {
    const el = $('frase');
    el.classList.remove('oculto');
    el.textContent = '';
    const letras = document.createElement('span');
    const caret = document.createElement('span');
    caret.className = 'caret';
    caret.innerHTML = '&nbsp;';
    el.append(letras, caret);
    const ids = [];
    let demora = 0;
    [...texto].forEach((c, i) => {
      demora += 0.052 + (/[.,:?]/.test(texto[i - 1] || '') ? 0.5 : 0);
      ids.push(setTimeout(() => { letras.textContent += c; }, demora * 1000));
    });
    const fin = () => {
      ids.forEach(clearTimeout);
      letras.textContent = texto;
      caret.remove();
      this.escribiendo = null;
      if (alTerminar) alTerminar();
    };
    ids.push(setTimeout(fin, (demora + 0.3) * 1000));
    this.temporizadores.push(...ids);
    this.escribiendo = fin;
  }

  completar() { if (this.escribiendo) this.escribiendo(); }

  escribirVarias(frases, alTerminar) {
    const sig = (i) => {
      if (i >= frases.length) { if (alTerminar) alTerminar(); return; }
      this.escribir(frases[i], () => this.despues(i < frases.length - 1 ? 1.9 : 0, () => sig(i + 1)));
    };
    sig(0);
  }

  mostrarPista(si) {
    this.listo = si;
    $('pista').classList.toggle('visible', si && !this.interactivo && this.actual !== TOTAL - 1);
    $('continuar').classList.toggle('visible', si && this.interactivo);
  }

  montar(n) {
    this.limpiar();
    this.mostrarPista(false);
    this.rescateAnunciado = false;
    this.finAnunciado = false;
    const body = document.body;

    $('portada').classList.toggle('oculto', n !== 0);
    $('frase').classList.add('oculto');
    body.classList.toggle('unido', n >= 6);
    body.classList.toggle('cine', n >= 1 && n <= 6);
    body.classList.toggle('epilogo', n === 7);
    for (const id of ['pregunta', 'respuesta', 'final-titulo', 'reiniciar']) $(id).classList.remove('visible');
    $('tarjeta').classList.remove('visible');

    const cap = CAPITULOS[n];
    if (cap) {
      $('tarjeta-numero').textContent = cap.numero;
      $('tarjeta-titulo').textContent = cap.titulo;
      this.despues(0.6, () => $('tarjeta').classList.add('visible'));
      this.despues(4.2, () => $('tarjeta').classList.remove('visible'));
      this.despues(5.2, () => this.escribirVarias(cap.frases, () => {
        if (!this.interactivo) this.mostrarPista(true);
      }));
    }

    if (n === 7) {
      // Epílogo: la espiral se forma, la cámara entra en ella, y aparece la respuesta.
      this.despues(9, () => $('pregunta').classList.add('visible'));
      this.despues(14, () => { $('respuesta').classList.add('visible'); this.sonido.acorde(); });
      this.despues(27, () => { $('pregunta').classList.remove('visible'); $('respuesta').classList.remove('visible'); });
      this.despues(30, () => $('final-titulo').classList.add('visible'));
      this.despues(34, () => { $('reiniciar').classList.add('visible'); this.listo = true; });
    }
  }

  actualizar(dt, t) {
    this.t = t;
    const enCap = t - this.inicioCapitulo;

    if (this.actual === 4) {
      if (this.m.rescatados >= 1 && !this.rescateAnunciado && !this.escribiendo) {
        this.rescateAnunciado = true;
        this.despues(1.2, () => this.escribir(CAPITULOS[4].alRescatar));
      }
      if (!this.listo && (this.m.rescatados >= 8 || enCap > 45)) this.mostrarPista(true);
    }

    if (this.actual === 6) {
      if (enCap > 24 && this.m.barrido === null && !this.m.jardin) this.m.iniciarBarrido();
      if (this.m.jardin && !this.finAnunciado) {
        this.finAnunciado = true;
        this.despues(3, () => this.escribir(CAPITULOS[6].alTerminar, () => this.despues(1.5, () => this.mostrarPista(true))));
      }
    }

    this.actualizarCursor();
  }

  actualizarCursor() {
    const cursor = $('cursor');
    const punto = cursor.firstElementChild;
    const pxPorUnidad = window.innerHeight / 100;
    let anillo = 26, centro = 4;
    if (this.actual === 4) {
      anillo = 26 + this.m.esfuerzo * 44;
      centro = 4 + this.m.esfuerzo * 24;
    } else if (this.actual === 6 && !this.m.jardin) {
      anillo = 22 * pxPorUnidad;
    }
    cursor.style.width = cursor.style.height = anillo + 'px';
    cursor.style.margin = `${-anillo / 2}px 0 0 ${-anillo / 2}px`;
    punto.style.width = punto.style.height = centro + 'px';
    cursor.classList.toggle('grande', this.actual === 6 && !this.m.jardin);
  }
}
