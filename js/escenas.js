// CAPÍTULOS
// La obra avanza con clics, como una película:
//
//   0  portada (un ensō se pinta solo)
//   1  道 el camino      cada uno inventa su camino y lo deja en tinta
//   2  写 la copia       del otro lado, una cuadrícula que imita
//   3  楽 lo cómodo      uno a uno ceden y cruzan
//   4  努 el esfuerzo    rescatarlos con el mouse; vuelven como símbolos
//   5  静 el silencio    si nadie lo hace, todo queda quieto
//   6  咲 florecer       al pasar sobre ellos, todos se vuelven símbolos
//   7  la reflexión     dentro de un ensō, con los símbolos girando

import {
  TITULO, SUBTITULO, EMPEZAR, CONTINUAR, CAPITULOS,
  REFLEXION, PREGUNTA_FINAL, RESPUESTA_FINAL, REINICIAR,
} from './guion.js';

const $ = (id) => document.getElementById(id);
export const TOTAL = 8;

// Qué se enciende en el mundo en cada capítulo y hacia dónde va la cámara.
// cam: x (fracción del ancho), y, z (fracción de la distancia), mx (hacia dónde mira).
function configuracion(n) {
  const camaras = [
    { x: 0, y: 0, z: 1.15, mx: 0 },
    { x: -0.34, y: -4, z: 0.8, mx: -0.44 },
    { x: 0.3, y: 2, z: 0.88, mx: 0.38 },
    { x: 0.04, y: -3, z: 0.98, mx: 0.05 },
    { x: 0, y: 0, z: 1, mx: 0 },
    { x: 0.14, y: 0, z: 1.12, mx: 0.16 },
    { x: 0, y: 0, z: 1, mx: 0 },
    { x: 0, y: -20, z: 1.05, mx: 0 },
  ];
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
    cam: camaras[n],
    camino: [0, 0.95, 0.8, 0.9, 1, 0.35, 1, 0.75][n],
    cuadricula: [0, 0, 0.2, 0.26, 0.22, 0.34, 0, 0][n],
  };
}

export class Escenas {
  constructor(mundo, sonido, pincel) {
    this.m = mundo;
    this.sonido = sonido;
    this.pincel = pincel;
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
    $('reiniciar').textContent = REINICIAR;
    $('continuar').addEventListener('click', (e) => { e.stopPropagation(); this.siguiente(); });
    this.ir(0);
  }

  get interactivo() { return this.actual === 4 || this.actual === 6; }

  ir(n, reiniciar = false) {
    n = Math.max(0, Math.min(TOTAL - 1, n));
    if (n === this.actual && !reiniciar) return;
    if (reiniciar || n < this.actual) this.m.reiniciar();
    this.previo = this.actual;
    this.actual = n;
    this.inicioCapitulo = this.t;
    this.m.configurar(configuracion(n));
    this.sonido.capitulo(n);
    this.montar(n);
  }

  siguiente() {
    if (this.actual === TOTAL - 1) { if (this.listo) this.ir(0, true); return; }
    this.ir(this.actual + 1);
  }
  anterior() { this.ir(this.actual - 1); }

