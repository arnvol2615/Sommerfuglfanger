import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ── Login ────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  userId: string;
  username: string;
  sessionToken: string;
}

async function callPublicAuthFunction(
  functionName: 'login' | 'register',
  payload: { username: string; password: string; email?: string }
): Promise<LoginResponse> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as LoginResponse & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? `${functionName} feilet`);
  }

  return data;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  return callPublicAuthFunction('login', { username, password });
}

export async function register(username: string, email: string, password: string): Promise<LoginResponse> {
  return callPublicAuthFunction('register', { username, email, password });
}

export async function requestPasswordReset(payload: { email?: string; username?: string }): Promise<void> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/reset-password`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? 'reset-password request feilet');
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/reset-password`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, newPassword }),
  });

  const data = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? 'reset-password feilet');
  }
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

  // Use fetch for multipart uploads so browser controls boundary/content-type.
  const response = await fetch(`${SUPABASE_URL}/functions/v1/identify`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${sessionToken}`,
    },
    body: form,
  });

  const data = (await response.json()) as ScoreImageResponse & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? 'Identifisering feilet');
  }

  return data;
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
    isDaily?: boolean;
  } = {}
): Promise<ConfirmCatchResponse> {
  if (!speciesId || !rarity) {
    throw new Error('Mangler species_id eller rarity i klientdata');
  }

  const { data, error } = await supabase.functions.invoke('confirm-catch-ts', {
    body: {
      species_id: speciesId,
      speciesId,
      rarity,
      vision_score: visionScore,
      visionScore,
      lat: options.lat,
      lng: options.lng,
      has_exif: options.hasExif,
      hasExif: options.hasExif,
      device_make: options.deviceMake,
      deviceMake: options.deviceMake,
      device_model: options.deviceModel,
      deviceModel: options.deviceModel,
      is_daily: options.isDaily ?? false,
      isDaily: options.isDaily ?? false,
    },
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
  if (error) throw new Error(error.message ?? 'Lagring av catch feilet');
  return data as ConfirmCatchResponse;
}

// ── Leaderboard ──────────────────────────────────────────────────────────────

export interface LeaderboardRow {
  rank: number;
  username: string;
  score: number;
  valid_catch_count: number;
  daily_catch_count: number;
  authenticity_score: number;
  has_suspicious_activity: boolean;
}

export async function getLeaderboard(limit = 50): Promise<LeaderboardRow[]> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/leaderboard?limit=${limit}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
      },
    }
  );
  const data = (await response.json()) as { rows: Omit<LeaderboardRow, 'rank'>[] } & { error?: string };
  if (!response.ok) throw new Error(data.error ?? 'Leaderboard feilet');
  return data.rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

export interface LeaderboardUserSpeciesRow {
  species_id: string;
  count: number;
}

export interface LeaderboardUserCollection {
  username: string;
  total_valid_catches: number;
  unique_species_count: number;
  species: LeaderboardUserSpeciesRow[];
}

export interface MyCollectionResponse {
  leaderboard_score: number;
  valid_catch_count: number;
  daily_catch_count: number;
  unique_species_count: number;
  total_catch_count: number;
  found_species_ids: string[];
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
}

export async function getCatchHeatmapPoints(): Promise<HeatmapPoint[]> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/leaderboard?heatmap=true`,
    { headers: { apikey: SUPABASE_ANON_KEY } }
  );
  const data = (await response.json()) as { points: HeatmapPoint[] } & { error?: string };
  if (!response.ok) throw new Error(data.error ?? 'Heatmap feilet');
  return data.points;
}

export async function getLeaderboardUserCollection(username: string): Promise<LeaderboardUserCollection> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/leaderboard?username=${encodeURIComponent(username)}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
      },
    }
  );
  const data = (await response.json()) as LeaderboardUserCollection & { error?: string };
  if (!response.ok) throw new Error(data.error ?? 'Kunne ikke hente brukerens funn');
  return data;
}

export async function getMyCollection(sessionToken: string): Promise<MyCollectionResponse> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/my-collection`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${sessionToken}`,
    },
  });

  const data = (await response.json()) as MyCollectionResponse & { error?: string };
  if (!response.ok) throw new Error(data.error ?? 'Kunne ikke hente min samling');
  return data;
}
