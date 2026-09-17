import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const IDS = ['dragon', 'phoenix', 'tiger', 'griffin', 'leviathan'];
const OUT_DIR = 'public/creatures';
const STAGES = 6;
const SIZE = 384;
const ORIGIN = 'http://localhost:5173';
const PORT = 9335;

const BROWSERS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
];

const SLICE_FN = `
async function slice(url, stages, size) {
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error('load failed: ' + url));
    i.src = url;
  });

  const W = img.naturalWidth, H = img.naturalHeight;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, W, H).data;

  const THRESH = 34;
  const colHas = new Uint8Array(W);
  const colTop = new Int32Array(W).fill(-1);
  const colBot = new Int32Array(W).fill(-1);

  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) {
      const i = (y * W + x) * 4;
      if (data[i + 3] < 12) continue;
      const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      if (lum <= THRESH) continue;
      colHas[x] = 1;
      if (colTop[x] < 0) colTop[x] = y;
      colBot[x] = y;
    }
  }

  let cx0 = 0, cx1 = W - 1;
  while (cx0 < W && !colHas[cx0]) cx0++;
  while (cx1 > cx0 && !colHas[cx1]) cx1--;

  const energy = new Float64Array(W);
  for (let x = 0; x < W; x++) {
    let sum = 0;
    for (let y = 0; y < H; y++) {
      const i = (y * W + x) * 4;
      sum += (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) * (data[i + 3] / 255);
    }
    energy[x] = sum;
  }

  const smooth = new Float64Array(W);
  const R = 6;
  for (let x = 0; x < W; x++) {
    let sum = 0, n = 0;
    for (let k = -R; k <= R; k++) {
      const xx = x + k;
      if (xx < 0 || xx >= W) continue;
      sum += energy[xx];
      n++;
    }
    smooth[x] = sum / n;
  }

  const span = cx1 - cx0 + 1;
  const minSep = Math.round((span / stages) * 0.55);
  const candidates = [];
  for (let x = cx0 + minSep; x <= cx1 - minSep; x++) candidates.push(x);
  candidates.sort((a, b) => smooth[a] - smooth[b]);

  const splits = [];
  for (const x of candidates) {
    if (splits.length >= stages - 1) break;
    if (splits.every((s) => Math.abs(s - x) >= minSep)) splits.push(x);
  }
  splits.sort((a, b) => a - b);

  const runs = [];
  let from = cx0;
  for (const s of splits) {
    runs.push([from, s]);
    from = s + 1;
  }
  runs.push([from, cx1]);

  const images = [], boxes = [];
  for (const [x0, x1] of runs) {
    let y0 = H, y1 = 0;
    for (let x = x0; x <= x1; x++) {
      if (colTop[x] < 0) continue;
      if (colTop[x] < y0) y0 = colTop[x];
      if (colBot[x] > y1) y1 = colBot[x];
    }
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    const side = Math.round(Math.max(w, h) * 1.12);
    const sx = Math.round((x0 + x1) / 2 - side / 2);
    const sy = Math.round((y0 + y1) / 2 - side / 2);

    const o = document.createElement('canvas');
    o.width = size; o.height = size;
    const octx = o.getContext('2d');
    octx.fillStyle = '#000';
    octx.fillRect(0, 0, size, size);

    const clipL = Math.max(sx, x0);
    const clipR = Math.min(sx + side, x1 + 1);
    if (clipR > clipL) {
      const scale = size / side;
      octx.drawImage(c, clipL, sy, clipR - clipL, side, (clipL - sx) * scale, 0, (clipR - clipL) * scale, size);
    }
    images.push(o.toDataURL('image/webp', 0.86));
    boxes.push({ x0, x1, y0, y1, w, h });
  }
  return { count: runs.length, boxes, images };
}
`;

const exe = BROWSERS.find((p) => existsSync(p));
if (!exe) throw new Error('No Edge or Chrome found');
mkdirSync(OUT_DIR, { recursive: true });

const browser = spawn(exe, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${process.env.TEMP}/sudoku-slice-profile`,
  '--no-first-run',
  'about:blank',
]);

let target = null;
for (let i = 0; i < 40 && !target; i++) {
  await sleep(300);
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    target = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
  } catch {}
}
if (!target) throw new Error('Could not reach the browser debugger');

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', reject, { once: true });
});

let msgId = 0;
const pending = new Map();
ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  const entry = pending.get(msg.id);
  if (!entry) return;
  pending.delete(msg.id);
  msg.error ? entry.reject(new Error(msg.error.message)) : entry.resolve(msg.result);
});
const send = (method, params = {}) => {
  const id = ++msgId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
};
const evaluate = async (expression) => {
  const res = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (res.exceptionDetails) throw new Error(res.exceptionDetails.exception?.description ?? res.exceptionDetails.text);
  return res.result.value;
};

await send('Page.enable');
await send('Runtime.enable');
await send('Page.navigate', { url: `${ORIGIN}/ad-mockup.html` });
await sleep(1500);
await evaluate(SLICE_FN + ';true');

for (const id of IDS) {
  const result = await evaluate(`slice('${ORIGIN}/art/${id}.png', ${STAGES}, ${SIZE})`);
  if (result.count !== STAGES) {
    console.log(`WARN ${id}: found ${result.count} segments, expected ${STAGES}`);
  }
  result.images.forEach((dataUrl, i) => {
    const file = `${OUT_DIR}/${id}-${i + 1}.webp`;
    writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
  });
  const widths = result.boxes.map((b) => b.w).join(', ');
  console.log(`${id}: ${result.count} stages sliced (source widths: ${widths})`);
}

ws.close();
browser.kill();
console.log('done');
