import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, Globe, FileText, Settings, Users, BookOpen } from 'lucide-react';
import { UserTypeSelector } from './components/UserTypeSelector';
import { EnhancedFileUpload } from './components/EnhancedFileUpload';
import { LanguageSelector } from './components/LanguageSelector';
import { QuizTypeSelector } from './components/QuizTypeSelector';
import { LoadingSpinner } from './components/LoadingSpinner';
import { QuizDisplay } from './components/QuizDisplay';
import { QuizSession } from './components/QuizSession';
import { QuizResults } from './components/QuizResults';
import { QuizReview } from './components/QuizReview';
import { GroupQuizMode } from './components/GroupQuizMode';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { useSupabaseData } from './hooks/useSupabaseData';
import { QuizGenerator } from './utils/quizGenerator';
import { EnhancedFileParser } from './utils/enhancedFileParser';
import { detectLanguage } from './utils/languages';
import { Quiz, QuizType, QuizAttempt, UserType, User } from './types';
import toast from 'react-hot-toast';

type AppState = 'userSelection' | 'dashboard' | 'input' | 'processing' | 'preview' | 'quiz' | 'results' | 'review' | 'group';

function App() {
  const [state, setState] = useState<AppState>('userSelection');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { 
    savedQuizzes, 
    quizAttempts, 
    groupQuizzes,
    saveQuiz, 
    saveQuizAttempt,
    createGroupQuiz,
    joinGroupQuiz,
    submitGroupQuizResult,
    saveFileUpload
  } = useSupabaseData(currentUser);
  const [inputText, setInputText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedQuizType, setSelectedQuizType] = useState<QuizType>('mcq');
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null);
  const [isFileMode, setIsFileMode] = useState(true);
  const [isTestMode, setIsTestMode] = useState(false);
  const [isGroupMode, setIsGroupMode] = useState(false);

  const handleUserTypeSelection = (userType: UserType, username: string) => {
    const user: User = {
      id: Date.now().toString(),
      name: username,
      email: `${username}@quizwhiz.local`,
      type: userType,
      createdAt: new Date(),
      preferences: {
        language: 'en',
        theme: 'light',
        notifications: true
      }
    };
    setCurrentUser(user);
    setState('dashboard');
    toast.success(`Welcome to QuizWhiz, ${username}!`);
  };

  const handleFileSelect = async (file: File) => {
    try {
      const result = await EnhancedFileParser.parseFile(file);
      setInputText(result.text);
      
      // Auto-detect language
      const detectedLang = detectLanguage(result.text);
      setSelectedLanguage(detectedLang);
      
      // Save file upload
      if (currentUser) {
        await saveFileUpload({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          text: result.text
        });
      }
      
      toast.success(`File processed successfully! Extracted ${result.text.length} characters`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to process file');
    }
  };

  const handleGenerateQuiz = async () => {
    if (!inputText.trim()) {
      toast.error('Please provide text or upload a file');
      return;
    }

    if (inputText.trim().length < 100) {
      toast.error('Please provide at least 100 characters for better quiz generation');
      return;
    }

    setState('processing');
    
    try {
      const questions = QuizGenerator.generateQuiz(
        inputText, 
        selectedQuizType, 
        questionCount, 
        difficulty,
        currentUser?.type
      );
      
      if (questions.length === 0) {
        throw new Error('Could not generate questions from the provided content. Please try with different material.');
      }

      const quiz: Quiz = {
        id: Date.now().toString(),
        title: `${selectedQuizType.toUpperCase()} Quiz - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`,
        language: selectedLanguage,
        type: selectedQuizType,
        questions,
        difficulty,
        createdAt: new Date(),
        updatedAt: new Date(),
        estimatedTime: questions.length * 2,
        createdBy: currentUser?.id,
        isShared: currentUser?.type === 'teacher',
        tags: ['AI-Generated', difficulty, selectedQuizType.toUpperCase()]
      };

      setGeneratedQuiz(quiz);
      setState('preview');
      toast.success(`Quiz generated! Created ${questions.length} high-quality questions`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate quiz');
      setState('input');
    }
  };

  const handleStartQuiz = () => {
    if (!generatedQuiz) return;
    
    if (isGroupMode) {
      setState('group');
    } else {
      setState('quiz');
    }
  };

  const handleQuizComplete = (attempt: QuizAttempt) => {
    setCurrentAttempt(attempt);
    setState('results');
    
    // Save to database if user is authenticated
    if (currentUser) {
      saveQuizAttempt({
        quizId: generatedQuiz?.id,
        score: attempt.correctAnswers,
        totalQuestions: attempt.totalQuestions,
        percentage: attempt.percentage,
        timeSpent: attempt.timeSpent,
        answers: attempt.answers,
        feedback: attempt.feedback,
      }).catch(error => {
        console.error('Error saving quiz results:', error);
      });
    }
  };

  const handleReviewMode = () => {
    setState('review');
  };

  const handleRestartQuiz = () => {
    setState('quiz');
    setCurrentAttempt(null);
  };

  const resetToInput = () => {
    setState('input');
    setInputText('');
    setGeneratedQuiz(null);
    setCurrentAttempt(null);
  };

  const resetToDashboard = () => {
    setState('dashboard');
    setInputText('');
    setGeneratedQuiz(null);
    setCurrentAttempt(null);
  };

  const handleSaveQuiz = (quiz: Quiz) => {
    if (currentUser) {
      saveQuiz(quiz)
        .then(() => {
          toast.success('Quiz saved! Added to your library');
        })
        .catch(() => {
          toast.error('Could not save quiz');
        });
    } else {
      toast.error('Please enter username to save quizzes');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setState('userSelection');
    toast.success('See you next time!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      
      {/* Enhanced Header */}
      {currentUser && state !== 'userSelection' && (
        <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">QuizWhiz</h1>
                  <p className="text-xs text-gray-500">AI-Powered Learning Platform</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Globe className="h-4 w-4" />
                    <span>Multilingual</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Sparkles className="h-4 w-4" />
                    <span>AI Powered</span>
                  </div>
                  {currentUser.type === 'teacher' && (
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>Collaborative</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{currentUser.type}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {state === 'userSelection' && (
          <UserTypeSelector onSelect={handleUserTypeSelection} />
        )}

        {state === 'dashboard' && currentUser && (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-gray-900">
                Welcome back, {currentUser.name}!
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {currentUser.type === 'student' 
                  ? 'Ready to enhance your learning with AI-powered quizzes? Upload your study materials or create custom quizzes.'
                  : 'Create engaging quizzes for your students, track their progress, and foster collaborative learning.'
                }
              </p>
            </div>

            {/* Dashboard Content */}
            {currentUser.type === 'student' ? (
              <StudentDashboard 
                user={currentUser}
                onCreateQuiz={() => setState('input')}
                onJoinGroup={() => setState('group')}
              />
            ) : (
              <TeacherDashboard 
                user={currentUser}
                onCreateQuiz={() => setState('input')}
                onManageClasses={() => setState('group')}
              />
            )}
          </div>
        )}

        {state === 'input' && (
          <div className="space-y-8">
            {/* Enhanced Hero Section */}
            <div className="text-center space-y-4">
              <button
                onClick={resetToDashboard}
                className="text-blue-600 hover:text-blue-800 transition-colors mb-4"
              >
                ← Back to Dashboard
              </button>
              <h2 className="text-4xl font-bold text-gray-900">
                Create Your AI-Powered Quiz
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Upload documents (PDF, PowerPoint, Word) or paste text in any language. 
                Our advanced AI will generate intelligent, engaging questions tailored to your needs.
              </p>
            </div>

            {/* Enhanced Main Content */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Panel - Enhanced Input */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Input</h3>
                  
                  {/* Enhanced Toggle */}
                  <div className="flex space-x-1 mb-6 p-1 bg-gray-100 rounded-lg">
                    <button
                      onClick={() => setIsFileMode(true)}
                      className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        isFileMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <FileText className="h-4 w-4" />
                      <span>Upload Files</span>
                    </button>
                    <button
                      onClick={() => setIsFileMode(false)}
                      className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        !isFileMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <span>Paste Text</span>
                    </button>
                  </div>

                  {isFileMode ? (
                    <EnhancedFileUpload 
                      onFileSelect={handleFileSelect}
                      maxSize={50}
                      accept=".pdf,.pptx,.docx,.txt"
                    />
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Paste your content
                      </label>
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Paste your study material, notes, or any text content here... (minimum 100 characters for optimal results)"
                        className="w-full h-48 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      />
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Characters: {inputText.length} / 100 minimum</span>
                        <span>{inputText.length > 0 ? `~${Math.ceil(inputText.length / 500)} questions possible` : ''}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Language Selection */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <LanguageSelector
                    selectedLanguage={selectedLanguage}
                    onLanguageChange={setSelectedLanguage}
                  />
                </div>
              </div>

              {/* Right Panel - Enhanced Options */}
              <div className="space-y-6">
                {/* Quiz Type Selection */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <QuizTypeSelector
                    selectedType={selectedQuizType}
                    onTypeChange={setSelectedQuizType}
                  />
                </div>

                {/* Enhanced Quiz Settings */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    <Settings className="h-5 w-5 inline mr-2" />
                    Quiz Configuration
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Questions
                      </label>
                      <select
                        value={questionCount}
                        onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={5}>5 Questions (Quick)</option>
                        <option value={10}>10 Questions (Standard)</option>
                        <option value={15}>15 Questions (Comprehensive)</option>
                        <option value={20}>20 Questions (Detailed)</option>
                        <option value={25}>25 Questions (Extensive)</option>
                        <option value={30}>30 Questions (Complete)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Difficulty Level
                      </label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="easy">Easy - Basic understanding</option>
                        <option value="medium">Medium - Applied knowledge</option>
                        <option value="hard">Hard - Critical thinking</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <input
                          type="checkbox"
                          id="testMode"
                          checked={isTestMode}
                          onChange={(e) => setIsTestMode(e.target.checked)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="testMode" className="text-sm font-medium text-gray-700">
                          Test Mode (hide answers until completion)
                        </label>
                      </div>

                      {currentUser?.type === 'teacher' && (
                        <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                          <input
                            type="checkbox"
                            id="groupMode"
                            checked={isGroupMode}
                            onChange={(e) => setIsGroupMode(e.target.checked)}
                            className="text-purple-600 focus:ring-purple-500"
                          />
                          <label htmlFor="groupMode" className="text-sm font-medium text-gray-700">
                            Create for group/class sharing
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Enhanced Generate Button */}
                <button
                  onClick={handleGenerateQuiz}
                  disabled={!inputText.trim() || inputText.trim().length < 100}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Generate AI-Powered Quiz
                </button>
              </div>
            </div>
          </div>
        )}

        {state === 'processing' && (
          <div className="min-h-[400px] flex items-center justify-center">
            <LoadingSpinner
              message="Our AI is analyzing your content and generating intelligent questions..."
              className="p-8"
            />
          </div>
        )}

        {state === 'preview' && generatedQuiz && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={resetToInput}
                  className="text-blue-600 hover:text-blue-800 transition-colors mb-2"
                >
                  ← Back to Input
                </button>
                <h2 className="text-2xl font-bold text-gray-900">Quiz Preview</h2>
                <p className="text-gray-600">Review your AI-generated quiz before starting</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleStartQuiz}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 font-semibold"
                >
                  {isGroupMode ? 'Start Group Quiz' : 'Start Quiz'}
                </button>
                <button
                  onClick={resetToDashboard}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
            
            <QuizDisplay
              quiz={generatedQuiz}
              onSave={handleSaveQuiz}
            />
          </div>
        )}

        {state === 'quiz' && generatedQuiz && (
          <QuizSession
            quiz={generatedQuiz}
            isTestMode={isTestMode}
            onComplete={handleQuizComplete}
            onExit={resetToDashboard}
          />
        )}

        {state === 'group' && generatedQuiz && (
          <GroupQuizMode
            quiz={generatedQuiz}
            user={currentUser!}
            onComplete={handleQuizComplete}
            onExit={resetToDashboard}
          />
        )}

        {state === 'results' && currentAttempt && generatedQuiz && (
          <QuizResults
            attempt={currentAttempt}
            quiz={generatedQuiz}
            onRestart={handleRestartQuiz}
            onReview={handleReviewMode}
            onExit={resetToDashboard}
          />
        )}

        {state === 'review' && currentAttempt && generatedQuiz && (
          <QuizReview
            attempt={currentAttempt}
            quiz={generatedQuiz}
            onBack={() => setState('results')}
          />
        )}
      </main>
    </div>
  );
}

export default App;