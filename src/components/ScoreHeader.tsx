interface ScoreHeaderProps {
  totalPoints: number;
  foundCount: number;
  totalCount: number;
  onCollectionClick: () => void;
}

export function ScoreHeader({ totalPoints, foundCount, totalCount, onCollectionClick }: ScoreHeaderProps) {
  return (
    <header className="bg-green-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🦋</span>
        <span className="font-bold text-lg tracking-tight">Sommerfuglfanger</span>
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
