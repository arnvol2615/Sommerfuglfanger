# Deploy to Supabase Editor (copy/paste guide)

Use the files in this folder as source when you paste code into Supabase Edge Functions.

## Function slug mapping

- `register` -> paste from `supabase-functions-updated/register.ts`
- `login` -> paste from `supabase-functions-updated/login.ts`
- `identify` -> paste from `supabase-functions-updated/identify.ts`
- `confirm-catch-ts` -> paste from `supabase-functions-updated/confirm-catch-ts.ts`
- `leaderboard` -> paste from `supabase-functions-updated/leaderboard.ts`

## Important settings per function

Set `Verify JWT` to `OFF` for all functions above.

Reason:
- `register`, `login`, `leaderboard` are public endpoints.
- `identify` and `confirm-catch-ts` use your own `sessions` table token, not Supabase Auth JWT.

## Required secrets

Set these in Supabase Edge Functions secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `INAT_API_TOKEN` (used by `identify`)

## Required database changes

Before deploying `login` and `register`, apply the latest SQL so the `auth_rate_limits` table exists.

Use one of:

- `DATABASE_SCHEMA.sql`
- `supabase-functions-updated/tables.sql`

## Quick smoke tests

1. Call `register` with `{ "username": "testuser", "password": "testpassord123" }`.
2. Call `login` with same credentials and verify you get `sessionToken`.
3. Call `identify` with `Authorization: Bearer <sessionToken>` and `photo` form-data.
4. Call `confirm-catch-ts` with same `Authorization` and payload containing `species_id`, `rarity`, `vision_score`.
5. Call `leaderboard?limit=20` and verify list is returned.
