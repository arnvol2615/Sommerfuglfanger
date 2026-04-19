import { useState, useEffect } from "react";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import { useGameState, getDailyButterfly } from "./hooks/useGameState";
import { ScoreHeader } from "./components/ScoreHeader";
import { CameraCapture } from "./components/CameraCapture";
import { IdentificationResult } from "./components/IdentificationResult";
import { FamilyList } from "./components/FamilyList";
import { LoginScreen } from "./components/LoginScreen";
import { CatchResultModal } from "./components/CatchResultModal";
import { Leaderboard } from "./components/Leaderboard";
import { scoreImageViaBackend, confirmCatch } from "./services/supabaseApi";
import type { VisionResult } from "./services/inatVision";
import { SPECIES, type Species } from "./data/butterflies";

type Tab = "camera" | "collection" | "leaderboard";

interface PendingIdentification {
  file: File;
  previewUrl: string;
  results: VisionResult[];
  isLoading: boolean;
  error: string | null;
}

interface LastCatch {
  species: Species;
  isNew: boolean;
  points: number;
  previewUrl: string;
  familyFound: number;
  familyTotal: number;
  isDailyBonus: boolean;
  bonusPoints: number;
}

function AppContent() {
  const { isAuthenticated, sessionToken, username, logout } = useAuth();
  const { state, registerSpecies } = useGameState();
  const dailyButterfly = getDailyButterfly();
  const [tab, setTab] = useState<Tab>("camera");
  const [pending, setPending] = useState<PendingIdentification | null>(null);
  const [lastCatch, setLastCatch] = useState<LastCatch | null>(null);
  const [dailyPhotoUrl, setDailyPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    const sciName = encodeURIComponent(dailyButterfly.name_sci);
    fetch(`https://api.inaturalist.org/v1/taxa?q=${sciName}&rank=species&per_page=1`)
      .then(r => r.json())
      .then(data => {
        const url = data?.results?.[0]?.default_photo?.square_url;
        if (url) setDailyPhotoUrl(url);
      })
      .catch(() => { /* silently ignore, photo is optional */ });
  }, [dailyButterfly.name_sci]);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  async function handleCapture(file: File, previewUrl: string) {
    setPending({ file, previewUrl, results: [], isLoading: true, error: null });
    try {
      const response = await scoreImageViaBackend(sessionToken!, file);
      setPending(prev =>
        prev ? { ...prev, results: response.results, isLoading: false } : null
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Noe gikk galt ved gjenkjenning.";
      setPending(prev => prev ? { ...prev, isLoading: false, error: message } : null);
    }
  }

  function handleConfirm(species: Species, visionResult?: VisionResult) {
    if (!species?.id || !species?.rarity) {
      console.error('Invalid species payload in handleConfirm:', species);
      setPending(prev => prev ? { ...prev, error: 'Ugyldig artsdata mottatt. Prøv igjen.' } : null);
      return;
    }

    const previewUrl = pending?.previewUrl ?? "";

    const doRegister = (location?: { lat: number; lng: number }) => {
      const { isNew, points, isDailyBonus, bonusPoints } = registerSpecies(species.id, species.rarity, location);
      
      // Call backend to save catch with anti-cheat checks
      confirmCatch(sessionToken!, species.id, species.rarity, visionResult?.score ?? 0, {
        lat: location?.lat,
        lng: location?.lng,
        hasExif: true, // TODO: check EXIF from image metadata
      }).catch(err => {
        console.error('Backend catch save failed:', err);
        // Still show success locally even if backend call fails
      });

      const familySpecies = SPECIES.filter(s => s.family === species.family);
      const familyTotal = familySpecies.length;
      const alreadyFoundInFamily = familySpecies.filter(s => state.foundSpecies[s.id]).length;
      const familyFound = isNew ? alreadyFoundInFamily + 1 : alreadyFoundInFamily;
      setPending(null);
      setLastCatch({ species, isNew, points, previewUrl, familyFound, familyTotal, isDailyBonus, bonusPoints });
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => doRegister({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => doRegister(), // permission denied or error — register without location
        { timeout: 5000, maximumAge: 60000 }
      );
    } else {
      doRegister();
    }
  }

  function handleDismiss() {
    setPending(null);
  }

  return (
    <div className="flex flex-col min-h-svh">
      <ScoreHeader
        totalPoints={state.totalPoints}
        foundCount={Object.keys(state.foundSpecies).length}
        totalCount={SPECIES.length}
        onCollectionClick={() => { setTab("collection"); setPending(null); }}
      />
      <main className="flex-1 overflow-y-auto">
        {pending ? (
          <IdentificationResult
            results={pending.results}
            previewUrl={pending.previewUrl}
            onConfirm={handleConfirm}
            onDismiss={handleDismiss}
            isLoading={pending.isLoading}
            error={pending.error}
          />
        ) : tab === "leaderboard" ? (
          <Leaderboard currentUsername={username} />
        ) : tab === "camera" ? (
          <div className="flex flex-col items-center gap-4 pb-4">
            <CameraCapture onCapture={handleCapture} />
            <p className="text-sm text-gray-500 text-center max-w-xs px-4">
              Ta bilde av en sommerfugl og vi identifiserer arten for deg!
            </p>
            <div className="w-full max-w-xs mx-4 rounded-2xl border border-amber-200 bg-amber-50 shadow-sm overflow-hidden">
              <div className="px-4 pt-3 pb-2">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">🌟 Dagens sommerfugl</p>
                <p className="font-bold text-gray-900">{dailyButterfly.name_no}</p>
                <p className="text-xs italic text-gray-500">{dailyButterfly.name_sci}</p>
                {state.dailyBonusClaimed === new Date().toISOString().slice(0, 10) ? (
                  <p className="mt-1 text-xs text-green-700 font-semibold">✅ Bonus allerede hentet i dag!</p>
                ) : (
                  <p className="mt-1 text-xs text-amber-600">Finn den og få +50 bonusstjerner!</p>
                )}
              </div>
              {dailyPhotoUrl && (
                <img
                  src={dailyPhotoUrl}
                  alt={dailyButterfly.name_no}
                  className="w-full h-36 object-cover"
                />
              )}
            </div>
          </div>
        ) : (
          <FamilyList gameState={state} />
        )}
      </main>
      {!pending && (
        <nav className="flex border-t border-gray-200 bg-white shadow-inner">
          <button
            onClick={() => setTab("camera")}
            className={"flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors " + (tab === "camera" ? "text-green-700" : "text-gray-400")}
          >
            <span className="text-2xl">📷</span>
            Kamera
          </button>
          <button
            onClick={() => setTab("collection")}
            className={"flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors " + (tab === "collection" ? "text-green-700" : "text-gray-400")}
          >
            <span className="text-2xl">🦋</span>
            Samling
          </button>
          <button
            onClick={() => setTab("leaderboard")}
            className={"flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors " + (tab === "leaderboard" ? "text-green-700" : "text-gray-400")}
          >
            <span className="text-2xl">🏆</span>
            Toppliste
          </button>
          <button
            onClick={logout}
            className="flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium text-gray-400"
          >
            <span className="text-2xl">🚪</span>
            Logg ut
          </button>
        </nav>
      )}

      {lastCatch && (
        <CatchResultModal
          species={lastCatch.species}
          isNew={lastCatch.isNew}
          points={lastCatch.points}
          previewUrl={lastCatch.previewUrl}
          familyFound={lastCatch.familyFound}
          familyTotal={lastCatch.familyTotal}
          isDailyBonus={lastCatch.isDailyBonus}
          bonusPoints={lastCatch.bonusPoints}
          onClose={() => setLastCatch(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
