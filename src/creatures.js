export const STAGE_XP = [0, 150, 500, 1200, 2400, 4200];
export const STAGE_COUNT = STAGE_XP.length;

export const CREATURES = [
  { id: 'dragon', accent: '#e0a106', deep: '#7d5102', glow: 'rgba(224, 161, 6, 0.26)' },
  { id: 'phoenix', accent: '#e2542a', deep: '#8a2c10', glow: 'rgba(226, 84, 42, 0.24)' },
  { id: 'tiger', accent: '#4aa3d8', deep: '#1c5c86', glow: 'rgba(74, 163, 216, 0.28)' },
  { id: 'griffin', accent: '#b08442', deep: '#66471a', glow: 'rgba(176, 132, 66, 0.26)' },
  { id: 'leviathan', accent: '#1f9d8f', deep: '#0c5851', glow: 'rgba(31, 157, 143, 0.26)' },
];

export const creatureById = (id) => CREATURES.find((c) => c.id === id) ?? CREATURES[0];

export function stageOf(xp) {
  let stage = 0;
  while (stage + 1 < STAGE_COUNT && xp >= STAGE_XP[stage + 1]) stage++;
  return stage;
}

export function creatureProgress(xp = 0) {
  const stage = stageOf(xp);
  const base = STAGE_XP[stage];
  const next = STAGE_XP[stage + 1];
  const complete = next === undefined;
  return {
    stage,
    into: xp - base,
    span: complete ? 0 : next - base,
    percent: complete ? 100 : Math.round(((xp - base) / (next - base)) * 100),
    complete,
  };
}

export function artPath(id, stage) {
  return `creatures/${id}-${stage + 1}.webp`;
}

export function paintPlaceholder(el, creature, stage) {
  const scale = 0.42 + stage * 0.116;
  el.style.background = `radial-gradient(circle at 50% 42%, ${creature.accent} 0%, ${creature.deep} 72%, #221a08 100%)`;
  el.style.setProperty('--mark-scale', String(scale));
  el.dataset.stage = String(stage + 1);
}
