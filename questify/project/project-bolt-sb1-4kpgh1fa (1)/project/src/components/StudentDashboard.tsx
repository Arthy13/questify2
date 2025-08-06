import React, { useState, useEffect } from 'react';
import { User, QuizAttempt, Quiz } from '../types';
import { 
  BookOpen, 
  TrendingUp, 
  Clock, 
  Target, 
  Users, 
  Plus,
  Award,
  Calendar,
  BarChart3,
  Brain,
  Search,
  Play
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useSupabaseData } from '../hooks/useSupabaseData';
import toast from 'react-hot-toast';

interface StudentDashboardProps {
  user: User;
  onCreateQuiz: () => void;
  onJoinGroup: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  onCreateQuiz,
  onJoinGroup
}) => {
  const { 
    savedQuizzes, 
    quizAttempts, 
    userActivity,
    joinGroupQuiz,
    getAvailableGroupQuizzes,
    refreshData 
  } = useSupabaseData(user);
  
  const [showJoinQuiz, setShowJoinQuiz] = useState(false);
  const [quizCode, setQuizCode] = useState('');
  const [availableQuizzes, setAvailableQuizzes] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    totalTimeSpent: 0,
    streakDays: 0
  });

  useEffect(() => {
    refreshData();
    loadAvailableQuizzes();
  }, []);

  useEffect(() => {
    // Calculate stats
    if (quizAttempts.length > 0) {
      const avgScore = quizAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / quizAttempts.length;
      const totalTime = quizAttempts.reduce((sum, attempt) => sum + attempt.time_spent, 0);
      
      setStats({
        totalQuizzes: quizAttempts.length,
        averageScore: Math.round(avgScore),
        totalTimeSpent: totalTime,
        streakDays: user.stats?.streakDays || 1
      });
    }
  }, [quizAttempts]);

  const loadAvailableQuizzes = async () => {
    const quizzes = await getAvailableGroupQuizzes();
    setAvailableQuizzes(quizzes);
  };

  const handleJoinQuiz = async () => {
    if (!quizCode.trim()) {
      toast.error('Please enter a quiz code');
      return;
    }

    try {
      const groupQuiz = await joinGroupQuiz(quizCode);
      if (groupQuiz) {
        setShowJoinQuiz(false);
        setQuizCode('');
        // Navigate to quiz taking mode
        toast.success(`Joined quiz: ${groupQuiz.title}`);
      }
    } catch (error) {
      console.error('Error joining quiz:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCreateQuiz}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Plus className="h-8 w-8" />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-semibold">Create New Quiz</h3>
              <p className="text-blue-100">Upload materials or paste text to generate AI-powered quizzes</p>
            </div>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowJoinQuiz(true)}
          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Users className="h-8 w-8" />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-semibold">Join Group Quiz</h3>
              <p className="text-green-100">Enter a quiz code to join teacher-created quizzes</p>
            </div>
          </div>
        </motion.button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Quizzes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalQuizzes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Study Time</p>
              <p className="text-2xl font-bold text-gray-900">{formatTime(stats.totalTimeSpent)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Award className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Streak Days</p>
              <p className="text-2xl font-bold text-gray-900">{stats.streakDays}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Group Quizzes */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Search className="h-5 w-5 mr-2 text-green-500" />
            Available Group Quizzes
          </h3>
          <button
            onClick={loadAvailableQuizzes}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Refresh
          </button>
        </div>

        {availableQuizzes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableQuizzes.map((quiz, index) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{quiz.title}</h4>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {quiz.quiz_code}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{quiz.questions_count} questions</span>
                  <span className="capitalize">{quiz.difficulty}</span>
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => {
                      setQuizCode(quiz.quiz_code);
                      handleJoinQuiz();
                    }}
                    className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center space-x-2"
                  >
                    <Play className="h-4 w-4" />
                    <span>Join Quiz</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No group quizzes available</p>
            <p className="text-sm text-gray-400">Check back later or ask your teacher for quiz codes</p>
          </div>
        )}
      </div>

      {/* Recent Activity & Quiz Library */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Quiz Attempts */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
              Recent Activity
            </h3>
            <span className="text-sm text-gray-500">{quizAttempts.length} attempts</span>
          </div>

          {quizAttempts.length > 0 ? (
            <div className="space-y-4">
              {quizAttempts.slice(0, 5).map((attempt, index) => (
                <motion.div
                  key={attempt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getScoreBgColor(attempt.percentage)}`}>
                      <span className={`text-sm font-bold ${getScoreColor(attempt.percentage)}`}>
                        {attempt.percentage}%
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Quiz Attempt</p>
                      <p className="text-sm text-gray-500">
                        {attempt.score}/{attempt.total_questions} correct • {formatTime(attempt.time_spent)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(attempt.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No quiz attempts yet</p>
              <p className="text-sm text-gray-400">Create your first quiz to get started!</p>
            </div>
          )}
        </div>

        {/* My Quiz Library */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-purple-500" />
              My Quiz Library
            </h3>
            <span className="text-sm text-gray-500">{savedQuizzes.length} saved</span>
          </div>

          {savedQuizzes.length > 0 ? (
            <div className="space-y-3">
              {savedQuizzes.slice(0, 5).map((quiz, index) => (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{quiz.title}</p>
                      <p className="text-sm text-gray-500">
                        {quiz.questions.length} questions • {quiz.type.toUpperCase()} • {quiz.difficulty}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {quiz.tags?.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No saved quizzes yet</p>
              <p className="text-sm text-gray-400">Create and save quizzes to build your library!</p>
            </div>
          )}
        </div>
      </div>

      {/* Learning Insights */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-green-500" />
          Learning Insights
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {stats.averageScore >= 80 ? '🎯' : stats.averageScore >= 60 ? '📈' : '💪'}
            </div>
            <p className="font-medium text-gray-900">Performance</p>
            <p className="text-sm text-gray-600">
              {stats.averageScore >= 80 ? 'Excellent work!' : 
               stats.averageScore >= 60 ? 'Good progress!' : 'Keep practicing!'}
            </p>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-2">🔥</div>
            <p className="font-medium text-gray-900">Consistency</p>
            <p className="text-sm text-gray-600">
              {stats.streakDays} day{stats.streakDays !== 1 ? 's' : ''} streak
            </p>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 mb-2">⏱️</div>
            <p className="font-medium text-gray-900">Efficiency</p>
            <p className="text-sm text-gray-600">
              {stats.totalQuizzes > 0 ? 
                `${Math.round(stats.totalTimeSpent / stats.totalQuizzes / 60)}min avg` : 
                'No data yet'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Join Quiz Modal */}
      {showJoinQuiz && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Join Group Quiz</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quiz Code
                </label>
                <input
                  type="text"
                  value={quizCode}
                  onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character code"
                  maxLength={6}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-lg font-mono"
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinQuiz()}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowJoinQuiz(false)}
                className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinQuiz}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Join Quiz
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};