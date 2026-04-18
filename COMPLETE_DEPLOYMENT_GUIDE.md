# Complete Deployment Guide - Sommerfuglfanger Backend

## Prerequisites
- Supabase account with a project created
- Node.js 18+ installed locally
- Git configured

---

## Phase 1: Database Setup (5 minutes)

### 1.1 Run Database Schema
1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy all SQL from `DATABASE_SCHEMA.sql`
4. Paste into editor
5. Click "Run"
6. Verify all tables created successfully:
   - `users` table
   - `sessions` table
   - `catches` table
   - `leaderboard_view` view

### 1.2 Get Supabase Credentials
1. Go to Settings → API
2. Copy: `URL` (SUPABASE_URL)
3. Copy: `anon public` key (VITE_SUPABASE_ANON_KEY)
4. Copy: `service_role` key (SUPABASE_SERVICE_ROLE_KEY) - keep this secret!
5. Store these safely - you'll need them for Edge Functions

---

## Phase 2: Edge Functions Deployment (10 minutes)

### 2.1 Deploy `identify` Function
1. Go to Supabase Dashboard → Edge Functions
2. Click "Create a new function"
3. Name it: `identify`
4. Choose Runtime: Deno
5. Copy entire code from `supabase-functions-updated/identify.ts`
6. Paste into editor
7. Click "Deploy"
8. **After deployment succeeds:**
   - Go to function Settings
   - Find "Verify JWT" toggle
   - **DISABLE it** (important - it resets on each deploy)

