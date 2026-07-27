// Génère les icônes PWA (PNG) sans dépendance : rendu SDF + encodeur PNG minimal.
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

// SDF d'un rectangle arrondi centré en (cx, cy), pivoté de `rot` degrés
function sdRoundRect(px, py, { cx, cy, hw, hh, r, rot = 0 }) {
  if (rot) {
    const a = (rot * Math.PI) / 180;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const dx = px - 256;
    const dy = py - 256;
    px = 256 + dx * c + dy * s;
    py = 256 - dx * s + dy * c;
  }
  const qx = Math.abs(px - cx) - (hw - r);
  const qy = Math.abs(py - cy) - (hh - r);
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
}
const smooth = (d) => Math.min(1, Math.max(0, 0.5 - d));

const ROT = -35; // marteau incliné, tête en haut à droite
const OFF_Y = 25; // recentre optiquement le marteau, plus lourd en haut

function renderIcon(size) {
  const buf = Buffer.alloc(size * size * 4);
  const s = size / 512; // dessiné en coordonnées 512
  /* Marteau de forge. Tout tient dans un cercle de rayon ~180 autour du centre :
     c'est la zone sûre des icônes maskables, rognées en cercle par Android. */
  const shapes = [
    { cx: 316, cy: 320, hw: 15, hh: 105, r: 15, rot: ROT }, // manche, planté près d'un bout
    { cx: 284, cy: 176, hw: 76, hh: 46, r: 18, rot: ROT }, // tête, face de frappe
    { cx: 180, cy: 176, hw: 34, hh: 30, r: 12, rot: ROT }, // panne, plus fine
  ];
  const accent = [232, 150, 60];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = (x + 0.5) / s;
      const py = (y + 0.5) / s;
      // fond : dégradé vertical très léger, noir chaud
      const t = py / 512;
      let R = 20 - 8 * t;
      let G = 17 - 7 * t;
      let B = 15 - 6 * t;
      let a = 0;
      for (const sh of shapes) {
        a = Math.max(a, smooth(sdRoundRect(px, py - OFF_Y, sh) * s));
      }
      R = R + (accent[0] - R) * a;
      G = G + (accent[1] - G) * a;
      B = B + (accent[2] - B) * a;
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
console.log('Icônes générées : 512, 192, 180');
