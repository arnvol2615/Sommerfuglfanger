-- Sommerfuglfanger Database Schema
-- Run these SQL queries in Supabase to set up the database

-- Extensions used for auth/security
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- 1. Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username citext UNIQUE NOT NULL,
  email text UNIQUE,
  password_hash text NOT NULL,
  password_updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_users_email_lower_unique
  ON users (LOWER(email))
  WHERE email IS NOT NULL;

-- Optional hardening: keep usernames simple and consistent
ALTER TABLE users
  ADD CONSTRAINT users_username_format_check
  CHECK (username ~ '^[a-zA-Z0-9_.-]{3,32}$');

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

-- 2b. Create auth rate limit table
CREATE TABLE auth_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  bucket_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_auth_rate_limits_lookup
  ON auth_rate_limits(action, bucket_key, created_at DESC);

-- 2c. Create password reset token table
CREATE TABLE password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  requested_ip text,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

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
  suspicion_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_daily boolean NOT NULL DEFAULT false
);

-- Create indexes for efficient queries
CREATE INDEX idx_catches_user_found_at ON catches(user_id, found_at DESC);
CREATE INDEX idx_catches_leaderboard ON catches(counted_in_leaderboard, found_at DESC);
CREATE INDEX idx_catches_geo ON catches(lat, lng);
CREATE INDEX idx_catches_species ON catches(species_id);

-- 4. Create user_achievements table
CREATE TABLE user_achievements (
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id text NOT NULL,
  unlocked_at    timestamptz NOT NULL DEFAULT now(),
  points_awarded integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);

-- 5. Create view for leaderboard (top users by valid catches)
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

-- 6b. Migration for existing databases that already have users
-- Run this block once in environments created with the old schema.
-- It keeps existing usernames but adds secure password support.
--
-- BEGIN;
-- CREATE EXTENSION IF NOT EXISTS citext;
-- ALTER TABLE users ALTER COLUMN username TYPE citext;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS email text;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS password_updated_at timestamptz NOT NULL DEFAULT now();
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower_unique
--   ON users (LOWER(email))
--   WHERE email IS NOT NULL;
-- CREATE TABLE IF NOT EXISTS auth_rate_limits (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   action text NOT NULL,
--   bucket_key text NOT NULL,
--   created_at timestamptz NOT NULL DEFAULT now()
-- );
-- CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_lookup
--   ON auth_rate_limits(action, bucket_key, created_at DESC);
-- CREATE TABLE IF NOT EXISTS password_reset_tokens (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--   token_hash text NOT NULL UNIQUE,
--   requested_ip text,
--   expires_at timestamptz NOT NULL,
--   used_at timestamptz,
--   created_at timestamptz NOT NULL DEFAULT now()
-- );
-- CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
-- CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
-- UPDATE users
-- SET password_hash = crypt(encode(gen_random_bytes(24), 'hex'), gen_salt('bf'))
-- WHERE password_hash IS NULL;
-- ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;
-- ALTER TABLE users
--   ADD CONSTRAINT users_username_format_check
--   CHECK (username ~ '^[a-zA-Z0-9_.-]{3,32}$');
-- COMMIT;

-- 6c. Migration: add is_daily column to existing catches table
-- ALTER TABLE catches ADD COLUMN IF NOT EXISTS is_daily boolean NOT NULL DEFAULT false;
-- CREATE INDEX IF NOT EXISTS idx_catches_daily ON catches(user_id, is_daily, found_at DESC);

-- 6d. Migration: add points_awarded to user_achievements
-- ALTER TABLE user_achievements ADD COLUMN IF NOT EXISTS points_awarded integer NOT NULL DEFAULT 0;

-- 7. Create function to compute user authenticity score
CREATE OR REPLACE FUNCTION compute_user_authenticity(user_id_param uuid)
RETURNS TABLE(authenticity_score numeric, has_suspicious_activity boolean) AS $$
DECLARE
  total_catches INT;
  catches_with_exif INT;
  unique_locations INT;
  exif_percentage numeric;
  device_variety INT;
BEGIN
  -- Count total valid catches, EXIF-tagged, and unique GPS locations
  SELECT COUNT(*),
         SUM(CASE WHEN has_exif THEN 1 ELSE 0 END),
         COUNT(DISTINCT (ROUND(lat::numeric, 4), ROUND(lng::numeric, 4)))
  INTO total_catches, catches_with_exif, unique_locations
  FROM catches
  WHERE user_id = user_id_param AND counted_in_leaderboard = true;

  -- Handle no catches case
  IF total_catches = 0 THEN
    RETURN QUERY SELECT 0.5::numeric, false;
    RETURN;
  END IF;

  -- Calculate EXIF percentage
  exif_percentage := COALESCE(catches_with_exif::numeric / total_catches, 0);

  -- Count unique device makes
  SELECT COUNT(DISTINCT device_make)
  INTO device_variety
  FROM catches
  WHERE user_id = user_id_param AND counted_in_leaderboard = true AND device_make IS NOT NULL;

  -- Compute authenticity score (0-1 scale)
  -- 40% = EXIF presence, 35% = location diversity, 25% = device consistency
  RETURN QUERY SELECT
    (exif_percentage * 0.4 +
     LEAST(unique_locations::numeric / NULLIF(total_catches::numeric, 0), 1.0) * 0.35 +
     (1.0 - LEAST(device_variety::numeric / NULLIF(total_catches::numeric, 0), 1.0)) * 0.25)::numeric,
    -- Suspicious if: <20% EXIF, only 1 location (within 10m), or unusual device patterns
    (exif_percentage < 0.2 OR unique_locations <= 1)::boolean;
END;
$$ LANGUAGE plpgsql;

-- Set up Supabase environment variables needed:
-- SUPABASE_URL=https://YOUR_PROJECT.supabase.co
-- SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  (from Settings → API)
-- INAT_API_TOKEN=your_inaturalist_api_token (from https://www.inaturalist.org/users/api_token)
