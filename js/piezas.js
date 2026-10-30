// PIEZAS ÚNICAS (los híbridos)
// Cuando un agente vuelve del lado IA con ayuda, se convierte en
// una pieza única en 3D. Cada pieza mezcla las dos formas de
// pensar:
//   - ORDEN (lo que aprendió del lado IA): una ecuación, una simetría.
//   - SINGULARIDAD (lo humano): parámetros que salen de su propia
//     semilla, así que ninguna pieza es igual a otra.
//
// Tipos: flor (curva rosa), copo (simetría de 6 brazos),
// girasol (filotaxis, ángulo áureo) y nota musical.

import * as THREE from 'three';
import { azarConSemilla } from './ruido.js';

// Textura de punto suave, creada una sola vez.
let texturaPunto = null;
function textura() {
  if (texturaPunto) return texturaPunto;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  texturaPunto = new THREE.CanvasTexture(c);
  return texturaPunto;
}

// --- Generadores: devuelven puntos {x,y,z,tono} en un radio ~1 ---

// Flor: curva rosa r = cos(k·θ). k = n/d define cuántos pétalos.
function flor(azar) {
  const opciones = [[2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [3, 2], [5, 2], [7, 3], [5, 3]];
  const [n, d] = opciones[Math.floor(azar() * opciones.length)];
  const k = n / d;
  const recorrido = Math.PI * 2 * d;
  const fase = azar() * Math.PI * 2;
  const ondulacion = 0.03 + azar() * 0.07; // imperfección humana
  const M = 300;
  const pts = [];
  for (let i = 0; i < M; i++) {
    const th = (i / M) * recorrido;
    const r = Math.cos(k * th) * (1 + ondulacion * Math.sin(th * 3 + fase));
    pts.push({
      x: r * Math.cos(th),
      y: r * Math.sin(th),
      z: 0.3 * Math.sin(2 * th + fase) * Math.abs(r), // pétalos que se curvan en 3D
      tono: Math.abs(r),
    });
  }
  for (let i = 0; i < 20; i++) {
    const a = i * 2.39996, r = 0.13 * Math.sqrt(i / 20);
    pts.push({ x: r * Math.cos(a), y: r * Math.sin(a), z: 0.15, tono: 0 });
  }
  return pts;
}

// Copo: seis brazos idénticos (orden), ramas que dependen de la semilla (único).
function copo(azar) {
  const pts = [];
  const giro = azar() * Math.PI;
  const ramas = [];
  const nRamas = 2 + Math.floor(azar() * 3);
  for (let i = 0; i < nRamas; i++) {
    ramas.push({ en: 0.25 + azar() * 0.6, largo: 0.15 + azar() * 0.35, ang: 0.6 + azar() * 0.5 });
  }
  for (let b = 0; b < 6; b++) {
    const a = giro + (b * Math.PI) / 3;
    const ca = Math.cos(a), sa = Math.sin(a);
    for (let i = 0; i <= 24; i++) {
      const r = i / 24;
      pts.push({ x: r * ca, y: r * sa, z: 0.15 * Math.cos(r * 6), tono: r });
    }
    for (const rama of ramas) {
      const ox = rama.en * ca, oy = rama.en * sa;
      for (const signo of [-1, 1]) {
        const ar = a + signo * rama.ang;
        for (let i = 1; i <= 9; i++) {
          const r = (i / 9) * rama.largo * (1 - rama.en * 0.5);
          pts.push({ x: ox + r * Math.cos(ar), y: oy + r * Math.sin(ar), z: 0.1, tono: rama.en + r });
        }
      }
    }
  }
  return pts;
}

// Girasol: filotaxis. Cada semilla gira el ángulo áureo (137.5°).
// Una pequeña desviación propia cambia por completo el patrón.
function girasol(azar) {
  const pts = [];
  const M = 170;
  const desvio = (azar() - 0.5) * 0.006;
  const curva = 0.4 + azar() * 0.4;
  for (let i = 0; i < M; i++) {
    const r = 0.95 * Math.sqrt(i / M);
    const a = i * (2.39996 + desvio);
    pts.push({ x: r * Math.cos(a), y: r * Math.sin(a), z: 0.3 - curva * r * r, tono: r });
  }
  return pts;
}

// Nota musical: corchea o semicorchea doble según la semilla.
function nota(azar) {
  const pts = [];
  const cabeza = (cx, cy) => {
    for (let anillo = 1; anillo <= 4; anillo++) {
      const f = anillo / 4, cantidad = 6 + anillo * 6;
      for (let i = 0; i < cantidad; i++) {
        const a = (i / cantidad) * Math.PI * 2;
        const ex = 0.27 * f * Math.cos(a), ey = 0.18 * f * Math.sin(a);
        const rot = -0.45;
        pts.push({
          x: cx + ex * Math.cos(rot) - ey * Math.sin(rot),
          y: cy + ex * Math.sin(rot) + ey * Math.cos(rot),
          z: 0.12 * (1 - f),
          tono: f * 0.4,
        });
      }
    }
  };
  const linea = (x0, y0, x1, y1, n, z = 0) => {
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push({ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, z: z + 0.1 * Math.sin(t * Math.PI), tono: 0.5 + t * 0.5 });
    }
  };
  const doble = azar() > 0.5;
  if (doble) {
    cabeza(-0.45, -0.6);
    cabeza(0.35, -0.42);
    linea(-0.22, -0.52, -0.22, 0.72, 30);
    linea(0.58, -0.34, 0.58, 0.9, 30);
    linea(-0.22, 0.72, 0.58, 0.9, 24);
    linea(-0.22, 0.56, 0.58, 0.74, 24);
  } else {
    cabeza(-0.25, -0.58);
    linea(0.02, -0.5, 0.02, 0.82, 34);
    for (let i = 0; i <= 26; i++) {
      const t = i / 26;
      pts.push({ x: 0.02 + 0.42 * Math.sin(t * 1.6), y: 0.82 - 0.62 * t, z: 0.2 * t, tono: 1 - t });
    }
  }
  return pts;
}

const GENERADORES = { flor, copo, girasol, nota };

function elegirTipo(azar) {
  const r = azar();
  if (r < 0.36) return 'flor';
  if (r < 0.6) return 'copo';
  if (r < 0.8) return 'girasol';
  return 'nota';
}

// Crea el objeto 3D de la pieza a partir del color y la semilla del agente.
export function crearPieza(color, semilla) {
  const azar = azarConSemilla(semilla);
  const tipo = elegirTipo(azar);
  const pts = GENERADORES[tipo](azar);

  const pos = new Float32Array(pts.length * 3);
  const col = new Float32Array(pts.length * 3);
  const hsl = {};
  color.getHSL(hsl);
  const c = new THREE.Color();
  pts.forEach((p, i) => {
    pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
    // Cada pieza conserva el color del agente, con un leve degradado propio.
    c.setHSL((hsl.h + p.tono * 0.07 + 1) % 1, Math.min(1, hsl.s + 0.05), Math.min(0.85, hsl.l + (1 - p.tono) * 0.18));
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  });

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.62,
    map: textura(),
    vertexColors: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const obj = new THREE.Points(geo, mat);
  obj.userData = {
    tipo,
    giro: (azar() - 0.5) * 0.9, // velocidad de giro propia
    inclinacion: azar() * Math.PI * 2,
  };
  return obj;
}

export function liberarPieza(obj) {
  obj.geometry.dispose();
  obj.material.dispose();
}
