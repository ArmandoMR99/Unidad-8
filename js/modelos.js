// SÍMBOLOS 3D
// Lo que aparece cuando alguien se toma el trabajo: cosas que me
// representan y que se pueden lograr con ayuda de la IA.
//
//   balón y aro de básquet · control de videojuego · katana ·
//   manga abierto · pincel de shodō
//
// Cada modelo se construye con geometrías de three.js (esferas,
// toros, cilindros, extrusiones, tornos) y se agrupa por material.
// Para que 320 objetos no pongan lento el navegador se usan
// InstancedMesh: un solo dibujo por cada combinación de modelo y
// material, y cada agente es una "instancia" con su propia posición.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const { PI } = Math;

// ---------- Utilidades ----------
function poner(g, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    new THREE.Vector3(sx, sy, sz),
  );
  return g.applyMatrix4(m);
}

// Deja todas las geometrías con los mismos atributos para poder unirlas.
function preparar(g) {
  let r = g.index ? g.toNonIndexed() : g;
  for (const nombre of Object.keys(r.attributes)) {
    if (!['position', 'normal', 'uv'].includes(nombre)) r.deleteAttribute(nombre);
  }
  if (!r.attributes.normal) r.computeVertexNormals();
  if (!r.attributes.uv) r.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(r.attributes.position.count * 2), 2));
  return r;
}

// Un cilindro que va de un punto a otro (para la red del aro).
function barra(a, b, radio) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const g = new THREE.CylinderGeometry(radio, radio, dir.length(), 4, 1);
  g.applyMatrix4(new THREE.Matrix4().makeTranslation(0, dir.length() / 2, 0));
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));
  g.applyMatrix4(new THREE.Matrix4().makeTranslation(a.x, a.y, a.z));
  return g;
}

// ---------- Modelos ----------
// Cada uno devuelve { material: [geometrías] }, centrado y de radio ~1.

function balon() {
  const negro = [
    poner(new THREE.TorusGeometry(0.902, 0.024, 6, 80), 0, 0, 0, PI / 2),
    new THREE.TorusGeometry(0.902, 0.024, 6, 80),
    poner(new THREE.TorusGeometry(0.71, 0.024, 6, 64), 0.555, 0, 0, 0, PI / 2),
    poner(new THREE.TorusGeometry(0.71, 0.024, 6, 64), -0.555, 0, 0, 0, PI / 2),
  ];
  return { rojo: [new THREE.SphereGeometry(0.9, 40, 28)], negro };
}

function control() {
  const s = new THREE.Shape();
  s.moveTo(-0.5, 0.38);
  s.lineTo(0.5, 0.38);
  s.bezierCurveTo(0.85, 0.38, 1.0, 0.2, 1.0, -0.05);
  s.bezierCurveTo(1.0, -0.45, 0.9, -0.72, 0.68, -0.72);
  s.bezierCurveTo(0.5, -0.72, 0.42, -0.45, 0.3, -0.3);
  s.lineTo(-0.3, -0.3);
  s.bezierCurveTo(-0.42, -0.45, -0.5, -0.72, -0.68, -0.72);
  s.bezierCurveTo(-0.9, -0.72, -1.0, -0.45, -1.0, -0.05);
  s.bezierCurveTo(-1.0, 0.2, -0.85, 0.38, -0.5, 0.38);
  const cuerpo = new THREE.ExtrudeGeometry(s, {
    depth: 0.2, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 3, curveSegments: 16,
  });
  poner(cuerpo, 0, 0, -0.1);
  const z = 0.2;
  const hueso = [
    poner(new THREE.BoxGeometry(0.27, 0.085, 0.06), -0.6, 0.04, z),
    poner(new THREE.BoxGeometry(0.085, 0.27, 0.06), -0.6, 0.04, z),
    poner(new THREE.BoxGeometry(0.1, 0.035, 0.03), -0.1, 0.2, z),
    poner(new THREE.BoxGeometry(0.1, 0.035, 0.03), 0.1, 0.2, z),
  ];
  const rojo = [];
  for (const [dx, dy] of [[0.12, 0], [-0.12, 0], [0, 0.12], [0, -0.12]]) {
    rojo.push(poner(new THREE.CylinderGeometry(0.055, 0.055, 0.07, 12), 0.6 + dx, 0.04 + dy, z, PI / 2));
  }
  const metal = [];
  for (const x of [-0.27, 0.27]) {
    metal.push(poner(new THREE.CylinderGeometry(0.11, 0.12, 0.05, 28), x, -0.2, z - 0.01, PI / 2));
    rojo.push(poner(new THREE.CylinderGeometry(0.085, 0.08, 0.08, 28), x, -0.2, z + 0.05, PI / 2));
  }
  rojo.push(poner(new THREE.BoxGeometry(0.36, 0.1, 0.18), -0.6, 0.43, -0.02));
  rojo.push(poner(new THREE.BoxGeometry(0.36, 0.1, 0.18), 0.6, 0.43, -0.02));
  const todo = { negro: [cuerpo], hueso, rojo, metal };
  for (const k in todo) todo[k].forEach((g) => poner(g, 0, 0.15, 0, 0, 0, 0, 0.9));
  return todo;
}

