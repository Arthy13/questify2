import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, Trophy, Clock, Calendar, Search, Filter, Award } from 'lucide-react';
import { User } from '../types';
import { useQuizHistory } from '../hooks/useQuizHistory';

interface QuizHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export const QuizHistoryModal: React.FC<QuizHistoryModalProps> = ({
  isOpen,
  onClose,
  user
}) => {
  const { quizHistory, loading, error, getQuizStats } = useQuizHistory(user);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'group' | 'individual'>('all');

  const stats = getQuizStats();

  const filteredHistory = quizHistory.filter(quiz => {
    const matchesSearch = quiz.quiz_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.quiz_group_code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'group' && quiz.quiz_group_code) ||
                         (filterType === 'individual' && !quiz.quiz_group_code);
    
    return matchesSearch && matchesFilter;
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (error) {
    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Database Error</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <History className="h-6 w-6 text-blue-600" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Quiz History</h2>
                  <p className="text-sm text-gray-500">Your complete quiz performance record</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Stats Overview */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalQuizzes}</div>
                  <div className="text-sm text-gray-600">Total Quizzes</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.averageScore}%</div>
                  <div className="text-sm text-gray-600">Average Score</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.bestScore}%</div>
                  <div className="text-sm text-gray-600">Best Score</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{formatTime(stats.totalTimeSpent)}</div>
                  <div className="text-sm text-gray-600">Total Time</div>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by quiz title or group code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Quizzes</option>
                    <option value="group">Group Quizzes</option>
                    <option value="individual">Individual Quizzes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quiz History List */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredHistory.length > 0 ? (
                <div className="space-y-3">
                  {filteredHistory.map((quiz, index) => (
                    <motion.div
                      key={quiz.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getScoreBgColor(quiz.percentage)}`}>
                          <span className={`text-sm font-bold ${getScoreColor(quiz.percentage)}`}>
                            {quiz.percentage}%
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{quiz.quiz_title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            {quiz.quiz_group_code && (
                              <span className="flex items-center space-x-1">
                                <Award className="h-3 w-3" />
                                <span>Code: {quiz.quiz_group_code}</span>
                              </span>
                            )}
                            <span className="flex items-center space-x-1">
                              <Trophy className="h-3 w-3" />
                              <span>{quiz.score}/{quiz.total_questions}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatTime(quiz.time_spent)}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(quiz.date_taken)}</span>
                        </div>
                        <div className={`text-xs font-medium ${quiz.quiz_group_code ? 'text-purple-600' : 'text-blue-600'}`}>
                          {quiz.quiz_group_code ? 'Group Quiz' : 'Individual Quiz'}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    {searchTerm || filterType !== 'all' ? 'No quizzes match your search' : 'No quiz history yet'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {searchTerm || filterType !== 'all' ? 'Try adjusting your search or filter' : 'Complete some quizzes to see your history here'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Total entries: {quizHistory.length}</span>
                <span>Showing: {filteredHistory.length}</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};