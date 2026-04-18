import type { Species } from '../data/butterflies';

interface CatchResultModalProps {
  species: Species;
  isNew: boolean;
  points: number;
  previewUrl: string;
  familyFound: number;
  familyTotal: number;
  onClose: () => void;
}

function rarityVisual(rarity: Species['rarity']) {
  switch (rarity) {
    case 'Svaert sjelden':
      return {
        badge: '👑 4★ Legendarisk',
        ring: 'ring-red-300',
        chip: 'bg-red-100 text-red-800 border-red-200',
      };
    case 'Sjelden':
      return {
        badge: '💎 3★ Sjelden',
        ring: 'ring-amber-300',
        chip: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    case 'Uvanlig':
      return {
        badge: '✨ 2★ Uvanlig',
        ring: 'ring-blue-300',
        chip: 'bg-blue-100 text-blue-800 border-blue-200',
      };
    case 'Vanlig':
    default:
      return {
        badge: '🍃 1★ Vanlig',
        ring: 'ring-green-300',
        chip: 'bg-green-100 text-green-800 border-green-200',
      };
  }
}

function redListLabel(category: Species['redlistCategory']) {
  switch (category) {
    case 'CR':
      return 'Kritisk truet (CR)';
    case 'EN':
      return 'Sterkt truet (EN)';
    case 'VU':
      return 'Saarbar (VU)';
    case 'NT':
      return 'Naer truet (NT)';
    case 'LC':
      return 'Livskraftig (LC)';
    case 'DD':
      return 'Datamangel (DD)';
    case 'NA':
      return 'Ikke egnet (NA)';
    case 'NE':
    default:
      return 'Ikke vurdert (NE)';
  }
}

export function CatchResultModal({
  species,
  isNew,
  points,
  previewUrl,
  familyFound,
  familyTotal,
  onClose,
}: CatchResultModalProps) {
  const visual = rarityVisual(species.rarity);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden animate-[fadeIn_.2s_ease-out]">
        <div className="relative p-5 bg-gradient-to-b from-green-50 to-white">
          <div className="absolute right-4 top-4 text-xs font-semibold text-gray-500">
            +{points} stjerner
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-green-700">
              {isNew ? 'Ny art fanget!' : 'Registrert igjen'}
            </p>
            <h3 className="mt-1 text-xl font-bold text-gray-900">{species.name_no}</h3>
            <p className="text-sm italic text-gray-500">{species.name_sci}</p>
          </div>

          <div className="mt-4 flex justify-center">
            <img
              src={previewUrl}
              alt={species.name_no}
              className={`h-44 w-44 rounded-2xl object-cover ring-4 ${visual.ring}`}
            />
          </div>

          <div className="mt-4 flex justify-center">
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${visual.chip}`}>
              {visual.badge}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 text-xs">
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700">
              Rodliste Norge: <span className="font-semibold">{redListLabel(species.redlistCategory)}</span>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700">
              Familieprogresjon: <span className="font-semibold">{familyFound}/{familyTotal}</span>
            </div>
          </div>
        </div>

        <div className="p-4">
          <button
            onClick={onClose}
            className="w-full rounded-full bg-green-600 py-3 font-bold text-white transition-colors hover:bg-green-700"
          >
            Fortsett jakten
          </button>
        </div>
      </div>
    </div>
  );
}