function katana() {
  // Hoja curva: un contorno extruido muy delgado.
  const L = 1.5;
  const curva = (y) => 0.06 * Math.pow(y / L, 2);
  const hoja = new THREE.Shape();
  hoja.moveTo(curva(0) - 0.048, 0);
  for (let i = 1; i <= 20; i++) { const y = (i / 20) * L; hoja.lineTo(curva(y) - 0.048, y); }
  hoja.quadraticCurveTo(curva(L) - 0.04, L + 0.1, curva(L) + 0.048, L + 0.15); // kissaki
  for (let i = 20; i >= 0; i--) { const y = (i / 20) * L; hoja.lineTo(curva(y) + 0.048, y); }
  const geoHoja = new THREE.ExtrudeGeometry(hoja, {
    depth: 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 6,
  });
  poner(geoHoja, 0, 0, -0.006);
  const metal = [geoHoja, poner(new THREE.CylinderGeometry(0.05, 0.05, 0.035, 20), 0, -0.86, 0)];
  const hueso = [poner(new THREE.BoxGeometry(0.085, 0.07, 0.04), 0.002, -0.02, 0)];
  const negro = [
    poner(new THREE.CylinderGeometry(0.13, 0.13, 0.03, 40), 0, -0.07, 0),
    poner(new THREE.CylinderGeometry(0.046, 0.05, 0.6, 18), 0, -0.4, 0),
  ];
  // El tsuka-ito: rombos rojos envolviendo el mango
  const rojo = [];
  for (let i = 0; i < 7; i++) {
    const y = -0.14 - i * 0.075;
    rojo.push(poner(new THREE.BoxGeometry(0.055, 0.055, 0.02), 0, y, 0.044, 0, 0, PI / 4));
    rojo.push(poner(new THREE.BoxGeometry(0.055, 0.055, 0.02), 0, y, -0.044, 0, 0, PI / 4));
  }
  const todo = { metal, hueso, negro, rojo };
  for (const k in todo) todo[k].forEach((g) => { poner(g, 0, -0.28, 0); poner(g, 0, 0, 0, 0, 0, -0.62, 1.05); });
  return todo;
}

