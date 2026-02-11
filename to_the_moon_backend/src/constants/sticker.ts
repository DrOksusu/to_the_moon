import { sticker_level } from '@prisma/client';

export interface StickerMeta {
  level: sticker_level;
  order: number;
  name: string;
  emoji: string;
  points: number;
}

export const STICKER_LEVELS: Record<sticker_level, StickerMeta> = {
  seed: {
    level: 'seed',
    order: 1,
    name: '씨앗',
    emoji: '🌱',
    points: 10,
  },
  bloom: {
    level: 'bloom',
    order: 2,
    name: '꽃봉오리',
    emoji: '🌸',
    points: 20,
  },
  shooting_star: {
    level: 'shooting_star',
    order: 3,
    name: '별똥별',
    emoji: '🌠',
    points: 30,
  },
  rocket: {
    level: 'rocket',
    order: 4,
    name: '로켓',
    emoji: '🚀',
    points: 50,
  },
  satellite: {
    level: 'satellite',
    order: 5,
    name: '위성',
    emoji: '🛰️',
    points: 70,
  },
  aurora: {
    level: 'aurora',
    order: 6,
    name: '오로라',
    emoji: '🌌',
    points: 85,
  },
  to_the_moon: {
    level: 'to_the_moon',
    order: 7,
    name: '투더문',
    emoji: '🌕',
    points: 100,
  },
};

export const STICKER_LEVELS_LIST = Object.values(STICKER_LEVELS).sort(
  (a, b) => a.order - b.order
);

export function calcTotalPoints(levelCounts: Partial<Record<sticker_level, number>>): number {
  return Object.entries(levelCounts).reduce((sum, [level, count]) => {
    const meta = STICKER_LEVELS[level as sticker_level];
    return sum + (meta ? meta.points * (count || 0) : 0);
  }, 0);
}
