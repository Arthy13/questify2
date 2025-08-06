import React from 'react';
import { QuizType } from '../types';
import { CheckCircle, Edit, MessageCircle } from 'lucide-react';

interface QuizTypeSelectorProps {
  selectedType: QuizType;
  onTypeChange: (type: QuizType) => void;
  className?: string;
}

export const QuizTypeSelector: React.FC<QuizTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  className = ""
}) => {
  const quizTypes = [
    {
      type: 'mcq' as QuizType,
      name: 'Multiple Choice',
      description: 'Choose the correct answer from options',
      icon: CheckCircle,
      color: 'blue'
    },
    {
      type: 'fillup' as QuizType,
      name: 'Fill in the Blanks',
      description: 'Complete the missing words',
      icon: Edit,
      color: 'green'
    },
    {
      type: 'qa' as QuizType,
      name: 'Short Q&A',
      description: 'Answer questions briefly',
      icon: MessageCircle,
      color: 'purple'
    }
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Select Quiz Type
      </label>
      <div className="grid gap-3">
        {quizTypes.map((quiz) => {
          const Icon = quiz.icon;
          return (
            <button
              key={quiz.type}
              onClick={() => onTypeChange(quiz.type)}
              className={`
                flex items-center space-x-4 p-4 rounded-lg border transition-all duration-200 text-left
                ${selectedType === quiz.type
                  ? `border-${quiz.color}-500 bg-${quiz.color}-50 text-${quiz.color}-700`
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <Icon className={`h-6 w-6 ${selectedType === quiz.type ? `text-${quiz.color}-500` : 'text-gray-400'}`} />
              <div>
                <h3 className="font-medium">{quiz.name}</h3>
                <p className="text-sm text-gray-500">{quiz.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};