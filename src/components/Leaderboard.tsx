import { useEffect, useState } from 'react';
import { getLeaderboard, type LeaderboardRow } from '../services/supabaseApi';

interface LeaderboardProps {
  currentUsername: string | null;
}

export function Leaderboard({ currentUsername }: LeaderboardProps) {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="flex flex-col min-h-0 pb-4">
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-xl font-bold text-gray-800">🏆 Highscore</h2>
        <p className="text-sm text-gray-500">Topp 50 sommerfuglfangere</p>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-16 text-gray-400 text-sm">
          Laster highscore…
        </div>
      )}

      {error && (
        <div className="mx-4 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="flex flex-col mx-4 gap-0 rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white">
          {top50.map((row) => {
            const isMe = row.username === currentUsername;
            const medal = medalEmoji(row.rank);
            const auth = authenticityIcon(row.authenticity_score, row.has_suspicious_activity);
            return (
              <div
                key={row.username}
                className={
                  'flex items-center px-4 py-3 gap-3 border-b border-gray-50 last:border-b-0 ' +
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
                <span className="text-yellow-500 font-bold text-sm shrink-0">
                  {row.score} ⭐
                </span>
                <span className={`text-sm shrink-0 ${auth.color}`} title={auth.label}>
                  {auth.icon}
                </span>
                <span className="text-gray-400 text-xs shrink-0 hidden sm:block">
                  {row.valid_catch_count} funn
                </span>
              </div>
            );
          })}

          {top50.length === 0 && (
            <div className="py-10 text-center text-gray-400 text-sm">
              Ingen spillere ennå – vær den første!
            </div>
          )}
        </div>
      )}

      {!loading && !error && !currentUserInTop50 && currentUsername && (
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
    </div>
  );
}
