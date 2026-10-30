// BANDA SONORA
// Música original generada en vivo con Web Audio, con sonido japonés:
// una flauta tipo shakuhachi, un koto y tambores taiko, sobre un
// bordón grave. Usa la escala miyako-bushi (re, mi bemol, sol, la,
// si bemol), la de la música tradicional japonesa.
// La mezcla cambia con cada capítulo de la historia:
//
//   el camino     -> shakuhachi y koto, cálidos, a la izquierda
//   la copia      -> aparece una máquina fría y exacta, a la derecha
//   lo cómodo     -> la máquina crece, la flauta se apaga
//   el esfuerzo   -> entra el taiko, como un corazón
//   el silencio   -> solo queda la máquina, y después nada
//   florecer      -> todo vuelve y crece
//   la reflexión  -> calma, y un acorde final
//
// Si en guion.js se define PISTA_PROPIA y el archivo existe, suena
// en el clímax en lugar de la música generada.

const NEGRA_CON_PUNTILLO = 64;                 // pulsos por minuto en 6/8
const CORCHEA = 60 / (NEGRA_CON_PUNTILLO * 3); // duración de una corchea (s)

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

// Melodía original en miyako-bushi. Cada nota: [midi, corcheas].
const FRASE_A = [
  [74, 2], [75, 1], [79, 3],
  [81, 2], [79, 1], [75, 3],
  [74, 1], [75, 1], [79, 1], [81, 2], [82, 1],
  [81, 3], [79, 3],
];
const FRASE_B = [
  [86, 3], [82, 2], [81, 1],
  [79, 2], [81, 1], [75, 3],
  [74, 2], [75, 1], [79, 2], [75, 1],
  [74, 6],
];
const MELODIA = [...FRASE_A, ...FRASE_A, ...FRASE_B, ...FRASE_A];
// Arpegios del koto por compás (16 compases)
const RE = [50, 57, 62, 69], MIB = [51, 58, 63, 67], SOL = [43, 50, 55, 62], SIB = [46, 53, 58, 62];
const A_ACORDES = [RE, MIB, SOL, RE];
const ACORDES = [...A_ACORDES, ...A_ACORDES, SOL, MIB, SIB, RE, ...A_ACORDES];

// Eventos de la melodía por corchea
const MELODIA_POR_PASO = new Map();
{
  let paso = 0;
  for (const [n, d] of MELODIA) { MELODIA_POR_PASO.set(paso, [n, d]); paso += d; }
}
const PASOS_CICLO = 16 * 6;

// Mezcla de cada capítulo (0 a 1 por instrumento)
const MEZCLAS = {
  0: { bordon: 0.35, flauta: 0, arpa: 0, tambor: 0, maquina: 0, oscuro: 0.4 },
  1: { bordon: 0.55, flauta: 0.85, arpa: 0.5, tambor: 0, maquina: 0, oscuro: 0.7 },
  2: { bordon: 0.5, flauta: 0.6, arpa: 0.3, tambor: 0, maquina: 0.55, oscuro: 0.6 },
  3: { bordon: 0.35, flauta: 0.2, arpa: 0.15, tambor: 0, maquina: 0.9, oscuro: 0.35 },
  4: { bordon: 0.55, flauta: 0.5, arpa: 0.45, tambor: 0.8, maquina: 0.6, oscuro: 0.6 },
  5: { bordon: 0.1, flauta: 0, arpa: 0, tambor: 0, maquina: 0.5, oscuro: 0.2 },
  6: { bordon: 0.8, flauta: 1, arpa: 0.85, tambor: 1, maquina: 0, oscuro: 1 },
  7: { bordon: 0.75, flauta: 0.8, arpa: 0.9, tambor: 0.25, maquina: 0, oscuro: 0.9 },
};

export class Sonido {
  constructor(pistaPropia = '') {
    this.ctx = null;
    this.activo = true;
    this.ultimoClic = 0;
    this.capituloActual = 0;
    this.pistaPropia = pistaPropia;
    this.pista = null;
  }

