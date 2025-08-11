import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { 
  BadgeCheck, User, Users
} from "lucide-react";
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import Chatbot from '../components/Chatbot';

// Custom cursor component
const CustomCursor = () => {
  const cursorRef = useRef(null);
  const cursorRingRef = useRef(null);
  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    const cursor = cursorRef.current;
    const cursorRing = cursorRingRef.current;

    if (!cursor || !cursorRing) return;

    const moveCursor = (e) => {
      const { clientX, clientY } = e;
      cursor.style.left = `${clientX}px`;
      cursor.style.top = `${clientY}px`;
      
      // Delayed follow for the cursor ring
      setTimeout(() => {
        cursorRing.style.left = `${clientX}px`;
        cursorRing.style.top = `${clientY}px`;
      }, 100);
    };

    const handleMouseOver = (e) => {
      if (e.target.tagName === 'BUTTON' || 
          e.target.tagName === 'A' || 
          e.target.closest('button') || 
          e.target.closest('a')) {
        setIsPointer(true);
      } else {
        setIsPointer(false);
      }
    };

    document.addEventListener('mousemove', moveCursor);
    document.addEventListener('mouseover', handleMouseOver);

    return () => {
      document.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return (
    <>
      <div 
        ref={cursorRef} 
        className={`custom-cursor ${isPointer ? 'pointer' : ''}`}
      ></div>
      <div 
        ref={cursorRingRef} 
        className={`cursor-ring ${isPointer ? 'pointer' : ''}`}
      ></div>
    </>
  );
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    mentorsConnected: 0
  });
  const [notifications, setNotifications] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastActive, setLastActive] = useState("N/A");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    try {
      // Clear localStorage completely
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('hasNewNotifications');
      localStorage.removeItem('hasNewConnections');
      localStorage.removeItem('pendingConnectionRequests');
      
      // Also try the API call to logout on server (but don't wait for it)
      axios.post("http://localhost:5000/api/auth/logout", {}, { 
        withCredentials: true 
      }).catch(err => console.error("Logout API error:", err));
      
      // Use navigate to redirect to login
      toast.success("Logged out successfully!");
      window.location.href = "/auth/login";
    } catch (error) {
      toast.error("Error logging out. Please try again.");
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const userRes = await axios.get("http://localhost:5000/api/auth/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!userRes.data?._id) {
          throw new Error("User data not found");
        }

        setUser(userRes.data);

        // Format and set last active date if available
        if (userRes.data.lastActive) {
          const lastActiveDate = new Date(userRes.data.lastActive);
          const formattedDate = lastActiveDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short', 
            day: 'numeric'
          });
          setLastActive(formattedDate);
        } else {
          setLastActive("Not available");
        }

        // Get profile data and calculate statistics
        const [profileRes, connectionsRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/profile/${userRes.data._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => ({ data: null })),
          
          // Get connections count - just for mentor count
          axios.get("http://localhost:5000/api/connections/all", {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => ({ data: [] }))
        ]);

        setProfile(profileRes.data);
        
        // Calculate only mentors connected (we're removing other stats)
        const mentorConnections = connectionsRes.data.filter(conn => 
          conn.role === 'mentor' || conn.role === 'both'
        ).length;
        
        // Update only the stats we need
        setStats({
          mentorsConnected: mentorConnections
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Session expired. Please login again.");
        window.location.href = "/auth/login";
      } finally {
        setLoading(false);
      }
    };

    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/connections/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(response.data || []);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        toast.error('Failed to fetch notifications');
      }
    };

    fetchUserData();
    fetchNotifications();
  }, []);

  const handleResponse = async (notificationId, action) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/connections/respond/${notificationId}`,
        { action },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success(`Connection request ${action}ed`);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    } catch (error) {
      console.error('Error responding to connection request:', error);
      toast.error('Failed to respond to connection request');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen modern-gradient flex items-center justify-center">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="mt-4 text-white text-xl">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  // Reduce dashboardCards to only keep the cards we want
  const dashboardCards = [
    {
      icon: <User className="card-icon" />,
      title: "Full Name",
      content: user?.fullName || "Not set",
      color: "blue-card"
    },
    {
      icon: <BadgeCheck className="card-icon" />,
      title: "Skills",
      content: profile?.skills?.length > 0 ? (
        <div className="flex gap-2 flex-wrap">
          {profile.skills.slice(0, 3).map((skill, index) => (
            <span key={index} className="skill-badge">
              {skill.name} (Lvl {skill.level})
            </span>
          ))}
          {profile.skills.length > 3 && (
            <span className="skill-badge more">
              +{profile.skills.length - 3} more
            </span>
          )}
        </div>
      ) : (
        <span className="text-blue-300">No skills added yet</span>
      ),
      color: "purple-card"
    },
    {
      icon: <Users className="card-icon" />,
      title: "Mentors Connected",
      content: stats.mentorsConnected > 0 
        ? `${stats.mentorsConnected} mentor${stats.mentorsConnected !== 1 ? 's' : ''}`
        : "No mentors yet",
      color: "indigo-card"
    }
  ];

  return (
    <div className="min-h-screen modern-gradient text-white overflow-x-hidden cursor-none">
      {/* Custom cursor */}
      <CustomCursor />
      <div className="subtle-grid"></div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="welcome-container">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 gradient-text">
              Welcome back, {user?.username}
            </h1>
            <div className="welcome-underline mx-auto"></div>
          </div>
          <div className="mt-6 modern-container p-4 max-w-2xl mx-auto">
            <p className="text-lg">
              {profile?.bio || "Update your profile to add a bio about yourself"}
            </p>
          </div>
          <div className="status-bar mt-6">
            <div className="status-item">
              <div className="status-dot blue"></div>
              <span>System Online</span>
            </div>
            <div className="time-display">
              {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
            <div className="status-item">
              <div className="status-dot green"></div>
              <span>Active Session</span>
            </div>
          </div>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {dashboardCards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ 
                scale: 1.03,
                boxShadow: "0 0 20px rgba(255, 255, 255, 0.2)"
              }}
              className={`modern-card ${card.color} cursor-hover-effect`}
            >
              <div className="card-header">
                {card.icon}
                <h3 className="text-xl font-semibold">{card.title}</h3>
              </div>
              <div className="card-content">
                {card.content}
              </div>
              <div className="card-glow"></div>
              <div className="card-corner top-left"></div>
              <div className="card-corner top-right"></div>
              <div className="card-corner bottom-left"></div>
              <div className="card-corner bottom-right"></div>
            </motion.div>
          ))}
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12"
          id="notifications-section"
        >
          <div className="section-header">
            <h2 className="text-2xl font-bold">Notifications</h2>
            <div className="section-line"></div>
          </div>
          {notifications.length > 0 ? (
            <ul className="space-y-4 mt-6">
              {notifications.map((notification) => (
                <motion.li 
                  key={notification._id} 
                  className="notification-item cursor-hover-effect"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="notification-content">
                    <p className="text-white">{notification.message}</p>
                    <p className="text-sm text-blue-300 mt-1">
                      From: {notification.sender?.fullName || notification.sender?.username || "Unknown Sender"}
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleResponse(notification._id, 'accept')}
                      className="action-button accept"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleResponse(notification._id, 'reject')}
                      className="action-button reject"
                    >
                      Reject
                    </button>
                  </div>
                </motion.li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              No new notifications
            </div>
          )}
        </motion.div>
        <motion.div 
          className="mt-12 action-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Link 
            to="/create-room"
            className="action-card create cursor-hover-effect"
          >
            <div className="action-icon">
              <Users size={24} />
            </div>
            <div className="action-text">Create Study Room</div>
          </Link>
          <Link 
            to="/join-room"
            className="action-card join cursor-hover-effect"
          >
            <div className="action-icon">
              <Users size={24} />
            </div>
            <div className="action-text">Join a Room</div>
          </Link>
          <Link 
            to={`/profile/${user?._id}/edit`}
            className="action-card edit cursor-hover-effect"
          >
            <div className="action-icon">
              <User size={24} />
            </div>
            <div className="action-text">Edit Profile</div>
          </Link>
          <Link 
            to={`/profile/${user?._id}`}
            className="action-card view cursor-hover-effect"
          >
            <div className="action-icon">
              <User size={24} />
            </div>
            <div className="action-text">View Profile</div>
          </Link>
        </motion.div>
        <motion.div 
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <button
            onClick={handleLogout}
            className="logout-button cursor-hover-effect"
          >
            <span>Logout</span>
          </button>
        </motion.div>
        <motion.div 
          className="mt-12 text-center footer-text"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <p>Keep pushing your limits and building amazing things</p>
          <p className="mt-2 text-sm text-blue-200">
            Last active: {lastActive || "Not available"}
          </p>
        </motion.div>
        <Chatbot />
      </div>
      <style>
        {`
          /* Hide default cursor */
          .cursor-none {
            cursor: none;
          }
          
          /* Custom cursor styles */
          .custom-cursor {
            position: fixed;
            width: 8px;
            height: 8px;
            background: #38bdf8;
            border-radius: 50%;
            pointer-events: none;
            transform: translate(-50%, -50%);
            z-index: 9999;
            transition: width 0.2s, height 0.2s, background 0.2s;
            mix-blend-mode: difference;
          }
          
          .custom-cursor.pointer {
            width: 12px;
            height: 12px;
            background: #a855f7;
            mix-blend-mode: normal;
          }
          
          .cursor-ring {
            position: fixed;
            width: 40px;
            height: 40px;
            border: 1px solid rgba(56, 189, 248, 0.5);
            border-radius: 50%;
            pointer-events: none;
            transform: translate(-50%, -50%);
            z-index: 9998;
            transition: width 0.3s, height 0.3s, border-color 0.3s, transform 0.1s;
          }
          
          .cursor-ring.pointer {
            width: 24px;
            height: 24px;
            border-color: rgba(168, 85, 247, 0.7);
            background: rgba(168, 85, 247, 0.1);
          }
          
          /* Cursor hover effect for interactive elements */
          .cursor-hover-effect {
            transition: all 0.3s ease;
          }
          
          .cursor-hover-effect:hover ~ .cursor-ring {
            transform: translate(-50%, -50%) scale(1.5);
            border-color: rgba(168, 85, 247, 0.7);
          }
          
          /* Modern gradient background */
          .modern-gradient {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            position: relative;
          }
          
          /* Subtle grid overlay */
          .subtle-grid {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: 
              linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
            background-size: 50px 50px;
            z-index: 1;
            pointer-events: none;
          }
          
          /* Loading animation */
          .loading-container {
            text-align: center;
            color: white;
          }
          
          .loading-spinner {
            display: inline-block;
            width: 50px;
            height: 50px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: #3b82f6;
            animation: spin 1s ease-in-out infinite;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          /* Welcome section */
          .welcome-container {
            position: relative;
            margin-bottom: 1rem;
          }
          
          .gradient-text {
            background: linear-gradient(90deg, #38bdf8, #a855f7);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            color: transparent;
          }
          
          .welcome-underline {
            height: 3px;
            width: 180px;
            background: linear-gradient(90deg, #38bdf8, #a855f7);
            border-radius: 3px;
            margin-top: 8px;
          }
          
          /* Status bar */
          .status-bar {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 2rem;
            font-size: 0.875rem;
            color: rgba(255, 255, 255, 0.7);
          }
          
          .status-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            animation: pulse 2s infinite;
          }
          
          .status-dot.blue {
            background-color: #38bdf8;
            box-shadow: 0 0 5px #38bdf8;
          }
          
          .status-dot.green {
            background-color: #34d399;
            box-shadow: 0 0 5px #34d399;
          }
          
          .time-display {
            background: rgba(0, 0, 0, 0.2);
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            font-family: monospace;
            letter-spacing: 0.5px;
          }
          
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
          
          /* Modern container */
          .modern-container {
            background: rgba(15, 23, 42, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            backdrop-filter: blur(10px);
          }
          
          /* Modern cards */
          .modern-card {
            position: relative;
            border-radius: 12px;
            padding: 1.5rem;
            background: rgba(15, 23, 42, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.1);
            overflow: hidden;
            transition: all 0.3s ease;
          }
          
          .card-header {
            display: flex;
            align-items: center;
            margin-bottom: 1rem;
          }
          
          .card-icon {
            width: 2.5rem;
            height: 2.5rem;
            margin-right: 0.75rem;
            color: white;
            opacity: 0.9;
          }
          
          .card-content {
            position: relative;
            z-index: 1;
            background: rgba(0, 0, 0, 0.2);
            padding: 1rem;
            border-radius: 8px;
            min-height: 60px;
            display: flex;
            align-items: center;
          }
          
          .card-glow {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, 
              transparent 0%, 
              rgba(255, 255, 255, 0.3) 50%, 
              transparent 100%);
          }
          
          .card-corner {
            position: absolute;
            width: 8px;
            height: 8px;
            border-style: solid;
            border-color: rgba(255, 255, 255, 0.3);
          }
          
          .top-left {
            top: 8px;
            left: 8px;
            border-width: 1px 0 0 1px;
          }
          
          .top-right {
            top: 8px;
            right: 8px;
            border-width: 1px 1px 0 0;
          }
          
          .bottom-left {
            bottom: 8px;
            left: 8px;
            border-width: 0 0 1px 1px;
          }
          
          .bottom-right {
            bottom: 8px;
            right: 8px;
            border-width: 0 1px 1px 0;
          }
          
          /* Card colors */
          .blue-card {
            background: linear-gradient(145deg, rgba(20, 83, 136, 0.7), rgba(15, 23, 42, 0.7));
            border-top: 1px solid rgba(56, 189, 248, 0.3);
          }
          
          .purple-card {
            background: linear-gradient(145deg, rgba(76, 29, 149, 0.7), rgba(15, 23, 42, 0.7));
            border-top: 1px solid rgba(168, 85, 247, 0.3);
          }
          
          .indigo-card {
            background: linear-gradient(145deg, rgba(49, 46, 129, 0.7), rgba(15, 23, 42, 0.7));
            border-top: 1px solid rgba(99, 102, 241, 0.3);
          }
          
          /* Skill badges */
          .skill-badge {
            background: rgba(56, 189, 248, 0.15);
            border: 1px solid rgba(56, 189, 248, 0.3);
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.875rem;
          }
          
          .skill-badge.more {
            background: rgba(168, 85, 247, 0.15);
            border: 1px solid rgba(168, 85, 247, 0.3);
          }
          
          /* Section styling */
          .section-header {
            display: flex;
            align-items: center;
            margin-bottom: 1rem;
          }
          
          .section-line {
            flex: 1;
            height: 1px;
            margin-left: 1rem;
            background: linear-gradient(
              90deg, 
              rgba(56, 189, 248, 0.5) 0%, 
              transparent 100%
            );
          }
          
          /* Notification styling */
          .notification-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 1.5rem;
            background: rgba(15, 23, 42, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-left: 3px solid #38bdf8;
            border-radius: 8px;
            transition: all 0.3s ease;
          }
          
          .notification-content {
            flex: 1;
          }
          
          .action-button {
            padding: 0.4rem 1rem;
            border-radius: 4px;
            font-weight: 500;
            transition: all 0.2s ease;
          }
          
          .action-button.accept {
            background: rgba(52, 211, 153, 0.2);
            border: 1px solid rgba(52, 211, 153, 0.4);
            color: #34d399;
          }
          
          .action-button.accept:hover {
            background: rgba(52, 211, 153, 0.3);
          }
          
          .action-button.reject {
            background: rgba(244, 63, 94, 0.2);
            border: 1px solid rgba(244, 63, 94, 0.4);
            color: #f43f5e;
          }
          
          .action-button.reject:hover {
            background: rgba(244, 63, 94, 0.3);
          }
          
          /* Empty state */
          .empty-state {
            padding: 2rem;
            text-align: center;
            background: rgba(15, 23, 42, 0.5);
            border: 1px dashed rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: rgba(255, 255, 255, 0.6);
          }
          
          /* Action grid */
          .action-grid {
            display: grid;
            grid-template-columns: repeat(1, 1fr);
            gap: 1rem;
          }
          
          @media (min-width: 640px) {
            .action-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          
          @media (min-width: 1024px) {
            .action-grid {
              grid-template-columns: repeat(4, 1fr);
            }
          }
          
          .action-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            transition: all 0.3s ease;
            text-align: center;
          }
          
          .action-card:hover {
            transform: translateY(-5px);
          }
          
          .action-icon {
            background: rgba(0, 0, 0, 0.2);
            width: 48px;
            height: 48px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1rem;
            transition: all 0.3s ease;
          }
          
          .action-text {
            font-weight: 500;
          }
          
          .action-card.create {
            border-top: 2px solid #38bdf8;
          }
          
          .action-card.create:hover {
            box-shadow: 0 10px 25px -5px rgba(56, 189, 248, 0.3);
          }
          
          .action-card.create .action-icon {
            color: #38bdf8;
          }
          
          .action-card.join {
            border-top: 2px solid #34d399;
          }
          
          .action-card.join:hover {
            box-shadow: 0 10px 25px -5px rgba(52, 211, 153, 0.3);
          }
          
          .action-card.join .action-icon {
            color: #34d399;
          }
          
          .action-card.edit {
            border-top: 2px solid #a855f7;
          }
          
          .action-card.edit:hover {
            box-shadow: 0 10px 25px -5px rgba(168, 85, 247, 0.3);
          }
          
          .action-card.edit .action-icon {
            color: #a855f7;
          }
          
          .action-card.view {
            border-top: 2px solid #f43f5e;
          }
          
          .action-card.view:hover {
            box-shadow: 0 10px 25px -5px rgba(244, 63, 94, 0.3);
          }
          
          .action-card.view .action-icon {
            color: #f43f5e;
          }
          
          /* Logout button */
          .logout-button {
            background: rgba(244, 63, 94, 0.1);
            border: 1px solid rgba(244, 63, 94, 0.3);
            color: white;
            padding: 0.75rem 2rem;
            border-radius: 8px;
            font-weight: 500;
            transition: all 0.3s ease;
          }
          
          .logout-button:hover {
            background: rgba(244, 63, 94, 0.2);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(244, 63, 94, 0.2);
          }
          
          /* Footer text */
          .footer-text {
            color: rgba(255, 255, 255, 0.7);
          }
        `}
      </style>
    </div>
  );
}