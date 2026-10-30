// LA PELÍCULA
// Una sola toma que corre sola. No hay capítulos: la cámara fluye de
// un momento al siguiente y los versos aparecen uno tras otro.
//
//   0  portada
//   1  pasos         los agentes deambulan y dejan huella
//   2  el espejo     del otro lado algo aprende de ellos y lo ordena
//   3  la corriente  dejarse llevar: cruzan uno a uno
//   4  volver        quien mira los trae de regreso (clic sostenido)
//   5  la quietud    si nadie interviene, todo queda quieto
//   6  la mano       al pasar el cursor, todos florecen
//   7  epílogo       una espiral con estelas de luz, y la reflexión
//
// Quien presenta puede adelantar con clic, espacio o →.

import {
  TITULO, SUBTITULO, EMPEZAR, MOMENTOS,
  AL_RESCATAR, AL_FLORECER, INVITACION_FLORECER,
  PREGUNTA, RESPUESTA_1, RESPUESTA_2, REINICIAR,
} from './guion.js';

const $ = (id) => document.getElementById(id);
export const TOTAL = 8;

// Movimiento de cámara de cada momento. Cada uno empieza donde terminó
// el anterior, así la toma nunca se corta.
// mx: hacia dónde mira (fracción del ancho) · g: giro horizontal (rad)
// d: distancia (fracción) · h: altura · dur: segundos
const PLANOS = [
  { desde: { mx: 0, g: 0, d: 1.3, h: 0 }, hasta: { mx: 0, g: 0, d: 1.15, h: 0 }, dur: 20 },
  { desde: { mx: -0.55, g: -0.42, d: 0.42, h: -8 }, hasta: { mx: -0.4, g: 0.06, d: 0.85, h: -2 }, dur: 30 },
  { hasta: { mx: 0.36, g: 0.22, d: 0.86, h: 3 }, dur: 24 },
  { hasta: { mx: 0.02, g: -0.06, d: 1.0, h: -2 }, dur: 26 },
  { hasta: { mx: 0, g: 0, d: 1.0, h: 0 }, dur: 7 },
  { hasta: { mx: 0.22, g: 0.2, d: 1.45, h: 10 }, dur: 26 },
  { hasta: { mx: 0, g: 0, d: 1.02, h: 0 }, dur: 9 },
  { hasta: { mx: 0, g: 0.12, d: 1.0, h: -30 }, dur: 40 },
];

function configuracion(n) {
  return {
    n,
    visibles: n >= 1,
    humanos: n >= 1,
    copias: n >= 2 && n <= 5,
    atajo: [0, 0, 0, 0.01, 0.007, 0.05, 0, 0][n],
    ventana: n === 5 ? 3 : 18,
    rescate: n === 4,
    cursorAprende: n === 6,
    frontera: n <= 5,
    modo: n === 5 ? 'sinAyuda' : n === 6 ? 'conAyuda' : n === 7 ? 'mensaje' : null,
    camino: [0, 0.95, 0.85, 0.9, 1, 0.45, 1, 0.45][n],
    cuadricula: [0, 0, 0.16, 0.2, 0.18, 0.28, 0, 0][n],
    flujo: [0, 0.75, 0.6, 0.5, 0.5, 0.3, 0.6, 0][n],
    astrolabio: n === 7,
  };
}

export class Escenas {
  constructor(mundo, sonido) {
    this.m = mundo;
    this.sonido = sonido;
    this.actual = -1;
    this.t = 0;
    this.inicioMomento = 0;
    this.temporizadores = [];
    this.saltar = null;
    this.listo = false;
    this.ultimoPlano = null;

    $('titulo').textContent = TITULO;
    $('subtitulo').textContent = SUBTITULO;
    $('empezar').textContent = EMPEZAR;
    $('pregunta').textContent = PREGUNTA;
    $('respuesta-1').textContent = RESPUESTA_1;
    $('respuesta-2').textContent = RESPUESTA_2;
    $('final-titulo').textContent = TITULO;
    $('reiniciar').textContent = REINICIAR;
    this.ir(0);
  }

  get interactivo() { return this.actual === 4 || this.actual === 6; }

  ir(n, reiniciar = false) {
    n = Math.max(0, Math.min(TOTAL - 1, n));
    if (n === this.actual && !reiniciar) return;
    if (reiniciar || n < this.actual) { this.m.reiniciar(); this.ultimoPlano = null; }
    this.actual = n;
    this.inicioMomento = this.t;

    // El plano empieza donde terminó el anterior: la toma no se corta.
    const base = PLANOS[n];
    const desde = this.ultimoPlano || base.desde || PLANOS[1].desde;
    const plano = { desde, hasta: base.hasta, dur: base.dur };
    this.ultimoPlano = base.hasta;

    const c = configuracion(n);
    c.plano = plano;
    this.m.configurar(c, this.t, reiniciar);
    this.sonido.capitulo(n);
    this.montar(n);
  }

  siguiente() {
    if (this.actual === TOTAL - 1) { if (this.listo) this.ir(0, true); return; }
    this.ir(this.actual + 1);
  }
  anterior() { this.ir(this.actual - 1, true); }

  // Clic sobre la obra: empezar, o apurar el verso que se está leyendo.
  clic() {
    if (this.actual === 0) { this.ir(1); return; }
    if (this.interactivo) return;
    if (this.actual === TOTAL - 1) { if (this.listo) this.ir(0, true); return; }
    if (this.saltar) this.saltar();
  }