// Textura de las páginas del manga: viñetas, líneas de velocidad y globos.
function texturaManga() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 704;
  const g = c.getContext('2d');
  g.fillStyle = '#efe7d8';
  g.fillRect(0, 0, 1024, 704);
  g.strokeStyle = '#111';
  g.lineWidth = 7;
  const panel = (x, y, w, h) => g.strokeRect(x, y, w, h);
  // Página izquierda
  panel(40, 40, 432, 250); panel(40, 310, 200, 354); panel(260, 310, 212, 354);
  // Página derecha
  panel(552, 40, 432, 400); panel(552, 460, 432, 204);
  // Líneas de velocidad hacia un centro (acción)
  g.save();
  g.beginPath(); g.rect(552, 40, 432, 400); g.clip();
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * PI * 2;
    g.strokeStyle = i % 3 === 0 ? '#b3121f' : '#222';
    g.lineWidth = 1 + (i % 4);
    g.beginPath();
    g.moveTo(768 + Math.cos(a) * 60, 240 + Math.sin(a) * 60);
    g.lineTo(768 + Math.cos(a) * 420, 240 + Math.sin(a) * 420);
    g.stroke();
  }
  g.restore();
  // Sol rojo y silueta
  g.fillStyle = '#b3121f';
  g.beginPath(); g.arc(256, 165, 70, 0, PI * 2); g.fill();
  g.fillStyle = '#111';
  g.fillRect(40, 230, 432, 60);
  g.beginPath(); g.moveTo(200, 230); g.lineTo(250, 150); g.lineTo(300, 230); g.fill();
  // Globos de diálogo
  g.fillStyle = '#fff'; g.lineWidth = 4; g.strokeStyle = '#111';
  for (const [x, y, rx, ry] of [[140, 400, 70, 40], [370, 560, 70, 46], [690, 540, 90, 50], [880, 610, 70, 34]]) {
    g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#111';
    for (let l = 0; l < 2; l++) g.fillRect(x - rx * 0.55, y - 10 + l * 16, rx * 1.1 * (l ? 0.7 : 1), 5);
    g.fillStyle = '#fff';
  }
  // Ojos grandes en una viñeta (rasgo del anime)
  g.fillStyle = '#111';
  g.beginPath(); g.ellipse(110, 520, 30, 40, 0, 0, PI * 2); g.fill();
  g.beginPath(); g.ellipse(180, 520, 30, 40, 0, 0, PI * 2); g.fill();
  g.fillStyle = '#fff';
  g.beginPath(); g.arc(120, 505, 9, 0, PI * 2); g.fill();
  g.beginPath(); g.arc(190, 505, 9, 0, PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function manga() {
  const pagina = (lado) => {
    const g = new THREE.PlaneGeometry(0.8, 1.08, 14, 1);
    const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i); // -0.4 .. 0.4
      const t = (x + 0.4) / 0.8; // 0 en el borde exterior de la izquierda
      const desdeLomo = lado < 0 ? 1 - t : t;
      p.setX(i, x + lado * 0.42);
      p.setZ(i, 0.06 + 0.07 * Math.sin(PI * desdeLomo) * (1 - desdeLomo * 0.4));
      uv.setX(i, uv.getX(i) * 0.5 + (lado < 0 ? 0 : 0.5));
    }
    g.computeVertexNormals();
    return g;
  };
  const rojo = [
    poner(new THREE.BoxGeometry(0.86, 1.16, 0.04), -0.43, 0, -0.03, 0, 0.1),
    poner(new THREE.BoxGeometry(0.86, 1.16, 0.04), 0.43, 0, -0.03, 0, -0.1),
  ];
  const hueso = [
    poner(new THREE.BoxGeometry(0.8, 1.1, 0.05), -0.41, 0, 0.005, 0, 0.1),
    poner(new THREE.BoxGeometry(0.8, 1.1, 0.05), 0.41, 0, 0.005, 0, -0.1),
  ];
  const paginas = [pagina(-1), pagina(1)];
  return { rojo, hueso, pagina: paginas };
}

function aro() {
  const hueso = [poner(new THREE.BoxGeometry(1.3, 0.85, 0.05), 0, 0.42, -0.02)];
  const negro = [poner(new THREE.BoxGeometry(1.36, 0.91, 0.03), 0, 0.42, -0.05)];
  const rojo = [
    poner(new THREE.BoxGeometry(0.44, 0.03, 0.02), 0, 0.4, 0.015),
    poner(new THREE.BoxGeometry(0.44, 0.03, 0.02), 0, 0.12, 0.015),
    poner(new THREE.BoxGeometry(0.03, 0.31, 0.02), -0.205, 0.26, 0.015),
    poner(new THREE.BoxGeometry(0.03, 0.31, 0.02), 0.205, 0.26, 0.015),
    poner(new THREE.TorusGeometry(0.29, 0.024, 8, 40), 0, 0.06, 0.38, PI / 2),
  ];
  const metal = [poner(new THREE.BoxGeometry(0.1, 0.06, 0.12), 0, 0.06, 0.06)];
  // La red: hilos cruzados del aro hacia abajo
  const n = 14;
  for (let i = 0; i < n; i++) {
    for (const giro of [1, -1]) {
      const a0 = (i / n) * PI * 2, a1 = a0 + giro * (PI / n) * 1.5;
      const p0 = new THREE.Vector3(Math.cos(a0) * 0.28, 0.05, 0.38 + Math.sin(a0) * 0.28);
      const p1 = new THREE.Vector3(Math.cos(a1) * 0.17, -0.42, 0.38 + Math.sin(a1) * 0.17);
      hueso.push(barra(p0, p1, 0.007));
    }
  }
  hueso.push(poner(new THREE.TorusGeometry(0.225, 0.008, 6, 40), 0, -0.18, 0.38, PI / 2));
  hueso.push(poner(new THREE.TorusGeometry(0.17, 0.008, 6, 40), 0, -0.42, 0.38, PI / 2));
  const todo = { negro, rojo, metal, hueso };
  for (const k in todo) todo[k].forEach((g) => poner(g, 0, 0, -0.18, 0, -0.35, 0, 1.15));
  return todo;
}

