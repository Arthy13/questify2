import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { SavedQuiz, QuizAttemptRecord, FileUpload } from '../lib/supabase';
import toast from 'react-hot-toast';

export const useUserData = (user: User | null) => {
  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttemptRecord[]>([]);
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && supabase) {
      loadUserData();
    } else if (user && !supabase) {
      // Load from localStorage for demo users
      loadLocalData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user || !supabase) return;

    setLoading(true);
    try {
      // Load saved quizzes
      const { data: quizzes } = await supabase
        .from('saved_quizzes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Load quiz attempts
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Load file uploads
      const { data: uploads } = await supabase
        .from('file_uploads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setSavedQuizzes(quizzes || []);
      setQuizAttempts(attempts || []);
      setFileUploads(uploads || []);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const loadLocalData = () => {
    if (!user) return;

    try {
      const quizzes = JSON.parse(localStorage.getItem(`quizwhiz_quizzes_${user.id}`) || '[]');
      const attempts = JSON.parse(localStorage.getItem(`quizwhiz_attempts_${user.id}`) || '[]');
      const uploads = JSON.parse(localStorage.getItem(`quizwhiz_uploads_${user.id}`) || '[]');

      setSavedQuizzes(quizzes);
      setQuizAttempts(attempts);
      setFileUploads(uploads);
    } catch (error) {
      console.error('Error loading local data:', error);
    }
  };

  const saveQuiz = async (quizData: any) => {
    if (!user) return null;

    const quiz = {
      id: Date.now().toString(),
      user_id: user.id,
      title: quizData.title,
      content: quizData,
      quiz_type: quizData.type,
      language: quizData.language,
      difficulty: quizData.difficulty,
      file_metadata: quizData.fileMetadata,
      is_shared: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('saved_quizzes')
          .insert(quiz)
          .select()
          .single();

        if (error) throw error;

        setSavedQuizzes(prev => [data, ...prev]);
        toast.success('Quiz saved successfully!');
        return data;
      } catch (error) {
        console.error('Error saving quiz:', error);
        toast.error('Failed to save quiz');
        throw error;
      }
    } else {
      // Save to localStorage for demo users
      const updatedQuizzes = [quiz, ...savedQuizzes];
      setSavedQuizzes(updatedQuizzes);
      localStorage.setItem(`quizwhiz_quizzes_${user.id}`, JSON.stringify(updatedQuizzes));
      toast.success('Quiz saved locally!');
      return quiz;
    }
  };

  const saveQuizAttempt = async (attemptData: any) => {
    if (!user) return null;

    const attempt = {
      id: Date.now().toString(),
      user_id: user.id,
      quiz_id: attemptData.quizId || 'unknown',
      score: attemptData.score,
      total_questions: attemptData.totalQuestions,
      percentage: attemptData.percentage,
      time_spent: attemptData.timeSpent,
      answers: attemptData.answers,
      feedback: attemptData.feedback,
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('quiz_attempts')
          .insert(attempt)
          .select()
          .single();

        if (error) throw error;

        setQuizAttempts(prev => [data, ...prev]);
        return data;
      } catch (error) {
        console.error('Error saving quiz attempt:', error);
        throw error;
      }
    } else {
      // Save to localStorage for demo users
      const updatedAttempts = [attempt, ...quizAttempts];
      setQuizAttempts(updatedAttempts);
      localStorage.setItem(`quizwhiz_attempts_${user.id}`, JSON.stringify(updatedAttempts));
      return attempt;
    }
  };

  const saveFileUpload = async (fileData: any) => {
    if (!user) return null;

    const upload = {
      id: Date.now().toString(),
      user_id: user.id,
      file_name: fileData.fileName,
      file_size: fileData.fileSize,
      file_type: fileData.fileType,
      extracted_text: fileData.text,
      metadata: fileData.metadata,
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('file_uploads')
          .insert(upload)
          .select()
          .single();

        if (error) throw error;

        setFileUploads(prev => [data, ...prev]);
        return data;
      } catch (error) {
        console.error('Error saving file upload:', error);
        throw error;
      }
    } else {
      // Save to localStorage for demo users
      const updatedUploads = [upload, ...fileUploads];
      setFileUploads(updatedUploads);
      localStorage.setItem(`quizwhiz_uploads_${user.id}`, JSON.stringify(updatedUploads));
      return upload;
    }
  };

  return {
    savedQuizzes,
    quizAttempts,
    fileUploads,
    loading,
    saveQuiz,
    saveQuizAttempt,
    saveFileUpload,
    refreshData: loadUserData,
  };
};