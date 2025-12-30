-- Spillover Database Schema
-- Run this in your Supabase SQL Editor

-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(50) NOT NULL,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hot Takes submissions
CREATE TABLE hot_takes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hot Takes votes (one per user per hot take)
CREATE TABLE hot_take_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hot_take_id UUID REFERENCES hot_takes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  vote VARCHAR(10) NOT NULL CHECK (vote IN ('agree', 'disagree')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hot_take_id, user_id)
);

-- Hot Takes reactions (emojis)
CREATE TABLE hot_take_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hot_take_id UUID REFERENCES hot_takes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hot_take_id, user_id, emoji)
);

-- Two Truths submissions
CREATE TABLE two_truths_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  statement_1 TEXT NOT NULL,
  statement_2 TEXT NOT NULL,
  statement_3 TEXT NOT NULL,
  lie_index INTEGER NOT NULL CHECK (lie_index BETWEEN 1 AND 3),
  is_revealed BOOLEAN DEFAULT FALSE,
  reveal_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Two Truths guesses (one per user per submission)
CREATE TABLE two_truths_guesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES two_truths_submissions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  guessed_lie_index INTEGER NOT NULL CHECK (guessed_lie_index BETWEEN 1 AND 3),
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_id, user_id)
);

-- Two Truths reactions (emojis)
CREATE TABLE two_truths_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES two_truths_submissions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_id, user_id, emoji)
);

-- Indexes
CREATE INDEX idx_hot_takes_created ON hot_takes(created_at DESC);
CREATE INDEX idx_hot_take_votes_take ON hot_take_votes(hot_take_id);
CREATE INDEX idx_two_truths_reveal ON two_truths_submissions(reveal_at) WHERE NOT is_revealed;
CREATE INDEX idx_two_truths_guesses_sub ON two_truths_guesses(submission_id);

-- Function to auto-reveal two truths after the reveal time
CREATE OR REPLACE FUNCTION reveal_expired_submissions()
RETURNS void AS $$
BEGIN
  -- Mark expired submissions as revealed
  UPDATE two_truths_submissions
  SET is_revealed = TRUE
  WHERE reveal_at <= NOW() AND is_revealed = FALSE;

  -- Calculate points for correct guesses (only for unprocessed guesses)
  UPDATE two_truths_guesses g
  SET
    is_correct = (g.guessed_lie_index = s.lie_index),
    points_earned = CASE WHEN g.guessed_lie_index = s.lie_index THEN 10 ELSE 0 END
  FROM two_truths_submissions s
  WHERE g.submission_id = s.id
    AND s.is_revealed = TRUE
    AND g.is_correct IS NULL;

  -- Update user scores ONLY for newly processed guesses
  UPDATE profiles p
  SET score = p.score + sub.new_points
  FROM (
    SELECT user_id, SUM(points_earned) as new_points
    FROM two_truths_guesses
    WHERE is_correct = TRUE
      AND points_earned > 0
      AND created_at > NOW() - INTERVAL '2 minutes'
    GROUP BY user_id
  ) sub
  WHERE p.id = sub.user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hot_takes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hot_take_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hot_take_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_truths_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_truths_guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_truths_reactions ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all, update own
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Hot Takes: Anyone can read, authenticated can insert
CREATE POLICY "Hot takes viewable by authenticated" ON hot_takes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can submit hot takes" ON hot_takes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Votes: Authenticated users, one per hot take (can change vote)
CREATE POLICY "Votes viewable by authenticated" ON hot_take_votes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can vote once" ON hot_take_votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vote" ON hot_take_votes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Reactions: Similar to votes (can toggle)
CREATE POLICY "Reactions viewable by authenticated" ON hot_take_reactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can react" ON hot_take_reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own hot take reactions" ON hot_take_reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Two Truths: All authenticated can view, own submissions only
CREATE POLICY "Submissions viewable by authenticated" ON two_truths_submissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can submit own" ON two_truths_submissions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated can update own submission" ON two_truths_submissions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Guesses: One per submission per user
CREATE POLICY "Guesses viewable by authenticated" ON two_truths_guesses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can guess once" ON two_truths_guesses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Two Truths Reactions (can toggle)
CREATE POLICY "Two truths reactions viewable by authenticated" ON two_truths_reactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can react to two truths" ON two_truths_reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own two truths reactions" ON two_truths_reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE hot_takes;
ALTER PUBLICATION supabase_realtime ADD TABLE hot_take_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE hot_take_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE two_truths_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE two_truths_guesses;
ALTER PUBLICATION supabase_realtime ADD TABLE two_truths_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- ============================================
-- CRON JOB FOR AUTO-REVEAL (Set up in Supabase Dashboard)
-- ============================================
-- Enable pg_cron extension in Database > Extensions
-- Then run:
-- SELECT cron.schedule('reveal-submissions', '* * * * *', 'SELECT reveal_expired_submissions()');
