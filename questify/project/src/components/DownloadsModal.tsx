import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, Calendar, Search, Filter } from 'lucide-react';
import { User } from '../types';
import { useSupabaseData } from '../hooks/useSupabaseData';

interface DownloadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

interface DownloadRecord {
  id: string;
  file_name: string;
  file_type: string;
  created_at: string;
  quiz_title?: string;
  group_quiz_title?: string;
}

export const DownloadsModal: React.FC<DownloadsModalProps> = ({
  isOpen,
  onClose,
  user
}) => {
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [filteredDownloads, setFilteredDownloads] = useState<DownloadRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'csv' | 'json'>('all');
  const [loading, setLoading] = useState(false);
  const { supabase } = useSupabaseData(user);

  useEffect(() => {
    if (isOpen && user) {
      loadDownloads();
    }
  }, [isOpen, user]);

  useEffect(() => {
    filterDownloads();
  }, [downloads, searchTerm, filterType]);

  const loadDownloads = async () => {
    if (!supabase) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quiz_downloads')
        .select(`
          *,
          quizzes(title),
          group_quizzes(title)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedDownloads = data?.map(download => ({
        id: download.id,
        file_name: download.file_name,
        file_type: download.file_type,
        created_at: download.created_at,
        quiz_title: download.quizzes?.title,
        group_quiz_title: download.group_quizzes?.title
      })) || [];

      setDownloads(formattedDownloads);
    } catch (error) {
      console.error('Error loading downloads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDownloads = () => {
    let filtered = downloads;

    if (searchTerm) {
      filtered = filtered.filter(download =>
        download.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        download.quiz_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        download.group_quiz_title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(download => download.file_type === filterType);
    }

    setFilteredDownloads(filtered);
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return '📄';
      case 'csv':
        return '📊';
      case 'json':
        return '📋';
      default:
        return '📁';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRedownload = (download: DownloadRecord) => {
    // In a real implementation, you would regenerate and download the file
    // For now, we'll just show a message
    alert(`Re-downloading ${download.file_name}...`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Download className="h-6 w-6 text-blue-600" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Downloads</h2>
                  <p className="text-sm text-gray-500">Your downloaded quiz files</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Search and Filter */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search downloads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="pdf">PDF</option>
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Downloads List */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredDownloads.length > 0 ? (
                <div className="space-y-3">
                  {filteredDownloads.map((download, index) => (
                    <motion.div
                      key={download.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">
                          {getFileIcon(download.file_type)}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{download.file_name}</h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(download.created_at)}</span>
                            {(download.quiz_title || download.group_quiz_title) && (
                              <>
                                <span>•</span>
                                <span>{download.quiz_title || download.group_quiz_title}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          download.file_type === 'pdf' ? 'bg-red-100 text-red-700' :
                          download.file_type === 'csv' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {download.file_type.toUpperCase()}
                        </span>
                        <button
                          onClick={() => handleRedownload(download)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Re-download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    {searchTerm || filterType !== 'all' ? 'No downloads match your search' : 'No downloads yet'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {searchTerm || filterType !== 'all' ? 'Try adjusting your search or filter' : 'Downloaded files will appear here'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Total downloads: {downloads.length}</span>
                <span>Filtered: {filteredDownloads.length}</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};