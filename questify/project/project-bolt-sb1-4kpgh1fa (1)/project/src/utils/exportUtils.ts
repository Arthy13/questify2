import jsPDF from 'jspdf';
import { Question, Quiz, QuizAttempt } from '../types';

export class ExportService {
  static exportToPDF(quiz: Quiz): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const lineHeight = 7;
    let yPos = margin;
    
    // Helper function to add text with word wrapping
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 12): number => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * lineHeight);
    };
    
    // Helper function to check if we need a new page
    const checkNewPage = (requiredSpace: number): number => {
      if (yPos + requiredSpace > pageHeight - margin) {
        doc.addPage();
        return margin;
      }
      return yPos;
    };
    
    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    yPos = addWrappedText(quiz.title, margin, yPos, pageWidth - 2 * margin, 24);
    yPos += 10;
    
    // Quiz info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    yPos = addWrappedText(`Language: ${quiz.language}`, margin, yPos, pageWidth - 2 * margin);
    yPos = addWrappedText(`Type: ${quiz.type.toUpperCase()}`, margin, yPos, pageWidth - 2 * margin);
    yPos = addWrappedText(`Questions: ${quiz.questions.length}`, margin, yPos, pageWidth - 2 * margin);
    if (quiz.difficulty) {
      yPos = addWrappedText(`Difficulty: ${quiz.difficulty.toUpperCase()}`, margin, yPos, pageWidth - 2 * margin);
    }
    yPos += 15;
    
    // Questions
    quiz.questions.forEach((question, index) => {
      // Check if we need space for the question (estimate 60 units minimum)
      yPos = checkNewPage(60);
      
      // Question number and text
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      yPos = addWrappedText(`${index + 1}. ${question.question}`, margin, yPos, pageWidth - 2 * margin, 14);
      yPos += 5;
      
      // Options for MCQ
      if (question.options && question.type === 'mcq') {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        question.options.forEach((option, optIndex) => {
          yPos = checkNewPage(10);
          const optionText = `   ${String.fromCharCode(65 + optIndex)}. ${option}`;
          yPos = addWrappedText(optionText, margin, yPos, pageWidth - 2 * margin);
        });
        yPos += 5;
      }
      
      // Answer section
      yPos = checkNewPage(20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      yPos = addWrappedText('Answer:', margin, yPos, pageWidth - 2 * margin, 10);
      
      doc.setFont('helvetica', 'normal');
      yPos = addWrappedText(question.correctAnswer, margin + 30, yPos - lineHeight, pageWidth - 2 * margin - 30, 10);
      
      // Explanation if available
      if (question.explanation) {
        yPos = checkNewPage(15);
        doc.setFont('helvetica', 'bold');
        yPos = addWrappedText('Explanation:', margin, yPos, pageWidth - 2 * margin, 10);
        
        doc.setFont('helvetica', 'normal');
        yPos = addWrappedText(question.explanation, margin + 30, yPos - lineHeight, pageWidth - 2 * margin - 30, 10);
      }
      
      yPos += 15;
    });
    
    // Save the PDF
    doc.save(`${quiz.title.replace(/\s+/g, '_')}_Quiz.pdf`);
  }

  static exportToCSV(quiz: Quiz): void {
    const headers = ['Question', 'Type', 'Options', 'Correct Answer', 'Explanation', 'Difficulty', 'Concept'];
    const rows = quiz.questions.map(q => [
      q.question,
      q.type,
      q.options?.join('; ') || '',
      q.correctAnswer,
      q.explanation || '',
      q.difficulty || '',
      q.concept || ''
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${quiz.title.replace(/\s+/g, '_')}_Quiz.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  static exportResultsToPDF(attempt: QuizAttempt, quiz: Quiz): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const lineHeight = 7;
    let yPos = margin;
    
    // Helper functions (same as above)
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 12): number => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * lineHeight);
    };
    
    const checkNewPage = (requiredSpace: number): number => {
      if (yPos + requiredSpace > pageHeight - margin) {
        doc.addPage();
        return margin;
      }
      return yPos;
    };
    
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    };
    
    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    yPos = addWrappedText('Quiz Results Report', margin, yPos, pageWidth - 2 * margin, 24);
    yPos += 15;
    
    // Quiz info
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    yPos = addWrappedText(quiz.title, margin, yPos, pageWidth - 2 * margin, 14);
    yPos += 10;
    
    // Results summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    yPos = addWrappedText(`Score: ${attempt.percentage}% (${attempt.correctAnswers}/${attempt.totalQuestions})`, margin, yPos, pageWidth - 2 * margin);
    yPos = addWrappedText(`Time Spent: ${formatTime(attempt.timeSpent)}`, margin, yPos, pageWidth - 2 * margin);
    yPos = addWrappedText(`Completed: ${attempt.completedAt.toLocaleDateString()}`, margin, yPos, pageWidth - 2 * margin);
    yPos += 15;
    
    // Performance breakdown
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    yPos = addWrappedText('Detailed Results', margin, yPos, pageWidth - 2 * margin, 16);
    yPos += 10;
    
    // Question-by-question results
    attempt.feedback.forEach((feedback, index) => {
      yPos = checkNewPage(80);
      
      // Question header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const statusText = feedback.isCorrect ? '✓ CORRECT' : '✗ INCORRECT';
      yPos = addWrappedText(`Question ${index + 1}: ${statusText}`, margin, yPos, pageWidth - 2 * margin);
      yPos += 5;
      
      // Question text
      doc.setFont('helvetica', 'normal');
      yPos = addWrappedText(feedback.question, margin, yPos, pageWidth - 2 * margin);
      yPos += 5;
      
      // Answers
      doc.setFontSize(10);
      yPos = addWrappedText(`Your Answer: ${feedback.userAnswer || 'No answer'}`, margin + 10, yPos, pageWidth - 2 * margin - 10, 10);
      yPos = addWrappedText(`Correct Answer: ${feedback.correctAnswer}`, margin + 10, yPos, pageWidth - 2 * margin - 10, 10);
      
      if (feedback.explanation) {
        yPos = addWrappedText(`Explanation: ${feedback.explanation}`, margin + 10, yPos, pageWidth - 2 * margin - 10, 10);
      }
      
      if (feedback.concept) {
        yPos = addWrappedText(`Concept: ${feedback.concept}`, margin + 10, yPos, pageWidth - 2 * margin - 10, 10);
      }
      
      yPos += 10;
    });
    
    // Save the PDF
    doc.save(`${quiz.title.replace(/\s+/g, '_')}_Results_${new Date().toISOString().split('T')[0]}.pdf`);
  }
}