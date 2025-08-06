import React, { useState } from 'react';
import { QuizAttempt, Quiz } from '../types';
import { Trophy, Clock, Target, TrendingUp, Download, RotateCcw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ExportService } from '../utils/exportUtils';

interface QuizResultsProps {
  attempt: QuizAttempt;
  quiz: Quiz;
  onRestart: () => void;
  onReview: () => void;
  onExit: () => void;
}

export const QuizResults: React.FC<QuizResultsProps> = ({
  attempt,
  quiz,
  onRestart,
  onReview,
  onExit
}) => {
  const [showConfetti, setShowConfetti] = useState(attempt.percentage >= 80);
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'analytics'>('overview');

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
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

  const pieData = [
    { name: 'Correct', value: attempt.correctAnswers, color: '#10B981' },
    { name: 'Incorrect', value: attempt.incorrectAnswers, color: '#EF4444' }
  ];

  const conceptAnalysis = attempt.feedback.reduce((acc, feedback) => {
    const concept = feedback.concept || 'General';
    if (!acc[concept]) {
      acc[concept] = { correct: 0, total: 0 };
    }
    acc[concept].total++;
    if (feedback.isCorrect) {
      acc[concept].correct++;
    }
    return acc;
  }, {} as Record<string, { correct: number; total: number }>);

  const conceptData = Object.entries(conceptAnalysis).map(([concept, data]) => ({
    concept,
    percentage: Math.round((data.correct / data.total) * 100),
    correct: data.correct,
    total: data.total
  }));

  const weakConcepts = conceptData.filter(c => c.percentage < 70);
  const strongConcepts = conceptData.filter(c => c.percentage >= 80);

  const handleExportReport = () => {
    ExportService.exportResultsToPDF(attempt, quiz);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          onConfettiComplete={() => setShowConfetti(false)}
        />
      )}

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-gray-900">Quiz Results</h1>
            <div className="flex space-x-3">
              <button
                onClick={handleExportReport}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export Report</span>
              </button>
              <button
                onClick={onExit}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Score Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border p-8 mb-8"
        >
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getScoreBgColor(attempt.percentage)} mb-4`}>
              <span className={`text-3xl font-bold ${getScoreColor(attempt.percentage)}`}>
                {attempt.percentage}%
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {attempt.percentage >= 80 ? 'Excellent Work!' : 
               attempt.percentage >= 60 ? 'Good Job!' : 'Keep Practicing!'}
            </h2>
            <p className="text-gray-600">
              You scored {attempt.correctAnswers} out of {attempt.totalQuestions} questions correctly
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{attempt.correctAnswers}</div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">{attempt.incorrectAnswers}</div>
              <div className="text-sm text-gray-600">Incorrect</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{formatTime(attempt.timeSpent)}</div>
              <div className="text-sm text-gray-600">Time Spent</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{Math.round(attempt.timeSpent / attempt.totalQuestions)}s</div>
              <div className="text-sm text-gray-600">Avg per Question</div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={onReview}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
          >
            <TrendingUp className="h-5 w-5" />
            <span>Review Answers</span>
          </button>
          <button
            onClick={onRestart}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
          >
            <RotateCcw className="h-5 w-5" />
            <span>Retake Quiz</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: Trophy },
                { id: 'detailed', label: 'Detailed Review', icon: AlertTriangle },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Score Distribution */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Performance Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
                  <div className="space-y-4">
                    {strongConcepts.length > 0 && (
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">Strong Areas</h4>
                        <div className="space-y-1">
                          {strongConcepts.map(concept => (
                            <div key={concept.concept} className="text-sm text-green-700">
                              {concept.concept}: {concept.percentage}%
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {weakConcepts.length > 0 && (
                      <div className="p-4 bg-red-50 rounded-lg">
                        <h4 className="font-medium text-red-800 mb-2">Areas for Improvement</h4>
                        <div className="space-y-1">
                          {weakConcepts.map(concept => (
                            <div key={concept.concept} className="text-sm text-red-700">
                              {concept.concept}: {concept.percentage}%
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'detailed' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Question-by-Question Review</h3>
                {attempt.feedback.map((feedback, index) => (
                  <motion.div
                    key={feedback.questionId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-6 rounded-lg border-l-4 ${
                      feedback.isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                      <div className="flex items-center space-x-2">
                        {feedback.isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${
                          feedback.isCorrect ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {feedback.isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{feedback.question}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Your Answer:</span>
                        <p className={`mt-1 ${feedback.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                          {feedback.userAnswer || 'No answer provided'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Correct Answer:</span>
                        <p className="mt-1 text-green-700">{feedback.correctAnswer}</p>
                      </div>
                    </div>
                    
                    {feedback.explanation && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm font-medium text-blue-800">Explanation:</span>
                        <p className="mt-1 text-sm text-blue-700">{feedback.explanation}</p>
                      </div>
                    )}
                    
                    {feedback.concept && (
                      <div className="mt-2">
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {feedback.concept}
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Concept</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={conceptData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="concept" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="percentage" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-3">Study Recommendations</h4>
                    <ul className="space-y-2 text-sm text-blue-800">
                      {weakConcepts.length > 0 ? (
                        weakConcepts.map(concept => (
                          <li key={concept.concept}>
                            • Focus on {concept.concept} - scored {concept.percentage}%
                          </li>
                        ))
                      ) : (
                        <li>• Great job! You performed well across all concepts.</li>
                      )}
                    </ul>
                  </div>

                  <div className="p-6 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-3">Strengths</h4>
                    <ul className="space-y-2 text-sm text-green-800">
                      {strongConcepts.length > 0 ? (
                        strongConcepts.map(concept => (
                          <li key={concept.concept}>
                            • Excellent understanding of {concept.concept}
                          </li>
                        ))
                      ) : (
                        <li>• Keep practicing to build stronger foundations.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};