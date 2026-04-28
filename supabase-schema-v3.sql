-- GULU AI — Phase 9 Schema (Mood Tracking, Projects, Insights)
-- Run in Supabase SQL Editor as a NEW QUERY

-- 1. Mood entries table
CREATE TABLE IF NOT EXISTS mood_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mood TEXT NOT NULL,
  mood_score INTEGER NOT NULL CHECK (mood_score BETWEEN 1 AND 10),
  encrypted_note TEXT,
  triggers TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Projects table (work mode)
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  encrypted_name TEXT NOT NULL,
  encrypted_description TEXT DEFAULT '',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Insights cache table
CREATE TABLE IF NOT EXISTS insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  encrypted_data TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, week_start)
);

-- 4. RLS Policies
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own moods" ON mood_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own moods" ON mood_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own moods" ON mood_entries FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users read own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users read own insights" ON insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own insights" ON insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own insights" ON insights FOR UPDATE USING (auth.uid() = user_id);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_mood_user_date ON mood_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id, status);
CREATE INDEX IF NOT EXISTS idx_insights_user_week ON insights(user_id, week_start DESC);

-- 6. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE mood_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
