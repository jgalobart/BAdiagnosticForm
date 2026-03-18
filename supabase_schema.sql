-- Supabase Schema for Diagnostic Form
-- Run this in your Supabase SQL Editor

-- Table: diagnostic_sessions
-- Stores each form session with user info and results
CREATE TABLE diagnostic_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Status tracking
  status TEXT DEFAULT 'started' CHECK (status IN ('started', 'intro_completed', 'in_progress', 'completed', 'abandoned')),
  current_area INTEGER,
  
  -- Intro data (denormalized for easy querying)
  id_tiquet TEXT,
  cif_empresa TEXT,
  business_name TEXT,
  contact_name TEXT,
  nif_usuari TEXT,
  nom_usuari TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  district TEXT,
  barri TEXT,
  sector TEXT,
  activity_type TEXT,
  activity_other TEXT,
  years_in_operation TEXT,
  team_size TEXT,
  
  -- Full intro data as JSON
  intro_data JSONB,
  
  -- Results (populated on completion)
  total_score INTEGER,
  area_scores JSONB,
  priority_areas JSONB,
  global_threshold TEXT,
  recommended_hours TEXT
);

-- Table: diagnostic_answers
-- Stores each answer individually for tracking abandonment
CREATE TABLE diagnostic_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES diagnostic_sessions(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  -- Single choice answer
  option_id TEXT,
  -- Multiple choice answer
  option_ids JSONB,
  -- Free text answer
  answer_text TEXT,
  -- Type of answer stored
  answer_type TEXT DEFAULT 'single_choice' CHECK (answer_type IN ('single_choice', 'multiple_choice', 'text')),
  -- Score to use for aggregations (for multiple_choice this is the sum)
  score INTEGER NOT NULL,
  area INTEGER NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint to allow upsert
  UNIQUE(session_id, question_id)
);

-- Indexes for performance
CREATE INDEX idx_sessions_status ON diagnostic_sessions(status);
CREATE INDEX idx_sessions_created_at ON diagnostic_sessions(created_at);
CREATE INDEX idx_sessions_email ON diagnostic_sessions(email);
CREATE INDEX idx_answers_session_id ON diagnostic_answers(session_id);

-- Enable Row Level Security (RLS)
ALTER TABLE diagnostic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_answers ENABLE ROW LEVEL SECURITY;

-- Policies: Allow anonymous inserts and updates (for public form)
CREATE POLICY "Allow anonymous insert sessions" ON diagnostic_sessions
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous update own sessions" ON diagnostic_sessions
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous select own sessions" ON diagnostic_sessions
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous insert answers" ON diagnostic_answers
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous update answers" ON diagnostic_answers
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous select answers" ON diagnostic_answers
  FOR SELECT TO anon USING (true);

-- View: Abandoned sessions (for follow-up)
CREATE VIEW abandoned_sessions AS
SELECT 
  s.*,
  COUNT(a.id) as questions_answered,
  MAX(a.answered_at) as last_answer_at
FROM diagnostic_sessions s
LEFT JOIN diagnostic_answers a ON s.id = a.session_id
WHERE s.status != 'completed'
  AND s.last_activity_at < NOW() - INTERVAL '30 minutes'
GROUP BY s.id;

-- View: Completed sessions summary
CREATE VIEW completed_sessions_summary AS
SELECT 
  id,
  business_name,
  contact_name,
  email,
  phone,
  district,
  activity_type,
  total_score,
  global_threshold,
  recommended_hours,
  completed_at
FROM diagnostic_sessions
WHERE status = 'completed'
ORDER BY completed_at DESC;
