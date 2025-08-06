export const extractTextFromPDF = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Simple PDF text extraction (for demo purposes)
        // In production, you'd use a proper PDF parser like PDF.js
        const decoder = new TextDecoder();
        let text = decoder.decode(uint8Array);
        
        // Remove PDF binary data and extract readable text
        text = text.replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, ' ');
        text = text.replace(/\s+/g, ' ').trim();
        
        // Extract meaningful content (simplified approach)
        const lines = text.split('\n').filter(line => 
          line.trim().length > 10 && 
          !line.includes('PDF') && 
          !line.includes('obj') &&
          !line.includes('stream')
        );
        
        const extractedText = lines.join('\n').trim();
        
        if (extractedText.length < 50) {
          reject(new Error('Could not extract sufficient text from PDF. Please try pasting the text directly.'));
        } else {
          resolve(extractedText);
        }
      } catch (error) {
        reject(new Error('Failed to parse PDF file. Please try pasting the text directly.'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read PDF file'));
    reader.readAsArrayBuffer(file);
  });
};