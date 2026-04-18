-- Sommerfuglfanger Database Schema
-- Run these SQL queries in Supabase to set up the database

-- 1. Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create sessions table
CREATE TABLE sessions (
  token text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for session lookups
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- 3. Create catches table
CREATE TABLE catches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  species_id text NOT NULL,
  rarity text NOT NULL,
  vision_score numeric NOT NULL,
  points_awarded integer NOT NULL,
  lat double precision,
  lng double precision,
  has_exif boolean,
  device_make text,
  device_model text,
  captured_at timestamptz,
  found_at timestamptz NOT NULL DEFAULT now(),
  counted_in_leaderboard boolean NOT NULL DEFAULT true,
  suspicion_flags jsonb NOT NULL DEFAULT '[]'::jsonb
);

-- Create indexes for efficient queries
CREATE INDEX idx_catches_user_found_at ON catches(user_id, found_at DESC);
CREATE INDEX idx_catches_leaderboard ON catches(counted_in_leaderboard, found_at DESC);
CREATE INDEX idx_catches_geo ON catches(lat, lng);
CREATE INDEX idx_catches_species ON catches(species_id);

-- 4. Create view for leaderboard (top users by valid catches)
CREATE VIEW leaderboard_view AS
SELECT 
  u.id as user_id,
  u.username,
  COALESCE(SUM(c.points_awarded), 0) as total_score,
  COUNT(CASE WHEN c.counted_in_leaderboard THEN 1 END) as valid_catch_count,
  COUNT(c.id) as total_catch_count
FROM users u
LEFT JOIN catches c ON u.id = c.user_id
GROUP BY u.id, u.username
ORDER BY total_score DESC;

-- 5. Enable Row Level Security (optional, for added security)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE catches ENABLE ROW LEVEL SECURITY;

-- 6. Create policies (example - adjust as needed)
-- CREATE POLICY "Users can view their own catches"
--   ON catches FOR SELECT
--   USING (auth.uid() = user_id);

-- Set up Supabase environment variables needed:
-- SUPABASE_URL=https://YOUR_PROJECT.supabase.co
-- SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  (from Settings → API)
-- INAT_API_TOKEN=your_inaturalist_api_token (from https://www.inaturalist.org/users/api_token)
