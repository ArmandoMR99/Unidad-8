// Why Bother? — punto de entrada
// Prepara three.js, conecta el teclado y el mouse, y corre el bucle.

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Pincel } from './pincel.js';
import { Mundo } from './mundo.js';
import { Escenas } from './escenas.js';
import { Sonido } from './sonido.js';
import { PISTA_PROPIA } from './guion.js';

const lienzo = document.getElementById('lienzo');
const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const escena = new THREE.Scene();

// Luz para los símbolos 3D: un reflejo suave de estudio, una luz
// principal cálida desde arriba a la izquierda y un contraluz rojo.
escena.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
escena.environmentIntensity = 0.8;
escena.add(new THREE.HemisphereLight(0xfff0e0, 0x300000, 0.6));
const principal = new THREE.DirectionalLight(0xfff4ea, 2.4);
principal.position.set(-40, 60, 120);
escena.add(principal);
const contraluz = new THREE.PointLight(0xff2030, 9000, 400, 1.6);
contraluz.position.set(60, 40, -60);
escena.add(contraluz);

// Cámara en perspectiva mirando de frente: casi todo se ve plano,
// y la profundidad aparece cuando nacen los símbolos 3D.
const FOV = 40;
const camara = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 1, 1000);
const DISTANCIA = 50 / Math.tan(THREE.MathUtils.degToRad(FOV / 2)); // así el alto visible mide 100
camara.position.set(0, 0, DISTANCIA);

const mundo = new Mundo(escena, camara, DISTANCIA);
const sonido = new Sonido(PISTA_PROPIA);
mundo.alNacer = (a, mx) => sonido.nota(a, mx);
mundo.alLlegar = (a, mx) => sonido.clic(a, mx);
const pincel = new Pincel(document.getElementById('tinta'));
const escenas = new Escenas(mundo, sonido, pincel);

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

// Cursor propio
const cursor = document.getElementById('cursor');
window.addEventListener('pointermove', (e) => {
  cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  cursor.classList.add('visible');
});
document.addEventListener('pointerleave', () => cursor.classList.remove('visible'));

// Sonido: el navegador solo lo permite después de una interacción.
const botonSonido = document.getElementById('sonido');
function alternarSonido() {
  if (!sonido.ctx) { sonido.despertar(); return; } // el primer toque solo lo enciende
  botonSonido.classList.toggle('apagado', !sonido.alternar());
}
botonSonido.addEventListener('click', (e) => { e.stopPropagation(); alternarSonido(); });
window.addEventListener('pointerdown', () => sonido.despertar());
// Un clic corto (sin arrastrar) sobre la obra la hace avanzar,
// excepto en los capítulos donde el mouse sirve para jugar.
let inicioClic = null;
lienzo.addEventListener('pointerdown', (e) => {
  moverPuntero(e);
  mundo.puntero.abajo = true;
  lienzo.setPointerCapture(e.pointerId);
  inicioClic = { x: e.clientX, y: e.clientY, t: performance.now() };
});
lienzo.addEventListener('pointerup', (e) => {
  mundo.puntero.abajo = false;
  if (inicioClic && Math.hypot(e.clientX - inicioClic.x, e.clientY - inicioClic.y) < 8 && performance.now() - inicioClic.t < 600) {
    escenas.clic();
  }
  inicioClic = null;
});
lienzo.addEventListener('pointercancel', () => { mundo.puntero.abajo = false; });
lienzo.addEventListener('pointerleave', () => { mundo.puntero.dentro = false; mundo.puntero.abajo = false; });

// ---------- Teclado: la presentación ----------
// Para quien presenta: espacio y flechas avanzan o retroceden,
// los números saltan a un capítulo (0 a 7).
window.addEventListener('keydown', (e) => {
  sonido.despertar();
  if (/^[0-7]$/.test(e.key)) { escenas.ir(Number(e.key)); return; }
  switch (e.key) {
    case 'ArrowRight': case 'PageDown': case ' ':
      e.preventDefault();
      if (escenas.escribiendo) escenas.completar(); else escenas.siguiente();
      break;
    case 'ArrowLeft': case 'PageUp':
      e.preventDefault(); escenas.anterior(); break;
    case 'h': case 'H':
      document.body.classList.toggle('con-ayuda'); break;
    case 's': case 'S':
      alternarSonido(); break;
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
window.obra = { mundo, escenas, sonido, renderer };
