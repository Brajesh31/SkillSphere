import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const JoinRoom = () => {
  const [formData, setFormData] = useState({ meetingId: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      const { data } = await axios.post('http://localhost:5000/api/rooms/join', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      if (!data?.room?.meetingId) {
        throw new Error('Invalid room ID received');
      }

      toast.success('Joining room...');
      navigate(`/room/${data.room.meetingId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error(error.response?.data?.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900 text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-2xl w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-4 text-center">Join a Room</h1>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Meeting ID</label>
          <input
            type="text"
            name="meetingId"
            value={formData.meetingId}
            onChange={handleChange}
            required
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter Meeting ID"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Password (if required)</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter Password"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-all"
        >
          {loading ? 'Joining...' : 'Join Meeting'}
        </button>
      </form>
    </div>
  );
};

export default JoinRoom;