# Backend Refactor Complete: Direct iNaturalist Calls Removed

## Summary

Refactored the butterfly identification system so that **klienten IKKE lenger gjør direkte kall til iNaturalist API**. 

### Before (Usikker)
```
Klient (med JWT) → iNaturalist  [DÅRLIG: Token ligger på klient]
```

### After (Sikker)
```
Klient → Backend (foto)
Backend (med master token) → iNaturalist  [BEKLIR: Token skjult i backend]
```

---

## What Changed in Code

### 1. **Frontend Flow**
- `handleCapture()` — nå bruker `scoreImageViaBackend()` (sender bare foto)
- `handleConfirm()` — nå bruker `confirmCatch()` (lagrer confirmed catch)
- `IdentificationResult.tsx` — pass `visionResult` til onConfirm

### 2. **Two New Edge Functions**
- `identify` — mottaker foto, matcher til norske sommerfugler, returnerer results
- `confirm-catch` — lagrer confirmed catch med GPS + anti-cheat

### 3. **Backend Services**
- `scoreImageViaBackend()` — nytt navn, same contract
- `confirmCatch()` — ny funksjon for å lagre

### 4. **Deprecated**
- `scoreImage()` i `inatVision.ts` — marked deprecated, men beholder for offline fallback

---

## ✅ Build Status
- TypeScript: ✅ PASS
- Vite: ✅ PASS

---

## 🚀 Next Steps (Manual)

### Step 1: Deploy New Edge Functions

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Update `identify` function with new code (or delete + recreate)
3. Create NEW function `confirm-catch`
4. See `EDGE_FUNCTIONS_DEPLOY.md` for exact code to copy-paste

### Step 2: Configure After Deploy

After EACH function deploy:
1. Go to **Settings** in that function
2. Find "Verify JWT" toggle
3. **DISABLE it** (it auto-resets on deploy)

### Step 3: Test End-to-End

1. Login with username
2. Take photo of butterfly
3. Should see identification results
4. Confirm one → should save to leaderboard

---

## Files Modified

- `src/App.tsx` — handleCapture + handleConfirm updated
- `src/services/supabaseApi.ts` — new functions
- `src/components/IdentificationResult.tsx` — pass visionResult
- `src/services/inatVision.ts` — marked deprecated
- Build: ✅ PASS

## Technical Details

**Photo Flow:**
1. Client captures → File object
2. FormData with photo blob
3. Backend receives, converts to ArrayBuffer
4. Reconstructs as FormData with proper MIME type
5. Sends to iNaturalist with **master token**
6. Returns matched species to frontend

**Anti-Cheat:**
- Detects repeated locations in 24h window (max 3 per 20m radius)
- Flags catches without EXIF data
- Can exclude from leaderboard if suspicious

---

## Important Notes

⚠️ **JWT Toggle Resets on Deploy**
- Every time you deploy an Edge Function, the "Verify JWT" toggle resets to ON
- You MUST manually disable it again after each deploy
- Public functions need it OFF

⚠️ **Session Token Storage**
- Frontend stores `sessionToken` in localStorage (not iNat JWT)
- Backend validates session before processing
- Session expires after configurable time

⚠️ **Master Token Security**
- INAT_API_TOKEN stored as Supabase secret (never in browser)
- Only visible in Edge Functions
- Not exposed to client-side code

---

## Verifying the Change

After deploying, test:
```
1. Login → get sessionToken
2. Take photo
3. POST /identify with photo blob
4. Should get back matched species list
5. Confirm selection
6. POST /confirm-catch
7. Catch saved to leaderboard
```

🎉 Now klienten gjør IKKE direktekall til iNaturalist lenger!
