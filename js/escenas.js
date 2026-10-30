// CAPÍTULOS
// La obra avanza con clics, como una película en capítulos:
//
//   0  portada
//   I    los que deciden      (lado humano)
//   II   los que copian       (lado IA)
//   III  el atajo
//   IV   tomarse el trabajo   (rescatar con el mouse)
//   V    si nadie lo hace
//   VI   si alguien lo hace   (pasar el cursor)
//   7  la pregunta y la respuesta
//   8  créditos

import {
  TITULO, SUBTITULO, EMPEZAR, CONTINUAR, CAPITULOS,
  PREGUNTA, RESPUESTA, CREDITOS, REINICIAR,
} from './guion.js';

const $ = (id) => document.getElementById(id);
export const TOTAL = 9;

// Qué se enciende en el mundo en cada capítulo, y hacia dónde va la cámara.
// cam: x (fracción del ancho), y, z (fracción de la distancia), mx (hacia dónde mira).
function configuracion(n) {
  const camaras = [
    { x: 0, y: 0, z: 1.15, mx: 0 },
    { x: -0.32, y: -4, z: 0.82, mx: -0.42 },
    { x: 0.3, y: 2, z: 0.88, mx: 0.38 },
    { x: 0.04, y: -3, z: 0.98, mx: 0.05 },
    { x: 0, y: 0, z: 1, mx: 0 },
    { x: 0.12, y: 0, z: 1.12, mx: 0.15 },
    { x: 0, y: 0, z: 1, mx: 0 },
    { x: 0, y: -18, z: 1.03, mx: 0 },
    { x: 0, y: -24, z: 1.1, mx: 0 },
  ];
  return {
    n,
    visibles: n >= 1,
    humanos: n >= 1,
    copias: n >= 2 && n <= 5,
    atajo: [0, 0, 0, 0.007, 0.007, 0.05, 0, 0, 0][n],
    ventana: n === 5 ? 3 : 45,
    rescate: n === 4,
    cursorAprende: n === 6,
    frontera: n <= 5,
    modo: n === 5 ? 'sinAyuda' : n === 6 ? 'conAyuda' : n >= 7 ? 'mensaje' : null,
    cam: camaras[n],
    camino: [0, 0.9, 0.75, 0.85, 0.95, 0.55, 1, 0.9, 0.7][n],
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

    $('titulo').textContent = TITULO;
    $('subtitulo').textContent = SUBTITULO;
    $('empezar').textContent = EMPEZAR;
    $('pista').textContent = CONTINUAR;
    $('pregunta').textContent = PREGUNTA;
    $('respuesta').textContent = RESPUESTA;
    $('creditos-lista').innerHTML = CREDITOS.map((c) => `<p>${c}</p>`).join('');
    $('reiniciar').textContent = REINICIAR;
    $('continuar').textContent = 'continuar';
    $('continuar').addEventListener('click', (e) => { e.stopPropagation(); this.siguiente(); });
    this.ir(0);
  }

  // Capítulos donde el clic sobre la obra es para jugar, no para avanzar.
  get interactivo() { return this.actual === 4 || this.actual === 6; }

  ir(n, reiniciar = false) {
    n = Math.max(0, Math.min(TOTAL - 1, n));
    if (n === this.actual && !reiniciar) return;
    if (reiniciar || n < this.actual) this.m.reiniciar();
    this.actual = n;
    this.inicioCapitulo = this.t;
    this.m.configurar(configuracion(n));
    this.sonido.capitulo(n);
    this.montar(n);
  }

  siguiente() {
    if (this.actual === TOTAL - 1) { this.ir(0, true); return; }
    this.ir(this.actual + 1);
  }
  anterior() { this.ir(this.actual - 1); }

  // Un clic sobre la obra.
  clic() {
    if (this.interactivo) return;
    if (this.actual === 7) return; // el final avanza solo
    if (this.escribiendo) { this.completar(); return; }
    if (this.listo || this.actual === 0 || this.actual === TOTAL - 1) this.siguiente();
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

  // Escribe una frase letra por letra. Si se hace clic, se completa.
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
      demora += 0.048 + (/[.,]/.test(texto[i - 1] || '') ? 0.4 : 0);
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

  // Escribe varias frases seguidas.
  escribirVarias(frases, alTerminar) {
    const siguienteFrase = (i) => {
      if (i >= frases.length) { if (alTerminar) alTerminar(); return; }
      this.escribir(frases[i], () => this.despues(i < frases.length - 1 ? 1.6 : 0, () => siguienteFrase(i + 1)));
    };
    siguienteFrase(0);
  }

  mostrarPista(si) {
    this.listo = si;
    $('pista').classList.toggle('visible', si && !this.interactivo);
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
    $('etq-humano').classList.toggle('oculto', !(n >= 1 && n <= 5));
    $('etq-ia').classList.toggle('oculto', !(n >= 2 && n <= 5));
    body.classList.toggle('unido', n >= 6);
    body.classList.toggle('cine', n >= 1 && n <= 6);
    body.classList.toggle('escena-activa', n > 0);
    $('pregunta').classList.remove('visible');
    $('respuesta').classList.remove('visible');
    $('creditos').classList.toggle('visible', n === TOTAL - 1);

    const cap = CAPITULOS[n];
    if (cap) {
      // Tarjeta de título, como en el cine
      $('tarjeta-numero').textContent = cap.numero;
      $('tarjeta-titulo').textContent = cap.titulo;
      $('tarjeta').classList.add('visible');
      this.despues(2.8, () => $('tarjeta').classList.remove('visible'));
      this.despues(3.6, () => this.escribirVarias(cap.frases, () => {
        if (!this.interactivo) this.mostrarPista(true);
      }));
    } else {
      $('tarjeta').classList.remove('visible');
    }

    if (n === 7) {
      this.despues(1.5, () => $('pregunta').classList.add('visible'));
      this.despues(4.5, () => { $('respuesta').classList.add('visible'); this.sonido.acorde(); });
      this.despues(13, () => this.ir(8));
    }
  }

  actualizar(dt, t) {
    this.t = t;
    const enCap = t - this.inicioCapitulo;

    // IV: cuando rescata al primero, la obra le responde.
    if (this.actual === 4) {
      if (this.m.rescatados >= 1 && !this.rescateAnunciado && !this.escribiendo) {
        this.rescateAnunciado = true;
        this.despues(1.2, () => this.escribir(CAPITULOS[4].alRescatar));
      }
      if (!this.listo && (this.m.rescatados >= 8 || enCap > 45)) this.mostrarPista(true);
    }

    // VI: si nadie mueve el mouse, empiezan a aprender solos.
    if (this.actual === 6) {
      if (enCap > 22 && this.m.barrido === null && !this.m.jardin) this.m.iniciarBarrido();
      if (this.m.jardin && !this.finAnunciado) {
        this.finAnunciado = true;
        this.despues(2.5, () => this.escribir(CAPITULOS[6].alTerminar, () => this.despues(1.5, () => this.mostrarPista(true))));
      }
    }

    this.actualizarCursor();
  }

  // El cursor también cuenta la historia: en IV se llena con el
  // esfuerzo, en VI muestra hasta dónde alcanza a enseñar.
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
