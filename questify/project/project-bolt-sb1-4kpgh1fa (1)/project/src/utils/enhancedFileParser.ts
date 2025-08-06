import { FileUploadResult } from '../types';

export class EnhancedFileParser {
  static async parseFile(file: File): Promise<FileUploadResult> {
    const fileType = file.type;
    const fileName = file.name;
    const fileSize = file.size;

    // Check file size (50MB limit)
    if (fileSize > 50 * 1024 * 1024) {
      throw new Error('File size exceeds 50MB limit');
    }

    let text = '';
    let pageCount: number | undefined;

    try {
      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        text = await this.parsePDF(file);
        pageCount = await this.getPDFPageCount(file);
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || fileName.endsWith('.pptx')) {
        text = await this.parsePowerPoint(file);
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
        text = await this.parseWord(file);
      } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
        text = await this.parseText(file);
      } else {
        throw new Error('Unsupported file type. Please upload PDF, PPTX, DOCX, or TXT files.');
      }

      if (text.length < 50) {
        throw new Error('Could not extract sufficient text from the file. Please check the file content or try a different file.');
      }

      return {
        text: text.trim(),
        metadata: {
          fileName,
          fileSize,
          fileType,
          pageCount,
          language: this.detectLanguage(text)
        }
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to parse file. Please try a different file or paste the text directly.');
    }
  }

  private static async parsePDF(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Enhanced PDF text extraction
          const decoder = new TextDecoder('utf-8');
          let text = decoder.decode(uint8Array);
          
          // Remove PDF binary data and extract readable text
          text = text.replace(/[^\x20-\x7E\u00A0-\uFFFF\n\r\t]/g, ' ');
          
          // Extract text between common PDF text markers
          const textMatches = text.match(/\(([^)]+)\)/g) || [];
          const extractedText = textMatches
            .map(match => match.slice(1, -1))
            .filter(t => t.length > 2 && !/^[0-9\s]*$/.test(t))
            .join(' ');
          
          // Also try to extract text from stream objects
          const streamMatches = text.match(/stream\s*(.*?)\s*endstream/gs) || [];
          const streamText = streamMatches
            .map(match => match.replace(/stream|endstream/g, ''))
            .join(' ')
            .replace(/[^\x20-\x7E\u00A0-\uFFFF\n\r\t]/g, ' ')
            .replace(/\s+/g, ' ');

          let finalText = extractedText || streamText;
          
          // Clean up the text
          finalText = finalText
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s\u00A0-\uFFFF.,!?;:()\-"']/g, ' ')
            .trim();
          
          if (finalText.length < 50) {
            reject(new Error('Could not extract sufficient text from PDF. The file might be image-based or encrypted.'));
          } else {
            resolve(finalText);
          }
        } catch (error) {
          reject(new Error('Failed to parse PDF file. Please try converting it to text first.'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsArrayBuffer(file);
    });
  }

  private static async getPDFPageCount(file: File): Promise<number> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const pageMatches = text.match(/\/Type\s*\/Page[^s]/g);
          resolve(pageMatches ? pageMatches.length : 1);
        } catch {
          resolve(1);
        }
      };
      
      reader.readAsText(file);
    });
  }

  private static async parsePowerPoint(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          // PowerPoint files are ZIP archives, we'll extract text from XML files
          const uint8Array = new Uint8Array(arrayBuffer);
          const decoder = new TextDecoder('utf-8');
          let content = decoder.decode(uint8Array);
          
          // Look for slide content in XML format
          const textMatches = content.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) || [];
          const extractedText = textMatches
            .map(match => match.replace(/<[^>]+>/g, ''))
            .filter(text => text.trim().length > 0)
            .join(' ');
          
          // Also try to extract from paragraph elements
          const paragraphMatches = content.match(/<a:p[^>]*>.*?<\/a:p>/gs) || [];
          const paragraphText = paragraphMatches
            .map(match => match.replace(/<[^>]+>/g, ' '))
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          const finalText = (extractedText || paragraphText).trim();
          
          if (finalText.length < 20) {
            reject(new Error('Could not extract sufficient text from PowerPoint file.'));
          } else {
            resolve(finalText);
          }
        } catch (error) {
          reject(new Error('Failed to parse PowerPoint file. Please save as PDF or copy the text manually.'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read PowerPoint file'));
      reader.readAsArrayBuffer(file);
    });
  }

  private static async parseWord(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          // Word files are ZIP archives, extract text from document.xml
          const uint8Array = new Uint8Array(arrayBuffer);
          const decoder = new TextDecoder('utf-8');
          let content = decoder.decode(uint8Array);
          
          // Look for text content in Word XML format
          const textMatches = content.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
          const extractedText = textMatches
            .map(match => match.replace(/<[^>]+>/g, ''))
            .filter(text => text.trim().length > 0)
            .join(' ');
          
          // Also try to extract from paragraph runs
          const runMatches = content.match(/<w:r[^>]*>.*?<\/w:r>/gs) || [];
          const runText = runMatches
            .map(match => match.replace(/<[^>]+>/g, ' '))
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          const finalText = (extractedText || runText).trim();
          
          if (finalText.length < 20) {
            reject(new Error('Could not extract sufficient text from Word document.'));
          } else {
            resolve(finalText);
          }
        } catch (error) {
          reject(new Error('Failed to parse Word document. Please save as PDF or copy the text manually.'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read Word document'));
      reader.readAsArrayBuffer(file);
    });
  }

  private static async parseText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          if (text.trim().length < 20) {
            reject(new Error('Text file appears to be empty or too short.'));
          } else {
            resolve(text.trim());
          }
        } catch (error) {
          reject(new Error('Failed to read text file.'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(file, 'utf-8');
    });
  }

  private static detectLanguage(text: string): string {
    // Enhanced language detection
    const tamilPattern = /[\u0B80-\u0BFF]/;
    const hindiPattern = /[\u0900-\u097F]/;
    const arabicPattern = /[\u0600-\u06FF]/;
    const chinesePattern = /[\u4E00-\u9FFF]/;
    const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF]/;
    const koreanPattern = /[\uAC00-\uD7AF]/;
    const russianPattern = /[\u0400-\u04FF]/;
    const greekPattern = /[\u0370-\u03FF]/;

    if (tamilPattern.test(text)) return 'ta';
    if (hindiPattern.test(text)) return 'hi';
    if (arabicPattern.test(text)) return 'ar';
    if (chinesePattern.test(text)) return 'zh';
    if (japanesePattern.test(text)) return 'ja';
    if (koreanPattern.test(text)) return 'ko';
    if (russianPattern.test(text)) return 'ru';
    if (greekPattern.test(text)) return 'el';
    
    return 'en'; // Default to English
  }
}