// Why Bother? — punto de entrada
// Prepara three.js, conecta el teclado y el mouse, y corre el bucle.

import * as THREE from 'three';
import { Mundo } from './mundo.js';
import { Escenas } from './escenas.js';

const lienzo = document.getElementById('lienzo');
const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);

const escena = new THREE.Scene();

// Cámara en perspectiva mirando de frente: casi todo se ve plano (2D),
// y la profundidad solo aparece cuando algo se vuelve único.
const FOV = 40;
const camara = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 1, 1000);
const DISTANCIA = 50 / Math.tan(THREE.MathUtils.degToRad(FOV / 2)); // así el alto visible mide 100
camara.position.set(0, 0, DISTANCIA);

const mundo = new Mundo(escena, camara, DISTANCIA);
const escenas = new Escenas(mundo);

function redimensionar() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camara.aspect = w / h;
  camara.updateProjectionMatrix();
  mundo.redimensionar(w / h, renderer.domElement.height, FOV);
}
window.addEventListener('resize', redimensionar);
redimensionar();

// ---------- Mouse: de la pantalla al plano z = 0 ----------
const rayo = new THREE.Raycaster();
const plano = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const ndc = new THREE.Vector2();
const punto = new THREE.Vector3();

function moverPuntero(e) {
  ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  rayo.setFromCamera(ndc, camara);
  if (rayo.ray.intersectPlane(plano, punto)) {
    mundo.puntero.x = punto.x;
    mundo.puntero.y = punto.y;
    mundo.puntero.dentro = true;
  }
}
lienzo.addEventListener('pointermove', moverPuntero);
lienzo.addEventListener('pointerdown', (e) => { moverPuntero(e); mundo.puntero.abajo = true; lienzo.setPointerCapture(e.pointerId); });
lienzo.addEventListener('pointerup', () => { mundo.puntero.abajo = false; });
lienzo.addEventListener('pointercancel', () => { mundo.puntero.abajo = false; });
lienzo.addEventListener('pointerleave', () => { mundo.puntero.dentro = false; mundo.puntero.abajo = false; });

// ---------- Teclado: la presentación ----------
// Números 0–7 para saltar a una escena; flechas, espacio y AvPág/RePág
// para los controles de presentación (clickers).
window.addEventListener('keydown', (e) => {
  if (/^[0-7]$/.test(e.key)) { escenas.ir(Number(e.key)); return; }
  switch (e.key) {
    case 'ArrowRight': case 'PageDown': case ' ':
      e.preventDefault(); escenas.siguiente(); break;
    case 'ArrowLeft': case 'PageUp':
      e.preventDefault(); escenas.anterior(); break;
    case 'h': case 'H':
      document.body.classList.toggle('sin-textos'); break;
    case 'r': case 'R':
      escenas.ir(0, true); break;
  }
});

// ---------- Bucle ----------
const reloj = new THREE.Clock();
function cuadro() {
  const dt = Math.min(reloj.getDelta(), 0.05);
  const t = reloj.elapsedTime;
  escenas.actualizar(dt, t);
  mundo.actualizar(dt, t);
  renderer.render(escena, camara);
  requestAnimationFrame(cuadro);
}
cuadro();

// Acceso desde la consola del navegador: obra.mundo.resumen()
window.obra = { mundo, escenas };
