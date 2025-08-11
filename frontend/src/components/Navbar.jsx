import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import NotificationBadge from './NotificationBadge';

const Navbar = () => {
  const [hasNewConnections, setHasNewConnections] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();

  // Check for new connections when component mounts and on localStorage change
  useEffect(() => {
    const checkNewConnections = () => {
      const hasConnections = localStorage.getItem('hasNewConnections') === 'true';
      setHasNewConnections(hasConnections);
    };
    
    // Check if user is logged in
    const checkLoginStatus = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
    };
    
    // Check immediately on mount
    checkNewConnections();
    checkLoginStatus();
    
    // Set up event listener for storage changes
    window.addEventListener('storage', checkNewConnections);
    window.addEventListener('storage', checkLoginStatus);
    
    // Also listen for our custom connectionAccepted event
    window.addEventListener('connectionAccepted', checkNewConnections);
    
    // Set interval to check periodically (redundant but provides better UX)
    const intervalId = setInterval(checkNewConnections, 3000);
    
    return () => {
      window.removeEventListener('storage', checkNewConnections);
      window.removeEventListener('storage', checkLoginStatus);
      window.removeEventListener('connectionAccepted', checkNewConnections);
      clearInterval(intervalId);
    };
  }, []);

  return (
    <nav className="bg-white/10 backdrop-blur-md shadow-md p-4 flex justify-between items-center">
      <Link to="/" className="text-2xl font-bold text-white">SkillSphere</Link>
      <div className="flex items-center gap-6 text-white font-medium">
        <Link to="/" className="hover:text-emerald-400 transition-colors">Home</Link>
        
        {/* Only show these links if user is logged in */}
        {isLoggedIn && (
          <>
            <Link to="/explore" className="text-white hover:text-emerald-400 transition-colors">Explore</Link>
            <div className="relative">
              <Link to="/connections" className="text-white hover:text-emerald-400 transition-colors">
                Connections
                {hasNewConnections && (
                  <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    •
                  </span>
                )}
              </Link>
            </div>
            <div className="flex items-center">
              <NotificationBadge />
            </div>
          </>
        )}
        
        {/* Show login/signup only if user is not logged in */}
        {!isLoggedIn && (
          <>
            <Link to="/auth/login" className="hover:text-emerald-400 transition-colors">Login</Link>
            <Link to="/auth/signup" className="hover:text-emerald-400 transition-colors">Signup</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
