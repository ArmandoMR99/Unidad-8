// Comportamientos de dirección (steering) de Craig Reynolds.
// Unidades 2, 3 y 6: vectores, fuerzas y agentes autónomos.
//
// Idea central: cada agente calcula una velocidad DESEADA y
// aplica una fuerza = deseada - velocidad actual, limitada por
// su fuerza máxima. Eso es lo que hace que giren con inercia.

import { ruido } from './ruido.js';

export function limitar(x, y, max) {
  const m = Math.hypot(x, y);
  if (m > max && m > 0) return [(x / m) * max, (y / m) * max];
  return [x, y];
}

// Fuerza de dirección hacia una dirección (dx, dy).
export function dirigir(a, dx, dy, vmax, fmax) {
  const m = Math.hypot(dx, dy);
  if (m === 0) return [0, 0];
  return limitar((dx / m) * vmax - a.vx, (dy / m) * vmax - a.vy, fmax);
}

// Bandada (flocking): separación + alineación + cohesión.
// P = { rSep, rVec, vmax, fmax, wSep, wAli, wCoh }
export function bandada(a, grupo, P) {
  let sx = 0, sy = 0, sn = 0;
  let ax = 0, ay = 0, cx = 0, cy = 0, n = 0;
  const rSep2 = P.rSep * P.rSep;
  const rVec2 = P.rVec * P.rVec;

  for (let i = 0; i < grupo.length; i++) {
    const b = grupo[i];
    if (b === a) continue;
    const dx = a.x - b.x, dy = a.y - b.y;
    const d2 = dx * dx + dy * dy;
    if (d2 > rVec2) continue;
    if (d2 < rSep2 && d2 > 0.0001) {
      const d = Math.sqrt(d2);
      sx += dx / d / d; // más cerca = empuja más
      sy += dy / d / d;
      sn++;
    }
    ax += b.vx; ay += b.vy;
    cx += b.x; cy += b.y;
    n++;
  }

  if (sn > 0) {
    const [fx, fy] = dirigir(a, sx, sy, P.vmax, P.fmax);
    a.fuerza(fx * P.wSep, fy * P.wSep);
  }
  if (n > 0) {
    const [fx, fy] = dirigir(a, ax, ay, P.vmax, P.fmax);
    a.fuerza(fx * P.wAli, fy * P.wAli);
    const [gx, gy] = dirigir(a, cx / n - a.x, cy / n - a.y, P.vmax, P.fmax);
    a.fuerza(gx * P.wCoh, gy * P.wCoh);
  }
}

// Deambular guiado por ruido de Perlin: la "curiosidad".
export function deambular(a, t, P) {
  const ang = ruido(a.x * 0.03, a.y * 0.03, t * 0.15 + a.semilla) * Math.PI * 2.4;
  const [fx, fy] = dirigir(a, Math.cos(ang), Math.sin(ang), P.vmax, P.fmax);
  a.fuerza(fx * P.wDea, fy * P.wDea);
}

// Paredes suaves: cuanto más cerca del borde, más fuerte el giro.
export function paredes(a, xmin, xmax, ymin, ymax, margen, fuerza) {
  if (a.x < xmin + margen) a.fuerza(fuerza * (1 - (a.x - xmin) / margen), 0);
  if (a.x > xmax - margen) a.fuerza(-fuerza * (1 - (xmax - a.x) / margen), 0);
  if (a.y < ymin + margen) a.fuerza(0, fuerza * (1 - (a.y - ymin) / margen));
  if (a.y > ymax - margen) a.fuerza(0, -fuerza * (1 - (ymax - a.y) / margen));
  // Límite duro por si la fuerza no alcanza.
  a.x = Math.min(Math.max(a.x, xmin), xmax);
  a.y = Math.min(Math.max(a.y, ymin), ymax);
}

// Integración de Euler: aceleración -> velocidad -> posición.
export function integrar(a, vmax, k) {
  a.vx += a.ax * k;
  a.vy += a.ay * k;
  [a.vx, a.vy] = limitar(a.vx, a.vy, vmax);
  a.x += a.vx * k;
  a.y += a.vy * k;
  a.ax = 0;
  a.ay = 0;
}

// Movimiento rígido del lado IA: sin fuerzas, sin inercia.
// Primero en x, luego en y, a velocidad constante (como un plotter).
export function moverManhattan(a, tx, ty, paso) {
  const dx = tx - a.x;
  if (Math.abs(dx) > paso) {
    a.x += Math.sign(dx) * paso;
    return false;
  }
  a.x = tx;
  const dy = ty - a.y;
  if (Math.abs(dy) > paso) {
    a.y += Math.sign(dy) * paso;
    return false;
  }
  a.y = ty;
  return true; // llegó
}