function pincel() {
  const perfil = (puntos) => puntos.map(([x, y]) => new THREE.Vector2(x, y));
  const negro = [
    poner(new THREE.CylinderGeometry(0.085, 0.08, 0.16, 28), 0, -0.44, 0),
    poner(new THREE.CylinderGeometry(0.08, 0.08, 0.07, 28), 0, 0.93, 0),
  ];
  const rojo = [
    poner(new THREE.CylinderGeometry(0.07, 0.078, 1.28, 28), 0, 0.26, 0),
    // la punta mojada en tinta roja
    new THREE.LatheGeometry(perfil([[0.0, -1.12], [0.03, -1.05], [0.06, -0.95], [0.075, -0.88], [0.001, -0.88]]), 18),
  ];
  const hueso = [
    // cerdas
    new THREE.LatheGeometry(perfil([[0.001, -0.9], [0.075, -0.88], [0.1, -0.74], [0.095, -0.58], [0.08, -0.52]]), 18),
    poner(new THREE.TorusGeometry(0.06, 0.012, 8, 24), 0, 1.01, 0),
  ];
  const todo = { negro, rojo, hueso };
  for (const k in todo) todo[k].forEach((g) => poner(g, 0, 0.06, 0, 0, 0, 0.55, 1.0));
  return todo;
}

const CONSTRUCTORES = { balon, control, katana, manga, aro, pincel };
export const TIPOS = Object.keys(CONSTRUCTORES);

// ---------- Materiales ----------
function materiales() {
  return {
    rojo: new THREE.MeshStandardMaterial({ color: 0xc8102e, roughness: 0.38, metalness: 0.05 }),
    negro: new THREE.MeshStandardMaterial({ color: 0x1b1515, roughness: 0.42, metalness: 0.25 }),
    hueso: new THREE.MeshStandardMaterial({ color: 0xece3d4, roughness: 0.6 }),
    metal: new THREE.MeshStandardMaterial({ color: 0xe8eaee, roughness: 0.28, metalness: 0.85, emissive: 0x222226 }),
    pagina: new THREE.MeshStandardMaterial({ map: texturaManga(), roughness: 0.85, side: THREE.DoubleSide }),
  };
}

// ---------- Todos los símbolos, instanciados ----------
export class Simbolos {
  constructor(escena, capacidad) {
    this.mallas = {}; // tipo -> [InstancedMesh]
    const mats = materiales();
    for (const tipo of TIPOS) {
      const partes = CONSTRUCTORES[tipo]();
      this.mallas[tipo] = [];
      for (const [mat, geos] of Object.entries(partes)) {
        const geo = mergeGeometries(geos.map(preparar));
        const malla = new THREE.InstancedMesh(geo, mats[mat], capacidad);
        malla.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        malla.count = 0;
        malla.frustumCulled = false;
        escena.add(malla);
        this.mallas[tipo].push(malla);
      }
    }
    this.m = new THREE.Matrix4();
    this.q = new THREE.Quaternion();
    this.e = new THREE.Euler();
    this.p = new THREE.Vector3();
    this.s = new THREE.Vector3();
    this.cuenta = {};
    this.empezarCuadro();
  }

  tipoDe(semilla) { return TIPOS[Math.floor(semilla * 7.31) % TIPOS.length]; }

  // Cada cuadro se vuelven a poner todos los símbolos visibles, uno
  // detrás de otro. Así solo se dibujan los que existen en ese momento.
  colocar(id, tipo, x, y, z, rx, ry, rz, escala) {
    if (escala < 0.002) return;
    this.p.set(x, y, z);
    this.q.setFromEuler(this.e.set(rx, ry, rz));
    this.s.setScalar(escala);
    this.m.compose(this.p, this.q, this.s);
    const i = this.cuenta[tipo]++;
    for (const malla of this.mallas[tipo]) malla.setMatrixAt(i, this.m);
  }

  empezarCuadro() { for (const tipo of TIPOS) this.cuenta[tipo] = 0; }

  // Los símbolos que no se vuelven a poner simplemente no se dibujan.
  esconder() {}
  esconderTodo() { this.empezarCuadro(); this.actualizar(); }

  actualizar() {
    for (const tipo of TIPOS) for (const malla of this.mallas[tipo]) {
      malla.count = this.cuenta[tipo];
      malla.instanceMatrix.needsUpdate = true;
    }
  }
}

// Para revisar cuántos triángulos tiene cada modelo (desde la consola).
export function contarTriangulos(simbolos) {
  const r = {};
  for (const tipo of TIPOS) r[tipo] = simbolos.mallas[tipo].reduce((s, m) => s + m.geometry.attributes.position.count / 3, 0);
  return r;
}
