import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import toast from 'react-hot-toast';

interface QuizHistoryEntry {
  id: string;
  quiz_group_code?: string;
  quiz_title: string;
  score: number;
  total_questions: number;
  percentage: number;
  time_spent: number;
  date_taken: string;
  answers?: any;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export const useQuizHistory = (currentUser: User | null) => {
  const [quizHistory, setQuizHistory] = useState<QuizHistoryEntry[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ensure user exists in database
  const ensureUserExists = async (user: User): Promise<string> => {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      // First, try to get existing user
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (existingUser) {
        return existingUser.id;
      }

      // If user doesn't exist, create them
      if (fetchError?.code === 'PGRST116') { // No rows returned
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            name: user.name
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('Error creating user:', insertError);
          throw new Error(`Failed to create user: ${insertError.message}`);
        }

        return newUser.id;
      }

      throw fetchError;
    } catch (error: any) {
      console.error('Error ensuring user exists:', error);
      
      // Handle specific Supabase errors
      if (error.message?.includes('relation "users" does not exist')) {
        throw new Error('Database tables not found. Please check if migrations have been run.');
      }
      
      throw error;
    }
  };

  // Load user profile and quiz history
  const loadUserData = async () => {
    if (!currentUser || !supabase) return;

    setLoading(true);
    setError(null);

    try {
      // Ensure user exists in database
      const userId = await ensureUserExists(currentUser);

      // Load user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        throw new Error(`Failed to load profile: ${profileError.message}`);
      }

      setUserProfile(profile);

      // Load quiz history
      const { data: history, error: historyError } = await supabase
        .from('quiz_history')
        .select('*')
        .eq('user_id', userId)
        .order('date_taken', { ascending: false });

      if (historyError) {
        throw new Error(`Failed to load quiz history: ${historyError.message}`);
      }

      setQuizHistory(history || []);
    } catch (error: any) {
      console.error('Error loading user data:', error);
      setError(error.message);
      
      // Show user-friendly error messages
      if (error.message.includes('Database tables not found')) {
        toast.error('Database setup incomplete. Please contact support.');
      } else if (error.message.includes('Failed to create user')) {
        toast.error('Unable to create user profile. Please try again.');
      } else {
        toast.error('Failed to load user data. Please refresh the page.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Save quiz result to history
  const saveQuizResult = async (quizData: {
    quiz_group_code?: string;
    quiz_title: string;
    score: number;
    total_questions: number;
    percentage: number;
    time_spent: number;
    answers?: any;
  }) => {
    if (!currentUser || !supabase) {
      throw new Error('User not authenticated or Supabase not configured');
    }

    try {
      // Ensure user exists
      const userId = await ensureUserExists(currentUser);

      // Insert quiz result
      const { data, error } = await supabase
        .from('quiz_history')
        .insert({
          user_id: userId,
          quiz_group_code: quizData.quiz_group_code,
          quiz_title: quizData.quiz_title,
          score: quizData.score,
          total_questions: quizData.total_questions,
          percentage: quizData.percentage,
          time_spent: quizData.time_spent,
          answers: quizData.answers
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving quiz result:', error);
        
        // Handle specific errors
        if (error.code === '23503') { // Foreign key violation
          throw new Error('User profile not found. Please refresh and try again.');
        } else if (error.code === '42P01') { // Table doesn't exist
          throw new Error('Database tables not found. Please check if migrations have been run.');
        }
        
        throw new Error(`Failed to save quiz result: ${error.message}`);
      }

      // Add to local state
      setQuizHistory(prev => [data, ...prev]);
      toast.success('Quiz result saved successfully!');
      
      return data;
    } catch (error: any) {
      console.error('Error in saveQuizResult:', error);
      toast.error(error.message || 'Failed to save quiz result');
      throw error;
    }
  };

  // Get quiz statistics
  const getQuizStats = () => {
    if (quizHistory.length === 0) {
      return {
        totalQuizzes: 0,
        averageScore: 0,
        bestScore: 0,
        totalTimeSpent: 0
      };
    }

    const totalQuizzes = quizHistory.length;
    const averageScore = Math.round(
      quizHistory.reduce((sum, quiz) => sum + quiz.percentage, 0) / totalQuizzes
    );
    const bestScore = Math.max(...quizHistory.map(quiz => quiz.percentage));
    const totalTimeSpent = quizHistory.reduce((sum, quiz) => sum + quiz.time_spent, 0);

    return {
      totalQuizzes,
      averageScore,
      bestScore,
      totalTimeSpent
    };
  };

  // Load data when user changes
  useEffect(() => {
    if (currentUser) {
      loadUserData();
    } else {
      setQuizHistory([]);
      setUserProfile(null);
      setError(null);
    }
  }, [currentUser]);

  return {
    quizHistory,
    userProfile,
    loading,
    error,
    saveQuizResult,
    getQuizStats,
    refreshData: loadUserData
  };
};