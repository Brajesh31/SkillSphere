import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { 
  FiVideo, FiDownload, FiTrash2, FiPlay, 
  FiArrowLeft, FiClock, FiCalendar, FiDatabase
} from 'react-icons/fi';

const Recordings = () => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const { data } = await axios.get('http://localhost:5000/api/rooms/recordings/user', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setRecordings(data.recordings || []);
    } catch (error) {
      console.error('Error fetching recordings:', error);
      toast.error('Failed to fetch recordings');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id, fileName) => {
    try {
      const token = localStorage.getItem('token');
      
      // Create a link element to trigger the download
      const a = document.createElement('a');
      a.href = `http://localhost:5000/api/rooms/recordings/download/${id}?token=${token}`;
      a.download = fileName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      
      toast.success('Downloading recording...');
    } catch (error) {
      console.error('Error downloading recording:', error);
      toast.error('Failed to download recording');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this recording? This cannot be undone.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(`http://localhost:5000/api/rooms/recordings/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Remove from state
      setRecordings(prev => prev.filter(rec => rec._id !== id));
      
      toast.success('Recording deleted successfully');
      
      // If the deleted recording was being previewed, close the preview
      if (selectedRecording && selectedRecording._id === id) {
        setSelectedRecording(null);
        setShowPreview(false);
      }
    } catch (error) {
      console.error('Error deleting recording:', error);
      toast.error('Failed to delete recording');
    }
  };

  const handlePlay = (recording) => {
    setSelectedRecording(recording);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setSelectedRecording(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <h1 className="text-3xl font-bold text-white flex items-center">
            <FiVideo className="mr-3" /> My Recordings
          </h1>
          <button
            onClick={() => navigate('/create-room')}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FiArrowLeft className="mr-2" /> Back to Rooms
          </button>
        </motion.div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : recordings.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-center text-white"
          >
            <FiVideo className="mx-auto text-5xl mb-4 opacity-50" />
            <h2 className="text-xl font-semibold mb-2">No Recordings Found</h2>
            <p className="max-w-md mx-auto text-blue-200">
              You haven't recorded any meetings yet. Start a meeting and use the recording feature to capture your sessions.
            </p>
            <button
              onClick={() => navigate('/create-room')}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Create a Room
            </button>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {recordings.map((recording) => (
              <motion.div
                key={recording._id}
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/10"
              >
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70 z-10"></div>
                    <FiVideo className="text-5xl text-white opacity-30" />
                    <button
                      onClick={() => handlePlay(recording)}
                      className="absolute inset-0 flex items-center justify-center z-20"
                    >
                      <div className="hover:scale-110 transition-transform duration-300 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                        <FiPlay size={30} className="text-white ml-1" />
                      </div>
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-white truncate">
                    {recording.roomName || 'Untitled Recording'}
                  </h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-blue-200 flex items-center">
                      <FiCalendar className="mr-2" /> {formatDate(recording.createdAt)}
                    </p>
                    {recording.fileSize && (
                      <p className="text-sm text-blue-200 flex items-center">
                        <FiDatabase className="mr-2" /> {formatFileSize(recording.fileSize)}
                      </p>
                    )}
                    <p className="text-sm text-blue-200 flex items-center">
                      <FiClock className="mr-2" /> Room ID: {recording.roomId}
                    </p>
                  </div>
                  <div className="mt-4 flex justify-between">
                    <button
                      onClick={() => handleDownload(recording._id, recording.fileName)}
                      className="flex items-center bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors"
                    >
                      <FiDownload className="mr-1" /> Download
                    </button>
                    <button
                      onClick={() => handleDelete(recording._id)}
                      className="flex items-center bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors"
                    >
                      <FiTrash2 className="mr-1" /> Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Video preview modal */}
      {showPreview && selectedRecording && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-4xl bg-black rounded-xl overflow-hidden">
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={closePreview}
                className="bg-white/10 hover:bg-white/20 rounded-full p-2 text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <video
              className="w-full aspect-video"
              controls
              autoPlay
              src={`http://localhost:5000/api/rooms/recordings/download/${selectedRecording._id}?token=${localStorage.getItem('token')}`}
            />
            <div className="p-4 bg-gray-900">
              <h3 className="text-xl font-semibold text-white">
                {selectedRecording.roomName || 'Untitled Recording'}
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Recorded on {formatDate(selectedRecording.createdAt)}
              </p>
              <div className="mt-4 flex space-x-4">
                <button
                  onClick={() => handleDownload(selectedRecording._id, selectedRecording.fileName)}
                  className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <FiDownload className="mr-2" /> Download Recording
                </button>
                <button
                  onClick={() => handleDelete(selectedRecording._id)}
                  className="flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <FiTrash2 className="mr-2" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recordings;