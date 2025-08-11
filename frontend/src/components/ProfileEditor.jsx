import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const ProfileEditor = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [preview, setPreview] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { register, handleSubmit, setValue } = useForm();
  const navigate = useNavigate();

  const API_BASE_URL = 'http://localhost:5000/api';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/profile/${userId}`, {
          withCredentials: true
        });
        setProfile(response.data);
        setSkills(response.data?.skills || []);
        setValue('bio', response.data?.bio || '');
        setValue('role', response.data?.role || 'student');
        if (response.data?.avatar) {
          setPreview(`${API_BASE_URL.replace('/api', '')}/uploads/${response.data.avatar}`);
        }
      } catch (error) {
        toast.error('Failed to load profile');
        console.error('Error fetching profile:', error);
        navigate('/dashboard');
      }
    };
    fetchProfile();
  }, [userId, setValue, navigate]);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    onDrop: acceptedFiles => {
      const file = acceptedFiles[0];
      if (file) {
        setPreview(URL.createObjectURL(file));
        handleUpload(file);
      }
    }
  });

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('userId', userId);

    try {
      setIsSaving(true);
      const response = await axios.post(
        `${API_BASE_URL}/profile/${userId}/photo`, 
        formData, 
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true
        }
      );
      setProfile(response.data.profile);
      toast.success('Profile picture updated successfully!');
    } catch (error) {
      toast.error('Failed to upload profile picture');
      console.error('Upload failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      const response = await axios.put(
        `${API_BASE_URL}/profile/${userId}`,
        {
          bio: data.bio,
          skills: skills.filter(skill => skill.name.trim() !== ''),
          role: data.role || profile?.role || 'student',
          userId
        },
        {
          withCredentials: true
        }
      );
      toast.success('Profile saved successfully!', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      setTimeout(() => {
        navigate('/auth/dashboard');
      }, 1500); // Wait for toast to show before redirecting
    } catch (error) {
      toast.error('Failed to save profile');
      console.error('Update failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addSkill = () => {
    setSkills([...skills, { name: '', level: 1 }]);
  };

  const removeSkill = (index) => {
    const newSkills = [...skills];
    newSkills.splice(index, 1);
    setSkills(newSkills);
  };

  const handleSkillChange = (index, field, value) => {
    const newSkills = [...skills];
    newSkills[index][field] = value;
    setSkills(newSkills);
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading profile...</div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Your Profile</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition">
              <input {...getInputProps()} />
              {preview ? (
                <img 
                  src={preview} 
                  alt="Profile Preview" 
                  className="profile-pic"
                />
              ) : (
                <p className="text-gray-500">Drag & drop profile picture here (JPEG, PNG, WEBP)</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 mb-2">About You</label>
              <textarea
                {...register('bio')}
                placeholder="Tell us about yourself..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px]"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Role</label>
              <select
                {...register('role')}
                defaultValue={profile?.role || 'student'}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="student">Student</option>
                <option value="mentor">Mentor</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Your Skills</label>
              <div className="space-y-3">
                {skills.map((skill, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      value={skill.name}
                      onChange={(e) => handleSkillChange(index, 'name', e.target.value)}
                      placeholder="Skill name"
                      className="flex-1 p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    />
                    <select
                      value={skill.level}
                      onChange={(e) => handleSkillChange(index, 'level', parseInt(e.target.value))}
                      className="p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    >
                      {[1, 2, 3, 4, 5].map(level => (
                        <option key={level} value={level}>Level {level}</option>
                      ))}
                    </select>
                    <button 
                      type="button" 
                      onClick={() => removeSkill(index)}
                      className="text-red-500 hover:text-red-700 p-2"
                      aria-label="Remove skill"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={addSkill}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition flex items-center gap-2 w-fit"
                >
                  <span>+</span>
                  <span>Add Skill</span>
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full py-3 px-4 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition disabled:bg-gray-400 flex justify-center items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin">↻</span>
                    <span>Saving...</span>
                  </>
                ) : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileEditor;