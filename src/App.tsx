import { useState } from "react";
import "./App.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useGameState } from "./hooks/useGameState";
import { ScoreHeader } from "./components/ScoreHeader";
import { CameraCapture } from "./components/CameraCapture";
import { IdentificationResult } from "./components/IdentificationResult";
import { FamilyList } from "./components/FamilyList";
import { LoginScreen } from "./components/LoginScreen";
import { CatchResultModal } from "./components/CatchResultModal";
import { scoreImage, type VisionResult } from "./services/inatVision";
import { SPECIES, type Species } from "./data/butterflies";

type Tab = "camera" | "collection";

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
}

function AppContent() {
  const { isAuthenticated, jwt, logout } = useAuth();
  const { state, registerSpecies } = useGameState();
  const [tab, setTab] = useState<Tab>("camera");
  const [pending, setPending] = useState<PendingIdentification | null>(null);
  const [lastCatch, setLastCatch] = useState<LastCatch | null>(null);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  async function handleCapture(file: File, previewUrl: string) {
    setPending({ file, previewUrl, results: [], isLoading: true, error: null });
    try {
      const response = await scoreImage(file, jwt!);
      setPending(prev =>
        prev ? { ...prev, results: response.results, isLoading: false } : null
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Noe gikk galt ved gjenkjenning.";
      setPending(prev => prev ? { ...prev, isLoading: false, error: message } : null);
    }
  }

  function handleConfirm(species: Species) {
    const previewUrl = pending?.previewUrl ?? "";
    const { isNew, points } = registerSpecies(species.id, species.rarity);

    const familySpecies = SPECIES.filter(s => s.family === species.family);
    const familyTotal = familySpecies.length;
    const alreadyFoundInFamily = familySpecies.filter(s => state.foundSpecies[s.id]).length;
    const familyFound = isNew ? alreadyFoundInFamily + 1 : alreadyFoundInFamily;

    setPending(null);
    setLastCatch({
      species,
      isNew,
      points,
      previewUrl,
      familyFound,
      familyTotal,
    });
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
        ) : tab === "camera" ? (
          <div className="flex flex-col items-center">
            <CameraCapture onCapture={handleCapture} />
            <p className="text-sm text-gray-500 text-center max-w-xs px-4">
              Ta bilde av en sommerfugl og vi identifiserer arten for deg!
            </p>
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
