# Backend MVP skisse for Sommerfuglfanger

Maal:
- Skjule iNaturalist API-token
- Lagre enkle spilldata (bruker, funn, poeng, gps)
- Grunnlag for highscore med enkle anti-jukseregler

Anbefalt stack (MVP):
- Backend: Supabase Edge Functions (eller liten Node/Fastify API)
- Database: PostgreSQL
- Frontend: eksisterende Vite-app
- Secrets: lagres kun i backend-plattform (ikke i frontend)

## 1) API-endepunkter (MVP)

### `POST /api/auth/login`
Beskrivelse:
- Oppretter/finner en spiller basert paa brukernavn

Request:
```json
{
  "username": "arnstein"
}
```

Response:
```json
{
  "userId": "uuid",
  "username": "arnstein",
  "sessionToken": "opaque-token"
}
```

Notat:
- For MVP holder det med enkel token/session uten full auth-provider.

### `POST /api/catches/identify`
Beskrivelse:
- Tar imot bilde + gps
- Kaller iNaturalist fra backend med hemmelig token
- Mapper treff til lokal artsliste
- Beregner poeng og lagrer funn
- Returnerer resultat til klient

Request (multipart/form-data):
- `photo`: bildefil
- `lat`: number (valgfritt)
- `lng`: number (valgfritt)
- `capturedAt`: ISO timestamp (valgfritt)

Response:
```json
{
  "accepted": true,
  "speciesId": "aglais_urticae",
  "rarity": "Vanlig",
  "score": 91,
  "pointsAwarded": 10,
  "suspicionFlags": ["missing_exif"],
  "countedInLeaderboard": true
}
```

### `GET /api/leaderboard`
Beskrivelse:
- Returnerer topp N spillere basert paa gyldige poeng

Query params:
- `limit` (default 20)
- `period` (all, month, week)

Response:
```json
{
  "rows": [
    {
      "rank": 1,
      "userId": "uuid",
      "username": "arnstein",
      "score": 1320,
      "validCatchCount": 97
    }
  ]
}
```

### `GET /api/me/stats`
Beskrivelse:
- Returnerer enkel profilstatistikk for innlogget spiller

Response:
```json
{
  "totalScore": 420,
  "validScore": 380,
  "totalCatches": 33,
  "validCatches": 29,
  "flaggedCatches": 4
}
```

## 2) Databasetabeller (MVP)

### `users`
Kolonner:
- `id uuid primary key`
- `username text unique not null`
- `created_at timestamptz not null default now()`

### `sessions`
Kolonner:
- `token text primary key`
- `user_id uuid not null references users(id)`
- `expires_at timestamptz not null`
- `created_at timestamptz not null default now()`

### `catches`
Kolonner:
- `id uuid primary key`
- `user_id uuid not null references users(id)`
- `species_id text not null`
- `rarity text not null`
- `vision_score int not null`
- `points_awarded int not null`
- `lat double precision null`
- `lng double precision null`
- `has_exif boolean null`
- `device_make text null`
- `device_model text null`
- `captured_at timestamptz null`
- `found_at timestamptz not null default now()`
- `counted_in_leaderboard boolean not null default true`
- `suspicion_flags jsonb not null default '[]'::jsonb`

Indekser:
- `idx_catches_user_found_at (user_id, found_at desc)`
- `idx_catches_leaderboard (counted_in_leaderboard, found_at desc)`
- `idx_catches_geo (lat, lng)`

### `leaderboard_scores` (valgfritt materialisert view)
Kolonner:
- `user_id`
- `score`
- `valid_catch_count`

Notat:
- Kan droppes i starten og beregnes direkte med SQL over `catches`.

## 3) Hva flyttes fra frontend til backend foerst

### Fase 1 (boer gjoeres foerst)
- Flytt kallet til iNaturalist fra frontend til backend (`/api/catches/identify`).
- Flytt poengberegning (rarity-multiplier) til backend.
- La backend returnere ferdig vurdert resultat (`pointsAwarded`, `countedInLeaderboard`).

Effekt:
- API-token eksponeres ikke i klient.
- Klienten kan ikke enkelt manipulere poeng direkte.

### Fase 2
- Lagre alle catches i DB med gps og flagg.
- Innfoer enkle serverregler for leaderboard:
  - Maks `N` tellende catches innen radius `R` meter per tidsvindu.
  - Hvis for mange funn paa samme lokasjon: sett `counted_in_leaderboard = false`.
  - Behold catchen, men flagg den.

Forslag til startverdier:
- `N = 3`, `R = 20m`, tidsvindu `24h`.

### Fase 3
- Legg til `GET /api/leaderboard` og `GET /api/me/stats`.
- Vis tydelig i UI hva som teller mot highscore og hva som er flagget.

## Eksempel: anti-jukseregler i backend

Regel 1:
- Hvis `has_exif = false`, legg til `missing_exif` i `suspicion_flags`.

Regel 2:
- Hvis ny catch er innenfor `R` meter fra forrige tellende catches og overskrider `N`, sett `counted_in_leaderboard = false`.

Regel 3:
- Hvis vision score er under terskel, avvis catch (`accepted = false`).

Notat:
- Disse reglene boer vaere myke i starten: behold data, men ekskluder fra highscore.

## Minimal leveranseplan (1-2 kvelder)

1. Opprett DB-tabeller (`users`, `sessions`, `catches`).
2. Implementer `POST /api/auth/login`.
3. Implementer `POST /api/catches/identify` med iNaturalist-kall i backend.
4. Endre frontend til aa bruke backend-endepunkt i stedet for direkte iNaturalist.
5. Implementer enkel SQL for leaderboard og eksponer `GET /api/leaderboard`.

## Miljovariabler backend

- `INAT_API_TOKEN`
- `INAT_API_URL` (default iNaturalist endpoint)
- `VISION_MIN_SCORE` (default behold dagens terskel)
- `SESSION_TTL_HOURS`

## Risiko og avgrensning

- Klient-side anti-juks kan alltid omgaas, derfor maa highscore-regler vurderes server-side.
- GPS er unoyaktig innendors; bruk radius og ikke eksakt punktmatch.
- Start enkelt: flagg og ekskluder fra highscore, ikke hard-ban brukere i MVP.
