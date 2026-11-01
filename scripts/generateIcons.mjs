import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';

try { mkdirSync('public', { recursive: true }); } catch {}

const CRC_TABLE = (() => {
  const t = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function uint32BE(n) {
  return [(n >> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function pngChunk(type, data) {
  const typeB = type.split('').map(c => c.charCodeAt(0));
  const crcInput = new Uint8Array([...typeB, ...data]);
  return [...uint32BE(data.length), ...typeB, ...data, ...uint32BE(crc32(crcInput))];
}

function createPNGSync(width, height, pixels) {
  const ihdr = [...uint32BE(width), ...uint32BE(height), 8, 2, 0, 0, 0];
  const raw = [];
  for (let y = 0; y < height; y++) {
    raw.push(0);
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      raw.push(pixels[i], pixels[i + 1], pixels[i + 2]);
    }
  }
  const compressed = deflateSync(Buffer.from(raw), { level: 6 });
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  return Buffer.from([
    ...sig,
    ...pngChunk('IHDR', ihdr),
    ...pngChunk('IDAT', [...compressed]),
    ...pngChunk('IEND', []),
  ]);
}

function drawIcon(size) {
  const pixels = new Uint8Array(size * size * 4);
  const bg = [2, 6, 23];      // slate-950 #020617
  const blue = [37, 99, 235]; // blue-600 #2563eb
  const white = [255, 255, 255];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      pixels[i] = bg[0]; pixels[i + 1] = bg[1]; pixels[i + 2] = bg[2]; pixels[i + 3] = 255;

      const margin = size * 0.08;
      const radius = size * 0.18;
      const left = margin, right = size - margin - 1;
      const top = margin, bottom = size - margin - 1;

      // Rounded blue rectangle
      if (x >= left && x <= right && y >= top && y <= bottom) {
        const dx = Math.max(0, Math.max(left + radius - x, x - (right - radius)));
        const dy = Math.max(0, Math.max(top + radius - y, y - (bottom - radius)));
        if (Math.sqrt(dx * dx + dy * dy) <= radius) {
          pixels[i] = blue[0]; pixels[i + 1] = blue[1]; pixels[i + 2] = blue[2];
        }
      }

      // "E" glyph
      const cxE = size / 2;
      const cyE = size / 2;
      const eW = size * 0.30;
      const eH = size * 0.42;
      const t = Math.max(3, Math.round(size * 0.065));
      const ex = Math.round(cxE - eW / 2);
      const ey = Math.round(cyE - eH / 2);
      const midLen = Math.round(eW * 0.75);

      const onLeft = x >= ex && x < ex + t && y >= ey && y <= ey + eH;
      const onTop = x >= ex && x < ex + eW && y >= ey && y < ey + t;
      const onMid = x >= ex && x < ex + midLen && y >= Math.round(cyE - t / 2) && y < Math.round(cyE + t / 2);
      const onBot = x >= ex && x < ex + eW && y > ey + eH - t && y <= ey + eH;

      if (onLeft || onTop || onMid || onBot) {
        pixels[i] = white[0]; pixels[i + 1] = white[1]; pixels[i + 2] = white[2];
      }
    }
  }
  return pixels;
}

for (const size of [512, 192, 180, 32]) {
  const pixels = drawIcon(size);
  const png = createPNGSync(size, size, pixels);
  let name;
  if (size === 180) name = 'apple-touch-icon';
  else if (size === 32) name = 'favicon';
  else name = `icon-${size}`;

  if (size === 32) {
    writeFileSync(`public/favicon.ico`, png);
    console.log(`Created public/favicon.ico (${size}x${size})`);
  } else {
    writeFileSync(`public/${name}.png`, png);
    console.log(`Created public/${name}.png (${size}x${size})`);
  }
}

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="100" fill="#020617"/>
  <rect x="42" y="42" width="428" height="428" rx="80" fill="#2563eb"/>
  <text x="256" y="315" font-family="-apple-system, system-ui, Arial, sans-serif" font-weight="900" font-size="280" fill="#ffffff" text-anchor="middle">E</text>
</svg>`;
writeFileSync('public/icon.svg', svgContent);
console.log('Created public/icon.svg');
