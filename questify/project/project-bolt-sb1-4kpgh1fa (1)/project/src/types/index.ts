export interface Quiz {
  id: string;
  title: string;
  language: string;
  type: QuizType;
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  estimatedTime?: number;
  createdBy?: string;
  isShared?: boolean;
  shareCode?: string;
  tags?: string[];
}

export interface Question {
  id: string;
  type: QuizType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  concept?: string;
  points?: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId?: string;
  userName?: string;
  userType?: UserType;
  answers: Record<string, string>;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  percentage: number;
  timeSpent: number;
  startedAt: Date;
  completedAt: Date;
  feedback: QuestionFeedback[];
  groupId?: string;
}

export interface QuestionFeedback {
  questionId: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
  concept?: string;
  difficulty?: string;
}

export interface QuizSession {
  id: string;
  quiz: Quiz;
  currentQuestionIndex: number;
  answers: Record<string, string>;
  startTime: Date;
  isTestMode: boolean;
  timeRemaining?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  type: UserType;
  avatar?: string;
  createdAt: Date;
  preferences: {
    language: string;
    theme: 'light' | 'dark';
    notifications: boolean;
  };
  stats?: UserStats;
}

export interface UserStats {
  totalQuizzes: number;
  averageScore: number;
  totalTimeSpent: number;
  strongConcepts: string[];
  weakConcepts: string[];
  improvementSuggestions: string[];
  streakDays: number;
  lastActive: Date;
}

export interface Group {
  id: string;
  name: string;
  code: string;
  createdBy: string;
  members: GroupMember[];
  quizzes: string[];
  createdAt: Date;
  isActive: boolean;
}

export interface GroupMember {
  userId: string;
  userName: string;
  joinedAt: Date;
  role: 'member' | 'admin';
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  language: string;
  type: 'text' | 'suggestion' | 'explanation';
}

export interface FileUploadResult {
  text: string;
  metadata: {
    fileName: string;
    fileSize: number;
    fileType: string;
    pageCount?: number;
    language?: string;
  };
}

export type QuizType = 'mcq' | 'fillup' | 'qa';
export type QuizMode = 'practice' | 'test' | 'review' | 'group';
export type UserType = 'student' | 'teacher';

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface GenerationOptions {
  text: string;
  language: string;
  quizType: QuizType;
  questionCount: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  userType?: UserType;
}

export interface QuizStats {
  totalQuizzes: number;
  averageScore: number;
  totalTimeSpent: number;
  strongConcepts: string[];
  weakConcepts: string[];
  improvementSuggestions: string[];
}

export interface TeacherDashboard {
  totalStudents: number;
  totalQuizzes: number;
  averageClassScore: number;
  recentActivity: Activity[];
  topPerformers: StudentPerformance[];
  strugglingStudents: StudentPerformance[];
}

export interface StudentPerformance {
  userId: string;
  userName: string;
  averageScore: number;
  quizzesCompleted: number;
  lastActive: Date;
  improvementTrend: 'up' | 'down' | 'stable';
}

export interface Activity {
  id: string;
  type: 'quiz_created' | 'quiz_completed' | 'group_joined' | 'achievement_earned';
  description: string;
  timestamp: Date;
  userId: string;
  userName: string;
}