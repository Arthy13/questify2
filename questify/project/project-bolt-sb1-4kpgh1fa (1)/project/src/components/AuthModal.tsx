import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, User, GraduationCap, Users, LogIn } from 'lucide-react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import toast from 'react-hot-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any, userType: 'student' | 'teacher') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [selectedUserType, setSelectedUserType] = useState<'student' | 'teacher'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle, createDemoUser, isConfigured } = useFirebaseAuth();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    
    try {
      const result = await signInWithGoogle();
      
      if (result) {
        // Update user type after successful login
        await result.userProfile;
        onSuccess(result.user, selectedUserType);
        onClose();
      }

      // The actual user data will be handled in the auth state change listener
      toast.success('Redirecting to Google...');
      
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      const demoUser = createDemoUser(selectedUserType);
      onSuccess(demoUser, selectedUserType);
      onClose();
    } catch (error) {
      toast.error('Failed to create demo user');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Welcome to QuizWhiz</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User Type Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">I am a...</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedUserType('student')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedUserType === 'student'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <GraduationCap className="h-8 w-8 mx-auto mb-2" />
                  <div className="font-medium">Student</div>
                  <div className="text-sm text-gray-500">Learn & Practice</div>
                </button>
                <button
                  onClick={() => setSelectedUserType('teacher')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedUserType === 'teacher'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Users className="h-8 w-8 mx-auto mb-2" />
                  <div className="font-medium">Teacher</div>
                  <div className="text-sm text-gray-500">Create & Manage</div>
                </button>
              </div>
            </div>

            {/* Login Options */}
            <div className="space-y-3">
              {isConfigured && (
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-3 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all disabled:opacity-50"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="font-medium text-gray-700">
                    {isLoading ? 'Connecting...' : 'Continue with Google'}
                  </span>
                </button>
              )}

              {isConfigured && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleDemoLogin}
                className="w-full flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                <User className="h-5 w-5" />
                <span className="font-medium">
                  {isConfigured ? 'Try Demo Mode' : 'Continue as Demo User'}
                </span>
              </button>
            </div>

            {!isConfigured && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Demo Mode:</strong> Google login requires Firebase configuration. 
                  You can still use all features in demo mode!
                </p>
              </div>
            )}

            <p className="text-xs text-gray-500 text-center mt-6">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};