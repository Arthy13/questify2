@@ .. @@
 import React, { useState, useEffect } from 'react';
 import { User, Quiz, QuizAttempt } from '../types';
 import { 
   Users, 
   BookOpen, 
   TrendingUp, 
   Plus,
   BarChart3,
   Clock,
   Award,
   UserCheck,
   AlertTriangle,
   Calendar,
   Copy,
-  Eye
+  Eye,
+  Settings,
+  Pause,
+  Play,
+  Trash2
 } from 'lucide-react';
 import { motion } from 'framer-motion';
 import { useSupabaseData } from '../hooks/useSupabaseData';
+import { LiveLeaderboard } from './LiveLeaderboard';
 import toast from 'react-hot-toast';

 interface TeacherDashboardProps {
   user: User;
   onCreateQuiz: () => void;
   onManageClasses: () => void;
 }

 export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
   user,
   onCreateQuiz,
   onManageClasses
 }) => {
   const { 
     savedQuizzes, 
     groupQuizzes, 
     userActivity,
     createGroupQuiz,
+    supabase,
     refreshData 
   } = useSupabaseData(user);
   
   const [showCreateGroup, setShowCreateGroup] = useState(false);
   const [groupQuizTitle, setGroupQuizTitle] = useState('');
   const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
+  const [selectedGroupQuiz, setSelectedGroupQuiz] = useState<any | null>(null);
+  const [showLeaderboard, setShowLeaderboard] = useState(false);

   useEffect(() => {
     refreshData();
   }, []);

   const handleCreateGroupQuiz = async () => {
     if (!selectedQuiz) {
       toast.error('Please select a quiz to share as group quiz');
       return;
     }

     if (!groupQuizTitle.trim()) {
       toast.error('Please enter a title for the group quiz');
       return;
     }

     try {
       const groupQuizData = {
         ...selectedQuiz,
         title: groupQuizTitle
       };

       await createGroupQuiz(groupQuizData);
       setShowCreateGroup(false);
       setGroupQuizTitle('');
       setSelectedQuiz(null);
       refreshData();
     } catch (error) {
       console.error('Error creating group quiz:', error);
     }
   };

+  const handleToggleGroupQuiz = async (groupQuiz: any) => {
+    if (!supabase) return;
+
+    try {
+      const { error } = await supabase
+        .from('group_quizzes')
+        .update({ is_active: !groupQuiz.is_active })
+        .eq('id', groupQuiz.id);
+
+      if (error) throw error;
+
+      toast.success(`Group quiz ${groupQuiz.is_active ? 'paused' : 'activated'} successfully`);
+      refreshData();
+    } catch (error) {
+      console.error('Error toggling group quiz:', error);
+      toast.error('Failed to update group quiz status');
+    }
+  };
+
+  const handleDeleteGroupQuiz = async (groupQuiz: any) => {
+    if (!supabase) return;
+    
+    if (!confirm(`Are you sure you want to delete "${groupQuiz.title}"? This action cannot be undone.`)) {
+      return;
+    }
+
+    try {
+      const { error } = await supabase
+        .from('group_quizzes')
+        .delete()
+        .eq('id', groupQuiz.id);
+
+      if (error) throw error;
+
+      toast.success('Group quiz deleted successfully');
+      refreshData();
+    } catch (error) {
+      console.error('Error deleting group quiz:', error);
+      toast.error('Failed to delete group quiz');
+    }
+  };
+
+  const handleViewLeaderboard = (groupQuiz: any) => {
+    setSelectedGroupQuiz(groupQuiz);
+    setShowLeaderboard(true);
+  };

   const copyQuizCode = (code: string) => {
     navigator.clipboard.writeText(code);
     toast.success('Quiz code copied to clipboard!');
   };

   const formatTime = (seconds: number) => {
     const hours = Math.floor(seconds / 3600);
     const minutes = Math.floor((seconds % 3600) / 60);
     if (hours > 0) return `${hours}h ${minutes}m`;
     return `${minutes}m`;
   };

   return (
-    <div className="space-y-8">
+    <>
+      <div className="space-y-8">
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
-              <p className="text-blue-100">Generate AI-powered quizzes for your students</p>
+              <p className="text-blue-100">Generate quizzes for your students</p>
             </div>
           </div>
         </motion.button>

         <motion.button
           whileHover={{ scale: 1.02 }}
           whileTap={{ scale: 0.98 }}
           onClick={() => setShowCreateGroup(true)}
           className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
         >
           <div className="flex items-center space-x-4">
             <div className="p-3 bg-white/20 rounded-lg">
               <Users className="h-8 w-8" />
             </div>
             <div className="text-left">
               <h3 className="text-xl font-semibold">Create Group Quiz</h3>
               <p className="text-green-100">Share quizzes with students using codes</p>
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
               <p className="text-sm text-gray-600">Created Quizzes</p>
               <p className="text-2xl font-bold text-gray-900">{savedQuizzes.length}</p>
             </div>
           </div>
         </div>

         <div className="bg-white rounded-xl shadow-sm border p-6">
           <div className="flex items-center space-x-3">
             <div className="p-2 bg-purple-100 rounded-lg">
               <Users className="h-6 w-6 text-purple-600" />
             </div>
             <div>
               <p className="text-sm text-gray-600">Group Quizzes</p>
               <p className="text-2xl font-bold text-gray-900">{groupQuizzes.length}</p>
             </div>
           </div>
         </div>

         <div className="bg-white rounded-xl shadow-sm border p-6">
           <div className="flex items-center space-x-3">
             <div className="p-2 bg-green-100 rounded-lg">
               <TrendingUp className="h-6 w-6 text-green-600" />
             </div>
             <div>
               <p className="text-sm text-gray-600">Total Participants</p>
               <p className="text-2xl font-bold text-gray-900">
                 {groupQuizzes.reduce((sum, quiz) => sum + (quiz.participants_count || 0), 0)}
               </p>
             </div>
           </div>
         </div>

         <div className="bg-white rounded-xl shadow-sm border p-6">
           <div className="flex items-center space-x-3">
             <div className="p-2 bg-orange-100 rounded-lg">
               <Award className="h-6 w-6 text-orange-600" />
             </div>
             <div>
               <p className="text-sm text-gray-600">Active Groups</p>
               <p className="text-2xl font-bold text-gray-900">
                 {groupQuizzes.filter(quiz => quiz.is_active).length}
               </p>
             </div>
           </div>
         </div>
       </div>

       {/* Group Quizzes Management */}
       <div className="bg-white rounded-xl shadow-sm border p-6">
         <div className="flex items-center justify-between mb-6">
           <h3 className="text-lg font-semibold text-gray-900 flex items-center">
             <Users className="h-5 w-5 mr-2 text-purple-500" />
             Group Quiz Management
           </h3>
           <span className="text-sm text-gray-500">{groupQuizzes.length} created</span>
         </div>

         {groupQuizzes.length > 0 ? (
           <div className="space-y-4">
             {groupQuizzes.map((quiz, index) => (
               <motion.div
                 key={quiz.id}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: index * 0.1 }}
-                className="p-4 bg-gray-50 rounded-lg border"
+                className="p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
               >
                 <div className="flex items-center justify-between">
                   <div className="flex-1">
                     <div className="flex items-center space-x-3 mb-2">
                       <h4 className="font-medium text-gray-900">{quiz.title}</h4>
                       <span className={`px-2 py-1 text-xs rounded-full ${
                         quiz.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                       }`}>
                         {quiz.is_active ? 'Active' : 'Inactive'}
                       </span>
+                      {quiz.participants_count > 0 && (
+                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
+                          {quiz.participants_count} participants
+                        </span>
+                      )}
                     </div>
                     <div className="flex items-center space-x-4 text-sm text-gray-600">
                       <span>{quiz.questions_count} questions</span>
-                      <span>{quiz.participants_count} participants</span>
+                      <span>Difficulty: {quiz.difficulty}</span>
                       <span>Created {new Date(quiz.created_at).toLocaleDateString()}</span>
                     </div>
                   </div>
                   
-                  <div className="flex items-center space-x-3">
+                  <div className="flex items-center space-x-2">
                     <div className="text-right">
                       <p className="text-sm font-medium text-gray-900">Code: {quiz.quiz_code}</p>
                       <button
                         onClick={() => copyQuizCode(quiz.quiz_code)}
                         className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                       >
                         <Copy className="h-3 w-3" />
                         <span>Copy</span>
                       </button>
                     </div>
                     
-                    {quiz.group_participants && quiz.group_participants.length > 0 && (
-                      <div className="text-right">
-                        <p className="text-xs text-gray-500 mb-1">Latest Results:</p>
-                        <div className="space-y-1">
-                          {quiz.group_participants.slice(0, 3).map((participant: any) => (
-                            <div key={participant.id} className="text-xs">
-                              <span className="font-medium">{participant.username}</span>
-                              <span className={`ml-2 ${
-                                participant.percentage >= 80 ? 'text-green-600' :
-                                participant.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
-                              }`}>
-                                {participant.percentage}%
-                              </span>
-                            </div>
-                          ))}
-                        </div>
-                      </div>
-                    )}
+                    <div className="flex items-center space-x-1">
+                      <button
+                        onClick={() => handleViewLeaderboard(quiz)}
+                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
+                        title="View Leaderboard"
+                      >
+                        <Eye className="h-4 w-4" />
+                      </button>
+                      
+                      <button
+                        onClick={() => handleToggleGroupQuiz(quiz)}
+                        className={`p-2 rounded-lg transition-colors ${
+                          quiz.is_active 
+                            ? 'text-orange-600 hover:text-orange-800 hover:bg-orange-50' 
+                            : 'text-green-600 hover:text-green-800 hover:bg-green-50'
+                        }`}
+                        title={quiz.is_active ? 'Pause Quiz' : 'Activate Quiz'}
+                      >
+                        {quiz.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
+                      </button>
+                      
+                      <button
+                        onClick={() => handleDeleteGroupQuiz(quiz)}
+                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
+                        title="Delete Quiz"
+                      >
+                        <Trash2 className="h-4 w-4" />
+                      </button>
+                    </div>
                   </div>
                 </div>
               </motion.div>
             ))}
           </div>
         ) : (
           <div className="text-center py-8">
             <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
             <p className="text-gray-500">No group quizzes created yet</p>
             <p className="text-sm text-gray-400">Create your first group quiz to get started!</p>
           </div>
         )}
       </div>

       {/* Recent Activity */}
       <div className="bg-white rounded-xl shadow-sm border p-6">
         <div className="flex items-center justify-between mb-6">
           <h3 className="text-lg font-semibold text-gray-900 flex items-center">
             <Clock className="h-5 w-5 mr-2 text-blue-500" />
             Recent Activity
           </h3>
           <span className="text-sm text-gray-500">{userActivity.length} activities</span>
         </div>

         {userActivity.length > 0 ? (
           <div className="space-y-4">
             {userActivity.slice(0, 5).map((activity, index) => (
               <motion.div
                 key={activity.id}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: index * 0.1 }}
                 className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
               >
                 <div className="p-2 bg-blue-100 rounded-lg">
                   <UserCheck className="h-4 w-4 text-blue-600" />
                 </div>
                 <div className="flex-1">
                   <p className="text-sm text-gray-900">{activity.description}</p>
                   <p className="text-xs text-gray-500">
                     {new Date(activity.created_at).toLocaleDateString()} at{' '}
                     {new Date(activity.created_at).toLocaleTimeString()}
                   </p>
                 </div>
               </motion.div>
             ))}
           </div>
         ) : (
           <div className="text-center py-8">
             <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
             <p className="text-gray-500">No recent activity</p>
             <p className="text-sm text-gray-400">Your activities will appear here</p>
           </div>
         )}
       </div>

       {/* Create Group Quiz Modal */}
       {showCreateGroup && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
           >
             <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Group Quiz</h3>
             
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Select Quiz to Share
                 </label>
                 <select
                   value={selectedQuiz?.id || ''}
                   onChange={(e) => {
                     const quiz = savedQuizzes.find(q => q.id === e.target.value);
                     setSelectedQuiz(quiz || null);
                   }}
                   className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                 >
                   <option value="">Select a quiz...</option>
                   {savedQuizzes.map(quiz => (
                     <option key={quiz.id} value={quiz.id}>
                       {quiz.title} ({quiz.questions.length} questions)
                     </option>
                   ))}
                 </select>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Group Quiz Title
                 </label>
                 <input
                   type="text"
                   value={groupQuizTitle}
                   onChange={(e) => setGroupQuizTitle(e.target.value)}
                   placeholder="Enter group quiz title"
                   className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                 />
               </div>
             </div>

             <div className="flex space-x-3 mt-6">
               <button
                 onClick={() => setShowCreateGroup(false)}
                 className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
               >
                 Cancel
               </button>
               <button
                 onClick={handleCreateGroupQuiz}
                 className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
               >
                 Create Group Quiz
               </button>
             </div>
           </motion.div>
         </div>
       )}
-    </div>
+      </div>
+
+      {/* Leaderboard Modal */}
+      {showLeaderboard && selectedGroupQuiz && (
+        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
+          <motion.div
+            initial={{ opacity: 0, scale: 0.9 }}
+            animate={{ opacity: 1, scale: 1 }}
+            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
+          >
+            <div className="flex items-center justify-between p-6 border-b border-gray-200">
+              <div>
+                <h3 className="text-xl font-semibold text-gray-900">{selectedGroupQuiz.title}</h3>
+                <p className="text-sm text-gray-500">Live Leaderboard • Code: {selectedGroupQuiz.quiz_code}</p>
+              </div>
+              <button
+                onClick={() => setShowLeaderboard(false)}
+                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
+              >
+                ×
+              </button>
+            </div>
+            <div className="p-6 max-h-[70vh] overflow-y-auto">
+              <LiveLeaderboard
+                groupQuizId={selectedGroupQuiz.id}
+                user={user}
+              />
+            </div>
+          </motion.div>
+        </div>
+      )}
+    </>
   );
 };