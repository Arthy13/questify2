@@ .. @@
 export interface QuizAttemptRecord {
   id: string
   user_id: string
   quiz_id: string
   score: number
   total_questions: number
   percentage: number
   time_spent: number
   answers: any
   feedback: any
   created_at: string
 }

+export interface QuizHistoryRecord {
+  id: string
+  user_id: string
+  quiz_group_code?: string
+  quiz_title: string
+  score: number
+  total_questions: number
+  percentage: number
+  time_spent: number
+  answers?: any
+  date_taken: string
+}
+
 export interface FileUpload {
   id: string
   user_id: string
   file_name: string
   file_size: number
   file_type: string
   extracted_text: string
   metadata: any
   created_at: string
 }