// PINCEL
// Trazos de shodō pintados sobre un lienzo 2D encima de la escena.
// Un trazo es un camino; a lo largo de él se "estampan" muchas cerdas.
// Cada cerda tiene su propia cantidad de tinta: cuando se le acaba,
// deja huecos (el efecto de pincel seco, kasure). El ancho sube al
// apoyar el pincel y se afina al levantarlo.

import { ruido } from './ruido.js';

export class Pincel {
  constructor(lienzo) {
    this.lienzo = lienzo;
    this.ctx = lienzo.getContext('2d');
    this.trazos = [];
    this.redimensionar();
    window.addEventListener('resize', () => this.redimensionar());
  }

  redimensionar() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.lienzo.width = this.w * this.dpr;
    this.lienzo.height = this.h * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  limpiar() {
    this.trazos = [];
    this.ctx.clearRect(0, 0, this.w, this.h);
  }

  // puntos: [[x, y], ...] en píxeles
  trazar(puntos, { color = '#c8102e', ancho = 40, duracion = 1.2, seco = 0.55, retraso = 0, salpicar = true } = {}) {
    // Re-muestrear el camino a pasos de ~1.5 px
    const camino = [];
    for (let i = 0; i < puntos.length - 1; i++) {
      const [x0, y0] = puntos[i], [x1, y1] = puntos[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 1.5));
      for (let j = 0; j < n; j++) camino.push([x0 + ((x1 - x0) * j) / n, y0 + ((y1 - y0) * j) / n]);
    }
    camino.push(puntos[puntos.length - 1]);
    const K = Math.max(10, Math.round(ancho * 0.9));
    const cerdas = Array.from({ length: K }, (_, k) => ({
      o: (k / (K - 1) - 0.5) + (Math.random() - 0.5) * 0.04,
      tinta: 0.55 + Math.random() * 0.45,
      r: 0.6 + Math.random() * 0.8,
    }));
    this.trazos.push({
      camino, cerdas, color, ancho, duracion, seco, salpicar,
      inicio: performance.now() / 1000 + retraso, hecho: 0, semilla: Math.random() * 100,
    });
  }

  // Ensō: el círculo zen, pintado de un solo trazo que no se cierra.
  enso(cx, cy, r, opciones = {}) {
    const inicio = -Math.PI * 0.62 + (Math.random() - 0.5) * 0.2;
    const vuelta = Math.PI * 2 * 0.93;
    const puntos = [];
    for (let i = 0; i <= 160; i++) {
      const t = i / 160;
      const a = inicio + t * vuelta;
      const rr = r * (1 + 0.035 * ruido(t * 3, 7.3) + 0.02 * t);
      puntos.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    this.trazar(puntos, { ancho: r * 0.16, duracion: 2.2, seco: 0.7, ...opciones });
  }

  // Un trazo horizontal ancho, como para enmarcar un título.
  barrido(cy, opciones = {}) {
    const x0 = this.w * (0.18 + Math.random() * 0.04), x1 = this.w * (0.82 - Math.random() * 0.04);
    const puntos = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      puntos.push([x0 + (x1 - x0) * t, cy + Math.sin(t * Math.PI * 1.2) * 10 - t * 8]);
    }
    this.trazar(puntos, { ancho: Math.min(130, this.h * 0.14), duracion: 0.9, seco: 0.8, ...opciones });
  }

  // Una gota de tinta que cae y se abre.
  gota(x, y, r, color = '#c8102e') {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const rr = r * (1 + 0.18 * ruido(Math.cos(a) * 2 + x, Math.sin(a) * 2 + y));
      if (i) ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else ctx.moveTo(x + rr, y);
    }
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  actualizar() {
    const ahora = performance.now() / 1000;
    const ctx = this.ctx;
    for (const tr of this.trazos) {
      const t = (ahora - tr.inicio) / tr.duracion;
      if (t < 0) continue;
      const hasta = Math.min(tr.camino.length, Math.floor(tr.camino.length * Math.min(1, t)));
      const n = tr.camino.length;
      ctx.fillStyle = tr.color;
      for (let i = tr.hecho; i < hasta; i++) {
        const f = i / n;
        // presión: apoyar, sostener, levantar
        const presion = Math.min(1, f / 0.08) * (1 - Math.pow(Math.max(0, (f - 0.7) / 0.3), 1.6) * 0.85);
        const w = tr.ancho * (0.25 + 0.75 * presion) * (1 + 0.12 * ruido(f * 6, tr.semilla));
        const [x, y] = tr.camino[i];
        const [xa, ya] = tr.camino[Math.max(0, i - 1)];
        let nx = -(y - ya), ny = x - xa;
        const nl = Math.hypot(nx, ny) || 1;
        nx /= nl; ny /= nl;
        for (const c of tr.cerdas) {
          // las cerdas de los bordes se secan antes
          const seca = f * tr.seco * (1 + Math.abs(c.o) * 1.6);
          if (c.tinta - seca < Math.random() * 0.35) continue;
          ctx.globalAlpha = 0.18 + 0.3 * Math.min(1, c.tinta - seca + 0.3);
          const px = x + nx * c.o * w, py = y + ny * c.o * w;
          const rr = (w / tr.cerdas.length) * c.r * 1.4 + 0.4;
          ctx.fillRect(px - rr, py - rr, rr * 2, rr * 2);
        }
      }
      if (hasta >= n && tr.hecho < n && tr.salpicar) {
        // salpicaduras al levantar el pincel
        const [x, y] = tr.camino[n - 1];
        for (let s = 0; s < 6; s++) {
          ctx.globalAlpha = 0.7;
          const d = tr.ancho * (0.4 + Math.random());
          const a = Math.random() * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, Math.random() * 2.5 + 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      tr.hecho = hasta;
    }
    ctx.globalAlpha = 1;
    this.trazos = this.trazos.filter((tr) => tr.hecho < tr.camino.length);
  }
}
