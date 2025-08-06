/*
  # Complete QuizWhiz Database Schema

  1. New Tables
    - `users` - User profiles with username and type
    - `quizzes` - Individual quizzes created by users
    - `group_quizzes` - Group quizzes with codes for sharing
    - `quiz_attempts` - Individual quiz attempts and scores
    - `group_participants` - Group quiz participants and their results
    - `file_uploads` - Uploaded files and extracted content
    - `user_activity` - Track all user activities

  2. Security
    - Enable RLS on all tables
    - Add policies for proper data access
    - Ensure teachers can only see their own group results
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  user_type text CHECK (user_type IN ('student', 'teacher')) NOT NULL,
  total_quizzes integer DEFAULT 0,
  total_score integer DEFAULT 0,
  average_score decimal DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Individual quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content jsonb NOT NULL,
  quiz_type text NOT NULL,
  language text DEFAULT 'en',
  difficulty text DEFAULT 'medium',
  questions_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Group quizzes table
CREATE TABLE IF NOT EXISTS group_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  quiz_code text UNIQUE NOT NULL,
  content jsonb NOT NULL,
  quiz_type text NOT NULL,
  language text DEFAULT 'en',
  difficulty text DEFAULT 'medium',
  questions_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  participants_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Individual quiz attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  percentage decimal NOT NULL,
  time_spent integer NOT NULL,
  answers jsonb NOT NULL,
  feedback jsonb,
  created_at timestamptz DEFAULT now()
);

-- Group quiz participants table
CREATE TABLE IF NOT EXISTS group_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_quiz_id uuid REFERENCES group_quizzes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  username text NOT NULL,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  percentage decimal NOT NULL,
  time_spent integer NOT NULL,
  answers jsonb NOT NULL,
  feedback jsonb,
  completed_at timestamptz DEFAULT now(),
  UNIQUE(group_quiz_id, user_id)
);

-- File uploads table
CREATE TABLE IF NOT EXISTS file_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  extracted_text text,
  upload_status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);

-- User activity table
CREATE TABLE IF NOT EXISTS user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (id = (SELECT id FROM users WHERE username = current_setting('app.current_username', true)));
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (true);

-- Quizzes policies
CREATE POLICY "Users can read own quizzes" ON quizzes FOR SELECT USING (user_id = (SELECT id FROM users WHERE username = current_setting('app.current_username', true)));
CREATE POLICY "Users can insert own quizzes" ON quizzes FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE username = current_setting('app.current_username', true)));
CREATE POLICY "Users can update own quizzes" ON quizzes FOR UPDATE USING (user_id = (SELECT id FROM users WHERE username = current_setting('app.current_username', true)));
CREATE POLICY "Users can delete own quizzes" ON quizzes FOR DELETE USING (user_id = (SELECT id FROM users WHERE username = current_setting('app.current_username', true)));

-- Group quizzes policies
CREATE POLICY "Teachers can read own group quizzes" ON group_quizzes FOR SELECT USING (teacher_id = (SELECT id FROM users WHERE username = current_setting('app.current_username', true)) OR is_active = true);
CREATE POLICY "Teachers can insert group quizzes" ON group_quizzes FOR INSERT WITH CHECK (teacher_id = (SELECT id FROM users WHERE username = current_setting('app.current_username', true)));
CREATE POLICY "Teachers can update own group quizzes" ON group_quizzes FOR UPDATE USING (teacher_id = (SELECT id FROM users WHERE username = current_setting('app.current_username', true)));
CREATE POLICY "Teachers can delete own group quizzes" ON group_quizzes FOR DELETE USING (teacher_id = (SELECT id FROM users WHERE username = current_setting('app.current_username', true)));

-- Quiz attempts policies
CREATE POLICY "Users can read own attempts" ON quiz_attempts FOR SELECT USING (user_id = (SELECT id FROM users WHERE username = current_setting('app.current_username', true)));
CREATE POLICY "Users can insert own attempts" ON quiz_attempts FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE username = current_setting('app.current_username', true)));

-- Group participants policies
CREATE POLICY "Participants can read own results" ON group_participants FOR SELECT USING (user_id = (SELECT id FROM users WHERE username = current_setting('app.current_username', true)));
CREATE POLICY "Teachers can read their group results" ON group_participants FOR SELECT USING (group_quiz_id IN (SELECT id FROM group_quizzes WHERE teacher_id = (SELECT id FROM users WHERE username = current_setting('app.current_username', true))));
CREATE POLICY "Students can insert participation" ON group_participants FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE username = current_setting('app.current_username', true)));

-- File uploads policies
CREATE POLICY "Users can read own uploads" ON file_uploads FOR SELECT USING (user_id = (SELECT id FROM users WHERE username = current_setting('app.current_username', true)));
CREATE POLICY "Users can insert own uploads" ON file_uploads FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE username = current_setting('app.current_username', true)));

-- User activity policies
CREATE POLICY "Users can read own activity" ON user_activity FOR SELECT USING (user_id = (SELECT id FROM users WHERE username = current_setting('app.current_username', true)));
CREATE POLICY "Users can insert own activity" ON user_activity FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE username = current_setting('app.current_username', true)));

-- Functions for updating statistics
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user statistics when quiz attempt is added
  UPDATE users 
  SET 
    total_quizzes = total_quizzes + 1,
    total_score = total_score + NEW.score,
    average_score = (total_score + NEW.score) / (total_quizzes + 1),
    updated_at = now()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating user stats
CREATE TRIGGER update_user_stats_trigger
  AFTER INSERT ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

-- Function to generate unique quiz codes
CREATE OR REPLACE FUNCTION generate_quiz_code()
RETURNS text AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 6));
    SELECT EXISTS(SELECT 1 FROM group_quizzes WHERE quiz_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to update group quiz participant count
CREATE OR REPLACE FUNCTION update_group_quiz_participants()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE group_quizzes 
  SET participants_count = participants_count + 1,
      updated_at = now()
  WHERE id = NEW.group_quiz_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating group quiz participant count
CREATE TRIGGER update_group_quiz_participants_trigger
  AFTER INSERT ON group_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_group_quiz_participants();

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id uuid,
  p_activity_type text,
  p_description text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_activity (user_id, activity_type, description, metadata)
  VALUES (p_user_id, p_activity_type, p_description, p_metadata);
END;
$$ LANGUAGE plpgsql;