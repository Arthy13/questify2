// Simple translation service (for demo purposes)
// In production, you'd use Google Translate API or similar service
export class TranslationService {
  private static translations: Record<string, Record<string, string>> = {
    en: {
      'upload_pdf': 'Upload PDF',
      'paste_text': 'Paste Text',
      'select_language': 'Select Language',
      'generate_quiz': 'Generate Quiz',
      'multiple_choice': 'Multiple Choice',
      'fill_blanks': 'Fill in the Blanks',
      'short_qa': 'Short Q&A'
    },
    ta: {
      'upload_pdf': 'PDF பதிவேற்றம்',
      'paste_text': 'உரையை ஒட்டவும்',
      'select_language': 'மொழியைத் தேர்ந்தெடுக்கவும்',
      'generate_quiz': 'வினாடி வினா உருவாக்கவும்',
      'multiple_choice': 'பல தேர்வு',
      'fill_blanks': 'வெற்றிடங்களை நிரப்பவும்',
      'short_qa': 'சிறிய கேள்வி பதில்'
    },
    hi: {
      'upload_pdf': 'PDF अपलोड करें',
      'paste_text': 'टेक्स्ट पेस्ट करें',
      'select_language': 'भाषा चुनें',
      'generate_quiz': 'क्विज़ बनाएं',
      'multiple_choice': 'बहुविकल्पीय',
      'fill_blanks': 'रिक्त स्थान भरें',
      'short_qa': 'छोटे प्रश्न उत्तर'
    }
  };

  static async translate(text: string, targetLanguage: string): Promise<string> {
    // For demo purposes, return original text
    // In production, implement actual translation service
    return text;
  }

  static getLocalizedText(key: string, language: string): string {
    return this.translations[language]?.[key] || this.translations.en[key] || key;
  }
}