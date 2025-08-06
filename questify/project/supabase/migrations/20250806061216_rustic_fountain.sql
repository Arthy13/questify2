/*
  # Quiz History Tables for QuizWhiz

  1. New Tables
    - `users` - Basic user information
    - `quiz_history` - Complete quiz attempt history with group codes

  2. Security
    - Enable RLS on all tables
    - Add policies for users to access their own data
*/

-- Users table (basic user info)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Quiz history table
CREATE TABLE IF NOT EXISTS quiz_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  quiz_group_code text,
  quiz_title text NOT NULL,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  percentage decimal NOT NULL,
  time_spent integer DEFAULT 0,
  answers jsonb,
  date_taken timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_history ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (id = auth.uid());

-- Quiz history policies
CREATE POLICY "Users can read own quiz history" ON quiz_history FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own quiz history" ON quiz_history FOR INSERT WITH CHECK (user_id = auth.uid());

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_history_user_id ON quiz_history(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_history_date_taken ON quiz_history(date_taken DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_history_group_code ON quiz_history(quiz_group_code);