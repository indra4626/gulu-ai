-- GULU AI — Additional Schema (Topics, Memories, Reminders)
-- Run this in Supabase SQL Editor AFTER the initial schema

-- 1. Memories table (pinned moments + auto-detected)
CREATE TABLE IF NOT EXISTS memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  encrypted_content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  is_pinned BOOLEAN DEFAULT false,
  source_message_id UUID,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Reminders table (smart check-ins + events)
CREATE TABLE IF NOT EXISTS reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  encrypted_content TEXT NOT NULL,
  reminder_type TEXT NOT NULL DEFAULT 'checkin',
  trigger_date TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Add topic column to messages if not exists
ALTER TABLE messages ADD COLUMN IF NOT EXISTS topic TEXT DEFAULT 'general';

-- 4. RLS for memories
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own memories" ON memories
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own memories" ON memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own memories" ON memories
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users update own memories" ON memories
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. RLS for reminders
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own reminders" ON reminders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own reminders" ON reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reminders" ON reminders
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own reminders" ON reminders
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id, trigger_date);
CREATE INDEX IF NOT EXISTS idx_messages_topic ON messages(user_id, topic);

-- 7. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE memories;
ALTER PUBLICATION supabase_realtime ADD TABLE reminders;
