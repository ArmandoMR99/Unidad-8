// Ruido de Perlin 3D (Unidad 1: aleatoriedad).
// A diferencia de Math.random(), valores cercanos dan resultados
// cercanos: por eso el deambular de los agentes humanos se ve
// orgánico y no nervioso.
// Devuelve un valor aproximadamente entre -1 y 1.

const p = new Uint8Array(512);
(function permutar() {
  const base = Array.from({ length: 256 }, (_, i) => i);
  let s = 20261030; // semilla fija: la obra se comporta igual en cada función
  for (let i = 255; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [base[i], base[j]] = [base[j], base[i]];
  }
  for (let i = 0; i < 512; i++) p[i] = base[i & 255];
})();

const suavizar = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const mezclar = (a, b, t) => a + (b - a) * t;

function gradiente(h, x, y, z) {
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
  return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
}

export function ruido(x, y = 0, z = 0) {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
  x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
  const u = suavizar(x), v = suavizar(y), w = suavizar(z);
  const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z;
  const B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;
  return mezclar(
    mezclar(
      mezclar(gradiente(p[AA] & 15, x, y, z), gradiente(p[BA] & 15, x - 1, y, z), u),
      mezclar(gradiente(p[AB] & 15, x, y - 1, z), gradiente(p[BB] & 15, x - 1, y - 1, z), u), v),
    mezclar(
      mezclar(gradiente(p[AA + 1] & 15, x, y, z - 1), gradiente(p[BA + 1] & 15, x - 1, y, z - 1), u),
      mezclar(gradiente(p[AB + 1] & 15, x, y - 1, z - 1), gradiente(p[BB + 1] & 15, x - 1, y - 1, z - 1), u), v),
    w);
}

// Generador pseudoaleatorio con semilla: cada pieza única se puede
// reconstruir igual a partir de su número.
export function azarConSemilla(semilla) {
  let a = Math.floor(semilla * 9973) >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
