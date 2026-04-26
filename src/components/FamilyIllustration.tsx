import type { Family } from '../data/butterflies';

interface FamilyIllustrationProps {
  family: Family;
}

function WingPair({ leftFill, rightFill, leftInner, rightInner, bodyFill, stroke = '#1f2937' }: {
  leftFill: string;
  rightFill: string;
  leftInner: string;
  rightInner: string;
  bodyFill: string;
  stroke?: string;
}) {
  return (
    <svg viewBox="0 0 160 112" className="h-14 w-20 drop-shadow-sm" aria-hidden="true">
      <g fill="none" fillRule="evenodd">
        <ellipse cx="48" cy="40" rx="30" ry="20" fill={leftFill} stroke={stroke} strokeWidth="3" transform="rotate(-18 48 40)" />
        <ellipse cx="112" cy="40" rx="30" ry="20" fill={rightFill} stroke={stroke} strokeWidth="3" transform="rotate(18 112 40)" />
        <ellipse cx="54" cy="73" rx="22" ry="14" fill={leftFill} stroke={stroke} strokeWidth="3" transform="rotate(18 54 73)" />
        <ellipse cx="106" cy="73" rx="22" ry="14" fill={rightFill} stroke={stroke} strokeWidth="3" transform="rotate(-18 106 73)" />
        <circle cx="47" cy="39" r="7" fill={leftInner} opacity="0.95" />
        <circle cx="113" cy="39" r="7" fill={rightInner} opacity="0.95" />
        <circle cx="53" cy="73" r="5" fill={leftInner} opacity="0.95" />
        <circle cx="107" cy="73" r="5" fill={rightInner} opacity="0.95" />
        <rect x="74" y="23" width="12" height="58" rx="6" fill={bodyFill} />
        <path d="M79 22 C74 10 67 9 60 6" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
        <path d="M81 22 C86 10 93 9 100 6" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function Swallowtail() {
  return (
    <svg viewBox="0 0 180 120" className="h-14 w-24 drop-shadow-sm" aria-hidden="true">
      <g fill="none" fillRule="evenodd">
        <path d="M82 56 C58 20 26 20 14 48 C8 62 22 72 40 72 C56 72 70 66 82 56Z" fill="#f7d84c" stroke="#111827" strokeWidth="3" />
        <path d="M98 56 C122 20 154 20 166 48 C172 62 158 72 140 72 C124 72 110 66 98 56Z" fill="#f7d84c" stroke="#111827" strokeWidth="3" />
        <path d="M84 60 C62 76 52 92 58 108 L72 98 L80 112 L88 82Z" fill="#f7d84c" stroke="#111827" strokeWidth="3" />
        <path d="M96 60 C118 76 128 92 122 108 L108 98 L100 112 L92 82Z" fill="#f7d84c" stroke="#111827" strokeWidth="3" />
        <path d="M32 48 L76 58" stroke="#111827" strokeWidth="4" strokeLinecap="round" />
        <path d="M148 48 L104 58" stroke="#111827" strokeWidth="4" strokeLinecap="round" />
        <circle cx="39" cy="67" r="5" fill="#e45f3d" />
        <circle cx="141" cy="67" r="5" fill="#e45f3d" />
        <rect x="84" y="24" width="12" height="56" rx="6" fill="#111827" />
        <path d="M90 24 C85 12 77 9 71 6" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
        <path d="M90 24 C95 12 103 9 109 6" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function Skipper() {
  return (
    <svg viewBox="0 0 168 108" className="h-14 w-24 drop-shadow-sm" aria-hidden="true">
      <g fill="none" fillRule="evenodd">
        <ellipse cx="52" cy="42" rx="34" ry="16" fill="#c97830" stroke="#40210f" strokeWidth="3" transform="rotate(-24 52 42)" />
        <ellipse cx="116" cy="42" rx="34" ry="16" fill="#d9903d" stroke="#40210f" strokeWidth="3" transform="rotate(24 116 42)" />
        <ellipse cx="58" cy="72" rx="20" ry="12" fill="#e2aa56" stroke="#40210f" strokeWidth="3" transform="rotate(16 58 72)" />
        <ellipse cx="110" cy="72" rx="20" ry="12" fill="#e2aa56" stroke="#40210f" strokeWidth="3" transform="rotate(-16 110 72)" />
        <circle cx="45" cy="42" r="4" fill="#f8e5b1" />
        <circle cx="123" cy="42" r="4" fill="#f8e5b1" />
        <circle cx="56" cy="74" r="3" fill="#f8e5b1" />
        <circle cx="112" cy="74" r="3" fill="#f8e5b1" />
        <rect x="78" y="26" width="12" height="52" rx="6" fill="#40210f" />
        <path d="M84 25 C79 14 74 11 68 9" stroke="#40210f" strokeWidth="3" strokeLinecap="round" />
        <path d="M84 25 C89 14 94 11 100 9" stroke="#40210f" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function Illustration({ family }: FamilyIllustrationProps) {
  switch (family) {
    case 'Nymfevinger':
      return <WingPair leftFill="#d7633c" rightFill="#d7633c" leftInner="#2a2251" rightInner="#2a2251" bodyFill="#1f2937" />;
    case 'Glansvinger':
      return <WingPair leftFill="#5e8ce6" rightFill="#7aa4ff" leftInner="#e9f1ff" rightInner="#e9f1ff" bodyFill="#1e3a8a" />;
    case 'Hvitvinger':
      return <WingPair leftFill="#fff7ea" rightFill="#fff7ea" leftInner="#f97316" rightInner="#1f2937" bodyFill="#475569" stroke="#475569" />;
    case 'Svalestjerter':
      return <Swallowtail />;
    case 'Smygere':
      return <Skipper />;
    default:
      return null;
  }
}

export function FamilyIllustration({ family }: FamilyIllustrationProps) {
  return (
    <div className="rounded-2xl bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(236,253,245,0.85)_55%,_rgba(209,250,229,0.75))] px-3 py-2 ring-1 ring-emerald-100">
        <Illustration family={family} />
    </div>
  );
}