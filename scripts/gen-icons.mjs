// Génère les icônes PWA (PNG) sans dépendance : rastérisation de tracés SVG + encodeur PNG minimal.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const crcTable = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
function crc32(buf) {
  let c = -1;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function png(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filtre none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ————————————————— Tracés SVG → polygones ————————————————— */

/**
 * Sous-ensemble de la syntaxe `d` : M/m, L/l, C/c, Z/z — soit exactement ce
 * qu'utilisent les tracés de la flamme. Les commandes répétées implicitement
 * (« c … … … » enchaîné) sont gérées, ainsi que les nombres collés (« .5-.6 »).
 */
function parsePath(d, steps = 24) {
  const tokens = d.match(/[MmLlCcZz]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? [];
  const polys = [];
  let poly = null;
  let cmd = null;
  let x = 0;
  let y = 0;
  let i = 0;
  const num = () => parseFloat(tokens[i++]);

  while (i < tokens.length) {
    if (/[MmLlCcZz]/.test(tokens[i])) cmd = tokens[i++];
    if (cmd === 'Z' || cmd === 'z') {
      if (poly && poly.length) polys.push(poly);
      poly = null;
      cmd = null;
      continue;
    }
    const rel = cmd === cmd.toLowerCase();
    if (cmd === 'M' || cmd === 'm') {
      const nx = num();
      const ny = num();
      x = rel ? x + nx : nx;
      y = rel ? y + ny : ny;
      if (poly && poly.length) polys.push(poly);
      poly = [[x, y]];
      // Un M suivi d'autres paires équivaut à des L
      cmd = rel ? 'l' : 'L';
    } else if (cmd === 'L' || cmd === 'l') {
      const nx = num();
      const ny = num();
      x = rel ? x + nx : nx;
      y = rel ? y + ny : ny;
      poly.push([x, y]);
    } else if (cmd === 'C' || cmd === 'c') {
      const x1 = rel ? x + num() : num();
      const y1 = rel ? y + num() : num();
      const x2 = rel ? x + num() : num();
      const y2 = rel ? y + num() : num();
      const x3 = rel ? x + num() : num();
      const y3 = rel ? y + num() : num();
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const u = 1 - t;
        poly.push([
          u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
          u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
        ]);
      }
      x = x3;
      y = y3;
    }
  }
  if (poly && poly.length) polys.push(poly);
  return polys;
}

/** Test pair-impair : le point est-il dans l'un des contours ? */
function inside(polys, px, py) {
  let win = false;
  for (const poly of polys) {
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i];
      const [xj, yj] = poly[j];
      if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) win = !win;
    }
  }
  return win;
}

/* ————————————————— L'icône ————————————————— */

// Tracés repris tels quels de src/components/gami/Flame.tsx — l'icône et le
// logo affiché dans l'app sont ainsi rigoureusement la même flamme.
const FLAME_BODY =
  'M12 22c-4.2 0-7-2.7-7-6.4 0-2.8 1.8-4.9 3.2-6.7C9.2 7.6 10.3 6.1 10.7 4c2.7 1.7 8.3 6.5 8.3 11.6 0 3.7-2.8 6.4-7 6.4Z';
const FLAME_CORE =
  'M12 22c-2 0-3.3-1.3-3.3-3.1 0-1.4 1-2.7 1.8-3.6.5-.6.9-1.1 1.1-1.9 1.3 1 3.7 3 3.7 5.5 0 1.8-1.3 3.1-3.3 3.1Z';

const body = parsePath(FLAME_BODY);
const core = parsePath(FLAME_CORE);

const ACCENT = [232, 150, 60]; // --accent
const CORE = [246, 202, 150]; // accent éclairci, comme le cœur du composant

// La flamme tient dans un cercle de rayon ~176 autour du centre : c'est la zone
// sûre des icônes maskables, qu'Android rogne en cercle.
const VIEW = { cx: 12, cy: 13, h: 18 };
const TARGET_H = 280;
const SCALE = TARGET_H / VIEW.h;
const SS = 3; // sur-échantillonnage : 3×3 par pixel

function renderIcon(size) {
  const buf = Buffer.alloc(size * size * 4);
  const s = size / 512; // dessiné en coordonnées 512
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Fond : dégradé vertical très léger, noir chaud
      const t = (y + 0.5) / size;
      let R = 20 - 8 * t;
      let G = 17 - 7 * t;
      let B = 15 - 6 * t;

      let aBody = 0;
      let aCore = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px512 = (x + (sx + 0.5) / SS) / s;
          const py512 = (y + (sy + 0.5) / SS) / s;
          const vx = (px512 - 256) / SCALE + VIEW.cx;
          const vy = (py512 - 256) / SCALE + VIEW.cy;
          if (inside(body, vx, vy)) aBody += 1;
          if (inside(core, vx, vy)) aCore += 1;
        }
      }
      const n = SS * SS;
      aBody /= n;
      aCore /= n;

      R += (ACCENT[0] - R) * aBody;
      G += (ACCENT[1] - G) * aBody;
      B += (ACCENT[2] - B) * aBody;
      R += (CORE[0] - R) * aCore;
      G += (CORE[1] - G) * aCore;
      B += (CORE[2] - B) * aCore;

      const i = (y * size + x) * 4;
      buf[i] = R;
      buf[i + 1] = G;
      buf[i + 2] = B;
      buf[i + 3] = 255;
    }
  }
  return png(size, size, buf);
}

mkdirSync('public', { recursive: true });
writeFileSync('public/icon-512.png', renderIcon(512));
writeFileSync('public/icon-192.png', renderIcon(192));
writeFileSync('public/apple-touch-icon.png', renderIcon(180));
console.log('Icônes générées : 512, 192, 180 — flamme');
