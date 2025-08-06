import React from 'react';
import { GraduationCap, Users, BookOpen, TrendingUp, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserType } from '../types';

interface UserTypeSelectorProps {
  onSelect: (type: UserType, username: string) => void;
  className?: string;
}

export const UserTypeSelector: React.FC<UserTypeSelectorProps> = ({
  onSelect,
  className = ""
}) => {
  const [showUsernameInput, setShowUsernameInput] = React.useState(false);
  const [selectedType, setSelectedType] = React.useState<UserType | null>(null);
  const [username, setUsername] = React.useState('');

  const userTypes = [
    {
      type: 'student' as UserType,
      title: 'Student',
      description: 'Generate personalized quizzes, track progress, and join group studies',
      icon: GraduationCap,
      color: 'blue',
      features: [
        'Personalized quiz generation',
        'Progress tracking & analytics',
        'Group study sessions',
        'AI-powered explanations',
        'Multilingual support'
      ]
    },
    {
      type: 'teacher' as UserType,
      title: 'Teacher',
      description: 'Create shared quizzes, manage classes, and track student performance',
      icon: Users,
      color: 'purple',
      features: [
        'Class management dashboard',
        'Shared quiz creation',
        'Student performance analytics',
        'Assignment & grading tools',
        'Collaborative learning tools'
      ]
    }
  ];

  const handleTypeSelect = (type: UserType) => {
    setSelectedType(type);
    setShowUsernameInput(true);
  };

  const handleUsernameSubmit = () => {
    if (!username.trim()) {
      alert('Please enter a username');
      return;
    }
    if (!selectedType) return;
    
    onSelect(selectedType, username.trim());
  };

  if (showUsernameInput && selectedType) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 ${className}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
        >
          <div className="text-center mb-6">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-r ${
              selectedType === 'student' 
                ? 'from-blue-500 to-cyan-500' 
                : 'from-purple-500 to-pink-500'
            } mb-4`}>
              {selectedType === 'student' ? (
                <GraduationCap className="h-8 w-8 text-white" />
              ) : (
                <Users className="h-8 w-8 text-white" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Continue as {selectedType === 'student' ? 'Student' : 'Teacher'}
            </h2>
            <p className="text-gray-600">Enter your username to get started</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleUsernameSubmit()}
                autoFocus
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowUsernameInput(false)}
                className="flex-1 py-3 px-4 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleUsernameSubmit}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold text-white bg-gradient-to-r ${
                  selectedType === 'student' 
                    ? 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600' 
                    : 'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                } transition-all duration-200`}
              >
                Continue
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 ${className}`}>
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center space-x-3 mb-6"
          >
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">QuizWhiz</h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <h2 className="text-3xl font-bold text-gray-900">Welcome to the Future of Learning</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              AI-powered multilingual quiz platform designed for modern education. 
              Choose your role to get started with personalized features.
            </p>
          </motion.div>
        </div>

        {/* User Type Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {userTypes.map((userType, index) => {
            const Icon = userType.icon;
            return (
              <motion.div
                key={userType.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTypeSelect(userType.type)}
                className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl group"
              >
                <div className="text-center mb-6">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-r ${
                    userType.color === 'blue' 
                      ? 'from-blue-500 to-cyan-500' 
                      : 'from-purple-500 to-pink-500'
                  } mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{userType.title}</h3>
                  <p className="text-gray-600">{userType.description}</p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                    Key Features
                  </h4>
                  <ul className="space-y-2">
                    {userType.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                        <div className={`w-2 h-2 rounded-full mr-3 ${
                          userType.color === 'blue' ? 'bg-blue-400' : 'bg-purple-400'
                        }`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <button className={`w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r ${
                    userType.color === 'blue' 
                      ? 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600' 
                      : 'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                  } transition-all duration-200 transform group-hover:scale-105 flex items-center justify-center space-x-2`}
                    onClick={() => handleTypeSelect(userType.type)}>
                    <User className="h-4 w-4" />
                    <span>Continue as {userType.title}</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Features Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Powered by Advanced AI Technology
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm text-gray-600">
              <div className="space-y-1">
                <div className="font-medium">🌍 Multilingual</div>
                <div>Tamil, Hindi, English & more</div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">🤖 AI-Powered</div>
                <div>Smart question generation</div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">📊 Analytics</div>
                <div>Detailed performance insights</div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">👥 Collaborative</div>
                <div>Group study & sharing</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};