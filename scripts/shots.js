import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const OUT_DIR = process.argv[2] ?? 'shots';
const URL_BASE = 'http://localhost:5173';
const PORT = 9333;

const BROWSERS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
];

class CDP {
  #ws;
  #id = 0;
  #pending = new Map();

  static async connect(wsUrl) {
    const cdp = new CDP();
    await cdp.#open(wsUrl);
    return cdp;
  }

  #open(wsUrl) {
    this.#ws = new WebSocket(wsUrl);
    this.#ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      const entry = this.#pending.get(msg.id);
      if (!entry) return;
      this.#pending.delete(msg.id);
      if (msg.error) entry.reject(new Error(msg.error.message));
      else entry.resolve(msg.result);
    });
    return new Promise((resolve, reject) => {
      this.#ws.addEventListener('open', resolve, { once: true });
      this.#ws.addEventListener('error', reject, { once: true });
    });
  }

  send(method, params = {}) {
    const id = ++this.#id;
    this.#ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.#pending.set(id, { resolve, reject }));
  }

  async run(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression: `(async () => { ${expression} })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  }

  close() {
    this.#ws.close();
  }
}

const ENTER = `
  const titleView = document.querySelector('[data-view="title"]');
  if (titleView && !titleView.hidden) {
    document.querySelector('[data-action="enter"]').click();
    await new Promise((r) => setTimeout(r, 400));
  }
`;

const FILL = `
  const g = window.__sc.game;
  const cells = [...document.querySelectorAll('[data-cell]')];
  const keys = [...document.querySelectorAll('[data-digit]')];
`;

const SHOTS = [
  {
    name: '1-home',
    setup: `
      localStorage.setItem('sc.theme', 'light');
      localStorage.setItem('sc.stats', JSON.stringify({
        solved: 23,
        best: { easy: 184 },
        dailyDone: null,
        streak: 4,
        xp: 770,
        techniques: { nakedSingle: true, hiddenSingle: true, pointing: true, claiming: true, nakedPair: true },
      }));
      localStorage.removeItem('sc.save');
      location.reload();
    `,
    after: `
      const stats = JSON.parse(localStorage.getItem('sc.stats'));
      const p = (n) => String(n).padStart(2, '0');
      const d = new Date();
      d.setDate(d.getDate() - 1);
      stats.dailyDone = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
      localStorage.setItem('sc.stats', JSON.stringify(stats));
      location.reload();
    `,
  },
  {
    name: '2-game',
    setup: `
      document.querySelector('[data-difficulty="medium"]').click();
      await new Promise((r) => setTimeout(r, 900));
      ${FILL}
      let done = 0;
      for (let i = 0; i < 81 && done < 18; i++) {
        if (g.board[i]) continue;
        cells[i].click();
        keys[g.solution[i] - 1].click();
        done++;
      }
      const target = [...g.board].findIndex((v) => !v);
      cells[target].click();
    `,
  },
  {
    name: '3-coach',
    setup: `
      document.querySelector('[data-action="coach"]').click();
      await new Promise((r) => setTimeout(r, 200));
      document.querySelector('[data-action="coachMore"]').click();
    `,
  },
  {
    name: '4-win',
    setup: `
      ${FILL}
      for (let i = 0; i < 81; i++) {
        if (g.board[i] === g.solution[i]) continue;
        cells[i].click();
        keys[g.solution[i] - 1].click();
      }
      await new Promise((r) => setTimeout(r, 2400));
    `,
  },
  {
    name: '5-game-dark',
    setup: `
      document.querySelector('[data-action="home"]').click();
      localStorage.setItem('sc.theme', 'dark');
      location.reload();
    `,
    after: `
      ${ENTER}
      document.querySelector('[data-difficulty="hard"]').click();
      await new Promise((r) => setTimeout(r, 900));
      ${FILL}
      let done = 0;
      for (let i = 0; i < 81 && done < 14; i++) {
        if (g.board[i]) continue;
        cells[i].click();
        keys[g.solution[i] - 1].click();
        done++;
      }
      document.querySelector('[data-action="coach"]').click();
    `,
  },
];

const CREATURE_SHOTS = [
  {
    name: '6-picker',
    setup: `
      localStorage.setItem('sc.theme', 'light');
      localStorage.setItem('sc.stats', JSON.stringify({ solved: 0, best: {}, dailyDone: null, streak: 0, xp: 0, techniques: {}, creature: null, creatureXp: {}, companions: [] }));
      localStorage.removeItem('sc.save');
      location.reload();
    `,
    after: `
      document.querySelector('[data-action="companion"]').click();
      await new Promise((r) => setTimeout(r, 500));
      document.querySelector('[data-pick="tiger"]').click();
    `,
  },
  {
    name: '7-companion-home',
    setup: `
      localStorage.setItem('sc.stats', JSON.stringify({
        solved: 34, best: { easy: 184 }, dailyDone: null, streak: 4, xp: 1480,
        techniques: { nakedSingle: 1, hiddenSingle: 1, pointing: 1, claiming: 1, nakedPair: 1 },
        creature: 'dragon', creatureXp: { dragon: 2680 }, companions: [],
      }));
      location.reload();
    `,
  },
  {
    name: '8-evolve',
    setup: `
      const s = JSON.parse(localStorage.getItem('sc.stats'));
      s.creatureXp.dragon = 4150;
      localStorage.setItem('sc.stats', JSON.stringify(s));
      document.querySelector('[data-difficulty="hard"]').click();
      await new Promise((r) => setTimeout(r, 1200));
      ${FILL}
      for (let i = 0; i < 81; i++) {
        if (g.board[i] === g.solution[i]) continue;
        cells[i].click();
        keys[g.solution[i] - 1].click();
      }
      await new Promise((r) => setTimeout(r, 3200));
    `,
  },
];

const SEED_STATS = `localStorage.setItem('sc.stats', JSON.stringify({
  solved: 34, best: { easy: 184 }, dailyDone: null, streak: 4, xp: 1480,
  techniques: { nakedSingle: 1, hiddenSingle: 1, pointing: 1, claiming: 1, nakedPair: 1 },
  creature: 'dragon', creatureXp: { dragon: 2680 }, companions: [],
}));`;

const PARTIAL = `
  ${FILL}
  let filled = 0;
  for (let i = 0; i < 81 && filled < 17; i++) {
    if (g.board[i]) continue;
    cells[i].click();
    keys[g.solution[i] - 1].click();
    filled++;
  }
`;

const ALL_SHOTS = [
  {
    name: 'a1-home',
    setup: `
      localStorage.setItem('sc.theme', 'light');
      localStorage.removeItem('sc.save');
      ${SEED_STATS}
      location.reload();
    `,
    after: ENTER,
  },
  {
    name: 'a2-picker',
    setup: `
      const s0 = JSON.parse(localStorage.getItem('sc.stats'));
      s0.creature = null; s0.creatureXp = {};
      localStorage.setItem('sc.stats', JSON.stringify(s0));
      location.reload();
    `,
    after: `
      ${ENTER}
      await new Promise((r) => setTimeout(r, 300));
      document.querySelector('[data-pick="tiger"]').click();
    `,
  },
  {
    name: 'a3-game',
    setup: `
      ${SEED_STATS}
      location.reload();
    `,
    after: `
      ${ENTER}
      document.querySelector('[data-difficulty="medium"]').click();
      await new Promise((r) => setTimeout(r, 1000));
      ${PARTIAL}
      cells[[...g.board].findIndex((v) => !v)].click();
    `,
  },
  {
    name: 'a4-coach',
    setup: `
      document.querySelector('[data-action="coach"]').click();
      await new Promise((r) => setTimeout(r, 250));
      document.querySelector('[data-action="coachMore"]').click();
    `,
  },
  {
    name: 'a5-win',
    setup: `
      ${FILL}
      for (let i = 0; i < 81; i++) {
        if (g.board[i] === g.solution[i]) continue;
        cells[i].click();
        keys[g.solution[i] - 1].click();
      }
      await new Promise((r) => setTimeout(r, 2600));
    `,
  },
  {
    name: 'a6-evolve',
    setup: `
      document.querySelector('[data-action="home"]').click();
      const s = JSON.parse(localStorage.getItem('sc.stats'));
      s.creatureXp.dragon = 4150;
      localStorage.setItem('sc.stats', JSON.stringify(s));
      await new Promise((r) => setTimeout(r, 200));
      document.querySelector('[data-difficulty="hard"]').click();
      await new Promise((r) => setTimeout(r, 1200));
      ${FILL}
      for (let i = 0; i < 81; i++) {
        if (g.board[i] === g.solution[i]) continue;
        cells[i].click();
        keys[g.solution[i] - 1].click();
      }
      await new Promise((r) => setTimeout(r, 3200));
    `,
  },
  {
    name: 'a7-dark',
    setup: `
      localStorage.setItem('sc.theme', 'dark');
      const s2 = JSON.parse(localStorage.getItem('sc.stats'));
      s2.creature = 'tiger';
      s2.creatureXp = { tiger: 1350 };
      localStorage.setItem('sc.stats', JSON.stringify(s2));
      localStorage.removeItem('sc.save');
      location.reload();
    `,
    after: `
      document.querySelector('[data-difficulty="hard"]').click();
      await new Promise((r) => setTimeout(r, 1100));
      ${PARTIAL}
      document.querySelector('[data-action="coach"]').click();
    `,
  },
];

async function main() {
  const exe = BROWSERS.find((p) => existsSync(p));
  if (!exe) throw new Error('No Edge or Chrome found');
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const profile = `${process.env.TEMP}/sudoku-shots-profile`;
  const browser = spawn(exe, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--hide-scrollbars',
    '--force-device-scale-factor=2',
    URL_BASE,
  ]);
  browser.on('error', (e) => console.error('browser error', e.message));

  let targets = null;
  for (let i = 0; i < 40 && !targets; i++) {
    await sleep(300);
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      targets = list.filter((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (!targets.length) targets = null;
    } catch {}
  }
  if (!targets) throw new Error('Could not reach the browser debugger');

  const cdp = await CDP.connect(targets[0].webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: Number(process.env.SHOT_W ?? 390),
    height: Number(process.env.SHOT_H ?? 844),
    deviceScaleFactor: Number(process.env.SHOT_DPR ?? 2),
    mobile: true,
  });
  await cdp.send('Page.navigate', { url: URL_BASE });
  await sleep(1600);

  const TITLE_SHOTS = [
    {
      name: 't1-title-dragon',
      setup: `localStorage.clear(); location.reload();`,
    },
    {
      name: 't2-title-tiger',
      setup: `
        localStorage.setItem('sc.stats', JSON.stringify({
          solved: 20, best: {}, dailyDone: null, streak: 3, xp: 900,
          techniques: {}, creature: 'tiger', creatureXp: { tiger: 2600 }, companions: [],
        }));
        location.reload();
      `,
    },
    {
      name: 't3-title-phoenix',
      setup: `
        const s = JSON.parse(localStorage.getItem('sc.stats'));
        s.creature = 'phoenix';
        s.creatureXp = { phoenix: 3000 };
        localStorage.setItem('sc.stats', JSON.stringify(s));
        location.reload();
      `,
    },
  ];

  const SETS = { creature: CREATURE_SHOTS, all: ALL_SHOTS, title: TITLE_SHOTS };
  const only = SETS[process.env.SHOT_SET] ?? SHOTS;
  for (const shot of only) {
    await cdp.run(shot.setup);
    await sleep(shot.setup.includes('location.reload') ? 1600 : 700);
    if (shot.after) {
      await cdp.run(shot.after);
      await sleep(shot.after.includes('location.reload') ? 1600 : 900);
    }
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const file = `${OUT_DIR}/${shot.name}.png`;
    writeFileSync(file, Buffer.from(data, 'base64'));
    console.log('saved', file);
  }

  cdp.close();
  browser.kill();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
