import { Question, QuizType, UserType } from '../types';

export class QuizGenerator {
  private static getKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const commonWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'does', 'let', 'man', 'she', 'too', 'use', 'will', 'with', 'have', 'this', 'that', 'they', 'from', 'been', 'said', 'each', 'which', 'their', 'time', 'would', 'there', 'could', 'other', 'after', 'first', 'well', 'water', 'very', 'what', 'know', 'just', 'where', 'much', 'before', 'move', 'right', 'think', 'also', 'around', 'another', 'came', 'come', 'work', 'three', 'must', 'because', 'does', 'part'];
    
    return words.filter(word => !commonWords.includes(word));
  }

  private static getSentences(text: string): string[] {
    return text.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20 && s.length < 500);
  }

  private static extractConcepts(text: string): string[] {
    const sentences = this.getSentences(text);
    const concepts: string[] = [];
    
    sentences.forEach(sentence => {
      const words = sentence.split(' ');
      const importantWords = words.filter(word => 
        word.length > 5 && 
        /^[A-Z]/.test(word) && 
        !['The', 'This', 'That', 'These', 'Those', 'When', 'Where', 'What', 'Which', 'Who', 'How', 'Why'].includes(word)
      );
      concepts.push(...importantWords);
    });
    
    return [...new Set(concepts)].slice(0, 15);
  }

  private static generateMCQ(text: string, count: number, difficulty: string = 'medium', userType?: UserType): Question[] {
    const sentences = this.getSentences(text);
    const concepts = this.extractConcepts(text);
    const questions: Question[] = [];
    const usedSentences = new Set<string>();
    
    let attempts = 0;
    const maxAttempts = count * 5; // Increased attempts for better generation
    
    while (questions.length < count && attempts < maxAttempts) {
      attempts++;
      const sentence = sentences[Math.floor(Math.random() * sentences.length)];
      
      if (usedSentences.has(sentence) || sentence.length < 30) continue;
      usedSentences.add(sentence);
      
      const words = sentence.split(' ');
      if (words.length < 8) continue;
      
      // Enhanced word selection based on difficulty and user type
      let importantWords = words.filter(word => {
        const cleanWord = word.replace(/[^\w]/g, '');
        return cleanWord.length > 3 && 
               !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'does', 'let', 'man', 'she', 'too', 'use', 'will', 'with', 'have', 'this', 'that', 'they', 'from', 'been', 'said', 'each', 'which', 'their', 'time', 'would', 'there', 'could', 'other'].includes(cleanWord.toLowerCase());
      });
      
      // Prioritize longer, more complex words for harder difficulties
      if (difficulty === 'hard') {
        importantWords = importantWords.filter(word => word.length > 6);
      } else if (difficulty === 'easy') {
        importantWords = importantWords.filter(word => word.length <= 8);
      }
      
      if (importantWords.length === 0) continue;
      
      const targetWord = importantWords[Math.floor(Math.random() * importantWords.length)];
      const cleanTargetWord = targetWord.replace(/[^\w]/g, '');
      
      // Create question with blank
      const questionText = sentence.replace(new RegExp(`\\b${targetWord}\\b`, 'gi'), '______');
      
      // Generate enhanced distractors
      const allKeywords = this.getKeywords(text);
      let distractors = allKeywords
        .filter(w => w !== cleanTargetWord.toLowerCase() && 
                    w.length >= Math.max(3, cleanTargetWord.length - 2) &&
                    w.length <= cleanTargetWord.length + 3)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
      // If not enough distractors, generate synthetic ones
      if (distractors.length < 3) {
        const syntheticDistractors = this.generateSyntheticDistractors(cleanTargetWord, difficulty);
        distractors.push(...syntheticDistractors.slice(0, 3 - distractors.length));
      }
      
      // Ensure we have exactly 3 distractors
      while (distractors.length < 3) {
        distractors.push(`option${distractors.length + 1}`);
      }
      
      const options = [cleanTargetWord, ...distractors.slice(0, 3)]
        .sort(() => Math.random() - 0.5);
      
      const concept = concepts.find(c => sentence.includes(c)) || 'General Knowledge';
      
      // Enhanced explanation based on user type
      let explanation = `The correct answer is "${cleanTargetWord}" as mentioned in the original text.`;
      if (userType === 'teacher') {
        explanation += ` This question tests ${difficulty} level comprehension of the concept: ${concept}.`;
      }
      
      questions.push({
        id: `mcq-${questions.length + 1}`,
        type: 'mcq',
        question: `Complete the sentence: "${questionText}"`,
        options,
        correctAnswer: cleanTargetWord,
        explanation,
        difficulty: difficulty as any,
        concept,
        points: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3
      });
    }
    
    return questions;
  }

  private static generateSyntheticDistractors(targetWord: string, difficulty: string): string[] {
    const distractors: string[] = [];
    
    // Generate variations based on difficulty
    if (difficulty === 'easy') {
      distractors.push(
        targetWord + 's',
        targetWord + 'ed',
        targetWord + 'ing'
      );
    } else if (difficulty === 'medium') {
      distractors.push(
        'un' + targetWord,
        targetWord + 'tion',
        'pre' + targetWord
      );
    } else {
      distractors.push(
        'anti' + targetWord,
        targetWord + 'ism',
        'pseudo' + targetWord
      );
    }
    
    return distractors.filter(d => d !== targetWord);
  }

  private static generateFillup(text: string, count: number, difficulty: string = 'medium', userType?: UserType): Question[] {
    const sentences = this.getSentences(text);
    const concepts = this.extractConcepts(text);
    const questions: Question[] = [];
    const usedSentences = new Set<string>();
    
    let attempts = 0;
    const maxAttempts = count * 5;
    
    while (questions.length < count && attempts < maxAttempts) {
      attempts++;
      const sentence = sentences[Math.floor(Math.random() * sentences.length)];
      
      if (usedSentences.has(sentence) || sentence.length < 50) continue;
      usedSentences.add(sentence);
      
      const words = sentence.split(' ');
      if (words.length < 12) continue;
      
      // Determine number of blanks based on difficulty
      const blanksCount = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
      const blankedWords: string[] = [];
      const questionWords = [...words];
      
      // Enhanced word selection for blanks
      const candidateIndices = words
        .map((word, index) => ({ word: word.replace(/[^\w]/g, ''), index }))
        .filter(({ word }) => word.length > 4 && 
                              !/^[a-z]/.test(word) &&
                              !['The', 'This', 'That', 'These', 'Those', 'When', 'Where', 'What', 'Which', 'Who', 'How', 'Why'].includes(word))
        .sort(() => Math.random() - 0.5)
        .slice(0, blanksCount);
      
      candidateIndices.forEach(({ word, index }) => {
        const cleanWord = word.replace(/[^\w]/g, '');
        blankedWords.push(cleanWord);
        questionWords[index] = '_______';
      });
      
      if (blankedWords.length === 0) continue;
      
      const concept = concepts.find(c => sentence.includes(c)) || 'General Knowledge';
      
      // Enhanced explanation
      let explanation = `The missing words are: ${blankedWords.join(', ')}.`;
      if (userType === 'teacher') {
        explanation += ` This ${difficulty} level question tests understanding of ${concept}.`;
      }
      
      questions.push({
        id: `fillup-${questions.length + 1}`,
        type: 'fillup',
        question: `Fill in the blanks: ${questionWords.join(' ')}`,
        correctAnswer: blankedWords.join(', '),
        explanation,
        difficulty: difficulty as any,
        concept,
        points: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3
      });
    }
    
    return questions;
  }

  private static generateQA(text: string, count: number, difficulty: string = 'medium', userType?: UserType): Question[] {
    const sentences = this.getSentences(text);
    const concepts = this.extractConcepts(text);
    const questions: Question[] = [];
    
    const questionTemplates = {
      easy: [
        'What is mentioned about',
        'According to the text, what',
        'The text states that',
        'What does the text say about',
        'How is {concept} described'
      ],
      medium: [
        'Explain the relationship between',
        'How does the text describe',
        'What can be inferred about',
        'Analyze the role of',
        'Compare the significance of'
      ],
      hard: [
        'Critically evaluate the implications of',
        'Synthesize the key arguments regarding',
        'Assess the validity of claims about',
        'Examine the underlying assumptions of',
        'Construct an argument for'
      ]
    };
    
    const templates = questionTemplates[difficulty as keyof typeof questionTemplates] || questionTemplates.medium;
    
    let attempts = 0;
    const maxAttempts = count * 5;
    
    while (questions.length < count && attempts < maxAttempts) {
      attempts++;
      const sentence = sentences[Math.floor(Math.random() * sentences.length)];
      
      if (sentence.length < 60) continue;
      
      const template = templates[Math.floor(Math.random() * templates.length)];
      const concept = concepts[Math.floor(Math.random() * concepts.length)] || 'the main topic';
      
      let questionText: string;
      let answerText: string;
      
      if (template.includes('{concept}')) {
        questionText = template.replace('{concept}', concept.toLowerCase());
        answerText = sentence;
      } else if (template.includes('mentioned about') || template.includes('describe')) {
        questionText = `${template} ${concept.toLowerCase()} based on this passage?`;
        answerText = sentence;
      } else if (template.includes('states that')) {
        questionText = `Complete this statement from the text: "${sentence.substring(0, 40)}..."`;
        answerText = sentence;
      } else if (template.includes('relationship') || template.includes('Compare')) {
        const concepts2 = concepts.filter(c => c !== concept);
        const concept2 = concepts2[Math.floor(Math.random() * concepts2.length)] || 'related concepts';
        questionText = `${template} ${concept.toLowerCase()} and ${concept2.toLowerCase()} as discussed in the text?`;
        answerText = sentence;
      } else {
        questionText = `${template} ${concept.toLowerCase()} as presented in the text?`;
        answerText = sentence;
      }
      
      // Enhanced explanation based on user type and difficulty
      let explanation = `This answer is based on the information provided in the text.`;
      if (userType === 'teacher') {
        explanation += ` This ${difficulty} level question assesses ${
          difficulty === 'easy' ? 'basic recall' : 
          difficulty === 'medium' ? 'comprehension and application' : 
          'critical thinking and analysis'
        } skills related to ${concept}.`;
      }
      
      questions.push({
        id: `qa-${questions.length + 1}`,
        type: 'qa',
        question: questionText,
        correctAnswer: answerText,
        explanation,
        difficulty: difficulty as any,
        concept,
        points: difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 5
      });
    }
    
    return questions;
  }

  static generateQuiz(
    text: string, 
    type: QuizType, 
    count: number = 5, 
    difficulty: string = 'medium',
    userType?: UserType
  ): Question[] {
    if (!text || text.trim().length < 100) {
      throw new Error('Text is too short to generate meaningful questions. Please provide at least 100 characters.');
    }

    let questions: Question[] = [];
    
    try {
      switch (type) {
        case 'mcq':
          questions = this.generateMCQ(text, count, difficulty, userType);
          break;
        case 'fillup':
          questions = this.generateFillup(text, count, difficulty, userType);
          break;
        case 'qa':
          questions = this.generateQA(text, count, difficulty, userType);
          break;
        default:
          throw new Error('Invalid quiz type');
      }
      
      // Ensure we generate the requested number of questions
      if (questions.length < count) {
        // Try to generate more questions with relaxed constraints
        const additionalQuestions = this.generateAdditionalQuestions(text, type, count - questions.length, difficulty, userType);
        questions.push(...additionalQuestions);
      }
      
      if (questions.length === 0) {
        throw new Error('Could not generate any questions from the provided text. Please try with different content or a different question type.');
      }
      
      // Shuffle questions for variety
      questions = questions.sort(() => Math.random() - 0.5);
      
    } catch (error) {
      throw new Error(`Failed to generate ${type.toUpperCase()} questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return questions.slice(0, count);
  }

  private static generateAdditionalQuestions(
    text: string, 
    type: QuizType, 
    count: number, 
    difficulty: string, 
    userType?: UserType
  ): Question[] {
    // Fallback generation with more relaxed constraints
    const sentences = this.getSentences(text);
    const questions: Question[] = [];
    
    for (let i = 0; i < count && i < sentences.length; i++) {
      const sentence = sentences[i];
      const words = sentence.split(' ');
      
      if (words.length < 5) continue;
      
      const questionId = `${type}-fallback-${i + 1}`;
      
      if (type === 'mcq') {
        const targetWord = words.find(w => w.length > 4) || words[Math.floor(words.length / 2)];
        const questionText = sentence.replace(targetWord, '______');
        
        questions.push({
          id: questionId,
          type: 'mcq',
          question: `Complete: "${questionText}"`,
          options: [targetWord, 'option1', 'option2', 'option3'].sort(() => Math.random() - 0.5),
          correctAnswer: targetWord,
          explanation: `The correct answer is "${targetWord}".`,
          difficulty: difficulty as any,
          concept: 'General',
          points: 1
        });
      } else if (type === 'fillup') {
        const targetWord = words[Math.floor(words.length / 2)];
        const questionText = sentence.replace(targetWord, '_______');
        
        questions.push({
          id: questionId,
          type: 'fillup',
          question: `Fill in the blank: ${questionText}`,
          correctAnswer: targetWord,
          explanation: `The missing word is "${targetWord}".`,
          difficulty: difficulty as any,
          concept: 'General',
          points: 1
        });
      } else if (type === 'qa') {
        questions.push({
          id: questionId,
          type: 'qa',
          question: `What does this sentence convey: "${sentence.substring(0, 50)}..."?`,
          correctAnswer: sentence,
          explanation: 'This answer is based on the provided text.',
          difficulty: difficulty as any,
          concept: 'General',
          points: 2
        });
      }
    }
    
    return questions;
  }
}