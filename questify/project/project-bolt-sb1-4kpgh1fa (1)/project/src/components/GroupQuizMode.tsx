import React, { useState, useEffect } from 'react';
import { Quiz, User, QuizAttempt, Group, GroupMember } from '../types';
import { Users, Share2, Copy, Clock, Trophy, UserPlus, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface GroupQuizModeProps {
  quiz: Quiz;
  user: User;
  onComplete: (attempt: QuizAttempt) => void;
  onExit: () => void;
}

export const GroupQuizMode: React.FC<GroupQuizModeProps> = ({
  quiz,
  user,
  onComplete,
  onExit
}) => {
  const [mode, setMode] = useState<'create' | 'join' | 'lobby' | 'quiz'>('create');
  const [groupCode, setGroupCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    // Generate a unique group code
    if (mode === 'create') {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      setGroupCode(code);
    }
  }, [mode]);

  const createGroup = () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    const group: Group = {
      id: Date.now().toString(),
      name: groupName,
      code: groupCode,
      createdBy: user.id,
      members: [{
        userId: user.id,
        userName: user.name,
        joinedAt: new Date(),
        role: 'admin'
      }],
      quizzes: [quiz.id],
      createdAt: new Date(),
      isActive: true
    };

    setCurrentGroup(group);
    setGroupMembers(group.members);
    setIsHost(true);
    setMode('lobby');

    // Save group to localStorage
    const savedGroups = JSON.parse(localStorage.getItem('quizwhiz_groups') || '[]');
    savedGroups.push(group);
    localStorage.setItem('quizwhiz_groups', JSON.stringify(savedGroups));

    toast.success(`Group "${groupName}" created! Share code: ${groupCode}`);
  };

  const joinGroup = () => {
    if (!joinCode.trim()) {
      toast.error('Please enter a group code');
      return;
    }

    const savedGroups = JSON.parse(localStorage.getItem('quizwhiz_groups') || '[]');
    const group = savedGroups.find((g: Group) => g.code === joinCode.toUpperCase());

    if (!group) {
      toast.error('Group not found. Please check the code.');
      return;
    }

    // Add user to group
    const newMember: GroupMember = {
      userId: user.id,
      userName: user.name,
      joinedAt: new Date(),
      role: 'member'
    };

    group.members.push(newMember);
    setCurrentGroup(group);
    setGroupMembers(group.members);
    setIsHost(false);
    setMode('lobby');

    // Update saved groups
    const updatedGroups = savedGroups.map((g: Group) => 
      g.id === group.id ? group : g
    );
    localStorage.setItem('quizwhiz_groups', JSON.stringify(updatedGroups));

    toast.success(`Joined group "${group.name}"!`);
  };

  const copyGroupCode = () => {
    navigator.clipboard.writeText(groupCode);
    toast.success('Group code copied to clipboard!');
  };

  const startGroupQuiz = () => {
    if (groupMembers.length < 2) {
      toast.error('Need at least 2 members to start a group quiz');
      return;
    }
    setMode('quiz');
  };

  const handleQuizComplete = (attempt: QuizAttempt) => {
    // Add group context to attempt
    const groupAttempt = {
      ...attempt,
      groupId: currentGroup?.id
    };
    onComplete(groupAttempt);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onExit}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Back
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-lg font-semibold text-gray-900">Group Quiz Mode</h1>
            </div>
            
            {currentGroup && (
              <div className="text-sm text-gray-600">
                Group: {currentGroup.name} • Code: {currentGroup.code}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {mode === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Create Group Quiz</h2>
                <p className="text-gray-600">Set up a collaborative quiz session for your students or study group</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Create Group */}
                <div className="bg-white rounded-xl shadow-sm border p-8">
                  <div className="text-center mb-6">
                    <div className="p-4 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4">
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Create New Group</h3>
                    <p className="text-gray-600">Start a new group quiz session</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Group Name
                      </label>
                      <input
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Enter group name..."
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Group Code (Auto-generated)
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={groupCode}
                          readOnly
                          className="flex-1 p-3 border rounded-lg bg-gray-50 text-gray-700"
                        />
                        <button
                          onClick={copyGroupCode}
                          className="px-4 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={createGroup}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold"
                    >
                      Create Group
                    </button>
                  </div>
                </div>

                {/* Join Group */}
                <div className="bg-white rounded-xl shadow-sm border p-8">
                  <div className="text-center mb-6">
                    <div className="p-4 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4">
                      <UserPlus className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Join Existing Group</h3>
                    <p className="text-gray-600">Enter a group code to join</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Group Code
                      </label>
                      <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="Enter 6-character code..."
                        maxLength={6}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-lg font-mono"
                      />
                    </div>

                    <button
                      onClick={joinGroup}
                      className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold"
                    >
                      Join Group
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {mode === 'lobby' && currentGroup && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{currentGroup.name}</h2>
                <p className="text-gray-600">Group Code: <span className="font-mono font-bold">{currentGroup.code}</span></p>
                <button
                  onClick={copyGroupCode}
                  className="mt-2 text-blue-600 hover:text-blue-800 transition-colors text-sm"
                >
                  Copy code to share
                </button>
              </div>

              {/* Quiz Info */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiz Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{quiz.questions.length}</p>
                    <p className="text-sm text-gray-600">Questions</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{quiz.type.toUpperCase()}</p>
                    <p className="text-sm text-gray-600">Type</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{quiz.difficulty}</p>
                    <p className="text-sm text-gray-600">Difficulty</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{quiz.estimatedTime}m</p>
                    <p className="text-sm text-gray-600">Est. Time</p>
                  </div>
                </div>
              </div>

              {/* Members */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Group Members ({groupMembers.length})
                  </h3>
                  {isHost && (
                    <button
                      onClick={startGroupQuiz}
                      disabled={groupMembers.length < 2}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Play className="h-4 w-4" />
                      <span>Start Quiz</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupMembers.map((member, index) => (
                    <motion.div
                      key={member.userId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {member.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{member.userName}</p>
                        <p className="text-sm text-gray-500 capitalize">{member.role}</p>
                      </div>
                      {member.role === 'admin' && (
                        <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          Host
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {!isHost && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg text-center">
                    <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-blue-800 font-medium">Waiting for host to start the quiz...</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {mode === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="bg-white rounded-xl shadow-sm border p-8">
                <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Group Quiz Started!</h2>
                <p className="text-gray-600 mb-6">
                  All members are now taking the quiz. Results will be compared at the end.
                </p>
                <div className="text-sm text-gray-500">
                  Quiz implementation would go here - this is a placeholder for the actual quiz session
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};