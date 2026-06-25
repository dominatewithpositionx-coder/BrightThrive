export type ExplorerLevel = {
  level: number;
  name: string;
  emoji: string;
  minCoins: number;
  nextLevelCoins: number;
  color: string;
};

export const EXPLORER_LEVELS: ExplorerLevel[] = [
  { level: 1, name: 'Seedling',         emoji: '🌱', minCoins: 0,    nextLevelCoins: 50,   color: '#86EFAC' },
  { level: 2, name: 'Trail Blazer',     emoji: '🥾', minCoins: 50,   nextLevelCoins: 150,  color: '#34D399' },
  { level: 3, name: 'Adventure Scout',  emoji: '🔭', minCoins: 150,  nextLevelCoins: 350,  color: '#14B8A6' },
  { level: 4, name: 'Navigator',        emoji: '🧭', minCoins: 350,  nextLevelCoins: 700,  color: '#0EA5E9' },
  { level: 5, name: 'Star Seeker',      emoji: '⭐', minCoins: 700,  nextLevelCoins: 1200, color: '#8B5CF6' },
  { level: 6, name: 'Galaxy Guardian',  emoji: '🌌', minCoins: 1200, nextLevelCoins: 2000, color: '#EC4899' },
  { level: 7, name: 'Legend',           emoji: '👑', minCoins: 2000, nextLevelCoins: 9999, color: '#F59E0B' },
];

export function getExplorerLevel(totalCoins: number): ExplorerLevel & { progress: number } {
  let level = EXPLORER_LEVELS[0];
  for (const l of EXPLORER_LEVELS) {
    if (totalCoins >= l.minCoins) level = l;
  }
  const next = EXPLORER_LEVELS.find(l => l.level === level.level + 1);
  const progress = next
    ? Math.min(100, Math.round(((totalCoins - level.minCoins) / (level.nextLevelCoins - level.minCoins)) * 100))
    : 100;
  return { ...level, progress };
}
