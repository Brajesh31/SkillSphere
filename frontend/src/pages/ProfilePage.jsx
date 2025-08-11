import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ProfileDisplay from '../components/ProfileDisplay';
import ProfileEditor from '../components/ProfileEditor';
import { motion } from 'framer-motion';

const ProfilePage = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/profile/${userId}`);
        setProfile(data.profile);
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  const handleUpdate = async (updatedProfile) => {
    try {
      const { data } = await axios.put(`http://localhost:5000/api/profile/${userId}`, updatedProfile);
      setProfile(data.profile);
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    }
  };

  if (isLoading) return <div className="loading">Loading profile...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="profile-page"
    >
      <div className="profile-header">
        <h1>My Profile</h1>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="edit-toggle"
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {isEditing ? (
        <ProfileEditor 
          userId={userId} 
          profile={profile} 
          onUpdate={handleUpdate}
        />
      ) : (
        <ProfileDisplay profile={profile} />
      )}
    </motion.div>
  );
};

export default ProfilePage;