  // Espacio o →: lo mismo, pero también en los momentos que se juegan.
  adelantar() {
    if (this.actual === 0) { this.ir(1); return; }
    if (this.saltar) this.saltar(); else this.siguiente();
  }

  despues(seg, fn) {
    const id = setTimeout(fn, seg * 1000);
    this.temporizadores.push(id);
    return id;
  }

  limpiar() {
    this.temporizadores.forEach(clearTimeout);
    this.temporizadores = [];
    this.saltar = null;
    this.listo = false;
  }

  // Un verso aparece letra por letra (cada una se enciende un poco
  // después que la anterior), se queda, y se desvanece.
  verso(texto, alTerminar, quedarse = false) {
    const el = $('verso');
    el.classList.remove('visible');
    el.innerHTML = '';
    [...texto].forEach((c, i) => {
      const s = document.createElement('span');
      s.textContent = c;
      s.style.transitionDelay = `${i * 0.035}s`;
      el.appendChild(s);
    });
    void el.offsetWidth;
    el.classList.add('visible');
    if (quedarse) { this.saltar = null; if (alTerminar) alTerminar(); return; }
    const leer = 2.6 + texto.length * 0.05;
    let hecho = false;
    const irse = () => {
      if (hecho) return;
      hecho = true;
      this.saltar = null;
      el.classList.add('saliendo');
      el.querySelectorAll('span').forEach((s) => { s.style.transitionDelay = '0s'; });
      el.classList.remove('visible');
      setTimeout(() => { el.classList.remove('saliendo'); if (alTerminar) alTerminar(); }, 1000);
    };
    const id = this.despues(leer, irse);
    this.saltar = () => { clearTimeout(id); irse(); };
  }

  versos(lista, alTerminar) {
    const sig = (i) => {
      if (i >= lista.length) { if (alTerminar) alTerminar(); return; }
      this.verso(lista[i], () => this.despues(0.5, () => sig(i + 1)));
    };
    sig(0);
  }

  montar(n) {
    this.limpiar();
    this.rescateAnunciado = false;
    this.florecerAnunciado = false;
    this.esperandoRescates = false;
    const body = document.body;

    $('portada').classList.toggle('oculto', n !== 0);
    $('verso').classList.remove('visible');
    body.classList.toggle('unido', n >= 6);
    body.classList.toggle('cine', n >= 1 && n <= 6);
    body.classList.toggle('epilogo', n === 7);
    body.classList.toggle('en-pelicula', n >= 1);
    for (const id of ['pregunta', 'respuesta-1', 'respuesta-2', 'final-titulo', 'reiniciar']) $(id).classList.remove('visible');

    const lista = MOMENTOS[n];
    const pausa = n === 1 ? 3 : 1.4;

    if (n >= 1 && n <= 3 || n === 5) {
      // Momentos que corren solos: versos, un respiro, y sigue.
      this.despues(pausa, () => this.versos(lista, () => this.despues(n === 5 ? 3 : 1.5, () => this.ir(n + 1))));
    }

    if (n === 4) {
      this.despues(pausa, () => this.versos(lista.slice(0, -1), () => {
        this.verso(lista[lista.length - 1], null, true); // la invitación se queda
        this.esperandoRescates = true;
      }));
    }

    if (n === 6) {
      this.despues(pausa, () => this.versos(lista, () => this.verso(INVITACION_FLORECER, null, true)));
    }

    if (n === 7) {
      this.despues(9, () => $('pregunta').classList.add('visible'));
      this.despues(14, () => $('respuesta-1').classList.add('visible'));
      this.despues(19, () => { $('respuesta-2').classList.add('visible'); this.sonido.acorde(); });
      this.despues(33, () => { for (const id of ['pregunta', 'respuesta-1', 'respuesta-2']) $(id).classList.remove('visible'); });
      this.despues(36, () => $('final-titulo').classList.add('visible'));
      this.despues(40, () => { $('reiniciar').classList.add('visible'); this.listo = true; });
    }
  }

  actualizar(dt, t) {
    this.t = t;
    const enMomento = t - this.inicioMomento;

    // Volver: cuando trae al primero, la obra le responde; cuando ya
    // trajo varios (o pasa un rato), la película sigue.
    if (this.actual === 4 && this.esperandoRescates) {
      if (this.m.rescatados >= 1 && !this.rescateAnunciado) {
        this.rescateAnunciado = true;
        this.verso(AL_RESCATAR, null, true);
      }
      if ((this.m.rescatados >= 7 && this.rescateAnunciado) || enMomento > 55) {
        this.esperandoRescates = false;
        this.despues(7, () => this.ir(5)); // un momento para mirar lo que volvió
      }
    }

    // La mano: si nadie mueve el mouse, empiezan a florecer solos.
    if (this.actual === 6) {
      if (enMomento > 24 && this.m.barrido === null && !this.m.jardin) this.m.iniciarBarrido();
      if (this.m.jardin && !this.florecerAnunciado) {
        this.florecerAnunciado = true;
        this.despues(2.5, () => this.verso(AL_FLORECER, () => this.despues(1.5, () => this.ir(7))));
      }
    }

    // Una línea dorada muy fina avanza abajo: cuánto va de la película.
    const fr = this.actual <= 0 ? 0 : Math.min(1, (this.actual - 1 + Math.min(1, enMomento / 30)) / 7);
    $('progreso').style.transform = `scaleX(${fr})`;

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