### 2.2 Set Secrets for `identify`
1. In the Edge Function settings, go to "Secrets"
2. Add new secret:
   - Key: `INAT_API_TOKEN`
   - Value: Your iNaturalist API token (get from https://www.inaturalist.org/users/api_token)
3. Click "Add secret"

### 2.3 Deploy `confirm-catch` Function
1. Click "Create a new function"
2. Name it: `confirm-catch`
3. Choose Runtime: Deno
4. Copy entire code from `supabase-functions-updated/confirm-catch.ts`
5. Paste into editor
6. Click "Deploy"
7. **After deployment succeeds:**
   - Go to function Settings
   - Find "Verify JWT" toggle
   - **DISABLE it**

### 2.4 Deploy `login` Function
1. Create new function: `login`
2. Copy this code:

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const body = await req.json() as { username: string };
  if (!body.username) {
    return new Response(JSON.stringify({ error: "Mangler brukernavn" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Find or create user
  let { data: user, error: selectErr } = await supabase
    .from("users")
    .select("id, username")
    .eq("username", body.username)
    .maybeSingle();

  if (!user && !selectErr) {
    const { data: newUser, error: insertErr } = await supabase
      .from("users")
      .insert({ username: body.username })
      .select()
      .single();
    
    if (insertErr) {
      return new Response(JSON.stringify({ error: `Opprett bruker feilet: ${insertErr.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    user = newUser;
  }

  if (!user) {
    return new Response(JSON.stringify({ error: "Bruker ikke funnet" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Create session
  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const { error: sessionErr } = await supabase
    .from("sessions")
    .insert({
      token: sessionToken,
      user_id: user.id,
      expires_at: expiresAt.toISOString(),
    });

  if (sessionErr) {
    return new Response(JSON.stringify({ error: `Sesjon feilet: ${sessionErr.message}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      userId: user.id,
      username: user.username,
      sessionToken,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
```

3. Click "Deploy"
4. Disable "Verify JWT" after deployment

---

## Phase 3: Frontend Configuration (5 minutes)

### 3.1 Update `.env.local`
Create or update `.env.local` in project root with:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3.2 Build Frontend
```bash
npm run build
```
Verify no errors and 81+ modules transform successfully.

---

## Phase 4: Testing (10 minutes)

### 4.1 Local Testing (Optional)
```bash
npm run dev
```
1. Open http://localhost:5173
2. Login with any username (it auto-creates)
3. Take a photo or upload butterfly image
4. Verify identification appears
5. Confirm selection and verify save

### 4.2 Network Verification
In browser DevTools → Network tab:
- ✅ Should see calls to `your-project.supabase.co/functions/v1/identify`
- ✅ Should see calls to `your-project.supabase.co/functions/v1/confirm-catch`
- ✅ Should see calls to `your-project.supabase.co/functions/v1/login`
- ❌ Should NOT see calls to `api.inaturalist.org`

### 4.3 Database Verification
In Supabase Dashboard → SQL Editor:
```sql
SELECT * FROM users LIMIT 5;
SELECT * FROM catches LIMIT 5;
SELECT * FROM leaderboard_view LIMIT 5;
```

Verify data appears after testing.

---

## Phase 5: Deployment to Production (varies)

### 5.1 Frontend Hosting Options

#### Option A: Vercel (Recommended)
```bash
npm i -g vercel
vercel login
vercel
```
Follow prompts. Set env vars in Vercel dashboard.

#### Option B: Netlify
```bash
npm i -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

#### Option C: GitHub Pages
Push to GitHub, enable Pages in Settings.

### 5.2 Custom Server
```bash
npm run build
# Copy dist/ to your server
# Set up reverse proxy (nginx/apache)
# Enable HTTPS (Let's Encrypt)
```

---

## Phase 6: Post-Deployment Verification (5 minutes)

1. Visit deployed URL
2. Create test account
3. Upload butterfly photo
4. Verify identification and save
5. Check leaderboard data in Supabase
6. Monitor Edge Function logs for errors

---

## Troubleshooting

### Error: "Ugyldig eller utløpt sesjon"
- **Cause**: Session token invalid or expired
- **Fix**: Clear localStorage (`session_token` key) and login again

### Error: "Identifisering feilet"
- **Cause**: Edge Function not deployed or JWT verification enabled
- **Fix**: 
  1. Check function is deployed
  2. Disable "Verify JWT" toggle
  3. Check INAT_API_TOKEN secret exists

### Error: "Database error"
- **Cause**: Table schema not created
- **Fix**: Run `DATABASE_SCHEMA.sql` in Supabase SQL Editor

### Photos not uploading
- **Cause**: CORS issue or Edge Function timeout
- **Fix**: Check browser console for error details, check Edge Function logs

---

## Monitoring & Maintenance

### Daily Checks
- Supabase Dashboard → Edge Functions → Logs
- Look for errors in `identify` and `confirm-catch` functions

### Weekly Checks
- Supabase Dashboard → Database → Browse data
- Verify catches are being saved correctly
- Check for suspicious patterns (many catches same location)

### Monthly Maintenance
- Review flagged catches in `suspicion_flags` column
- Verify anti-cheat rules are working

---

## Rollback Plan

If something breaks after deployment:

### Quick Rollback
1. Disable affected Edge Function in Supabase
2. Frontend will gracefully show error
3. Revert code if needed:
   ```bash
   git revert HEAD
   npm run build
   # Redeploy to hosting
   ```

### Database Rollback
```sql
-- Delete test data
DELETE FROM catches WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'test%');
DELETE FROM users WHERE username LIKE 'test%';
```

---

## Success Checklist

- [ ] Database schema created (users, sessions, catches, leaderboard_view)
- [ ] Edge Function `login` deployed and JWT disabled
- [ ] Edge Function `identify` deployed, JWT disabled, INAT_API_TOKEN secret set
- [ ] Edge Function `confirm-catch` deployed and JWT disabled
- [ ] Frontend .env.local configured with Supabase credentials
- [ ] Frontend builds without errors (npm run build)
- [ ] Local testing works (login, photo identify, save)
- [ ] Network tab shows Supabase calls, NOT iNaturalist direct calls
- [ ] Database verification shows data saved from testing
- [ ] Production URL accessible and functional
- [ ] Leaderboard view returns data

---

## System Fully Deployed ✅

When all checkboxes are complete, the system is production-ready and all security improvements are active:
- ✅ No iNaturalist token on client
- ✅ All API calls routed through backend
- ✅ Session-based authentication
- ✅ Anti-cheat detection active
- ✅ GPS location logging enabled
