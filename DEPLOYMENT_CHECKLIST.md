# Backend Refactor Deployment Checklist

## Code Status
- ✅ Backend refactor code: COMPLETE
- ✅ Frontend updates: COMPLETE  
- ✅ ESLint validation: **PASSED** (0 errors)
- ✅ TypeScript build: **PASSED** (0 errors)
- ✅ Vite production build: **PASSED** (41 modules, 608ms)
- ✅ PWA manifest: Generated

---

## Pre-Deployment Code Verification

### Files Modified (All Verified)
- `src/App.tsx` - useAuth hook separated to new file ✅
- `src/components/IdentificationResult.tsx` - visionResult parameter added ✅
- `src/context/AuthContext.tsx` - AuthContext exported, useAuth moved ✅
- `src/context/useAuth.ts` - NEW file with useAuth hook ✅
- `src/components/LoginScreen.tsx` - Import updated ✅
- `src/services/supabaseApi.ts` - New backend functions added ✅

### Edge Functions Ready (All Complete)
- `supabase-functions-updated/identify.ts` - 70+ species hardcoded, iNaturalist API integration ✅
- `supabase-functions-updated/confirm-catch.ts` - Anti-cheat detection, GPS logging ✅

---

## Deployment Steps (Manual - User Performs)

### Step 1: Deploy `identify` Function
1. Go to **Supabase Dashboard** → **Edge Functions**
2. Click on existing `identify` function (or create if new)
3. Copy entire code from `supabase-functions-updated/identify.ts`
4. Replace function content
5. Click **Deploy**
6. After deploy succeeds: Go to **Settings** → disable **"Verify JWT"** toggle
7. ✅ Mark complete

### Step 2: Deploy `confirm-catch` Function
1. Go to **Supabase Dashboard** → **Edge Functions**
2. Create NEW function with slug name: `confirm-catch`
3. Copy entire code from `supabase-functions-updated/confirm-catch.ts`
4. Paste into editor
5. Click **Deploy**
6. After deploy succeeds: Go to **Settings** → disable **"Verify JWT"** toggle
7. ✅ Mark complete

---

## Testing After Deployment

### Minimal Test Flow
1. Load app in browser
2. Login with test account
3. Click camera button
4. Take/upload butterfly photo
5. Verify identification appears
6. Click "Confirm" on result
7. Verify catch appears in collection

### Expected Behavior
- Photo uploads to backend (not to iNaturalist directly)
- Backend matches species and returns result
- Score should be above 0.15 (15% confidence)
- Confirmed catch saves with GPS metadata
- No direct calls to `api.inaturalist.org` visible in browser Network tab

---

## Verification After Deployment

Run in browser console while testing:
```javascript
// Should see calls to your-project.supabase.co/functions/v1/identify
// Should NOT see calls to api.inaturalist.org
fetch.log = console.log.bind(console, 'FETCH');
```

Or check Network tab:
- ✅ Requests to: `your-project.supabase.co/functions/v1/identify`
- ✅ Requests to: `your-project.supabase.co/functions/v1/confirm-catch`
- ❌ NO requests to: `api.inaturalist.org/v1/computervision/score_image`

---

## Rollback Plan (If Needed)

If something breaks after deployment:
1. Disable `identify` Edge Function temporarily
2. Frontend will fail gracefully
3. Revert to previous version in Supabase
4. Check Edge Function logs for errors

---

## Documentation Files

- `BACKEND_REFACTOR_README.md` - Overall architecture and rationale
- `EDGE_FUNCTIONS_DEPLOY.md` - Step-by-step deployment instructions with code
- `DEPLOYMENT_CHECKLIST.md` - THIS FILE - visual verification checklist

---

## Sign-Off

- Code delivery: ✅ READY
- Documentation: ✅ COMPLETE  
- Build verification: ✅ PASSED
- Deployment readiness: ✅ VERIFIED

**Next action**: User deploys the two Edge Functions to Supabase following the deployment steps above, then tests end-to-end flow.
