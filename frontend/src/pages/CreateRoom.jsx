import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { FiVideo, FiLock, FiUsers, FiClock, FiPlus, FiFilm } from 'react-icons/fi';

// Configure axios
const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true
});

export default function CreateRoom() {
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    maxParticipants: 10,
    duration: 60
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      const { data } = await api.post('/api/rooms/create', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!data?.meetingId) {
        throw new Error('Invalid room ID received');
      }

      toast.success('Room created successfully!');
      navigate(`/room/${data.meetingId}`);
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error(error.response?.data?.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const viewRecordings = () => {
    navigate('/recordings');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 text-white"
    >
      <div className="max-w-md mx-auto p-6">
        <motion.div 
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center">
            <FiVideo className="mr-2" /> Create New Room
          </h1>
          <p className="text-gray-300">Set up your meeting with advanced options</p>
          
          {/* Recordings button */}
          <button
            onClick={viewRecordings}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center mx-auto"
          >
            <FiFilm className="mr-2" /> View My Recordings
          </button>
        </motion.div>

        <motion.form 
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-2xl"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Meeting Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Team Standup Meeting"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 flex items-center">
                <FiLock className="mr-1" /> Password (optional)
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Secure your meeting"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center">
                  <FiUsers className="mr-1" /> Max Participants
                </label>
                <select
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {[2, 5, 10, 20, 50].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center">
                  <FiClock className="mr-1" /> Duration (mins)
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {[30, 60, 90, 120, 180].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <FiPlus className="mr-2" /> Create Meeting
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.form>
      </div>
    </motion.div>
  );
}