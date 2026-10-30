// ESCENAS
// Cada tecla (0–7) es un momento de la presentación. Una escena
// solo dice qué "perillas" del mundo están encendidas y qué
// textos se ven.
//
//   0  Portada: los dos lados
//   1  Lado humano
//   2  Lado IA (copias rígidas y genéricas)
//   3  El atajo
//   4  Tomarse el trabajo (rescate con el mouse)
//   5  Final A: nadie ayuda
//   6  Final B: alguien ayuda (pasar el cursor)
//   7  La pregunta y la respuesta

import { LEYENDAS, PREGUNTA, RESPUESTA, PAUSA_RESPUESTA } from './guion.js';

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
  constructor(mundo) {
    this.m = mundo;
    this.actual = -1;
    this.t = 0;
    this.temporizador = null;

    $('pregunta').textContent = PREGUNTA;
    $('respuesta').textContent = RESPUESTA;
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

  // Pulsar la misma tecla otra vez.
  repetir(n) {
    if (n === 6) this.m.iniciarBarrido();
  }

  actualizarTextos(n) {
    $('portada').classList.toggle('oculto', n !== 0);
    $('etq-humano').classList.toggle('oculto', n > 5);
    $('etq-ia').classList.toggle('oculto', n > 5);
    $('esfuerzo').classList.toggle('oculto', n !== 4);
    document.body.classList.toggle('unido', n >= 6);

    const ley = LEYENDAS[n];
    const caja = $('leyenda');
    caja.classList.add('oculto');
    setTimeout(() => {
      if (this.actual !== n) return;
      if (ley) {
        $('leyenda-titulo').textContent = ley.titulo;
        $('leyenda-texto').textContent = ley.texto;
        caja.classList.remove('oculto');
      }
    }, 450);

    clearTimeout(this.temporizador);
    $('pregunta').classList.toggle('visible', n === 7);
    $('respuesta').classList.remove('visible');
    if (n === 7) {
      this.temporizador = setTimeout(() => $('respuesta').classList.add('visible'), PAUSA_RESPUESTA * 1000);
    }

    $('contador').textContent = `${n} / ${TOTAL - 1}`;
    $('ayuda').classList.toggle('oculto', n !== 0);
  }

  actualizar(dt, t) {
    this.t = t;
    $('esfuerzo-relleno').style.width = (this.m.esfuerzo * 100).toFixed(1) + '%';
  }
}
