import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

// Only create Supabase client if valid URL is provided
export const supabase = supabaseUrl !== 'https://placeholder.supabase.co' 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Database types
export interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  user_type: 'student' | 'teacher'
  preferences: {
    language: string
    theme: 'light' | 'dark'
    notifications: boolean
  }
  created_at: string
  updated_at: string
}

export interface SavedQuiz {
  id: string
  user_id: string
  title: string
  content: any
  quiz_type: string
  language: string
  difficulty: string
  file_metadata?: any
  is_shared: boolean
  share_code?: string
  created_at: string
  updated_at: string
}

export interface QuizAttemptRecord {
  id: string
  user_id: string
  quiz_id: string
  score: number
  total_questions: number
  percentage: number
  time_spent: number
  answers: any
  feedback: any
  created_at: string
}

export interface FileUpload {
  id: string
  user_id: string
  file_name: string
  file_size: number
  file_type: string
  extracted_text: string
  metadata: any
  created_at: string
}