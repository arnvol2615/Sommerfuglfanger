import { useEffect, useState } from 'react';
import {
  getLeaderboard,
  getLeaderboardUserCollection,
  type LeaderboardRow,
  type LeaderboardUserCollection,
} from '../services/supabaseApi';
import { SPECIES_BY_ID } from '../data/butterflies';
import { CatchMap } from './CatchMap';

interface LeaderboardProps {
  currentUsername: string | null;
}

export function Leaderboard({ currentUsername }: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState<'liste' | 'kart'>('liste');
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<LeaderboardUserCollection | null>(null);
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [collectionError, setCollectionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getLeaderboard(50)
      .then(data => { if (!cancelled) { setRows(data); setLoading(false); } })
      .catch(err => { if (!cancelled) { setError(err instanceof Error ? err.message : 'Noe gikk galt'); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  const top50 = rows.slice(0, 50);
  const currentUserRow = currentUsername
    ? top50.find(r => r.username === currentUsername) ?? null
    : null;
  const currentUserInTop50 = currentUserRow !== null;

  const medalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const authenticityIcon = (score: number, hasSuspicious: boolean) => {
    if (hasSuspicious || score < 0.25) return { icon: '❌', label: 'Mistenkelig', color: 'text-red-500' };
    if (score < 0.5) return { icon: '⚠️', label: 'Usikker', color: 'text-yellow-500' };
    return { icon: '✅', label: 'Autentisk', color: 'text-green-500' };
  };

  const openCollection = async (username: string) => {
    setSelectedUsername(username);
    setSelectedCollection(null);
    setCollectionError(null);
    setCollectionLoading(true);
    try {
      const data = await getLeaderboardUserCollection(username);
      setSelectedCollection(data);
    } catch (err) {
      setCollectionError(err instanceof Error ? err.message : 'Kunne ikke hente brukerens funn');
    } finally {
      setCollectionLoading(false);
    }
  };

  const closeCollection = () => {
    setSelectedUsername(null);
    setSelectedCollection(null);
    setCollectionError(null);
    setCollectionLoading(false);
  };

  return (
    <div className="flex flex-col min-h-0 pb-4">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {activeTab === 'liste' ? '🏆 Toppliste' : '🗺️ Funnkart'}
          </h2>
          <p className="text-sm text-gray-500">
            {activeTab === 'liste' ? 'Topp 50 sommerfuglfangere' : 'Hvor sommerfuglene er fanget'}
          </p>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('liste')}
            className={
              'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ' +
              (activeTab === 'liste'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700')
            }
          >
            Liste
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kart')}
            className={
              'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ' +
              (activeTab === 'kart'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700')
            }
          >
            Kart
          </button>
        </div>
      </div>

      {activeTab === 'kart' && <CatchMap />}

      {activeTab === 'liste' && loading && (
        <div className="flex justify-center items-center py-16 text-gray-400 text-sm">
          Laster highscore…
        </div>
      )}

      {activeTab === 'liste' && error && (
        <div className="mx-4 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {activeTab === 'liste' && !loading && !error && (
        <div className="flex flex-col mx-4 gap-0 rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white">
          {top50.map((row) => {
            const isMe = row.username === currentUsername;
            const medal = medalEmoji(row.rank);
            const auth = authenticityIcon(row.authenticity_score, row.has_suspicious_activity);
            const dailyPoints = row.daily_catch_count * 10;
            const regularPoints = row.score - dailyPoints;
            return (
              <button
                key={row.username}
                type="button"
                onClick={() => openCollection(row.username)}
                className={
                  'w-full text-left flex items-center px-4 py-3 gap-3 border-b border-gray-50 last:border-b-0 transition-colors hover:bg-gray-50 ' +
                  (isMe ? 'bg-green-50' : '')
                }
                title={auth.label}
              >
                <span className="w-8 text-center font-bold text-gray-500 text-sm shrink-0">
                  {medal ?? `#${row.rank}`}
                </span>
                <span className={'flex-1 font-medium truncate ' + (isMe ? 'text-green-800' : 'text-gray-800')}>
                  {row.username}
                  {isMe && <span className="ml-2 text-xs text-green-600 font-normal">(deg)</span>}
                </span>
                <span className="text-right shrink-0">
                  <span className="text-yellow-500 font-bold text-sm">{row.score} ⭐</span>
                  {row.daily_catch_count > 0 && (
                    <span className="block text-xs text-amber-500">({regularPoints} + {dailyPoints} 🌟 daglig)</span>
                  )}
                </span>
                <span className={`text-sm shrink-0 ${auth.color}`} title={auth.label}>
                  {auth.icon}
                </span>
                <span className="text-gray-400 text-xs shrink-0 hidden sm:block">
                  {row.valid_catch_count} funn
                </span>
              </button>
            );
          })}

          {top50.length === 0 && (
            <div className="py-10 text-center text-gray-400 text-sm">
              Ingen spillere ennå – vær den første!
            </div>
          )}
        </div>
      )}

      {activeTab === 'liste' && !loading && !error && !currentUserInTop50 && currentUsername && (
        <div className="mx-4 mt-4 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-2 text-xs text-gray-400 border-b border-dashed border-gray-200">
            ·  ·  ·  Din plassering
          </div>
          <div className="flex items-center px-4 py-3 gap-3 bg-green-50">
            <span className="w-8 text-center font-bold text-gray-400 text-sm shrink-0">
              #{top50.length + 1}+
            </span>
            <span className="flex-1 font-medium text-green-800 truncate">
              {currentUsername}
              <span className="ml-2 text-xs text-green-600 font-normal">(deg)</span>
            </span>
            <span className="text-xs text-gray-400">Ikke i topp 50 ennå</span>
          </div>
        </div>
      )}

      {selectedUsername && (
        <div
          className="fixed inset-0 z-40 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={closeCollection}
        >
          <div
            className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-800">{selectedUsername}</h3>
                <p className="text-xs text-gray-500">Funnede sommerfugler</p>
              </div>
              <button
                type="button"
                onClick={closeCollection}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Lukk
              </button>
            </div>

            <div className="p-4">
              {collectionLoading && (
                <p className="text-sm text-gray-500">Laster funn…</p>
              )}

              {collectionError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {collectionError}
                </div>
              )}

              {!collectionLoading && !collectionError && selectedCollection && (
                <>
                  <p className="text-xs text-gray-500 mb-3">
                    {selectedCollection.unique_species_count} unike arter · {selectedCollection.total_valid_catches} tellende funn
                  </p>

                  {selectedCollection.species.length === 0 ? (
                    <p className="text-sm text-gray-500">Ingen funn registrert ennå.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedCollection.species.map((entry) => {
                        const species = SPECIES_BY_ID[entry.species_id];
                        return (
                          <div
                            key={entry.species_id}
                            className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-100"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {species?.name_no ?? entry.species_id}
                              </p>
                              {species?.name_sci && (
                                <p className="text-xs text-gray-500 italic truncate">{species.name_sci}</p>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-gray-600 ml-3">x{entry.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
