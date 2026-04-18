import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
);

// ── Login ────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  userId: string;
  username: string;
  sessionToken: string;
}

export async function login(username: string): Promise<LoginResponse> {
  const { data, error } = await supabase.functions.invoke('login', {
    body: { username },
    headers: {}, // Fjern Authorization for public endpoint
  });
  if (error) throw new Error(error.message ?? 'Innlogging feilet');
  return data as LoginResponse;
}

// ── Identify (get vision results) ────────────────────────────────────────────

import type { VisionResult } from './inatVision';

export interface ScoreImageResponse {
  accepted: boolean;
  reason?: string;
  results: VisionResult[];
}

export async function scoreImageViaBackend(
  sessionToken: string,
  photo: File
): Promise<ScoreImageResponse> {
  const form = new FormData();
  form.append('photo', photo);

  const { data, error } = await supabase.functions.invoke('identify', {
    body: form,
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
  if (error) throw new Error(error.message ?? 'Identifisering feilet');
  return data as ScoreImageResponse;
}

// ── Confirm Catch (save to database) ─────────────────────────────────────────

export interface ConfirmCatchResponse {
  success: boolean;
  pointsAwarded: number;
  countedInLeaderboard: boolean;
  suspicionFlags: string[];
}

export async function confirmCatch(
  sessionToken: string,
  speciesId: string,
  rarity: string,
  visionScore: number,
  options: {
    lat?: number;
    lng?: number;
    hasExif?: boolean;
    deviceMake?: string;
    deviceModel?: string;
  } = {}
): Promise<ConfirmCatchResponse> {
  const { data, error } = await supabase.functions.invoke('confirm-catch', {
    body: {
      species_id: speciesId,
      rarity,
      vision_score: visionScore,
      lat: options.lat,
      lng: options.lng,
      has_exif: options.hasExif,
      device_make: options.deviceMake,
      device_model: options.deviceModel,
    },
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
  if (error) throw new Error(error.message ?? 'Lagring av catch feilet');
  return data as ConfirmCatchResponse;
}

// ── Leaderboard ──────────────────────────────────────────────────────────────

export interface LeaderboardRow {
  rank: number;
  userId: string;
  username: string;
  score: number;
  validCatchCount: number;
}

export async function getLeaderboard(limit = 20): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase.functions.invoke('leaderboard', {
    body: { limit },
  });
  if (error) throw new Error(error.message ?? 'Leaderboard feilet');
  const rows = (data as { rows: Omit<LeaderboardRow, 'rank'>[] }).rows;
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}
