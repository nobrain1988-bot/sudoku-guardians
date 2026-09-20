// 아이콘 전부를 store/icon.html 한 장에서 뽑는다.
//
//   node scripts/make-icons.js [dev서버주소]
//
// 나오는 것
//   store/icon-512.png                     플레이 스토어 아이콘 (32비트 RGBA)
//   mipmap-*/ic_launcher.png               폰 런처 아이콘
//   mipmap-*/ic_launcher_round.png         원형 런처용
//   mipmap-*/ic_launcher_foreground.png    적응형 아이콘 전경 (배경 투명)
//
// 브라우저를 한 번만 띄우고 16장을 연달아 찍는다 — 장마다 띄우면 몇 배 느리다.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = process.argv[2] ?? 'http://localhost:5311';
const PORT = 9336;
const RES = 'android/app/src/main/res';

const BROWSERS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
];

// 안드로이드 밀도별 크기. 런처 아이콘은 48dp, 적응형 전경은 108dp 가 기준이다.
const DENSITIES = [
  ['mdpi', 1],
  ['hdpi', 1.5],
  ['xhdpi', 2],
  ['xxhdpi', 3],
  ['xxxhdpi', 4],
];

const JOBS = [
  { mode: 'store', size: 512, out: 'store/icon-512.png', alpha: false },
  ...DENSITIES.flatMap(([d, m]) => [
    { mode: 'store', size: 48 * m, out: `${RES}/mipmap-${d}/ic_launcher.png`, alpha: false },
    { mode: 'round', size: 48 * m, out: `${RES}/mipmap-${d}/ic_launcher_round.png`, alpha: true },
    { mode: 'fg', size: 108 * m, out: `${RES}/mipmap-${d}/ic_launcher_foreground.png`, alpha: true },
  ]),
];

const exe = BROWSERS.find((p) => existsSync(p));
if (!exe) throw new Error('엣지나 크롬을 찾지 못했습니다');

const browser = spawn(exe, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${process.env.TEMP}/sudoku-icons-profile`,
  '--no-first-run',
  '--hide-scrollbars',
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
if (!target) throw new Error('브라우저 디버거에 연결하지 못했습니다');

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', reject, { once: true });
});

let id = 0;
const pending = new Map();
ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  const entry = pending.get(msg.id);
  if (!entry) return;
  pending.delete(msg.id);
  msg.error ? entry.reject(new Error(msg.error.message)) : entry.resolve(msg.result);
});
const send = (method, params = {}) => {
  const msgId = ++id;
  ws.send(JSON.stringify({ id: msgId, method, params }));
  return new Promise((resolve, reject) => pending.set(msgId, { resolve, reject }));
};

await send('Page.enable');

for (const job of JOBS) {
  await send('Emulation.setDeviceMetricsOverride', {
    width: job.size,
    height: job.size,
    deviceScaleFactor: 1,
    mobile: false,
  });
  // 적응형 전경은 배경이 투명해야 한다 — 배경색은 안드로이드가 따로 깐다.
  await send('Emulation.setDefaultBackgroundColorOverride', {
    color: { r: 0, g: 0, b: 0, a: job.alpha ? 0 : 1 },
  });
  await send('Page.navigate', { url: `${BASE}/store/icon.html?mode=${job.mode}&size=${job.size}` });
  await sleep(900);

  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  const dir = job.out.slice(0, job.out.lastIndexOf('/'));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(job.out, Buffer.from(data, 'base64'));
  console.log(`${job.size}px`.padStart(6), job.out);
}

ws.close();
browser.kill();
