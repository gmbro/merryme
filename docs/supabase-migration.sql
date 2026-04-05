/* ==========================================================
   MerryMe — Supabase Database Migration
   
   Run this SQL in the Supabase Dashboard → SQL Editor
   or using Supabase CLI: supabase db push
   ========================================================== */

-- 1. 세션 테이블 (비로그인 사용자도 사용 가능)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NULL,
  couple_name_her TEXT,
  couple_name_him TEXT,
  her_photo_urls TEXT[] DEFAULT '{}',
  him_photo_urls TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read sessions (for gallery sharing)
CREATE POLICY "Sessions are publicly readable"
  ON sessions FOR SELECT USING (true);

-- Policy: Service role can insert/update
CREATE POLICY "Service role can manage sessions"
  ON sessions FOR ALL USING (true) WITH CHECK (true);

-- 2. 생성된 이미지 테이블
CREATE TABLE IF NOT EXISTS generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  step TEXT NOT NULL CHECK (step IN ('snapshot', 'styling', 'venue', 'honeymoon')),
  theme TEXT,
  image_url TEXT NOT NULL,
  prompt TEXT,
  metadata JSONB DEFAULT '{}',
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Generated images are publicly readable"
  ON generated_images FOR SELECT USING (true);

CREATE POLICY "Service role can manage generated_images"
  ON generated_images FOR ALL USING (true) WITH CHECK (true);

-- Index for fast session lookups
CREATE INDEX idx_generated_images_session ON generated_images(session_id);
CREATE INDEX idx_generated_images_step ON generated_images(session_id, step);

-- 3. 예식장 캐시 테이블
CREATE TABLE IF NOT EXISTS venue_cache (
  id SERIAL PRIMARY KEY,
  business_name TEXT NOT NULL,
  road_address TEXT,
  jibun_address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  phone TEXT,
  hall_count INTEGER,
  representative TEXT,
  sido TEXT,
  sigungu TEXT,
  is_operating BOOLEAN DEFAULT true,
  cached_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE venue_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venues are publicly readable"
  ON venue_cache FOR SELECT USING (true);

CREATE POLICY "Service role can manage venue_cache"
  ON venue_cache FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_venue_sido ON venue_cache(sido);
CREATE INDEX idx_venue_sigungu ON venue_cache(sido, sigungu);

-- 4. 갤러리 공유 테이블
CREATE TABLE IF NOT EXISTS shared_galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  share_code TEXT UNIQUE NOT NULL,
  is_public BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shared_galleries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shared galleries are publicly readable"
  ON shared_galleries FOR SELECT USING (is_public = true);

CREATE POLICY "Service role can manage shared_galleries"
  ON shared_galleries FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_shared_galleries_code ON shared_galleries(share_code);
CREATE INDEX idx_shared_galleries_session ON shared_galleries(session_id);

-- 5. Updated_at 자동 갱신 trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
