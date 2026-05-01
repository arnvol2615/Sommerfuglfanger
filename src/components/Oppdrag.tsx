import { ACHIEVEMENTS, type UnlockedAchievement } from '../achievements';

interface OppdragProps {
  foundSpeciesIds: string[];
  dailySpeciesIds?: string[];
  unlockedAchievements: UnlockedAchievement[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function Oppdrag({ foundSpeciesIds, dailySpeciesIds = [], unlockedAchievements }: OppdragProps) {
  const unlockedMap = new Map(unlockedAchievements.map(u => [u.id, u.unlockedAt]));

  return (
    <div className="flex flex-col gap-3 p-4">
      <h2 className="text-xl font-bold text-gray-800">Oppdrag</h2>
      <p className="text-sm text-gray-500">Fullfør oppdrag og lås opp merker</p>

      <div className="flex flex-col gap-2">
        {ACHIEVEMENTS.map(achievement => {
          const unlockedAt = unlockedMap.get(achievement.id);
          const unlocked = Boolean(unlockedAt);
          const { current, total } = achievement.progress(foundSpeciesIds, dailySpeciesIds);
          const pct = Math.round((current / total) * 100);

          return (
            <div
              key={achievement.id}
              className={
                'rounded-2xl border p-4 flex items-start gap-4 ' +
                (unlocked
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-gray-100')
              }
            >
              <div className={
                'text-3xl w-12 h-12 flex items-center justify-center rounded-xl shrink-0 ' +
                (unlocked ? 'bg-green-100' : 'bg-gray-100 grayscale opacity-60')
              }>
                {achievement.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={'font-semibold text-sm ' + (unlocked ? 'text-green-800' : 'text-gray-700')}>
                    {achievement.title}
                  </p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={'text-xs font-bold px-1.5 py-0.5 rounded-full ' + (unlocked ? 'bg-green-200 text-green-800' : 'bg-gray-100 text-gray-500')}>
                      +{achievement.points} ⭐
                    </span>
                    {unlocked ? (
                      <span className="text-green-600 text-lg">✓</span>
                    ) : (
                      <span className="text-gray-300 text-lg">🔒</span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-0.5">{achievement.description}</p>

                {total > 1 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={'h-full rounded-full transition-all ' + (unlocked ? 'bg-green-500' : 'bg-green-400')}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{current}/{total}</span>
                  </div>
                )}

                {unlockedAt && (
                  <p className="text-xs text-green-600 mt-1">Låst opp {formatDate(unlockedAt)}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
