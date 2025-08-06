import { FileUploadResult } from '../types';

export class EnhancedFileParser {
  static async parseFile(file: File): Promise<FileUploadResult> {
    const fileType = file.type;
    const fileName = file.name;
    const fileSize = file.size;

    // Check file size (100MB limit for better support)
    if (fileSize > 100 * 1024 * 1024) {
      throw new Error('File size exceeds 100MB limit');
    }

    let text = '';
    let pageCount: number | undefined;

    try {
      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        text = await this.parsePDF(file);
        pageCount = await this.getPDFPageCount(file);
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || fileName.endsWith('.pptx')) {
        text = await this.parsePowerPoint(file);
      } else if (fileType === 'application/vnd.ms-powerpoint' || fileName.endsWith('.ppt')) {
        text = await this.parsePowerPointLegacy(file);
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
        text = await this.parseWord(file);
      } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
        text = await this.parseText(file);
      } else {
        throw new Error('Unsupported file type. Please upload PDF, PPT, PPTX, DOCX, or TXT files.');
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
          
          // Enhanced PDF text extraction with better handling for large files
          const decoder = new TextDecoder('utf-8', { fatal: false });
          let text = decoder.decode(uint8Array);
          
          // Remove PDF binary data and extract readable text
          text = text.replace(/[^\x20-\x7E\u00A0-\uFFFF\n\r\t]/g, ' ');
          
          // Extract text between common PDF text markers with improved regex
          const textMatches = text.match(/\(([^)]+)\)/g) || [];
          const extractedText = textMatches
            .map(match => match.slice(1, -1))
            .filter(t => t.length > 2 && !/^[0-9\s]*$/.test(t))
            .join(' ');
          
          // Enhanced stream object extraction for better text recovery
          const streamMatches = text.match(/stream\s*([\s\S]*?)\s*endstream/gs) || [];
          const streamText = streamMatches
            .map(match => {
              let content = match.replace(/stream|endstream/g, '');
              // Better text filtering for PDF streams
              content = content.replace(/[^\x20-\x7E\u00A0-\uFFFF\n\r\t]/g, ' ');
              return content;
            })
            .join(' ')
            .replace(/\s+/g, ' ');

