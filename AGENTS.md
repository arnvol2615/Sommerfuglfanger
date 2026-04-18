# AGENTS.md

This file documents repository-specific guidance for AI agents and contributors.

## Goal

Deliver safe, small, verifiable changes to Sommerfuglfanger without breaking login, camera capture, or species scoring.

## Architecture Snapshot

- Frontend: React + TypeScript + Vite
- Main app flow: `src/App.tsx`
- Auth storage and state: `src/context/AuthContext.tsx`
- Game state and points: `src/hooks/useGameState.ts`
- Vision API integration: `src/services/inatVision.ts`
- Species source of truth: `src/data/butterflies.ts`

## Hard Constraints

- Keep species IDs and taxon mappings stable unless explicitly requested.
- Do not lower result quality safeguards casually (`MIN_SCORE` in vision service).
- Do not introduce backend assumptions; this app currently runs fully client-side.
- Never commit secrets or personal tokens.

## Safe Change Checklist

Before editing:

1. Identify affected flow: login, camera, identification, or collection.
2. Read the nearest source file fully before making changes.
3. Check if localStorage keys or data shapes are impacted.

After editing:

1. Run `npm run lint`.
2. Run `npm run build`.
3. Manually verify the touched flow in browser.

## Definition of Done

A change is done only when:

1. Build passes.
2. Lint passes.
3. Main user flow affected by the change has been manually tested.
4. README and this file are updated if behavior or setup changed.

## Common Pitfalls

- Changing `useGameState` structure without migration can reset player progress.
- Modifying species IDs in `butterflies.ts` breaks existing saved collection data.
- Relaxing score filters in `inatVision.ts` can produce noisy identifications.

## If You Need New Config

If adding environment variables:

1. Add defaults and validation in code.
2. Update `.env.example`.
3. Document each variable in `README.md`.

## Preferred Commit Style

- Keep commits small and scoped to one concern.
- Include why the change was needed, not only what changed.
