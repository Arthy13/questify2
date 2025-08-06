import React, { useState, useEffect } from 'react';
import { Brain, FileText, Settings, Users, BookOpen } from 'lucide-react';
import { UserTypeSelector } from './components/UserTypeSelector';
import { EnhancedFileUpload } from './components/EnhancedFileUpload';
import { LanguageSelector } from './components/LanguageSelector';
import { QuizTypeSelector } from './components/QuizTypeSelector';
import { QuizDisplay } from './components/QuizDisplay';
import { QuizResults } from './components/QuizResults';
import { LoadingSpinner } from './components/LoadingSpinner';
import { AuthModal } from './components/AuthModal';
import { Header } from './components/Header';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { useSupabaseData } from './hooks/useSupabaseData';
import { useQuizHistory } from './hooks/useQuizHistory';
import { QuizGenerator } from './utils/quizGenerator';
import { EnhancedFileParser } from './utils/enhancedFileParser';
import { detectLanguage } from './utils/languages';
import type { Quiz, QuizType, QuizAttempt, UserType, User } from './types';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const {
    saveQuizAttempt,
    createGroupQuiz,
    joinGroupQuiz,
    submitGroupQuizResult,
    saveFileUpload,
    notifications
  } = useSupabaseData(currentUser);
  
  const { saveQuizResult } = useQuizHistory(currentUser);
  
  const [inputText, setInputText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedQuizType, setSelectedQuizType] = useState<QuizType>('mcq');
  const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<'userSelection' | 'input' | 'quiz' | 'results' | 'dashboard'>('userSelection');

  const handleUserTypeSelect = (userType: UserType) => {
    if (userType === 'guest') {
      setCurrentUser({ id: 'guest', name: 'Guest User', email: '', type: 'guest' });
      setState('input');
    } else {
      setShowAuthModal(true);
    }
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    setState('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setState('userSelection');
    setGeneratedQuiz(null);
    setCurrentAttempt(null);
    setInputText('');
  };

  const handleFileUpload = async (content: string, filename: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const parser = new EnhancedFileParser();
      const extractedText = await parser.parseFile(content, filename);
      
      if (!extractedText.trim()) {
        throw new Error('No text content could be extracted from the file');
      }
      
      setInputText(extractedText);
      
      // Auto-detect language
      const detectedLang = detectLanguage(extractedText);
      if (detectedLang) {
        setSelectedLanguage(detectedLang);
      }
      
      // Save file upload if user is authenticated
      if (currentUser && currentUser.type !== 'guest') {
        await saveFileUpload({
          filename,
          content: extractedText,
          fileType: filename.split('.').pop() || 'txt'
        });
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text or upload a file first');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const generator = new QuizGenerator();
      const quiz = await generator.generateQuiz(
        inputText,
        selectedQuizType,
        selectedLanguage
      );
      
      setGeneratedQuiz(quiz);
      setState('quiz');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizComplete = (attempt: QuizAttempt) => {
    setCurrentAttempt(attempt);
    setState('results');
    
    // Save to quiz history and attempts if user is authenticated
    if (currentUser) {
      // Save to quiz attempts table
      saveQuizAttempt({
        quizId: generatedQuiz?.id,
        score: attempt.correctAnswers,
        totalQuestions: attempt.totalQuestions,
        percentage: attempt.percentage,
        timeSpent: attempt.timeSpent,
        answers: attempt.answers
      }).catch(error => {
        console.error('Error saving quiz results:', error);
      });
      
      // Save to quiz history table
      saveQuizResult({
        quiz_group_code: attempt.groupId ? `GROUP-${attempt.groupId}` : undefined,
        quiz_title: generatedQuiz?.title || 'Untitled Quiz',
        score: attempt.correctAnswers,
        total_questions: attempt.totalQuestions,
        percentage: attempt.percentage,
        time_spent: attempt.timeSpent,
        answers: attempt.answers
      }).catch(error => {
        console.error('Error saving to quiz history:', error);
      });
    }
  };

  const handleRetakeQuiz = () => {
    setState('quiz');
    setCurrentAttempt(null);
  };

  const handleNewQuiz = () => {
    setState('input');
    setGeneratedQuiz(null);
    setCurrentAttempt(null);
    setInputText('');
  };

  const handleBackToDashboard = () => {
    setState('dashboard');
    setGeneratedQuiz(null);
    setCurrentAttempt(null);
    setInputText('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Enhanced Header */}
      {currentUser && state !== 'userSelection' && (
        <Header
          currentUser={currentUser}
          onLogout={handleLogout}
          notificationCount={notifications.filter(n => !n.read).length}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Type Selection */}
        {state === 'userSelection' && (
          <UserTypeSelector onUserTypeSelect={handleUserTypeSelect} />
        )}

        {/* Dashboard */}
        {state === 'dashboard' && currentUser && (
          <div>
            {currentUser.type === 'teacher' ? (
              <TeacherDashboard
                user={currentUser}
                onCreateQuiz={() => setState('input')}
                onCreateGroupQuiz={createGroupQuiz}
                onViewResults={() => {}}
              />
            ) : (
              <StudentDashboard
                user={currentUser}
                onTakeQuiz={() => setState('input')}
                onJoinGroupQuiz={joinGroupQuiz}
                onViewHistory={() => {}}
              />
            )}
          </div>
        )}

        {/* Quiz Input */}
        {state === 'input' && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                  <Brain className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                AI Quiz Generator
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Transform any text into interactive quizzes instantly. Upload documents or paste content to get started.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <EnhancedFileUpload onFileUpload={handleFileUpload} />
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-50 text-gray-500">or paste text directly</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your text content
                  </label>
                  <textarea
                    id="text-input"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste your study material, article, or any text content here..."
                    className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <LanguageSelector
                  selectedLanguage={selectedLanguage}
                  onLanguageChange={setSelectedLanguage}
                />

                <QuizTypeSelector
                  selectedType={selectedQuizType}
                  onTypeChange={setSelectedQuizType}
                />

                <button
                  onClick={handleGenerateQuiz}
                  disabled={isLoading || !inputText.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isLoading ? 'Generating Quiz...' : 'Generate Quiz'}
                </button>

                {currentUser && currentUser.type !== 'guest' && (
                  <button
                    onClick={handleBackToDashboard}
                    className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    Back to Dashboard
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quiz Display */}
        {state === 'quiz' && generatedQuiz && (
          <QuizDisplay
            quiz={generatedQuiz}
            onComplete={handleQuizComplete}
            onBack={() => setState('input')}
          />
        )}

        {/* Quiz Results */}
        {state === 'results' && currentAttempt && generatedQuiz && (
          <QuizResults
            attempt={currentAttempt}
            quiz={generatedQuiz}
            onRetake={handleRetakeQuiz}
            onNewQuiz={handleNewQuiz}
            onBackToDashboard={currentUser?.type !== 'guest' ? handleBackToDashboard : undefined}
          />
        )}

        {/* Loading Spinner */}
        {isLoading && <LoadingSpinner />}

        {/* Error Display */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg">
            <div className="flex items-center">
              <span className="text-sm">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-4 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}

export default App;