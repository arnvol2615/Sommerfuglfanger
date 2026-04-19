# Sommerfuglfanger

Mobile-first webapp where players photograph butterflies, identify species using iNaturalist Computer Vision, and build a Norwegian butterfly collection.

## Quick Start

### Requirements

- Node.js 20+
- npm 10+

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open the URL shown by Vite (typically http://localhost:5173).

## Scripts

- `npm run dev`: start Vite dev server
- `npm run build`: typecheck and production build
- `npm run lint`: run ESLint
- `npm run preview`: preview production build locally

## Gameplay and Core Flow

1. User logs in by pasting an iNaturalist API token.
2. App verifies the token against `GET /v1/users/me`.
3. User captures or selects an image from the camera input.
4. App sends image to iNaturalist CV endpoint `POST /v1/computervision/score_image`.
5. Results are filtered to known Norwegian species in this project.
6. User confirms a species and receives points if it is a new find.

## Project Structure

- `src/components`: UI components
- `src/context/AuthContext.tsx`: auth state and localStorage handling
- `src/hooks/useGameState.ts`: game progress, scoring, and persistence
- `src/services/inatVision.ts`: iNaturalist API integration and result filtering
- `src/data/butterflies.ts`: curated species dataset and lookup maps

## Auth and Storage

The app stores state in localStorage:

- `inat_jwt`: iNaturalist API token
- `sommerfuglfanger_v1`: saved game state (`foundSpecies`, `totalPoints`)

Security note:

- Token is stored in the browser only.
- Do not commit personal tokens to git.

## Vision and Matching Rules

Implemented in `src/services/inatVision.ts`:

- Minimum confidence threshold: `MIN_SCORE = 0.15`
- Primary matching: iNaturalist taxon ID -> local species map
- Fallback matching: scientific name (lowercase) -> local species map
- Max returned matches in primary pass: 3
- Secondary pass when no match: check top 10 API results

These rules are game-critical. Change with care and document any changes.

## Environment Variables

The frontend uses Vite environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Local development (`.env.local`):

```dotenv
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

GitHub Pages (GitHub Actions):

1. Add repository variables in GitHub Settings -> Secrets and variables -> Actions -> Variables.
2. Create `VITE_SUPABASE_URL`.
3. Create `VITE_SUPABASE_ANON_KEY`.

Notes:

- Values prefixed with `VITE_` are embedded in the client bundle at build time.
- `VITE_SUPABASE_ANON_KEY` is expected to be public and must be protected by proper Supabase RLS/policies.
- Keep server-side secrets (for example `INAT_API_TOKEN`) out of the frontend and store them in Supabase Function Secrets.

## AI Handoff Notes

See `AGENTS.md` for repository-specific instructions for AI agents (constraints, done criteria, and safe-change checklist).

## Roadmap and Issue Planning

Future features are tracked in `docs/issues-backlog.md`.

When GitHub CLI is available and authenticated, issues can be created in batch with:

```powershell
./scripts/create-github-issues.ps1
```

## Known Gaps

- No automated tests yet
- No CI pipeline defined in this repository

Recommended next step is to add at least smoke tests for login, capture flow, and score registration.