          // Try to extract from BT/ET blocks (text objects)
          const textObjectMatches = text.match(/BT\s*([\s\S]*?)\s*ET/gs) || [];
          const textObjectText = textObjectMatches
            .map(match => {
              let content = match.replace(/BT|ET/g, '');
              // Extract text from Tj and TJ operators
              const tjMatches = content.match(/\(([^)]+)\)\s*Tj/g) || [];
              return tjMatches.map(tj => tj.match(/\(([^)]+)\)/)?.[1] || '').join(' ');
            })
            .join(' ');

          let finalText = extractedText || streamText || textObjectText;
          
          // Clean up the text with better processing
          finalText = finalText
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s\u00A0-\uFFFF.,!?;:()\-"']/g, ' ')
            .replace(/\b\d+\s+\d+\s+obj\b/g, '') // Remove PDF object references
            .replace(/\b\d+\s+\d+\s+R\b/g, '') // Remove PDF references
            .trim();
          
          if (finalText.length < 50) {
            reject(new Error('Could not extract sufficient text from PDF. The file might be image-based, encrypted, or have complex formatting.'));
          } else {
            resolve(finalText);
          }
        } catch (error) {
          reject(new Error('Failed to parse PDF file. Please try converting it to text first or use a different file.'));
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
          // More accurate page counting
          const pageMatches = text.match(/\/Type\s*\/Page[^s]/g) || text.match(/\/Count\s+(\d+)/g);
          if (pageMatches) {
            if (text.match(/\/Count\s+(\d+)/)) {
              const countMatch = text.match(/\/Count\s+(\d+)/);
              resolve(countMatch ? parseInt(countMatch[1]) : pageMatches.length);
            } else {
              resolve(pageMatches.length);
            }
          } else {
            resolve(1);
          }
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
          
          // PowerPoint files are ZIP archives, extract text from XML files
          const uint8Array = new Uint8Array(arrayBuffer);
          const decoder = new TextDecoder('utf-8', { fatal: false });
          let content = decoder.decode(uint8Array);
          
          // Enhanced text extraction for PowerPoint
          // Look for slide content in XML format with better patterns
          const textMatches = content.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) || [];
          const extractedText = textMatches
            .map(match => match.replace(/<[^>]+>/g, ''))
            .filter(text => text.trim().length > 0)
            .join(' ');
          
          // Extract from paragraph elements with improved regex
          const paragraphMatches = content.match(/<a:p[^>]*>([\s\S]*?)<\/a:p>/gs) || [];
          const paragraphText = paragraphMatches
            .map(match => {
              // Remove XML tags and extract text content
              let text = match.replace(/<[^>]+>/g, ' ');
              return text.replace(/\s+/g, ' ').trim();
            })
            .filter(text => text.length > 0)
            .join(' ');
          
          // Try to extract from text runs
          const runMatches = content.match(/<a:r[^>]*>([\s\S]*?)<\/a:r>/gs) || [];
          const runText = runMatches
            .map(match => match.replace(/<[^>]+>/g, ' '))
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          // Try to extract from drawing text
          const drawingMatches = content.match(/<p:txBody[^>]*>([\s\S]*?)<\/p:txBody>/gs) || [];
          const drawingText = drawingMatches
            .map(match => match.replace(/<[^>]+>/g, ' '))
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          const finalText = (extractedText || paragraphText || runText || drawingText).trim();
          
          if (finalText.length < 20) {
            reject(new Error('Could not extract sufficient text from PowerPoint file. The slides might contain mostly images or complex formatting.'));
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

  private static async parsePowerPointLegacy(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          const decoder = new TextDecoder('utf-8', { fatal: false });
          let content = decoder.decode(uint8Array);
          
          // Legacy PPT files have different structure
          // Extract readable text with improved filtering
          content = content.replace(/[^\x20-\x7E\u00A0-\uFFFF\n\r\t]/g, ' ');
          
          // Look for text patterns in legacy PPT format
          const textBlocks = content.split(/\s+/).filter(block => 
            block.length > 3 && 
            block.length < 100 && 
            /^[a-zA-Z\u00A0-\uFFFF]/.test(block) &&
            !/^\d+$/.test(block)
          );
          
          const finalText = textBlocks.join(' ').trim();
          
          if (finalText.length < 20) {
            reject(new Error('Could not extract sufficient text from legacy PowerPoint file. Please convert to PPTX or PDF format.'));
          } else {
            resolve(finalText);
          }
        } catch (error) {
          reject(new Error('Failed to parse legacy PowerPoint file. Please convert to a newer format.'));
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
          const decoder = new TextDecoder('utf-8', { fatal: false });
          let content = decoder.decode(uint8Array);
          
          // Enhanced text extraction for Word documents
          // Look for text content in Word XML format with better patterns
          const textMatches = content.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
          const extractedText = textMatches
            .map(match => match.replace(/<[^>]+>/g, ''))
            .filter(text => text.trim().length > 0)
            .join(' ');
          
          // Extract from paragraph runs with improved handling
          const runMatches = content.match(/<w:r[^>]*>([\s\S]*?)<\/w:r>/gs) || [];
          const runText = runMatches
            .map(match => {
              // Extract text from within the run, handling nested elements
              const textElements = match.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
              return textElements.map(t => t.replace(/<[^>]+>/g, '')).join(' ');
            })
            .filter(text => text.trim().length > 0)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          // Try to extract from paragraph elements
          const paraMatches = content.match(/<w:p[^>]*>([\s\S]*?)<\/w:p>/gs) || [];
          const paraText = paraMatches
            .map(match => match.replace(/<[^>]+>/g, ' '))
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          const finalText = (extractedText || runText || paraText).trim();
          
          if (finalText.length < 20) {
            reject(new Error('Could not extract sufficient text from Word document. The document might be mostly images or have complex formatting.'));
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
    // Enhanced language detection with more patterns
    const tamilPattern = /[\u0B80-\u0BFF]/;
    const hindiPattern = /[\u0900-\u097F]/;
    const arabicPattern = /[\u0600-\u06FF]/;
    const chinesePattern = /[\u4E00-\u9FFF]/;
    const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF]/;
    const koreanPattern = /[\uAC00-\uD7AF]/;
    const russianPattern = /[\u0400-\u04FF]/;
    const greekPattern = /[\u0370-\u03FF]/;
    const thaiPattern = /[\u0E00-\u0E7F]/;
    const vietnamesePattern = /[\u1EA0-\u1EF9]/;

    if (tamilPattern.test(text)) return 'ta';
    if (hindiPattern.test(text)) return 'hi';
    if (arabicPattern.test(text)) return 'ar';
    if (chinesePattern.test(text)) return 'zh';
    if (japanesePattern.test(text)) return 'ja';
    if (koreanPattern.test(text)) return 'ko';
    if (russianPattern.test(text)) return 'ru';
    if (greekPattern.test(text)) return 'el';
    if (thaiPattern.test(text)) return 'th';
    if (vietnamesePattern.test(text)) return 'vi';
    
    return 'en'; // Default to English
  }
}