@@ .. @@
 export const useSupabaseData = (currentUser: User | null) => {
   const [savedQuizzes, setSavedQuizzes] = useState<Quiz[]>([]);
   const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
   const [groupQuizzes, setGroupQuizzes] = useState<any[]>([]);
   const [userActivity, setUserActivity] = useState<any[]>([]);
+  const [notifications, setNotifications] = useState<any[]>([]);
   const [loading, setLoading] = useState(false);

   // Set current user context for RLS
@@ .. @@
   // Load user data
   useEffect(() => {
     if (currentUser) {
       loadUserData();
+      subscribeToNotifications();
     }
   }, [currentUser]);

   const loadUserData = async () => {
@@ .. @@
       // Load user activity
       const { data: activity } = await supabase
         .from('user_activity')
         .select('*')
         .eq('user_id', currentUser.id)
         .order('created_at', { ascending: false })
         .limit(10);

+      // Load notifications
+      const { data: notifs } = await supabase
+        .from('notifications')
+        .select('*')
+        .eq('user_id', currentUser.id)
+        .order('created_at', { ascending: false })
+        .limit(20);

       setSavedQuizzes(quizzes || []);
       setQuizAttempts(attempts || []);
       setUserActivity(activity || []);
+      setNotifications(notifs || []);
     } catch (error) {
       console.error('Error loading user data:', error);
       toast.error('Failed to load user data');
     } finally {
       setLoading(false);
     }
   };

+  const subscribeToNotifications = () => {
+    if (!currentUser || !supabase) return;
+
+    const subscription = supabase
+      .channel('user-notifications')
+      .on(
+        'postgres_changes',
+        {
+          event: 'INSERT',
+          schema: 'public',
+          table: 'notifications',
+          filter: `user_id=eq.${currentUser.id}`
+        },
+        (payload) => {
+          console.log('New notification:', payload);
+          setNotifications(prev => [payload.new, ...prev]);
+          
+          // Show toast for new notifications
+          if (payload.new.type === 'group_quiz_created') {
+            toast.success(`New group quiz available! Code: ${payload.new.data.quiz_code}`);
+          }
+        }
+      )
+      .subscribe();

+    return () => {
+      subscription.unsubscribe();
+    };
+  };

   const saveQuiz = async (quizData: any) => {
@@ .. @@
   return {
     savedQuizzes,
     quizAttempts,
     groupQuizzes,
     userActivity,
+    notifications,
     loading,
+    supabase,
     saveQuiz,
     saveQuizAttempt,
     createGroupQuiz,
     joinGroupQuiz,
     submitGroupQuizResult,
     saveFileUpload,
     logActivity,
     getAvailableGroupQuizzes,
     refreshData: loadUserData
   };
 };