  clic() {
    if (this.interactivo) return;
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
      demora += 0.05 + (/[.,:?]/.test(texto[i - 1] || '') ? 0.45 : 0);
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
      this.escribir(frases[i], () => this.despues(i < frases.length - 1 ? 1.8 : 0, () => sig(i + 1)));
    };
    sig(0);
  }

  mostrarPista(si) {
    this.listo = si;
    $('pista').classList.toggle('visible', si && !this.interactivo && this.actual !== TOTAL - 1);
    $('continuar').classList.toggle('visible', si && this.interactivo);
  }

  // La tinta del lienzo de encima: se apaga y se limpia.
  apagarTinta(despues = 0) {
    this.despues(despues, () => {
      $('tinta').classList.add('apagada');
      this.despues(1.7, () => { this.pincel.limpiar(); $('tinta').classList.remove('apagada'); });
    });
  }

  montar(n) {
    this.limpiar();
    this.mostrarPista(false);
    this.rescateAnunciado = false;
    this.finAnunciado = false;
    const body = document.body;
    const w = window.innerWidth, h = window.innerHeight;

    $('portada').classList.toggle('oculto', n !== 0);
    $('frase').classList.add('oculto');
    body.classList.toggle('unido', n >= 6);
    body.classList.toggle('cine', n >= 1 && n <= 6);
    for (const id of ['reflexion-linea', 'reflexion-respuesta', 'reflexion-sello', 'reiniciar']) $(id).classList.remove('visible');
    $('reflexion-linea').classList.remove('pregunta');
    $('tarjeta').classList.remove('visible');

    // Al salir de la portada, el ensō se desvanece en lugar de desaparecer de golpe.
    let o = 0;
    if (this.previo === 0 && n !== 0) {
      o = 1.5;
      $('tinta').classList.add('apagada');
      this.despues(1.6, () => { this.pincel.limpiar(); $('tinta').classList.remove('apagada'); });
    } else {
      this.pincel.limpiar();
      $('tinta').classList.remove('apagada');
    }

    if (n === 0) {
      // Portada: un ensō rojo se pinta solo alrededor del título.
      this.despues(0.6, () => this.pincel.enso(w / 2, h / 2 - h * 0.02, Math.min(w, h) * 0.34, { duracion: 2.6 }));
      return;
    }

    const cap = CAPITULOS[n];
    if (cap) {
      // Tarjeta de capítulo: un trazo de pincel, el sello y el título.
      this.despues(o + 0.25, () => this.pincel.barrido(h / 2 + h * 0.035));
      $('tarjeta-sello').textContent = cap.kanji;
      $('tarjeta-titulo').textContent = cap.titulo;
      this.despues(o + 0.15, () => $('tarjeta').classList.add('visible'));
      this.despues(o + 3, () => $('tarjeta').classList.remove('visible'));
      this.apagarTinta(o + 2.9);
      this.despues(o + 3.8, () => this.escribirVarias(cap.frases, () => {
        if (!this.interactivo) this.mostrarPista(true);
      }));
      return;
    }

    if (n === 7) this.reflexion(w, h);
  }

  // La reflexión final: un ensō grande, las líneas una a una, y la respuesta.
  reflexion(w, h) {
    this.despues(1, () => this.pincel.enso(w / 2, h / 2, Math.min(w, h) * 0.36, { duracion: 4.5, seco: 0.6 }));
    const linea = $('reflexion-linea');
    let t = 6.5; // primero el ensō y que los símbolos formen el anillo
    REFLEXION.forEach((texto) => {
      this.despues(t, () => { linea.textContent = texto; linea.classList.add('visible'); });
      this.despues(t + 3.4, () => linea.classList.remove('visible'));
      t += 4.4;
    });
    this.despues(t, () => {
      linea.textContent = PREGUNTA_FINAL;
      linea.classList.add('pregunta', 'visible');
    });
    this.despues(t + 2.6, () => {
      $('reflexion-respuesta').textContent = RESPUESTA_FINAL;
      $('reflexion-respuesta').classList.add('visible');
      this.sonido.acorde();
    });
    this.despues(t + 4.2, () => $('reflexion-sello').classList.add('visible'));
    this.despues(t + 8, () => { $('reiniciar').classList.add('visible'); this.listo = true; });
  }

  actualizar(dt, t) {
    this.t = t;
    this.pincel.actualizar();
    const enCap = t - this.inicioCapitulo;

    if (this.actual === 4) {
      if (this.m.rescatados >= 1 && !this.rescateAnunciado && !this.escribiendo) {
        this.rescateAnunciado = true;
        this.despues(1.2, () => this.escribir(CAPITULOS[4].alRescatar));
      }
      if (!this.listo && (this.m.rescatados >= 8 || enCap > 45)) this.mostrarPista(true);
    }

    if (this.actual === 6) {
      if (enCap > 22 && this.m.barrido === null && !this.m.jardin) this.m.iniciarBarrido();
      if (this.m.jardin && !this.finAnunciado) {
        this.finAnunciado = true;
        this.despues(2.5, () => this.escribir(CAPITULOS[6].alTerminar, () => this.despues(1.5, () => this.mostrarPista(true))));
      }
    }

    this.actualizarCursor();
  }

  actualizarCursor() {
    const cursor = $('cursor');
    const punto = cursor.firstElementChild;
    const pxPorUnidad = window.innerHeight / 100;
    let anillo = 26, centro = 5;
    if (this.actual === 4) {
      anillo = 26 + this.m.esfuerzo * 44;
      centro = 5 + this.m.esfuerzo * 24;
    } else if (this.actual === 6 && !this.m.jardin) {
      anillo = 22 * pxPorUnidad;
    }
    cursor.style.width = cursor.style.height = anillo + 'px';
    cursor.style.margin = `${-anillo / 2}px 0 0 ${-anillo / 2}px`;
    punto.style.width = punto.style.height = centro + 'px';
    cursor.classList.toggle('grande', this.actual === 6 && !this.m.jardin);
  }
}