  despertar() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());

    // Cadena final: compresor (para que todo suene unido) y volumen.
    this.salida = ctx.createGain();
    this.salida.gain.value = this.activo ? 0.9 : 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    this.salida.connect(comp).connect(ctx.destination);

    // Reverberación hecha a mano: ruido que se apaga.
    this.reverb = ctx.createConvolver();
    const largo = ctx.sampleRate * 3.2;
    const ir = ctx.createBuffer(2, largo, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < largo; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / largo, 2.6);
    }
    this.reverb.buffer = ir;
    this.envioReverb = ctx.createGain();
    this.envioReverb.gain.value = 0.35;
    this.envioReverb.connect(this.reverb).connect(this.salida);

    // Ruido reutilizable (soplido de la flauta, golpe del tambor)
    this.ruido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const r = this.ruido.getChannelData(0);
    for (let i = 0; i < r.length; i++) r[i] = Math.random() * 2 - 1;

    // Un bus por instrumento, para poder mezclarlos por capítulo.
    this.buses = {};
    for (const nombre of ['bordon', 'flauta', 'arpa', 'tambor', 'maquina', 'efectos']) {
      const g = ctx.createGain();
      g.gain.value = nombre === 'efectos' ? 1 : 0;
      g.connect(this.salida);
      g.connect(this.envioReverb);
      this.buses[nombre] = g;
    }

    this.crearBordon();
    this.paso = 0;
    this.proximo = ctx.currentTime + 0.1;
    this.reloj = setInterval(() => this.programar(), 25);
    this.capitulo(this.capituloActual);
  }

  // Bordón: re y la graves, como una gaita lejana.
  crearBordon() {
    const ctx = this.ctx;
    this.filtroBordon = ctx.createBiquadFilter();
    this.filtroBordon.type = 'lowpass';
    this.filtroBordon.frequency.value = 500;
    this.filtroBordon.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.value = 0.05;
    [38, 45, 50].forEach((n, i) => {
      const o = ctx.createOscillator();
      o.type = i === 2 ? 'triangle' : 'sawtooth';
      o.frequency.value = midi(n);
      o.detune.value = (i - 1) * 4;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.1 + i * 0.07;
      const lg = ctx.createGain();
      lg.gain.value = 3;
      lfo.connect(lg).connect(o.detune);
      lfo.start();
      o.connect(this.filtroBordon);
      o.start();
    });
    this.filtroBordon.connect(g).connect(this.buses.bordon);
  }

  capitulo(n) {
    this.capituloActual = n;
    if (!this.ctx) return;
    const m = MEZCLAS[n] || MEZCLAS[0];
    const t = this.ctx.currentTime;
    const usarPista = this.pista && (n === 6 || n === 7);
    for (const [nombre, v] of Object.entries(m)) {
      if (nombre === 'oscuro') continue;
      const valor = usarPista && nombre !== 'efectos' ? 0 : v;
      this.buses[nombre].gain.setTargetAtTime(valor, t, n === 5 ? 3 : 1.6);
    }
    // "oscuro" cierra o abre el filtro del bordón: más cálido cuanto más alto.
    this.filtroBordon.frequency.setTargetAtTime(250 + m.oscuro * 900, t, 2);
    if (n === 6 || n === 7) this.sonarPista();
    else if (this.pista && n < 6) this.pista.pause();
  }

  async sonarPista() {
    if (!this.pistaPropia) return;
    if (!this.pista) {
      try {
        const r = await fetch(this.pistaPropia, { method: 'HEAD' });
        if (!r.ok) { this.pistaPropia = ''; return; }
      } catch { this.pistaPropia = ''; return; }
      this.pista = new Audio(this.pistaPropia);
      this.pista.loop = false;
      this.pista.volume = 0;
      this.capitulo(this.capituloActual); // silencia la música generada
    }
    this.pista.play().catch(() => {});
    const subir = setInterval(() => {
      if (!this.pista) return clearInterval(subir);
      this.pista.volume = Math.min(this.activo ? 0.85 : 0, this.pista.volume + 0.02);
      if (this.pista.volume >= 0.85 || !this.activo) clearInterval(subir);
    }, 100);
  }

  alternar() {
    this.activo = !this.activo;
    if (this.salida) this.salida.gain.setTargetAtTime(this.activo ? 0.9 : 0, this.ctx.currentTime, 0.1);
    if (this.pista) this.pista.volume = this.activo ? 0.85 : 0;
    return this.activo;
  }

  // Secuenciador: programa las notas un poco antes de que suenen.
  programar() {
    const ctx = this.ctx;
    while (this.proximo < ctx.currentTime + 0.12) {
      this.tocarPaso(this.paso % PASOS_CICLO, this.proximo);
      this.proximo += CORCHEA;
      this.paso++;
    }
  }

  tocarPaso(paso, t) {
    const enCompas = paso % 6;
    const acorde = ACORDES[Math.floor(paso / 6)];

    // Flauta
    const nota = MELODIA_POR_PASO.get(paso);
    if (nota) this.flauta(nota[0], t, nota[1] * CORCHEA);

    // Arpa: arpegio del acorde en cada corchea
    const patron = [0, 1, 2, 3, 2, 1];
    this.arpa(acorde[patron[enCompas]] + (enCompas === 0 ? 0 : 12), t, enCompas === 0 ? 0.11 : 0.06);

    // Bodhrán: fuerte en 1 y 4, suave en 3 y 6
    if (enCompas === 0 || enCompas === 3) this.tambor(t, enCompas === 0 ? 1 : 0.75);
    else if (enCompas === 5 || (enCompas === 2 && Math.random() < 0.5)) this.tambor(t, 0.3);

    // Máquina: exacta, siempre igual, en semicorcheas
    this.maquina(acorde[(paso * 2) % 4] + 24, t);
    this.maquina(acorde[(paso * 2 + 1) % 4] + 24, t + CORCHEA / 2);
  }

  flauta(n, t, dur) {
    const ctx = this.ctx;
    const f = midi(n);
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(f * 0.94, t);
    o.frequency.exponentialRampToValueAtTime(f, t + 0.14); // entra desde abajo, como el shakuhachi
    const o2 = ctx.createOscillator();
    o2.type = 'triangle';
    o2.frequency.value = f * 2;
    const g2 = ctx.createGain();
    g2.gain.value = 0.12;
    // Vibrato que aparece si la nota es larga
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 5.3;
    const lg = ctx.createGain();
    lg.gain.setValueAtTime(0, t);
    lg.gain.linearRampToValueAtTime(f * 0.012, t + Math.min(dur, 0.7));
    lfo.connect(lg).connect(o.frequency);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.11, t + 0.04);
    env.gain.setValueAtTime(0.1, t + dur * 0.8);
    env.gain.linearRampToValueAtTime(0, t + dur + 0.08);
    // Soplido
    const s = ctx.createBufferSource();
    s.buffer = this.ruido;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = f * 1.5;
    bp.Q.value = 1.2;
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.09, t);
    sg.gain.exponentialRampToValueAtTime(0.012, t + 0.25);
    sg.gain.setValueAtTime(0.012, t + dur);
    s.connect(bp).connect(sg).connect(env);
    const pan = ctx.createStereoPanner();
    pan.pan.value = -0.25;
    o.connect(env);
    o2.connect(g2).connect(env);
    env.connect(pan).connect(this.buses.flauta);
    [o, o2, lfo, s].forEach((x) => { x.start(t); x.stop(t + dur + 0.15); });
  }

  arpa(n, t, vol) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(midi(n + 0.35), t);
    o.frequency.exponentialRampToValueAtTime(midi(n), t + 0.05); // la cuerda del koto se asienta
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2600, t);
    lp.frequency.exponentialRampToValueAtTime(420, t + 0.5);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(vol * 0.8, t + 0.003);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
    o.connect(lp).connect(env).connect(this.buses.arpa);
    o.start(t);
    o.stop(t + 1.9);
  }

  tambor(t, fuerza) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(95, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.3);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.45 * fuerza, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    o.connect(g).connect(this.buses.tambor);
    const s = ctx.createBufferSource();
    s.buffer = this.ruido;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 700;
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.09 * fuerza, t);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    s.connect(lp).connect(sg).connect(this.buses.tambor);
    o.start(t); o.stop(t + 0.65);
    s.start(t); s.stop(t + 0.1);
  }

  maquina(n, t) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = midi(n);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 900;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.018, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    const pan = ctx.createStereoPanner();
    pan.pan.value = 0.55;
    o.connect(hp).connect(env).connect(pan).connect(this.buses.maquina);
    o.start(t);
    o.stop(t + 0.08);
  }

  // Cuando un agente vuelve y se vuelve único: una nota de arpa
  // de la escala, elegida por su color, en el lado donde nació.
  nota(agente, mx) {
    if (!this.ctx || !this.activo) return;
    const ctx = this.ctx;
    const hsl = {};
    agente.color.getHSL(hsl);
    const escala = [62, 63, 67, 69, 70, 74, 75, 79, 81, 82, 86];
    const n = escala[Math.floor(hsl.h * escala.length) % escala.length];
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = midi(n);
    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = midi(n + 12);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.07, t + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.max(-1, Math.min(1, agente.x / mx));
    o.connect(env); o2.connect(env);
    env.connect(pan).connect(this.buses.efectos);
    o.start(t); o2.start(t);
    o.stop(t + 2.7); o2.stop(t + 2.7);
  }

  // Cuando un rígido llega a su casilla: un clic seco.
  clic(agente, mx) {
    if (!this.ctx || !this.activo || this.capituloActual >= 6) return;
    const t = this.ctx.currentTime;
    if (t - this.ultimoClic < 0.07) return;
    this.ultimoClic = t;
    const o = this.ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = 1500;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.008, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);
    o.connect(env).connect(this.buses.efectos);
    o.start(t);
    o.stop(t + 0.03);
  }

  // Acorde largo para la respuesta final.
  acorde() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [38, 50, 57, 62, 67, 69].forEach((n, i) => {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = midi(n);
      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.045, t + 1.2 + i * 0.25);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 10);
      o.connect(env).connect(this.buses.efectos);
      o.start(t);
      o.stop(t + 10.2);
    });
  }
}
