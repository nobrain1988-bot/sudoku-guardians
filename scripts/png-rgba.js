// Re-encode an opaque PNG as 32-bit RGBA, which is what the Play Console
// asks for on app icons. Pure Node, no browser, no dependencies.
import { readFileSync, writeFileSync } from 'node:fs';
import zlib from 'node:zlib';

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/png-rgba.js <file.png>');
  process.exit(1);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const buf = readFileSync(file);
const chunks = [];
for (let pos = 8; pos < buf.length; ) {
  const len = buf.readUInt32BE(pos);
  chunks.push({ type: buf.toString('ascii', pos + 4, pos + 8), data: buf.subarray(pos + 8, pos + 8 + len) });
  pos += 12 + len;
}

const ihdr = chunks.find((c) => c.type === 'IHDR').data;
const width = ihdr.readUInt32BE(0);
const height = ihdr.readUInt32BE(4);
const bitDepth = ihdr[8];
const colorType = ihdr[9];

if (colorType === 6) {
  console.log(`${file} is already 32-bit RGBA`);
  process.exit(0);
}
if (colorType !== 2 || bitDepth !== 8) {
  console.error(`unsupported PNG: colorType ${colorType}, bitDepth ${bitDepth}`);
  process.exit(1);
}

const packed = zlib.inflateSync(Buffer.concat(chunks.filter((c) => c.type === 'IDAT').map((c) => c.data)));
const bpp = 3;
const stride = width * bpp;
const raw = Buffer.alloc(height * stride);

let read = 0;
for (let y = 0; y < height; y++) {
  const filter = packed[read++];
  const line = packed.subarray(read, read + stride);
  read += stride;
  const row = raw.subarray(y * stride, (y + 1) * stride);
  const prev = y > 0 ? raw.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);

  for (let x = 0; x < stride; x++) {
    const a = x >= bpp ? row[x - bpp] : 0;
    const b = prev[x];
    const c = x >= bpp ? prev[x - bpp] : 0;
    let v = line[x];
    if (filter === 1) v += a;
    else if (filter === 2) v += b;
    else if (filter === 3) v += (a + b) >> 1;
    else if (filter === 4) {
      const pa = Math.abs(b - c);
      const pb = Math.abs(a - c);
      const pc = Math.abs(a + b - 2 * c);
      v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
    }
    row[x] = v & 0xff;
  }
}

const outStride = width * 4;
const out = Buffer.alloc(height * (outStride + 1));
for (let y = 0; y < height; y++) {
  const base = y * (outStride + 1);
  out[base] = 0;
  for (let x = 0; x < width; x++) {
    const s = y * stride + x * 3;
    const d = base + 1 + x * 4;
    out[d] = raw[s];
    out[d + 1] = raw[s + 1];
    out[d + 2] = raw[s + 2];
    out[d + 3] = 255;
  }
}

const newIhdr = Buffer.from(ihdr);
newIhdr[9] = 6;

writeFileSync(
  file,
  Buffer.concat([
    buf.subarray(0, 8),
    chunk('IHDR', newIhdr),
    chunk('IDAT', zlib.deflateSync(out, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
);

console.log(`${file} -> 32-bit RGBA (${width}x${height})`);
