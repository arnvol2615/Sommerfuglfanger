import { SPECIES_BY_ID, FAMILIES } from './data/butterflies';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  check: (foundSpeciesIds: string[]) => boolean;
  progress: (foundSpeciesIds: string[]) => { current: number; total: number };
}

const FAMILY_IDS = FAMILIES.map(f => f.id);
const ALL_RARITIES = ['Vanlig', 'Uvanlig', 'Sjelden', 'Svaert sjelden'] as const;

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_catch',
    title: 'Første fangst',
    description: 'Fang din første sommerfugl',
    icon: '🦋',
    points: 5,
    check: ids => ids.length >= 1,
    progress: ids => ({ current: Math.min(ids.length, 1), total: 1 }),
  },
  {
    id: 'rare_catch',
    title: 'Sjeldent funn',
    description: 'Fang en sjelden art',
    icon: '💎',
    points: 15,
    check: ids => ids.some(id => SPECIES_BY_ID[id]?.rarity === 'Sjelden'),
    progress: ids => ({
      current: ids.some(id => SPECIES_BY_ID[id]?.rarity === 'Sjelden') ? 1 : 0,
      total: 1,
    }),
  },
  {
    id: 'legendary_catch',
    title: 'Legendarisk funn',
    description: 'Fang en legendarisk art',
    icon: '👑',
    points: 30,
    check: ids => ids.some(id => SPECIES_BY_ID[id]?.rarity === 'Svaert sjelden'),
    progress: ids => ({
      current: ids.some(id => SPECIES_BY_ID[id]?.rarity === 'Svaert sjelden') ? 1 : 0,
      total: 1,
    }),
  },
  {
    id: 'redlist_hunter',
    title: 'Rødlistejeger',
    description: 'Fang en art som er kritisk truet (CR) eller sterkt truet (EN)',
    icon: '🔴',
    points: 25,
    check: ids => ids.some(id => ['CR', 'EN'].includes(SPECIES_BY_ID[id]?.redlistCategory ?? '')),
    progress: ids => ({
      current: ids.some(id => ['CR', 'EN'].includes(SPECIES_BY_ID[id]?.redlistCategory ?? '')) ? 1 : 0,
      total: 1,
    }),
  },
  {
    id: 'all_rarities',
    title: 'Alle sjeldenheter',
    description: 'Fang minst én art fra hvert raritetnivå',
    icon: '✨',
    points: 20,
    check: ids => {
      const found = new Set(ids.map(id => SPECIES_BY_ID[id]?.rarity).filter(Boolean));
      return ALL_RARITIES.every(r => found.has(r));
    },
    progress: ids => {
      const found = new Set(ids.map(id => SPECIES_BY_ID[id]?.rarity).filter(Boolean));
      return { current: ALL_RARITIES.filter(r => found.has(r)).length, total: ALL_RARITIES.length };
    },
  },
  {
    id: 'one_per_family',
    title: 'En fra hver familie',
    description: 'Fang minst én art fra alle 5 sommerfuglfamilier',
    icon: '🌿',
    points: 25,
    check: ids => {
      const found = new Set(ids.map(id => SPECIES_BY_ID[id]?.family).filter(Boolean));
      return FAMILY_IDS.every(f => found.has(f));
    },
    progress: ids => {
      const found = new Set(ids.map(id => SPECIES_BY_ID[id]?.family).filter(Boolean));
      return { current: FAMILY_IDS.filter(f => found.has(f)).length, total: FAMILY_IDS.length };
    },
  },
];

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string;
}

export function checkNewlyUnlocked(
  foundSpeciesIds: string[],
  alreadyUnlocked: UnlockedAchievement[],
): Achievement[] {
  const unlockedIds = new Set(alreadyUnlocked.map(u => u.id));
  return ACHIEVEMENTS.filter(a => !unlockedIds.has(a.id) && a.check(foundSpeciesIds));
}
