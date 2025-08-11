import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';

const NotificationBadge = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const { data } = await axios.get("http://localhost:5000/api/connections/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        setNotifications(Array.isArray(data) ? data : []);
        
        // Set the hasNewNotifications flag if there are notifications
        if (Array.isArray(data) && data.length > 0) {
          setHasNewNotifications(true);
          // Store in localStorage that we have new notifications
          localStorage.setItem('hasNewNotifications', 'true');
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
      }
    };

    fetchNotifications();
    
    // Set up polling to fetch notifications every 15 seconds
    const intervalId = setInterval(fetchNotifications, 15000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Check localStorage for new notifications on mount and when location changes
  useEffect(() => {
    const hasNotifications = localStorage.getItem('hasNewNotifications');
    if (hasNotifications === 'true') {
      setHasNewNotifications(true);
    }

    // Clear notification indicator if we're on dashboard with #notifications hash
    if (location.pathname === '/auth/dashboard' && location.hash === '#notifications') {
      setHasNewNotifications(false);
      localStorage.removeItem('hasNewNotifications');
    }
  }, [location]);

  useEffect(() => {
    // Handle clicks outside the dropdown to close it
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResponse = async (notificationId, action) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        `http://localhost:5000/api/connections/respond/${notificationId}`,
        { action },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      toast.success(`Connection request ${action}ed`);
      
      // Remove this notification from the list
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      
      // If there are no more notifications, clear the indicator
      if (notifications.length <= 1) {
        setHasNewNotifications(false);
        localStorage.removeItem('hasNewNotifications');
        setShowDropdown(false);
      }
      
      // If accepting, refresh connections with a custom event
      if (action === 'accept') {
        localStorage.setItem('hasNewConnections', 'true');
        
        // Get the sender ID from the notification
        const notification = notifications.find(n => n._id === notificationId);
        const connectedUserId = notification?.sender?._id;
        
        // Dispatch a custom event with connection details
        const connectionEvent = new CustomEvent('connectionAccepted', {
          detail: { 
            userId: connectedUserId,
            status: 'accepted'
          }
        });
        
        window.dispatchEvent(connectionEvent);
      }
    } catch (error) {
      console.error('Error responding to connection request:', error);
      toast.error('Failed to respond to connection request');
    }
  };

  const handleNotificationClick = () => {
    // If we're not on dashboard, navigate there with notification hash
    if (location.pathname !== '/auth/dashboard') {
      navigate('/auth/dashboard#notifications');
      return;
    }
    
    // If we're already on dashboard, scroll to notifications section
    const notificationsSection = document.getElementById('notifications-section');
    if (notificationsSection) {
      notificationsSection.scrollIntoView({ behavior: 'smooth' });
      setHasNewNotifications(false);
      localStorage.removeItem('hasNewNotifications');
    }
    
    // Toggle dropdown (for smaller screens where we show the dropdown)
    setShowDropdown(prev => !prev);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className="relative flex items-center text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
        onClick={handleNotificationClick}
        aria-label="Notifications"
      >
        Notifications
        {hasNewNotifications && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>
      
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50">
          <div className="py-2 px-3 bg-gray-100 border-b border-gray-200 font-semibold text-gray-700">
            Notifications ({notifications.length})
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              <div>
                {notifications.map(notification => (
                  <div key={notification._id} className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50">
                    <p className="text-gray-800">{notification.message}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      From: {notification.sender?.fullName || notification.sender?.username || "Unknown"}
                    </p>
                    <div className="mt-2 flex justify-end space-x-2">
                      <button
                        onClick={() => handleResponse(notification._id, 'accept')}
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleResponse(notification._id, 'reject')}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-gray-500">No new notifications</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBadge;