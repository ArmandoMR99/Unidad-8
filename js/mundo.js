// EL MUNDO
// Contiene a los agentes, sus copias del lado IA, las piezas únicas
// y todo lo que se dibuja. Las escenas (escenas.js) solo cambian
// "perillas" de este mundo; las reglas viven aquí.
//
// Coordenadas: el alto visible del mundo mide 100 unidades
// (y de -50 a 50). El ancho depende de la pantalla.
// La frontera entre los dos lados está en x = 0.

import * as THREE from 'three';
import { bandada, deambular, paredes, integrar, moverManhattan } from './comportamientos.js';
import { crearPieza, liberarPieza } from './piezas.js';
import { ruido } from './ruido.js';

export const HUMANO = 'humano';
export const RIGIDO = 'rigido';
export const HIBRIDO = 'hibrido';

const N = 320;          // cantidad de agentes
const RASTRO = 18;      // largo de la estela de los humanos
const CASILLA = 3.4;    // tamaño de la cuadrícula del lado IA

// Parámetros de cada forma de moverse
const P_HUMANO = { rSep: 3.2, rVec: 8, vmax: 0.5, fmax: 0.028, wSep: 1.7, wAli: 0.9, wCoh: 0.75, wDea: 0.7 };
const P_HIBRIDO = { rSep: 7, rVec: 12, vmax: 0.2, fmax: 0.01, wSep: 1.8, wAli: 0.4, wCoh: 0.25, wDea: 0.8 };

// ---------- Agente ----------
class Agente {
  constructor(id, color) {
    this.id = id;
    this.color = color;
    this.semilla = Math.random() * 1000;
    this.resistencia = 0.5 + Math.random() * 1.0; // qué tanto le cuesta ceder al atajo
    this.momento = Math.random();                 // cuándo empieza a sentir la tentación
    this.reiniciar(0, 0);
  }
  reiniciar(x, y) {
    this.x = x; this.y = y; this.z = 0;
    const a = Math.random() * Math.PI * 2;
    this.vx = Math.cos(a) * 0.3; this.vy = Math.sin(a) * 0.3;
    this.ax = 0; this.ay = 0;
    this.estado = HUMANO;
    this.alpha = 0;
    this.tx = 0; this.ty = 0; this.clave = null; // casilla en el lado IA
    this.agarrado = false;
    this.pieza = null;
    this.nace = 0;
    this.rastro = [];
  }
  fuerza(fx, fy) { this.ax += fx; this.ay += fy; }
}

// ---------- Shader de los puntos ----------
// Forma 0 = círculo suave (humano). Forma 1 = cuadrado nítido (IA).
const VERTEX = /* glsl */`
  attribute vec3 aColor;
  attribute float aAlpha;
  attribute float aSize;
  attribute float aShape;
  uniform float uEscala;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vShape;
  void main() {
    vColor = aColor; vAlpha = aAlpha; vShape = aShape;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uEscala / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;
const FRAGMENT = /* glsl */`
  varying vec3 vColor;
  varying float vAlpha;
  varying float vShape;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    vec4 c;
    if (vShape < 0.5) {
      float d = length(p);
      float a = pow(smoothstep(0.5, 0.0, d), 1.5);
      vec3 col = mix(vColor, vec3(1.0), smoothstep(0.16, 0.0, d) * 0.4);
      c = vec4(col, a * vAlpha);
    } else {
      float m = max(abs(p.x), abs(p.y));
      float dentro = step(m, 0.34);
      float borde = step(0.25, m) * dentro;
      c = vec4(mix(vColor * 0.78, vColor, borde), dentro * vAlpha);
    }
    if (c.a < 0.01) discard;
    gl_FragColor = c;
  }
