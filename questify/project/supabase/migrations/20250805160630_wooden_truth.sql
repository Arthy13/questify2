/*
  # Comprehensive QuizWhiz Updates

  1. New Tables
    - `notifications` - Real-time notifications for students
    - `weekly_performance` - Weekly student performance tracking
    - `quiz_downloads` - Track downloaded quiz files
    - `leaderboards` - Real-time leaderboard data

  2. Enhanced Tables
    - Add real-time features to existing tables
    - Add weekly tracking columns
    - Add notification triggers

  3. Security
    - Enable RLS on all new tables
    - Add real-time subscriptions
    - Add proper policies for live updates
*/

-- Notifications table for real-time updates
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('group_quiz_created', 'quiz_completed', 'weekly_report', 'achievement')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Weekly performance tracking
CREATE TABLE IF NOT EXISTS weekly_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  week_end date NOT NULL,
  total_quizzes integer DEFAULT 0,
  total_score integer DEFAULT 0,
  average_score decimal DEFAULT 0,
  best_score integer DEFAULT 0,
  improvement_percentage decimal DEFAULT 0,
  rank_position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Quiz downloads tracking
CREATE TABLE IF NOT EXISTS quiz_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  quiz_id uuid,
  group_quiz_id uuid REFERENCES group_quizzes(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('pdf', 'csv', 'json')),
  download_url text,
  created_at timestamptz DEFAULT now()
);

-- Real-time leaderboard data
CREATE TABLE IF NOT EXISTS leaderboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_quiz_id uuid REFERENCES group_quizzes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  username text NOT NULL,
  score integer NOT NULL,
  percentage decimal NOT NULL,
  time_spent integer NOT NULL,
  rank_position integer DEFAULT 0,
  completed_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(group_quiz_id, user_id)
);

-- Add columns to existing tables for enhanced features
ALTER TABLE group_quizzes ADD COLUMN IF NOT EXISTS max_participants integer DEFAULT 100;
ALTER TABLE group_quizzes ADD COLUMN IF NOT EXISTS time_limit integer DEFAULT 0;
ALTER TABLE group_quizzes ADD COLUMN IF NOT EXISTS show_results boolean DEFAULT true;
ALTER TABLE group_quizzes ADD COLUMN IF NOT EXISTS auto_grade boolean DEFAULT true;

ALTER TABLE users ADD COLUMN IF NOT EXISTS current_week_score integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_week_score integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS weekly_rank integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_downloads integer DEFAULT 0;

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (user_id = (SELECT id FROM users WHERE username = current_setting('app.current_username', true)));
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = (SELECT id FROM users WHERE username = current_setting('app.current_username', true)));

-- Policies for weekly_performance
CREATE POLICY "Users can read own performance" ON weekly_performance FOR SELECT USING (user_id = (SELECT id FROM users WHERE username = current_setting('app.current_username', true)));
CREATE POLICY "Teachers can read all performance" ON weekly_performance FOR SELECT USING ((SELECT user_type FROM users WHERE username = current_setting('app.current_username', true)) = 'teacher');
CREATE POLICY "System can manage performance" ON weekly_performance FOR ALL WITH CHECK (true);

-- Policies for quiz_downloads
CREATE POLICY "Users can read own downloads" ON quiz_downloads FOR SELECT USING (user_id = (SELECT id FROM users WHERE username = current_setting('app.current_username', true)));
CREATE POLICY "Users can insert own downloads" ON quiz_downloads FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE username = current_setting('app.current_username', true)));

-- Policies for leaderboards
CREATE POLICY "Users can read leaderboards" ON leaderboards FOR SELECT USING (true);
CREATE POLICY "System can manage leaderboards" ON leaderboards FOR ALL WITH CHECK (true);

-- Function to notify students when group quiz is created
CREATE OR REPLACE FUNCTION notify_students_group_quiz()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notifications for all students
  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT 
    u.id,
    'group_quiz_created',
    'New Group Quiz Available!',
    'A new group quiz "' || NEW.title || '" has been created. Code: ' || NEW.quiz_code,
    jsonb_build_object(
      'group_quiz_id', NEW.id,
      'quiz_code', NEW.quiz_code,
      'teacher_name', (SELECT username FROM users WHERE id = NEW.teacher_id),
      'difficulty', NEW.difficulty,
      'questions_count', NEW.questions_count
    )
  FROM users u
  WHERE u.user_type = 'student';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for group quiz notifications
DROP TRIGGER IF EXISTS notify_students_group_quiz_trigger ON group_quizzes;
CREATE TRIGGER notify_students_group_quiz_trigger
  AFTER INSERT ON group_quizzes
  FOR EACH ROW
  EXECUTE FUNCTION notify_students_group_quiz();

