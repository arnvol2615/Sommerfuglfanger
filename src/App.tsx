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
import { IssueReportModal } from "./components/IssueReportModal";
import { scoreImageViaBackend, confirmCatch, getMyCollection, unlockAchievement, createGithubIssue, type RawTopResult } from "./services/supabaseApi";
import { checkNewlyUnlocked, type UnlockedAchievement } from "./achievements";
import type { VisionResult } from "./services/inatVision";
import { SPECIES, type Species } from "./data/butterflies";

type Tab = "camera" | "collection" | "leaderboard";

interface PendingIdentification {
  file: File;
  previewUrl: string;
  results: VisionResult[];
  rawTop: RawTopResult[];
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

interface ServerCollectionStats {
  leaderboardScore: number;
  uniqueSpeciesCount: number;
}

async function hasExifMetadata(file: File): Promise<boolean> {
  // EXIF lives in JPEG APP1 segment with the "Exif\0\0" signature.
  if (!file.type.includes('jpeg') && !file.type.includes('jpg')) {
    return false;
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // JPEG SOI marker
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return false;
  }

  let offset = 2;
  while (offset + 4 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      break;
    }

    const marker = bytes[offset + 1];
    // Start of Scan or End of Image, stop parsing segments.
    if (marker === 0xda || marker === 0xd9) {
      break;
    }

    const segmentLength = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (segmentLength < 2 || offset + 2 + segmentLength > bytes.length) {
      break;
    }

    // APP1 marker
    if (marker === 0xe1) {
      const start = offset + 4;
      if (
        bytes[start] === 0x45 && // E
        bytes[start + 1] === 0x78 && // x
        bytes[start + 2] === 0x69 && // i
        bytes[start + 3] === 0x66 && // f
        bytes[start + 4] === 0x00 &&
        bytes[start + 5] === 0x00
      ) {
        return true;
      }
    }

    offset += 2 + segmentLength;
  }

  return false;
}

