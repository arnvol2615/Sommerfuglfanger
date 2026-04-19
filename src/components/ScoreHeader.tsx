interface ScoreHeaderProps {
  username: string | null;
  totalPoints: number;
  foundCount: number;
  totalCount: number;
  onCollectionClick: () => void;
}

export function ScoreHeader({ username, totalPoints, foundCount, totalCount, onCollectionClick }: ScoreHeaderProps) {
  return (
    <header className="bg-green-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🦋</span>
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-lg tracking-tight">Sommerfuglfanger</span>
          {username && (
            <span className="max-w-28 truncate rounded-full bg-green-700/70 px-2 py-0.5 text-xs text-green-50">
              {username}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onCollectionClick}
        className="flex flex-col items-end"
        aria-label="Se samlingen din"
      >
        <span className="text-yellow-300 font-bold text-lg leading-none">{totalPoints} ⭐</span>
        <span className="text-green-100 text-xs">{foundCount}/{totalCount} arter</span>
      </button>
    </header>
  );
}
