import React, { useState } from 'react';
import { QuizAttempt, Quiz } from '../types';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuizReviewProps {
  attempt: QuizAttempt;
  quiz: Quiz;
  onBack: () => void;
}

export const QuizReview: React.FC<QuizReviewProps> = ({
  attempt,
  quiz,
  onBack
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  const currentFeedback = attempt.feedback[currentQuestionIndex];
  const currentQuestion = quiz.questions.find(q => q.id === currentFeedback.questionId);

  const nextQuestion = () => {
    if (currentQuestionIndex < attempt.feedback.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Results</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-lg font-semibold text-gray-900">Review Mode</h1>
            </div>
            
            <div className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {attempt.feedback.length}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">
              Review Progress
            </span>
            <span className={`text-sm font-medium ${
              currentFeedback.isCorrect ? 'text-green-600' : 'text-red-600'
            }`}>
              {currentFeedback.isCorrect ? 'Correct' : 'Incorrect'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / attempt.feedback.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Review */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className={`bg-white rounded-xl shadow-sm border-l-4 p-8 mb-6 ${
              currentFeedback.isCorrect ? 'border-green-500' : 'border-red-500'
            }`}
          >
            {/* Question Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  {currentFeedback.isCorrect ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                  <span className={`font-semibold ${
                    currentFeedback.isCorrect ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {currentFeedback.isCorrect ? 'Correct Answer' : 'Incorrect Answer'}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 leading-relaxed">
                  {currentFeedback.question}
                </h2>
              </div>
              
              {currentQuestion?.difficulty && (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {currentQuestion.difficulty}
                </span>
              )}
            </div>

            {/* Answer Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* User's Answer */}
              <div className={`p-4 rounded-lg border-2 ${
                currentFeedback.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}>
                <h3 className="font-medium text-gray-900 mb-2">Your Answer</h3>
                <p className={`${
                  currentFeedback.isCorrect ? 'text-green-700' : 'text-red-700'
                }`}>
                  {currentFeedback.userAnswer || 'No answer provided'}
                </p>
              </div>

              {/* Correct Answer */}
              <div className="p-4 rounded-lg border-2 border-green-200 bg-green-50">
                <h3 className="font-medium text-gray-900 mb-2">Correct Answer</h3>
                <p className="text-green-700">{currentFeedback.correctAnswer}</p>
              </div>
            </div>

            {/* Show MCQ Options if applicable */}
            {currentQuestion?.type === 'mcq' && currentQuestion.options && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">All Options</h3>
                <div className="space-y-2">
                  {currentQuestion.options.map((option, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        option === currentFeedback.correctAnswer
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : option === currentFeedback.userAnswer && !currentFeedback.isCorrect
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 bg-gray-50 text-gray-600'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                        <span>{option}</span>
                        {option === currentFeedback.correctAnswer && (
                          <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                        )}
                        {option === currentFeedback.userAnswer && !currentFeedback.isCorrect && (
                          <XCircle className="h-4 w-4 text-red-600 ml-auto" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explanation */}
            {currentFeedback.explanation && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                <h3 className="font-medium text-blue-900 mb-2">Explanation</h3>
                <p className="text-blue-800">{currentFeedback.explanation}</p>
              </div>
            )}

            {/* Concept Tag */}
            {currentFeedback.concept && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Concept:</span>
                <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                  {currentFeedback.concept}
                </span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-2">
            {attempt.feedback.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  index === currentQuestionIndex
                    ? 'bg-blue-600 text-white'
                    : attempt.feedback[index].isCorrect
                    ? 'bg-green-100 text-green-600 hover:bg-green-200'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <button
            onClick={nextQuestion}
            disabled={currentQuestionIndex === attempt.feedback.length - 1}
            className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};