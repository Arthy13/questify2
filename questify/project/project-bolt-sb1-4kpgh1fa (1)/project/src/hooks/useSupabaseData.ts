import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Quiz, QuizAttempt } from '../types';
import toast from 'react-hot-toast';

export const useSupabaseData = (currentUser: User | null) => {
  const [savedQuizzes, setSavedQuizzes] = useState<Quiz[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [groupQuizzes, setGroupQuizzes] = useState<any[]>([]);
  const [userActivity, setUserActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Set current user context for RLS
  useEffect(() => {
    if (currentUser && supabase) {
      supabase.rpc('set_config', {
        parameter: 'app.current_username',
        value: currentUser.name
      });
    }
  }, [currentUser]);

  // Load user data
  useEffect(() => {
    if (currentUser) {
      loadUserData();
    }
  }, [currentUser]);

  const loadUserData = async () => {
    if (!currentUser || !supabase) return;

    setLoading(true);
    try {
      // Load individual quizzes
      const { data: quizzes } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      // Load quiz attempts
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      // Load group quizzes (for teachers)
      if (currentUser.type === 'teacher') {
        const { data: groupQuizData } = await supabase
          .from('group_quizzes')
          .select(`
            *,
            group_participants (
              id,
              username,
              score,
              percentage,
              completed_at
            )
          `)
          .eq('teacher_id', currentUser.id)
          .order('created_at', { ascending: false });

        setGroupQuizzes(groupQuizData || []);
      }

      // Load user activity
      const { data: activity } = await supabase
        .from('user_activity')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setSavedQuizzes(quizzes || []);
      setQuizAttempts(attempts || []);
      setUserActivity(activity || []);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const saveQuiz = async (quizData: any) => {
    if (!currentUser || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('quizzes')
        .insert({
          user_id: currentUser.id,
          title: quizData.title,
          content: quizData,
          quiz_type: quizData.type,
          language: quizData.language,
          difficulty: quizData.difficulty,
          questions_count: quizData.questions.length
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await logActivity('quiz_created', `Created quiz: ${quizData.title}`);

      setSavedQuizzes(prev => [data, ...prev]);
      toast.success('Quiz saved successfully!');
      return data;
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast.error('Failed to save quiz');
      throw error;
    }
  };

  const saveQuizAttempt = async (attemptData: any) => {
    if (!currentUser || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: currentUser.id,
          quiz_id: attemptData.quizId,
          score: attemptData.score,
          total_questions: attemptData.totalQuestions,
          percentage: attemptData.percentage,
          time_spent: attemptData.timeSpent,
          answers: attemptData.answers,
          feedback: attemptData.feedback
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await logActivity('quiz_completed', `Completed quiz with ${attemptData.percentage}% score`);

      setQuizAttempts(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
      throw error;
    }
  };

  const createGroupQuiz = async (quizData: any) => {
    if (!currentUser || !supabase || currentUser.type !== 'teacher') return null;

    try {
      // Generate unique quiz code
      const { data: codeData } = await supabase.rpc('generate_quiz_code');
      const quizCode = codeData;

      const { data, error } = await supabase
        .from('group_quizzes')
        .insert({
          teacher_id: currentUser.id,
          title: quizData.title,
          quiz_code: quizCode,
          content: quizData,
          quiz_type: quizData.type,
          language: quizData.language,
          difficulty: quizData.difficulty,
          questions_count: quizData.questions.length
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await logActivity('group_quiz_created', `Created group quiz: ${quizData.title} (Code: ${quizCode})`);

      setGroupQuizzes(prev => [{ ...data, group_participants: [] }, ...prev]);
      toast.success(`Group quiz created! Code: ${quizCode}`);
      return data;
    } catch (error) {
      console.error('Error creating group quiz:', error);
      toast.error('Failed to create group quiz');
      throw error;
    }
  };

  const joinGroupQuiz = async (quizCode: string) => {
    if (!currentUser || !supabase) return null;

    try {
      // Find the group quiz
      const { data: groupQuiz, error: findError } = await supabase
        .from('group_quizzes')
        .select('*')
        .eq('quiz_code', quizCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (findError || !groupQuiz) {
        toast.error('Quiz code not found or inactive');
        return null;
      }

      // Check if already participated
      const { data: existing } = await supabase
        .from('group_participants')
        .select('id')
        .eq('group_quiz_id', groupQuiz.id)
        .eq('user_id', currentUser.id)
        .single();

      if (existing) {
        toast.error('You have already participated in this quiz');
        return null;
      }

      return groupQuiz;
    } catch (error) {
      console.error('Error joining group quiz:', error);
      toast.error('Failed to join group quiz');
      return null;
    }
  };

  const submitGroupQuizResult = async (groupQuizId: string, resultData: any) => {
    if (!currentUser || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('group_participants')
        .insert({
          group_quiz_id: groupQuizId,
          user_id: currentUser.id,
          username: currentUser.name,
          score: resultData.score,
          total_questions: resultData.totalQuestions,
          percentage: resultData.percentage,
          time_spent: resultData.timeSpent,
          answers: resultData.answers,
          feedback: resultData.feedback
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await logActivity('group_quiz_completed', `Completed group quiz with ${resultData.percentage}% score`);

      toast.success('Quiz results submitted successfully!');
      return data;
    } catch (error) {
      console.error('Error submitting group quiz result:', error);
      toast.error('Failed to submit quiz results');
      throw error;
    }
  };

  const saveFileUpload = async (fileData: any) => {
    if (!currentUser || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('file_uploads')
        .insert({
          user_id: currentUser.id,
          filename: fileData.fileName,
          file_type: fileData.fileType,
          file_size: fileData.fileSize,
          extracted_text: fileData.text,
          upload_status: 'completed'
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await logActivity('file_uploaded', `Uploaded file: ${fileData.fileName}`);

      return data;
    } catch (error) {
      console.error('Error saving file upload:', error);
      throw error;
    }
  };

  const logActivity = async (activityType: string, description: string, metadata: any = {}) => {
    if (!currentUser || !supabase) return;

    try {
      await supabase.rpc('log_user_activity', {
        p_user_id: currentUser.id,
        p_activity_type: activityType,
        p_description: description,
        p_metadata: metadata
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const getAvailableGroupQuizzes = async () => {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('group_quizzes')
        .select('id, title, quiz_code, difficulty, questions_count, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching available group quizzes:', error);
      return [];
    }
  };

  return {
    savedQuizzes,
    quizAttempts,
    groupQuizzes,
    userActivity,
    loading,
    saveQuiz,
    saveQuizAttempt,
    createGroupQuiz,
    joinGroupQuiz,
    submitGroupQuizResult,
    saveFileUpload,
    logActivity,
    getAvailableGroupQuizzes,
    refreshData: loadUserData
  };
};