-- Function to update leaderboard in real-time
CREATE OR REPLACE FUNCTION update_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update leaderboard entry
  INSERT INTO leaderboards (group_quiz_id, user_id, username, score, percentage, time_spent, completed_at)
  VALUES (NEW.group_quiz_id, NEW.user_id, NEW.username, NEW.score, NEW.percentage, NEW.time_spent, NEW.completed_at)
  ON CONFLICT (group_quiz_id, user_id)
  DO UPDATE SET
    score = NEW.score,
    percentage = NEW.percentage,
    time_spent = NEW.time_spent,
    completed_at = NEW.completed_at,
    updated_at = now();
  
  -- Update ranks for this group quiz
  WITH ranked_participants AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY percentage DESC, time_spent ASC) as new_rank
    FROM leaderboards
    WHERE group_quiz_id = NEW.group_quiz_id
  )
  UPDATE leaderboards l
  SET rank_position = rp.new_rank, updated_at = now()
  FROM ranked_participants rp
  WHERE l.id = rp.id AND l.group_quiz_id = NEW.group_quiz_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for leaderboard updates
DROP TRIGGER IF EXISTS update_leaderboard_trigger ON group_participants;
CREATE TRIGGER update_leaderboard_trigger
  AFTER INSERT OR UPDATE ON group_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_leaderboard();

-- Function to update weekly performance
CREATE OR REPLACE FUNCTION update_weekly_performance()
RETURNS TRIGGER AS $$
DECLARE
  week_start date;
  week_end date;
BEGIN
  -- Calculate current week boundaries
  week_start := date_trunc('week', CURRENT_DATE)::date;
  week_end := (week_start + interval '6 days')::date;
  
  -- Update or insert weekly performance
  INSERT INTO weekly_performance (user_id, week_start, week_end, total_quizzes, total_score, average_score, best_score)
  VALUES (
    NEW.user_id,
    week_start,
    week_end,
    1,
    NEW.score,
    NEW.percentage,
    NEW.score
  )
  ON CONFLICT (user_id, week_start)
  DO UPDATE SET
    total_quizzes = weekly_performance.total_quizzes + 1,
    total_score = weekly_performance.total_score + NEW.score,
    average_score = (weekly_performance.total_score + NEW.score) / (weekly_performance.total_quizzes + 1),
    best_score = GREATEST(weekly_performance.best_score, NEW.score),
    updated_at = now();
  
  -- Update user's current week score
  UPDATE users 
  SET 
    current_week_score = (
      SELECT COALESCE(average_score, 0) 
      FROM weekly_performance 
      WHERE user_id = NEW.user_id AND week_start = date_trunc('week', CURRENT_DATE)::date
    ),
    updated_at = now()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for weekly performance updates
DROP TRIGGER IF EXISTS update_weekly_performance_trigger ON group_participants;
CREATE TRIGGER update_weekly_performance_trigger
  AFTER INSERT ON group_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_weekly_performance();

-- Function to calculate weekly rankings
CREATE OR REPLACE FUNCTION calculate_weekly_rankings()
RETURNS void AS $$
DECLARE
  week_start date;
BEGIN
  week_start := date_trunc('week', CURRENT_DATE)::date;
  
  -- Update weekly rankings
  WITH ranked_users AS (
    SELECT 
      wp.user_id,
      ROW_NUMBER() OVER (ORDER BY wp.average_score DESC, wp.total_quizzes DESC) as rank_pos
    FROM weekly_performance wp
    WHERE wp.week_start = week_start
  )
  UPDATE weekly_performance wp
  SET rank_position = ru.rank_pos, updated_at = now()
  FROM ranked_users ru
  WHERE wp.user_id = ru.user_id AND wp.week_start = week_start;
  
  -- Update users table with weekly rank
  UPDATE users u
  SET 
    weekly_rank = wp.rank_position,
    updated_at = now()
  FROM weekly_performance wp
  WHERE u.id = wp.user_id AND wp.week_start = week_start;
END;
$$ LANGUAGE plpgsql;

-- Function to track downloads
CREATE OR REPLACE FUNCTION track_download(
  p_user_id uuid,
  p_quiz_id uuid DEFAULT NULL,
  p_group_quiz_id uuid DEFAULT NULL,
  p_file_name text,
  p_file_type text
)
RETURNS uuid AS $$
DECLARE
  download_id uuid;
BEGIN
  INSERT INTO quiz_downloads (user_id, quiz_id, group_quiz_id, file_name, file_type)
  VALUES (p_user_id, p_quiz_id, p_group_quiz_id, p_file_name, p_file_type)
  RETURNING id INTO download_id;
  
  -- Update user's total downloads count
  UPDATE users 
  SET total_downloads = total_downloads + 1, updated_at = now()
  WHERE id = p_user_id;
  
  RETURN download_id;
END;
$$ LANGUAGE plpgsql;

-- Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE leaderboards;
ALTER PUBLICATION supabase_realtime ADD TABLE group_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE weekly_performance;