`;

export class Mundo {
  constructor(escena, camara, distancia) {
    this.escena = escena;
    this.camara = camara;
    this.distancia = distancia;
    this.my = 50;
    this.mx = 80;

    // Colores: cada agente tiene el suyo y lo conserva siempre.
    this.agentes = [];
    for (let i = 0; i < N; i++) {
      const c = new THREE.Color().setHSL(Math.random(), 0.62 + Math.random() * 0.25, 0.58 + Math.random() * 0.1);
      this.agentes.push(new Agente(i, c));
    }
    // Orden por tono: se usa para el jardín y la órbita (degradado de color).
    this.ordenTono = new Array(N);
    [...this.agentes]
      .sort((a, b) => a.color.getHSL({}).h - b.color.getHSL({}).h)
      .forEach((a, i) => { this.ordenTono[a.id] = i; });

    this.copias = new Array(N).fill(null);
    this.casillas = new Map();
    this.piezasMuriendo = [];
    this.puntero = { x: 0, y: 0, abajo: false, dentro: false };
    // Avisos para el sonido: cuando nace una pieza y cuando un rígido llega a su casilla.
    this.alNacer = null;
    this.alLlegar = null;

    this.crearGraficos();
    this.reiniciar();
  }

  // ---------- Gráficos ----------
  crearGraficos() {
    const total = N * 2; // agentes + sus copias
    const g = new THREE.BufferGeometry();
    this.bPos = new Float32Array(total * 3);
    this.bCol = new Float32Array(total * 3);
    this.bAlpha = new Float32Array(total);
    this.bSize = new Float32Array(total);
    this.bShape = new Float32Array(total);
    g.setAttribute('position', new THREE.BufferAttribute(this.bPos, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(this.bCol, 3));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(this.bAlpha, 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.bSize, 1));
    g.setAttribute('aShape', new THREE.BufferAttribute(this.bShape, 1));
    this.matPuntos = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms: { uEscala: { value: 500 } },
      transparent: true,
      depthWrite: false,
    });
    this.puntos = new THREE.Points(g, this.matPuntos);
    this.puntos.frustumCulled = false;
    this.puntos.renderOrder = 2;
    this.escena.add(this.puntos);

    // Estelas de los humanos: segmentos con color RGBA (se desvanecen).
    const segs = N * (RASTRO - 1) * 2;
    const gr = new THREE.BufferGeometry();
    this.rPos = new Float32Array(segs * 3);
    this.rCol = new Float32Array(segs * 4);
    gr.setAttribute('position', new THREE.BufferAttribute(this.rPos, 3));
    gr.setAttribute('color', new THREE.BufferAttribute(this.rCol, 4));
    this.rastros = new THREE.LineSegments(gr, new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    this.rastros.frustumCulled = false;
    this.rastros.renderOrder = 1;
    this.escena.add(this.rastros);

    // La frontera: una línea muy tenue en x = 0.
    this.matFrontera = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
    this.frontera = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 100), this.matFrontera);
    this.escena.add(this.frontera);
  }

  redimensionar(aspecto, altoPx, fov) {
    this.mx = this.my * aspecto;
    this.matPuntos.uniforms.uEscala.value = altoPx / (2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)));
  }

  // ---------- Estado ----------
  reiniciar() {
    for (const a of this.agentes) {
      if (a.pieza) this.quitarPieza(a, true);
      a.reiniciar(
        -this.mx + 4 + Math.random() * (this.mx - 8),
        -this.my + 4 + Math.random() * (this.my * 2 - 8),
      );
    }
    for (const p of this.piezasMuriendo) { this.escena.remove(p); liberarPieza(p); }
    this.piezasMuriendo = [];
    this.copias.fill(null);
    this.casillas.clear();
    this.visibles = false;
    this.humanosActivos = false;
    this.copiasActivas = false;
    this.atajo = 0; this.atajoMeta = 0;
    this.inicioAtajo = null; this.ventanaAtajo = 40;
    this.rescate = false;
    this.cursorAprende = false;
    this.fronteraActiva = true;
    this.fronteraMeta = 0.14;
    this.modo = null;
    this.jardin = false;
    this.orbita = false;
    this.barrido = null;
    this.esfuerzo = 0;
    this.relojCopia = 0;
    this.camMeta = new THREE.Vector3(0, 0, this.distancia);
  }

  configurar(c) {
    this.visibles = c.visibles;
    this.humanosActivos = c.humanos;
    this.atajoMeta = c.atajo;
    this.ventanaAtajo = c.ventana;
    if (c.atajo > 0 && this.inicioAtajo === null) this.inicioAtajo = -1; // se fija en el próximo cuadro
    this.rescate = c.rescate;
    this.cursorAprende = c.cursorAprende;
    this.fronteraActiva = c.frontera;
    this.fronteraMeta = c.frontera ? (c.n === 0 ? 0.03 : 0.06) : 0;
    this.modo = c.modo;
    this.camMeta.set(0, 0, this.distancia);

    if (c.copias && !this.copiasActivas) this.relojCopia = 999; // copia de inmediato
    this.copiasActivas = c.copias;
    if (!c.copias) this.desvanecerCopias();

    if (c.modo === 'sinAyuda') {
      // Nadie ayuda: los que habían vuelto pierden lo que eran.
      for (const a of this.agentes) if (a.estado === HIBRIDO) this.volverHumano(a);
    }
    if (c.modo === 'conAyuda') { this.jardin = false; this.barrido = null; }
    if (c.modo === 'mensaje') { this.orbita = true; this.jardin = false; }
  }

  // ---------- Transiciones de estado ----------
  volverRigido(a) {
    a.estado = RIGIDO;
    a.enCasilla = false;
    a.agarrado = false;
    a.rastro.length = 0;
    const copia = this.copias[a.id];
    if (copia && copia.vivo && copia.clave) {
      // Ocupa el lugar que su copia ya le tenía preparado.
      a.tx = copia.tx; a.ty = copia.ty; a.clave = copia.clave;
      this.casillas.set(a.clave, a);
      copia.clave = null;
      copia.vivo = false;
    } else {
      const [x, y] = this.casillaGenerica(a.id, -(4 + ((a.id * 7.31) % (this.mx * 0.8))), a.y);
      this.ocuparCasilla(a, x, y);
    }
  }

  volverHibrido(a, t) {
    this.liberarCasilla(a);
    a.estado = HIBRIDO;
    a.agarrado = false;
    a.rastro.length = 0;
    a.vx *= 0.3; a.vy *= 0.3;
    a.nace = t;
    a.pieza = crearPieza(a.color, a.semilla);
    if (this.alNacer) this.alNacer(a, this.mx);
    a.pieza.position.set(a.x, a.y, 0);
    a.pieza.scale.setScalar(0.001);
    this.escena.add(a.pieza);
    const copia = this.copias[a.id];
    if (copia) copia.vivo = false;
  }

  volverHumano(a) {
    this.quitarPieza(a, false);
    a.estado = HUMANO;
    a.z = 0;
  }

  quitarPieza(a, inmediato) {
    if (!a.pieza) return;
    if (inmediato) { this.escena.remove(a.pieza); liberarPieza(a.pieza); }
    else this.piezasMuriendo.push(a.pieza);
    a.pieza = null;
  }

  // ---------- Casillas del lado IA ----------
  // La IA "promedia": refleja la figura humana al otro lado,
  // la vuelve simétrica (arriba = abajo) y la pega a una cuadrícula.
  casillaGenerica(id, hx, hy) {
    const x = Math.min(Math.max(-hx, 4), this.mx - 4);
    const lado = id % 2 === 0 ? 1 : -1;
    const y = Math.min(Math.abs(hy), this.my - 4) * lado;
    return [x, y];
  }

  ocuparCasilla(dueno, x, y) {
    const gx0 = Math.max(2, Math.round(x / CASILLA));
    const gy0 = Math.round(y / CASILLA);
    const maxX = Math.floor((this.mx - 3) / CASILLA);
    const maxY = Math.floor((this.my - 3) / CASILLA);
    for (let r = 0; r < 14; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const gx = gx0 + dx, gy = gy0 + dy;
          if (gx < 2 || gx > maxX || Math.abs(gy) > maxY) continue;
          const clave = gx + ',' + gy;
          if (this.casillas.has(clave)) continue;
          this.casillas.set(clave, dueno);
          dueno.clave = clave;
          dueno.tx = gx * CASILLA;
          dueno.ty = gy * CASILLA;
          return;
        }
      }
    }
    dueno.clave = null; dueno.tx = x; dueno.ty = y;
  }

  liberarCasilla(dueno) {
    if (dueno.clave && this.casillas.get(dueno.clave) === dueno) this.casillas.delete(dueno.clave);
    dueno.clave = null;
  }

  desvanecerCopias() {
    for (const c of this.copias) if (c) { c.vivo = false; this.liberarCasilla(c); }
  }

  iniciarBarrido() { this.barrido = -this.mx - 5; }

  // ---------- Bucle ----------
  actualizar(dt, t) {
    const k = Math.min(dt * 60, 3);
    const ag = this.agentes;
    const humanos = ag.filter((a) => a.estado === HUMANO);
    const rigidos = ag.filter((a) => a.estado === RIGIDO);
    const hibridos = ag.filter((a) => a.estado === HIBRIDO);

    this.atajo += (this.atajoMeta - this.atajo) * 0.01 * k;

    // --- Humanos: bandada + curiosidad + (quizás) atajo ---
    if (this.inicioAtajo === -1) this.inicioAtajo = t;
    if (this.humanosActivos) {
      const transcurrido = this.inicioAtajo === null ? -1 : t - this.inicioAtajo;
      for (const a of humanos) {
        bandada(a, humanos, P_HUMANO);
        deambular(a, t, P_HUMANO);
        // Cada agente cede en su propio momento: no es una avalancha,
        // es uno por uno.
        const tentado = this.fronteraActiva && transcurrido >= 0 && transcurrido > a.momento * this.ventanaAtajo;
        if (tentado) {
          const tentacion = 0.6 + 0.6 * ruido(a.semilla, t * 0.25);
          a.fuerza((this.atajo * tentacion) / a.resistencia, 0);
        }
        const xmax = this.fronteraActiva && !tentado ? -1.5 : this.mx - 2;
        paredes(a, -this.mx + 2, xmax, -this.my + 2, this.my - 2, 8, 0.03);
        integrar(a, P_HUMANO.vmax, k);
        if (this.fronteraActiva && a.x > 1) this.volverRigido(a);
      }
    }

    // --- Copias del lado IA ---
    if (this.copiasActivas) {
      this.relojCopia += dt;
      if (this.relojCopia > 3.5) {
        this.relojCopia = 0;
        for (const a of humanos) {
          let c = this.copias[a.id];
          if (!c) {
            c = this.copias[a.id] = { id: a.id, x: Math.max(3, -a.x), y: a.y, tx: 0, ty: 0, clave: null, alpha: 0, vivo: true, color: a.color };
          }
          if (!c.vivo) continue;
          this.liberarCasilla(c);
          const [x, y] = this.casillaGenerica(a.id, a.x, a.y);
          this.ocuparCasilla(c, x, y);
        }
      }
    }
    for (let i = 0; i < N; i++) {
      const c = this.copias[i];
      if (!c) continue;
      moverManhattan(c, c.tx, c.ty, 0.55 * k);
      c.alpha += ((c.vivo && this.visibles ? 0.55 : 0) - c.alpha) * 0.06 * k;
      if (!c.vivo && c.alpha < 0.01) { this.liberarCasilla(c); this.copias[i] = null; }
    }

    // --- Rescate: el esfuerzo ---
    for (const a of rigidos) a.agarrado = false;
    if (this.rescate) {
      const p = this.puntero;
      this.esfuerzo = p.abajo
        ? Math.min(1, this.esfuerzo + dt * 0.42)
        : Math.max(0, this.esfuerzo - dt * 1.2);
      if (p.abajo && p.dentro) {
        // Solo unos pocos a la vez: los más cercanos.
        const cerca = rigidos
          .map((a) => [a, Math.hypot(a.x - p.x, a.y - p.y)])
          .filter(([, d]) => d < 10)
          .sort((u, v) => u[1] - v[1])
          .slice(0, 6);
        for (const [a] of cerca) a.agarrado = true;
      }
    } else {
      this.esfuerzo = 0;
    }

    // --- Rígidos ---
    for (const a of rigidos) {
      if (a.agarrado) {
        const e = this.esfuerzo;
        const temblor = (1 - e) * 0.5; // se resisten
        a.x += ((this.puntero.x - a.x) * 0.07 * e + (a.tx - a.x) * 0.012) * k + (Math.random() - 0.5) * temblor;
        a.y += ((this.puntero.y - a.y) * 0.07 * e + (a.ty - a.y) * 0.012) * k + (Math.random() - 0.5) * temblor;
        if (a.x < -2.5) this.volverHibrido(a, t);
      } else {
        const yaEstaba = a.enCasilla;
        a.enCasilla = moverManhattan(a, a.tx, a.ty, 0.7 * k);
        if (a.enCasilla && !yaEstaba && this.alLlegar) this.alLlegar(a, this.mx);
      }
    }

    // --- Aprender al pasar el cursor (escena 6) ---
    if (this.cursorAprende) {
      const p = this.puntero;
      if (this.barrido !== null) this.barrido += 0.9 * k;
      for (const a of ag) {
        if (a.estado === HIBRIDO) continue;
        const tocado = p.dentro && Math.hypot(a.x - p.x, a.y - p.y) < 11;
        const barrido = this.barrido !== null && a.x < this.barrido;
        if (tocado || barrido) this.volverHibrido(a, t);
      }
      if (!this.jardin && ag.every((a) => a.estado === HIBRIDO)) this.armarJardin();
    }

    // --- Mensaje final: todos se vuelven únicos, poco a poco ---
    if (this.modo === 'mensaje') {
      let n = 0;
      for (const a of ag) {
        if (a.estado !== HIBRIDO && n < 6) { this.volverHibrido(a, t); n++; }
      }
    }

    // --- Híbridos ---
    const hib = ag.filter((a) => a.estado === HIBRIDO);
    for (const a of hib) {
      let zBase = 0;
      if (this.orbita) {
        // Un anillo inclinado que gira alrededor de la respuesta.
        const ang = (this.ordenTono[a.id] / N) * Math.PI * 2 + t * 0.045;
        const mx = Math.cos(ang) * (this.mx - 9);
        const my = Math.sin(ang) * this.my * 0.66;
        zBase = Math.sin(ang) * -22;
        a.x += (mx - a.x) * 0.02 * k;
        a.y += (my - a.y) * 0.02 * k;
      } else if (this.jardin) {
        const m = a.meta;
        a.x += (m.x - a.x) * 0.02 * k;
        a.y += (m.y - a.y) * 0.02 * k;
        zBase = m.z;
      } else {
        bandada(a, hib, P_HIBRIDO);
        deambular(a, t, P_HIBRIDO);
        const xmax = this.fronteraActiva ? -3 : this.mx - 4;
        paredes(a, -this.mx + 4, xmax, -this.my + 4, this.my - 4, 10, 0.02);
        integrar(a, P_HIBRIDO.vmax, k);
      }
      a.z += (zBase - a.z) * 0.03 * k;
      this.animarPieza(a, t, dt);
    }

    // --- Piezas que se desvanecen ---
    this.piezasMuriendo = this.piezasMuriendo.filter((p) => {
      p.material.opacity *= Math.pow(0.9, k);
      p.scale.multiplyScalar(Math.pow(0.985, k));
      if (p.material.opacity < 0.01) { this.escena.remove(p); liberarPieza(p); return false; }
      return true;
    });

    // --- Cámara y frontera ---
    if (this.jardin) this.camMeta.set(0, -34, this.distancia * 0.93);
    if (this.orbita) this.camMeta.set(0, -16, this.distancia * 1.02);
    this.camara.position.lerp(this.camMeta, 0.015 * k);
    this.camara.lookAt(0, 0, 0);
    this.matFrontera.opacity += (this.fronteraMeta - this.matFrontera.opacity) * 0.04 * k;
    this.frontera.scale.y = this.my / 50;

    this.dibujar();
  }

  armarJardin() {
    // Filotaxis: el mismo ángulo áureo de los girasoles, ahora a gran escala.
    this.jardin = true;
    for (const a of this.agentes) {
      const i = this.ordenTono[a.id];
      const r = Math.sqrt((i + 0.5) / N);
      const ang = i * 2.39996;
      a.meta = {
        x: r * Math.cos(ang) * (this.mx - 10),
        y: r * Math.sin(ang) * (this.my - 8),
        z: (1 - r) * 10,
      };
    }
  }

  animarPieza(a, t, dt) {
    const p = a.pieza;
    if (!p) return;
    const edad = t - a.nace;
    // Nacimiento: crece con un pequeño rebote y salta hacia el espectador.
    const f = Math.min(1, edad / 1.4);
    const rebote = 1 + 2.2 * Math.pow(f - 1, 3) + 1.2 * Math.pow(f - 1, 2);
    const salto = edad < 2.6 ? Math.sin((Math.PI * edad) / 2.6) * 14 : 0;
    const escala = (this.jardin ? 2.3 : this.orbita ? 2.2 : 2.7) * rebote;
    p.scale.setScalar(Math.max(0.001, escala));
    p.position.set(a.x, a.y, a.z + salto + ruido(a.semilla, t * 0.3) * 1.5);
    const u = p.userData;
    p.rotation.z += u.giro * dt * 0.4;
    p.rotation.x = 0.55 * Math.sin(t * 0.4 + u.inclinacion);
    p.rotation.y = 0.55 * Math.cos(t * 0.33 + u.inclinacion);
    const meta = this.visibles ? 0.95 : 0;
    p.material.opacity += (meta - p.material.opacity) * 0.05;
  }

  // ---------- Volcar todo a los buffers de la GPU ----------
  dibujar() {
    const ag = this.agentes;
    for (let i = 0; i < N; i++) {
      const a = ag[i];
      const meta = this.visibles && a.estado !== HIBRIDO ? 1 : 0;
      a.alpha += (meta - a.alpha) * (a.estado === HIBRIDO ? 0.25 : 0.04);
      this.bPos[i * 3] = a.x; this.bPos[i * 3 + 1] = a.y; this.bPos[i * 3 + 2] = 0;
      this.bCol[i * 3] = a.color.r; this.bCol[i * 3 + 1] = a.color.g; this.bCol[i * 3 + 2] = a.color.b;
      this.bAlpha[i] = a.alpha;
      const rigido = a.estado === RIGIDO;
      this.bShape[i] = rigido ? 1 : 0;
      this.bSize[i] = rigido ? (a.agarrado ? 1.9 : 1.5) : 1.8;

      const c = this.copias[i], j = N + i;
      if (c) {
        this.bPos[j * 3] = c.x; this.bPos[j * 3 + 1] = c.y; this.bPos[j * 3 + 2] = 0;
        this.bCol[j * 3] = c.color.r; this.bCol[j * 3 + 1] = c.color.g; this.bCol[j * 3 + 2] = c.color.b;
        this.bAlpha[j] = c.alpha; this.bShape[j] = 1; this.bSize[j] = 1.35;
      } else {
        this.bAlpha[j] = 0;
      }
    }
    const g = this.puntos.geometry;
    for (const n of ['position', 'aColor', 'aAlpha', 'aSize', 'aShape']) g.attributes[n].needsUpdate = true;

    // Estelas
    let v = 0;
    for (const a of ag) {
      if (a.estado === HUMANO && this.humanosActivos) {
        a.rastro.push(a.x, a.y);
        if (a.rastro.length > RASTRO * 2) a.rastro.splice(0, 2);
      } else if (a.rastro.length) {
        a.rastro.length = 0;
      }
      const r = a.rastro, n = r.length / 2;
      for (let s = 0; s < RASTRO - 1; s++) {
        const o = v * 3, oc = v * 4;
        if (s < n - 1) {
          const al0 = (s / RASTRO) * 0.45 * a.alpha;
          const al1 = ((s + 1) / RASTRO) * 0.45 * a.alpha;
          this.rPos[o] = r[s * 2]; this.rPos[o + 1] = r[s * 2 + 1]; this.rPos[o + 2] = 0;
          this.rPos[o + 3] = r[s * 2 + 2]; this.rPos[o + 4] = r[s * 2 + 3]; this.rPos[o + 5] = 0;
          this.rCol.set([a.color.r, a.color.g, a.color.b, al0, a.color.r, a.color.g, a.color.b, al1], oc);
        } else {
          this.rCol[oc + 3] = 0; this.rCol[oc + 7] = 0;
          this.rPos.fill(0, o, o + 6);
        }
        v += 2;
      }
    }
    this.rastros.geometry.attributes.position.needsUpdate = true;
    this.rastros.geometry.attributes.color.needsUpdate = true;
  }

  // Datos para la consola (útil al presentar o depurar).
  resumen() {
    const cuenta = { humano: 0, rigido: 0, hibrido: 0 };
    for (const a of this.agentes) cuenta[a.estado]++;
    return cuenta;
  }
}
