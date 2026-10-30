// Sonido generativo con Web Audio.
// - Fondo: un zumbido grave y suave.
// - Cada vez que un agente vuelve y se vuelve único, suena una nota.
//   La nota sale de su color, así que cada pieza tiene la suya.
// - Cuando un agente rígido llega a su casilla, suena un clic seco.
// El navegador solo deja sonar audio después de que la persona
// toca la página, por eso empieza apagado hasta la primera tecla.

// Escala pentatónica menor: cualquier combinación suena bien junta.
const ESCALA = [0, 3, 5, 7, 10];
const BASE = 220; // la (A3)

export class Sonido {
  constructor() {
    this.ctx = null;
    this.activo = true;
    this.ultimoClic = 0;
  }

  // Se llama en la primera interacción.
  despertar() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.salida = this.ctx.createGain();
    this.salida.gain.value = this.activo ? 1 : 0;

    // Un poco de eco para que las notas respiren.
    const eco = this.ctx.createDelay(1);
    eco.delayTime.value = 0.32;
    const retro = this.ctx.createGain();
    retro.gain.value = 0.32;
    const filtroEco = this.ctx.createBiquadFilter();
    filtroEco.type = 'lowpass';
    filtroEco.frequency.value = 2200;
    eco.connect(filtroEco).connect(retro).connect(eco);
    this.envioEco = this.ctx.createGain();
    this.envioEco.gain.value = 0.5;
    this.envioEco.connect(eco);
    filtroEco.connect(this.salida);
    this.salida.connect(this.ctx.destination);

    // Zumbido de fondo
    this.fondo = this.ctx.createGain();
    this.fondo.gain.value = 0;
    const filtro = this.ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 320;
    [55, 82.4, 110.6].forEach((f) => {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      o.connect(filtro);
      o.start();
    });
    filtro.connect(this.fondo).connect(this.salida);
    this.fondo.gain.linearRampToValueAtTime(0.035, this.ctx.currentTime + 4);
  }

  alternar() {
    this.activo = !this.activo;
    if (this.salida) this.salida.gain.setTargetAtTime(this.activo ? 1 : 0, this.ctx.currentTime, 0.1);
    return this.activo;
  }

  // Panorama izquierda/derecha según la posición en x.
  panear(x, mx) {
    const p = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    if (p) p.pan.value = Math.max(-1, Math.min(1, x / mx));
    return p;
  }

  nota(agente, mx) {
    if (!this.ctx || !this.activo) return;
    const hsl = {};
    agente.color.getHSL(hsl);
    const grado = Math.floor(hsl.h * ESCALA.length * 2);
    const octava = Math.floor(grado / ESCALA.length);
    const f = BASE * Math.pow(2, (ESCALA[grado % ESCALA.length] + 12 * octava) / 12);
    const t = this.ctx.currentTime;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.09, t + 0.015);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
    const pan = this.panear(agente.x, mx);
    [1, 2.01].forEach((mult, i) => {
      const o = this.ctx.createOscillator();
      o.type = i === 0 ? 'triangle' : 'sine';
      o.frequency.value = f * mult;
      o.connect(env);
      o.start(t);
      o.stop(t + 2.3);
    });
    const destino = pan ? env.connect(pan) : env;
    destino.connect(this.salida);
    destino.connect(this.envioEco);
  }

  clic(agente, mx) {
    if (!this.ctx || !this.activo) return;
    const t = this.ctx.currentTime;
    if (t - this.ultimoClic < 0.06) return; // que no se amontonen
    this.ultimoClic = t;
    const o = this.ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = 1400 + Math.random() * 300;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.012, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    const pan = this.panear(agente.x, mx);
    o.connect(env);
    (pan ? env.connect(pan) : env).connect(this.salida);
    o.start(t);
    o.stop(t + 0.04);
  }

  // Un acorde suave para la respuesta final.
  acorde() {
    if (!this.ctx || !this.activo) return;
    const t = this.ctx.currentTime;
    [0, 7, 15, 19].forEach((s, i) => {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = BASE / 2 * Math.pow(2, s / 12);
      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.05, t + 1.5 + i * 0.2);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 9);
      o.connect(env).connect(this.salida);
      env.connect(this.envioEco);
      o.start(t);
      o.stop(t + 9.2);
    });
  }
}
