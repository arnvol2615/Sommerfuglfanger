import { useState } from 'react';
import { FAMILIES, SPECIES, type Family, type Rarity } from '../data/butterflies';
import { FamilyIllustration } from './FamilyIllustration';
import { Oppdrag } from './Oppdrag';
import type { GameState } from '../hooks/useGameState';
import type { UnlockedAchievement } from '../achievements';

function getArtsdatabankenUrl(adbTaxonId: number): string {
  return `https://artsdatabanken.no/arter/takson/${adbTaxonId}`;
}

function getInaturalistUrl(inatTaxonId: number): string {
  return `https://www.inaturalist.org/taxa/${inatTaxonId}`;
}

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
  foundSpeciesIds?: string[];
  unlockedAchievements?: UnlockedAchievement[];
  apiLoading?: boolean;
  apiError?: string | null;
}

export function FamilyList({ gameState, foundSpeciesIds, unlockedAchievements = [], apiLoading = false, apiError = null }: FamilyListProps) {
  const [openFamily, setOpenFamily] = useState<Family | null>(null);
  const [subTab, setSubTab] = useState<'arter' | 'oppdrag'>('arter');
  const foundSpeciesSet = foundSpeciesIds ? new Set(foundSpeciesIds) : null;
  const isFound = (speciesId: string) => foundSpeciesSet ? foundSpeciesSet.has(speciesId) : Boolean(gameState.foundSpecies[speciesId]);
  const effectiveFoundIds = foundSpeciesIds ?? Object.keys(gameState.foundSpecies);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 mx-4 mt-4 bg-gray-100 rounded-xl p-1">
        {(['arter', 'oppdrag'] as const).map(t => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={
              'flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ' +
              (subTab === t ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700')
            }
          >
            {t === 'arter' ? '🦋 Arter' : '🎯 Oppdrag'}
          </button>
        ))}
      </div>

      {subTab === 'oppdrag' && (
        <Oppdrag foundSpeciesIds={effectiveFoundIds} unlockedAchievements={unlockedAchievements} />
      )}

      {subTab === 'arter' && <div className="flex flex-col gap-3 px-4">
      <h2 className="text-xl font-bold text-gray-800">Min samling</h2>
      {apiLoading && (
        <p className="text-sm text-gray-500">Henter samling fra server…</p>
      )}
      {apiError && (
        <p className="text-sm text-amber-700">Viser lokal samling. Serverfeil: {apiError}</p>
      )}
      {FAMILIES.map(family => {
        const familySpecies = SPECIES.filter(s => s.family === family.id);
        const foundCount = familySpecies.filter(s => isFound(s.id)).length;
        const total = familySpecies.length;
        const isOpen = openFamily === family.id;

        return (
          <div key={family.id} className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
            <button
              className="w-full flex items-center justify-between gap-4 px-4 py-4 text-left"
              onClick={() => setOpenFamily(isOpen ? null : family.id)}
              aria-expanded={isOpen}
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <FamilyIllustration family={family.id} />
                <div className="min-w-0">
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
                  const found = isFound(species.id);
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
                        {found && (gameState.catchCounts?.[species.id] ?? 0) > 1 && (
                          <div className="mt-1 text-xs text-green-700 font-medium">
                            Fanget {gameState.catchCounts![species.id]} ganger
                          </div>
                        )}
                        <div className="mt-1 text-xs flex items-center gap-2">
                          <a
                            href={getArtsdatabankenUrl(species.adbTaxonId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            Artsdatabanken
                          </a>
                          <span className="text-gray-300">•</span>
                          <a
                            href={getInaturalistUrl(species.inatTaxonId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            iNaturalist
                          </a>
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
    </div>}
  </div>
  );
}
