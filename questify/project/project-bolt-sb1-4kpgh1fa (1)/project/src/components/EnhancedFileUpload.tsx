import React, { useCallback, useState } from 'react';
import { Upload, FileText, File, Presentation, X, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

export const EnhancedFileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept = ".pdf,.pptx,.docx,.txt",
  maxSize = 50, // 50MB default
  className = ""
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'pptx':
      case 'ppt':
        return <Presentation className="h-8 w-8 text-orange-500" />;
      case 'docx':
      case 'doc':
        return <File className="h-8 w-8 text-blue-500" />;
      default:
        return <FileText className="h-8 w-8 text-gray-500" />;
    }
  };

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setErrorMessage(`File size must be less than ${maxSize}MB`);
      setUploadStatus('error');
      return false;
    }

    // Check file type
    const allowedTypes = accept.split(',').map(type => type.trim());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      setErrorMessage('File type not supported. Please upload PDF, PPTX, or DOCX files.');
      setUploadStatus('error');
      return false;
    }

    return true;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      processFile(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      processFile(file);
    }
  }, []);

  const processFile = async (file: File) => {
    setErrorMessage('');
    setUploadStatus('processing');
    
    if (!validateFile(file)) {
      return;
    }

    try {
      setSelectedFile(file);
      setUploadStatus('success');
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onFileSelect(file);
    } catch (error) {
      setErrorMessage('Failed to process file. Please try again.');
      setUploadStatus('error');
    }
  };

  const removeFile = useCallback(() => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setErrorMessage('');
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
              ${isDragging 
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 hover:border-gray-400'
              }
              ${uploadStatus === 'error' ? 'border-red-300 bg-red-50' : ''}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept={accept}
              onChange={handleFileSelect}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={uploadStatus === 'processing'}
            />
            
            <div className="space-y-4">
              {uploadStatus === 'processing' ? (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-lg font-medium text-gray-900">Processing file...</p>
                  <p className="text-sm text-gray-500">This may take a moment for large files</p>
                </div>
              ) : uploadStatus === 'error' ? (
                <div className="flex flex-col items-center">
                  <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                  <p className="text-lg font-medium text-red-700">Upload Failed</p>
                  <p className="text-sm text-red-600">{errorMessage}</p>
                  <button
                    onClick={() => setUploadStatus('idle')}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      Drop your files here or click to browse
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Supports PDF, PowerPoint (PPTX), and Word (DOCX) files up to {maxSize}MB
                    </p>
                  </div>
                  
                  {/* Supported formats */}
                  <div className="flex justify-center space-x-6 pt-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <FileText className="h-5 w-5 text-red-500" />
                      <span>PDF</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Presentation className="h-5 w-5 text-orange-500" />
                      <span>PowerPoint</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <File className="h-5 w-5 text-blue-500" />
                      <span>Word</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 border-2 border-green-300 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {getFileIcon(selectedFile.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(selectedFile.size)} • Uploaded successfully
                  </p>
                </div>
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <button
                onClick={removeFile}
                className="p-1 text-red-500 hover:text-red-700 transition-colors ml-4"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};