import React from 'react';
import { FiMessageSquare, FiUserPlus, FiCheck, FiClock, FiUser } from 'react-icons/fi';

const UserCard = ({ user, onConnect, onMessageClick, isPending, connectionStatus, hideConnectButton }) => {
  // Helper function to render avatars consistently
  const renderAvatar = () => {
    if (!user || !user.avatar) {
      return (
        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
          <FiUser className="text-4xl" />
        </div>
      );
    }
    
    return (
      <div className="w-20 h-20 rounded-full overflow-hidden">
        <img
          src={user.avatar.includes('http')
            ? user.avatar
            : `http://localhost:5000/uploads/profiles/${user.avatar}`}
          alt={user?.fullName || 'User'}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
            const parent = e.target.parentElement;
            if (parent) {
              parent.classList.add('bg-gray-200', 'flex', 'items-center', 'justify-center');
              // Show first letter of name or a user icon
              const userInitial = user?.fullName?.charAt(0);
              if (userInitial) {
                parent.innerHTML = `<span class="text-2xl font-semibold text-gray-500">${userInitial}</span>`;
              } else {
                parent.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
              }
            }
          }}
        />
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex flex-col items-center">
          {renderAvatar()}
          
          <h3 className="mt-4 text-xl font-semibold text-gray-800">{user?.fullName || 'Unknown User'}</h3>
          <p className="text-gray-500">@{user?.username || 'username'}</p>
          
          <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mt-2">
            {user?.role || 'User'}
          </div>
          
          <p className="mt-4 text-gray-600 text-sm text-center line-clamp-3">
            {user?.bio || 'No bio available'}
          </p>
          
          {user?.skills && user.skills.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {user.skills.slice(0, 3).map((skill, index) => (
                <span key={index} className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  {skill.name || skill}
                </span>
              ))}
              {user.skills.length > 3 && (
                <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  +{user.skills.length - 3} more
                </span>
              )}
            </div>
          )}
          
          <div className="mt-6 flex space-x-3">
            {!hideConnectButton && (
              <button
                onClick={onConnect}
                disabled={isPending || connectionStatus === 'accepted'}
                className={`flex items-center py-2 px-4 text-sm font-medium rounded-lg 
                  ${isPending 
                    ? 'bg-yellow-100 text-yellow-700 cursor-not-allowed' 
                    : connectionStatus === 'accepted'
                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
              >
                {isPending ? (
                  <>
                    <FiClock className="mr-1" /> Request Sent
                  </>
                ) : connectionStatus === 'accepted' ? (
                  <>
                    <FiCheck className="mr-1" /> Connected
                  </>
                ) : (
                  <>
                    <FiUserPlus className="mr-1" /> Connect
                  </>
                )}
              </button>
            )}
            
            {(connectionStatus === 'accepted' || onMessageClick) && (
              <button
                onClick={() => onMessageClick && onMessageClick(user.userId)}
                className="flex items-center py-2 px-4 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                <FiMessageSquare className="mr-1" /> Message
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCard;