import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserCard from '../components/UserCard';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const Explore = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    // Get the current user ID from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Extract user ID from JWT token (this assumes the token contains user ID)
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.id);
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
    
    // Load pending requests from localStorage if available
    const savedPendingRequests = localStorage.getItem('pendingConnectionRequests');
    if (savedPendingRequests) {
      setPendingRequests(JSON.parse(savedPendingRequests));
    }
    
    // Fetch the user's existing connections
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('http://localhost:5000/api/connections', {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      
      // Extract all connection user IDs
      const connectionIds = response.data.map(conn => 
        conn.user1._id === currentUserId ? conn.user2._id : conn.user1._id
      );
      
      setConnectedUsers(connectionIds);
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  // Fetch pending requests from the server instead of just localStorage
  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('http://localhost:5000/api/connections/pending', {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      
      // Extract pending request user IDs
      const pendingIds = response.data.map(req => req.recipient._id);
      setPendingRequests(pendingIds);
      
      // Store in localStorage for backup/quick access
      localStorage.setItem('pendingConnectionRequests', JSON.stringify(pendingIds));
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      // Fetch pending requests when component mounts
      fetchPendingRequests();
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchProfiles();
  }, [searchQuery, roleFilter, currentUserId, connectedUsers]);

  useEffect(() => {
    const handleConnectionAccepted = (event) => {
      // Refresh connections list
      fetchConnections();
      // Also refresh profiles to hide the newly connected user
      fetchProfiles();
    };

    window.addEventListener('connectionAccepted', handleConnectionAccepted);
    
    return () => {
      window.removeEventListener('connectionAccepted', handleConnectionAccepted);
    };
  }, []);

  const fetchProfiles = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('You must be logged in to view profiles.');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/profile/explore', {
        params: {
          query: searchQuery,
          role: roleFilter !== 'all' ? roleFilter : undefined
        },
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      
      // Filter out the current user and connected users
      const filteredProfiles = response.data.filter(profile => {
        // Skip if it's the current user
        if (profile.userId?._id === currentUserId) return false;
        
        // Skip if user is already connected
        if (connectedUsers.includes(profile.userId?._id)) return false;
        
        return true;
      });
      
      setProfiles(filteredProfiles || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch profiles');
      setLoading(false);
    }
  };

  const handleConnect = async (userId) => {
    try {
      if (!userId) {
        toast.error('Invalid user ID');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('You must be logged in to connect.');
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/api/connections/connect/${userId}`,
        {}, // Empty body
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );

      // Update pending requests in state and localStorage
      const newPendingRequests = [...pendingRequests, userId];
      setPendingRequests(newPendingRequests);
      localStorage.setItem('pendingConnectionRequests', JSON.stringify(newPendingRequests));
      
      toast.success('Connection request sent!');
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error(error.response?.data?.message || 'Failed to send connection request');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 py-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Profiles</h1>
          <p className="text-gray-600">Find mentors, students, and collaborators</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name, bio, or skills..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-4">
              <label className="text-sm text-gray-600">Filter by:</label>
              <select
                className="border rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="mentor">Mentors</option>
              </select>
            </div>
          </div>

          {profiles.length === 0 ? (
            <div className="text-center py-12 bg-blue-50 rounded-lg">
              <svg className="mx-auto h-12 w-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No profiles found</h3>
              <p className="mt-1 text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map((profile) => (
                <UserCard
                  key={profile.userId?._id}
                  user={{
                    avatar: profile.avatar || '/default-avatar.png',
                    fullName: profile.userId?.fullName || 'Unknown User',
                    username: profile.userId?.username || 'No username',
                    bio: profile.bio || 'No bio available',
                    role: profile.role,
                    skills: profile.skills,
                    userId: profile.userId?._id
                  }}
                  onConnect={() => handleConnect(profile.userId?._id)}
                  isPending={pendingRequests.includes(profile.userId?._id)}
                  hideMessageButton={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Explore;