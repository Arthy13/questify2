import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User, Lightbulb, BookOpen, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from '../types';

interface AIAssistantProps {
  language: string;
  userType: 'student' | 'teacher';
  className?: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  language,
  userType,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message when first opened
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        content: getWelcomeMessage(),
        sender: 'assistant',
        timestamp: new Date(),
        language,
        type: 'text'
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, language, userType]);

  const getWelcomeMessage = (): string => {
    const messages = {
      en: {
        student: "Hi! I'm your AI study assistant. I can help you understand concepts, suggest study techniques, or guide you through using QuizWhiz. What would you like to know?",
        teacher: "Hello! I'm here to help you create better quizzes, understand student performance, and make the most of QuizWhiz's teaching features. How can I assist you today?"
      },
      ta: {
        student: "வணக்கம்! நான் உங்கள் AI படிப்பு உதவியாளர். கருத்துகளை புரிந்துகொள்ள, படிப்பு நுட்பங்களை பரிந்துரைக்க, அல்லது QuizWhiz பயன்படுத்த உதவ முடியும். என்ன தெரிந்துகொள்ள விரும்புகிறீர்கள்?",
        teacher: "வணக்கம்! சிறந்த வினாடி வினாக்களை உருவாக்க, மாணவர் செயல்திறனை புரிந்துகொள்ள, மற்றும் QuizWhiz கற்பித்தல் அம்சங்களை சிறப்பாக பயன்படுத்த உதவ இங்கே இருக்கிறேன். இன்று எப்படி உதவ முடியும்?"
      },
      hi: {
        student: "नमस्ते! मैं आपका AI अध्ययन सहायक हूं। मैं अवधारणाओं को समझने, अध्ययन तकनीकों का सुझाव देने, या QuizWhiz का उपयोग करने में मार्गदर्शन करने में मदद कर सकता हूं। आप क्या जानना चाहते हैं?",
        teacher: "नमस्ते! मैं बेहतर क्विज़ बनाने, छात्र प्रदर्शन को समझने, और QuizWhiz की शिक्षण सुविधाओं का अधिकतम उपयोग करने में आपकी मदद के लिए यहां हूं। आज मैं आपकी कैसे सहायता कर सकता हूं?"
      }
    };

    return messages[language as keyof typeof messages]?.[userType] || messages.en[userType];
  };

  const quickSuggestions = [
    {
      icon: Lightbulb,
      text: userType === 'student' ? 'Study tips' : 'Quiz creation tips',
      action: userType === 'student' ? 'Give me some effective study tips' : 'How can I create engaging quizzes?'
    },
    {
      icon: BookOpen,
      text: userType === 'student' ? 'Explain concepts' : 'Student analytics',
      action: userType === 'student' ? 'Help me understand difficult concepts' : 'How to interpret student performance data?'
    },
    {
      icon: HelpCircle,
      text: 'How to use QuizWhiz',
      action: 'Guide me through using QuizWhiz features'
    }
  ];

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      language,
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputMessage, userType, language);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'assistant',
        timestamp: new Date(),
        language,
        type: 'text'
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (input: string, userType: string, language: string): string => {
    // Simple response generation based on keywords
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('study') || lowerInput.includes('learn')) {
      return userType === 'student' 
        ? "Here are some effective study techniques: 1) Use active recall by testing yourself, 2) Space out your learning sessions, 3) Create mind maps for complex topics, 4) Take regular breaks using the Pomodoro technique. Would you like me to elaborate on any of these?"
        : "To help students study better, consider: 1) Creating varied question types, 2) Providing immediate feedback, 3) Using spaced repetition in your quizzes, 4) Incorporating real-world examples. What specific subject are you teaching?";
    }
    
    if (lowerInput.includes('quiz') || lowerInput.includes('question')) {
      return userType === 'student'
        ? "When taking quizzes: 1) Read questions carefully, 2) Eliminate obviously wrong answers first, 3) Don't spend too much time on one question, 4) Review your answers if time permits. Remember, practice makes perfect!"
        : "For creating effective quizzes: 1) Mix different difficulty levels, 2) Include various question types, 3) Provide clear explanations for answers, 4) Test concepts, not just memorization. Would you like tips for any specific subject?";
    }
    
    if (lowerInput.includes('difficult') || lowerInput.includes('hard')) {
      return "When facing difficult concepts: 1) Break them down into smaller parts, 2) Use analogies to relate to familiar ideas, 3) Practice with examples, 4) Don't hesitate to ask for help. Remember, every expert was once a beginner!";
    }
    
    return "I understand you're looking for help. Could you be more specific about what you'd like to know? I can assist with study techniques, quiz strategies, understanding concepts, or using QuizWhiz features.";
  };

  const handleSuggestionClick = (action: string) => {
    setInputMessage(action);
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 h-96 mb-4 flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bot className="h-5 w-5" />
                  <span className="font-semibold">AI Assistant</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[80%] ${
                    message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      message.sender === 'user' 
                        ? 'bg-blue-500' 
                        : 'bg-gradient-to-r from-purple-500 to-pink-500'
                    }`}>
                      {message.sender === 'user' ? (
                        <User className="h-3 w-3 text-white" />
                      ) : (
                        <Bot className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div className={`p-3 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <Bot className="h-3 w-3 text-white" />
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2">
                <div className="text-xs text-gray-500 mb-2">Quick suggestions:</div>
                <div className="space-y-1">
                  {quickSuggestions.map((suggestion, index) => {
                    const Icon = suggestion.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion.action)}
                        className="w-full text-left p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <Icon className="h-3 w-3 text-gray-400" />
                        <span>{suggestion.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything..."
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </motion.button>
    </div>
  );
};