function AppContent() {
  const { isAuthenticated, sessionToken, username, logout } = useAuth();
  const { state, registerSpecies, addPoints } = useGameState();
  const dailyButterfly = getDailyButterfly();
  const [tab, setTab] = useState<Tab>("camera");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [pending, setPending] = useState<PendingIdentification | null>(null);
  const [lastCatch, setLastCatch] = useState<LastCatch | null>(null);
  const [dailyPhotoUrl, setDailyPhotoUrl] = useState<string | null>(null);
  const [serverFoundSpeciesIds, setServerFoundSpeciesIds] = useState<string[] | null>(null);
  const [dailySpeciesIds, setDailySpeciesIds] = useState<string[]>([]);
  const [collectionError, setCollectionError] = useState<string | null>(null);
  const [serverCollectionStats, setServerCollectionStats] = useState<ServerCollectionStats | null>(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);
  const collectionLoading = serverFoundSpeciesIds === null && collectionError === null;

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

  useEffect(() => {
    if (!isAuthenticated || !sessionToken) return;

    let cancelled = false;

    getMyCollection(sessionToken)
      .then((data) => {
        if (cancelled) return;
        setServerFoundSpeciesIds(data.found_species_ids);
        setDailySpeciesIds(data.daily_species_ids ?? []);
        setServerCollectionStats({
          leaderboardScore: data.leaderboard_score,
          uniqueSpeciesCount: data.unique_species_count,
        });
        setUnlockedAchievements(data.achievements ?? []);
        setCollectionError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setCollectionError(err instanceof Error ? err.message : 'Kunne ikke hente samling');
        setServerFoundSpeciesIds(null);
        setServerCollectionStats(null);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, sessionToken]);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  async function handleCapture(file: File, previewUrl: string) {
    setPending({ file, previewUrl, results: [], rawTop: [], isLoading: true, error: null });
    try {
      const response = await scoreImageViaBackend(sessionToken!, file);
      setPending(prev =>
        prev ? { ...prev, results: response.results, rawTop: response.rawTop ?? [], isLoading: false } : null
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

    const doRegister = async (location?: { lat: number; lng: number }) => {
      const { isNew, points, isDailyBonus, bonusPoints } = registerSpecies(species.id, species.rarity, location);
      const earnedNow = points + bonusPoints;

      if (earnedNow > 0 || isNew) {
        setServerCollectionStats(prev => {
          if (!prev) return prev;
          return {
            leaderboardScore: prev.leaderboardScore + earnedNow,
            uniqueSpeciesCount: prev.uniqueSpeciesCount + (isNew ? 1 : 0),
          };
        });
      }

      if (isNew) {
        setServerFoundSpeciesIds(prev => {
          if (!prev) return prev;
          if (prev.includes(species.id)) return prev;
          return [...prev, species.id];
        });
      }

      let hasExif = false;
      try {
        if (pending?.file) {
          hasExif = await hasExifMetadata(pending.file);
        }
      } catch {
        hasExif = false;
      }
      
      // Call backend to save catch with anti-cheat checks — must complete before unlocking achievements
      let catchSavedToBackend = false;
      try {
        await confirmCatch(sessionToken!, species.id, species.rarity, visionResult?.score ?? 0, {
          lat: location?.lat,
          lng: location?.lng,
          hasExif,
          isDaily: isDailyBonus,
        });
        catchSavedToBackend = true;
      } catch (err) {
        console.error('Backend catch save failed:', err);
        // Still show success locally even if backend call fails
      }

      const familySpecies = SPECIES.filter(s => s.family === species.family);
      const familyTotal = familySpecies.length;
      const alreadyFoundInFamily = familySpecies.filter(s => state.foundSpecies[s.id]).length;
      const familyFound = isNew ? alreadyFoundInFamily + 1 : alreadyFoundInFamily;

      // Check and unlock newly met achievements — only after catch is confirmed saved on backend
      if (sessionToken && catchSavedToBackend) {
        const updatedFoundIds = isNew
          ? [...(serverFoundSpeciesIds ?? Object.keys(state.foundSpecies)), species.id]
          : (serverFoundSpeciesIds ?? Object.keys(state.foundSpecies));
        const updatedDailyIds = isDailyBonus && !dailySpeciesIds.includes(species.id)
          ? [...dailySpeciesIds, species.id]
          : dailySpeciesIds;
        if (isDailyBonus && !dailySpeciesIds.includes(species.id)) {
          setDailySpeciesIds(updatedDailyIds);
        }
        const newlyUnlocked = checkNewlyUnlocked(updatedFoundIds, unlockedAchievements, updatedDailyIds);
        if (newlyUnlocked.length > 0) {
          const now = new Date().toISOString();
          setUnlockedAchievements(prev => [
            ...prev,
            ...newlyUnlocked.map(a => ({ id: a.id, unlockedAt: now })),
          ]);
          newlyUnlocked.forEach(a => {
            unlockAchievement(sessionToken, a.id)
              .then(pts => {
                if (pts > 0) {
                  addPoints(pts);
                  setServerCollectionStats(prev =>
                    prev ? { ...prev, leaderboardScore: prev.leaderboardScore + pts } : prev
                  );
                }
              })
              .catch(() => {});
          });
        }
      }

      setPending(null);
      setLastCatch({ species, isNew, points, previewUrl, familyFound, familyTotal, isDailyBonus, bonusPoints });
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          void doRegister({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          void doRegister(); // permission denied or error — register without location
        },
        { timeout: 5000, maximumAge: 60000 }
      );
    } else {
      void doRegister();
    }
  }

  function handleDismiss() {
    setPending(null);
  }

  async function handleCreateIssue(payload: { title: string; description: string; category: 'bug' | 'feature' | 'other'; page: string }) {
    const result = await createGithubIssue(sessionToken!, {
      ...payload,
      appVersion: 'web',
    });
    return { issue_url: result.issue_url };
  }

  return (
    <div className="flex flex-col h-svh">
      <ScoreHeader
        username={username}
        totalPoints={serverCollectionStats?.leaderboardScore ?? state.totalPoints}
        foundCount={serverCollectionStats?.uniqueSpeciesCount ?? Object.keys(state.foundSpecies).length}
        totalCount={SPECIES.length}
        onCollectionClick={() => { setTab("collection"); setPending(null); }}
      />
      <main className="flex-1 overflow-y-auto">
        {pending ? (
          <IdentificationResult
            results={pending.results}
            rawTop={pending.rawTop}
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
                  <p className="mt-1 text-xs text-amber-600">Finn den og få +10 bonusstjerner – selv om du har fanget den før!</p>
                )}
              </div>
              {dailyPhotoUrl && (
                <img
                  src={dailyPhotoUrl}
                  alt={dailyButterfly.name_no}
                  className="w-full h-36 object-contain bg-amber-100"
                />
              )}
            </div>
          </div>
        ) : (
          <FamilyList
            gameState={state}
            foundSpeciesIds={serverFoundSpeciesIds ?? undefined}
            dailySpeciesIds={dailySpeciesIds}
            unlockedAchievements={unlockedAchievements}
            apiLoading={collectionLoading}
            apiError={collectionError}
          />
        )}
      </main>
      {!pending && (
        <>
          <div className="px-4 pb-2">
            <button
              type="button"
              onClick={() => setShowIssueModal(true)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              🐞 Meld feil eller forslag
            </button>
          </div>

          <nav className="flex border-t border-gray-200 bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
            {(["camera", "collection", "leaderboard"] as const).map((t) => {
              const active = tab === t;
              const label = t === "camera" ? "Kamera" : t === "collection" ? "Samling" : "Toppliste";
              const icon = t === "camera" ? "📷" : t === "collection" ? "🦋" : "🏆";
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={"flex-1 flex flex-col items-center pb-3 gap-0.5 transition-colors " + (active ? "text-green-700 bg-green-50" : "text-gray-400 hover:text-gray-500")}
                >
                  <span className={"block h-0.5 w-10 rounded-full mb-1 transition-colors " + (active ? "bg-green-600" : "bg-transparent")} />
                  <span className="text-2xl leading-none">{icon}</span>
                  <span className={"text-xs " + (active ? "font-bold" : "font-medium")}>{label}</span>
                </button>
              );
            })}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex-1 flex flex-col items-center pb-3 gap-0.5 text-gray-400 hover:text-gray-500"
            >
              <span className="block h-0.5 w-10 mb-1" />
              <span className="text-2xl leading-none">🚪</span>
              <span className="text-xs font-medium">Logg ut</span>
            </button>
          </nav>
        </>
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

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="w-full max-w-xs rounded-3xl bg-white shadow-2xl overflow-hidden animate-[fadeIn_.15s_ease-out]">
            <div className="px-6 pt-6 pb-4 text-center">
              <span className="text-4xl">🚪</span>
              <h3 className="mt-3 text-lg font-bold text-gray-900">Logg ut?</h3>
              <p className="mt-1 text-sm text-gray-500">Fremgangen din er lagret og du kan logge inn igjen når som helst.</p>
            </div>
            <div className="flex border-t border-gray-100">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-4 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Avbryt
              </button>
              <div className="w-px bg-gray-100" />
              <button
                onClick={() => { setShowLogoutConfirm(false); logout(); }}
                className="flex-1 py-4 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                Logg ut
              </button>
            </div>
          </div>
        </div>
      )}

      {showIssueModal && (
        <IssueReportModal
          currentPage={tab}
          onClose={() => setShowIssueModal(false)}
          onSubmit={handleCreateIssue}
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
