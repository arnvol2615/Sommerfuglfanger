import { useState, useEffect } from 'react';
import type { VisionResult } from '../services/inatVision';
import type { Rarity, Species } from '../data/butterflies';

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

function rarityMultiplier(rarity: Rarity): number {
  switch (rarity) {
    case 'Svaert sjelden':
      return 3;
    case 'Sjelden':
      return 2;
    case 'Uvanlig':
      return 1.5;
    case 'Vanlig':
    default:
      return 1;
  }
}

interface IdentificationResultProps {
  results: VisionResult[];
  previewUrl: string;
  onConfirm: (species: Species, visionResult?: VisionResult) => void;
  onDismiss: () => void;
  isLoading: boolean;
  error: string | null;
}

export function IdentificationResult({
  results,
  previewUrl,
  onConfirm,
  onDismiss,
  isLoading,
  error,
}: IdentificationResultProps) {
  const [selected, setSelected] = useState<Species | null>(null);
  const [isAutoConfirming, setIsAutoConfirming] = useState(false);

  // Auto-select and auto-confirm the result with the highest score if it's clearly the best
  // Threshold: 10+ percentage points better than second place, or only 1 result
  useEffect(() => {
    if (results.length > 0) {
      const sorted = [...results].sort((a, b) => b.score - a.score);
      const best = sorted[0];
      const secondBest = sorted[1];
      
      // Auto-confirm if: only 1 result, or best is 10+ points better than second
      const shouldAutoConfirm = results.length === 1 || (best.score - (secondBest?.score ?? 0)) >= 10;
      
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected(best.species);
      if (shouldAutoConfirm) {
        setIsAutoConfirming(true);
        // Auto-confirm after a brief delay to show the selection
        const timer = setTimeout(() => {
          onConfirm(best.species, best);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [results, onConfirm]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <img src={previewUrl} alt="Analyserer..." className="w-48 h-48 rounded-2xl object-cover opacity-60" />
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Gjenkjenner sommerfuglen…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <button onClick={onDismiss} className="text-green-700 underline">Prøv igjen</button>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 text-center">
        <img src={previewUrl} alt="Bilde" className="w-48 h-48 rounded-2xl object-cover" />
        <p className="text-gray-700 font-medium">Ingen norsk dagsommerfugl funnet i bildet.</p>
        <p className="text-sm text-gray-500">Prøv å ta et nærmere bilde, helst mot en lys bakgrunn.</p>
        <button
          onClick={onDismiss}
          className="mt-2 bg-green-600 text-white font-bold rounded-full px-6 py-3"
        >
          Ta nytt bilde
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <img src={previewUrl} alt="Ditt bilde" className="w-full max-w-sm mx-auto rounded-2xl object-cover max-h-56" />
      <h2 className="text-lg font-bold text-gray-800 text-center">Hva er dette?</h2>
      <p className="text-center text-sm text-gray-500">
        {isAutoConfirming ? 'Registreres automatisk...' : 'Flere treff - velg den riktige:'}
      </p>
      <ul className="flex flex-col gap-2">
        {results.map(r => (
          <li key={r.species.id}>
            <button
              onClick={() => !isAutoConfirming && setSelected(r.species)}
              disabled={isAutoConfirming}
              className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-colors ${
                selected?.id === r.species.id
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200 bg-white'
              } ${isAutoConfirming ? 'opacity-50' : ''}`}
            >
              <div className="font-semibold text-gray-800">{r.species.name_no}</div>
              <div className="text-sm text-gray-400 italic">{r.species.name_sci}</div>
              <div className="mt-2">
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${rarityBadgeClasses(r.species.rarity)}`}>
                  {rarityBadgeText(r.species.rarity)}
                </span>
              </div>
              <div className="text-xs text-green-700 mt-1">
                Sikkerhet: {Math.round(r.score)}%
              </div>
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-3 mt-2">
        {!isAutoConfirming && (
          <button
            onClick={onDismiss}
            className="flex-1 border-2 border-gray-300 text-gray-600 font-bold rounded-full py-3"
          >
            Avbryt
          </button>
        )}
        {!isAutoConfirming && (
          <button
            onClick={() => {
              const visionResult = results.find(r => r.species.id === selected?.id);
              if (selected) onConfirm(selected, visionResult);
            }}
            disabled={!selected}
            className="flex-1 bg-green-600 disabled:bg-gray-300 text-white font-bold rounded-full py-3 transition-colors"
          >
            Registrer {selected && `(${Math.round(results.find(r => r.species.id === selected.id)?.score ?? 0)}%, +${Math.round(10 * rarityMultiplier(selected.rarity))})`}
          </button>
        )}
      </div>
    </div>
  );
}
