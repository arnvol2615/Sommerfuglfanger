import { useState } from 'react';
import { FAMILIES, SPECIES, type Family, type Rarity } from '../data/butterflies';
import type { GameState } from '../hooks/useGameState';

function rarityBadgeClasses(rarity: Rarity): string {
  switch (rarity) {
    case 'Svaert sjelden':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Sjelden':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Uvanlig':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Vanlig':
    default:
      return 'bg-green-100 text-green-800 border-green-200';
  }
}

function rarityBadgeText(rarity: Rarity): string {
  switch (rarity) {
    case 'Svaert sjelden':
      return '👑 4★ Legendarisk';
    case 'Sjelden':
      return '💎 3★ Sjelden';
    case 'Uvanlig':
      return '✨ 2★ Uvanlig';
    case 'Vanlig':
    default:
      return '🍃 1★ Vanlig';
  }
}

interface FamilyListProps {
  gameState: GameState;
}

export function FamilyList({ gameState }: FamilyListProps) {
  const [openFamily, setOpenFamily] = useState<Family | null>(null);

  return (
    <div className="flex flex-col gap-3 p-4">
      <h2 className="text-xl font-bold text-gray-800">Min samling</h2>
      {FAMILIES.map(family => {
        const familySpecies = SPECIES.filter(s => s.family === family.id);
        const foundCount = familySpecies.filter(s => gameState.foundSpecies[s.id]).length;
        const total = familySpecies.length;
        const isOpen = openFamily === family.id;

        return (
          <div key={family.id} className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-4 text-left"
              onClick={() => setOpenFamily(isOpen ? null : family.id)}
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{family.icon}</span>
                <div>
                  <div className="font-semibold text-gray-800">{family.name}</div>
                  <div className="text-sm text-gray-500">
                    {foundCount} av {total} funnet
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${(foundCount / total) * 100}%` }}
                  />
                </div>
                <span className="text-gray-400 text-lg">{isOpen ? '▲' : '▼'}</span>
              </div>
            </button>

            {isOpen && (
              <ul className="border-t border-gray-100 divide-y divide-gray-50">
                {familySpecies.map(species => {
                  const found = Boolean(gameState.foundSpecies[species.id]);
                  return (
                    <li
                      key={species.id}
                      className={`flex items-center justify-between px-4 py-3 ${found ? 'bg-green-50' : ''}`}
                    >
                      <div>
                        <div className={`font-medium ${found ? 'text-green-800' : 'text-gray-700'}`}>
                          {species.name_no}
                        </div>
                        <div className="text-xs text-gray-400 italic">{species.name_sci}</div>
                        <div className="mt-1">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${rarityBadgeClasses(species.rarity)}`}>
                            {rarityBadgeText(species.rarity)}
                          </span>
                        </div>
                      </div>
                      {found ? (
                        <span className="text-green-600 text-xl" aria-label="Funnet">✓</span>
                      ) : (
                        <span className="text-gray-300 text-xl" aria-label="Ikke funnet">○</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
