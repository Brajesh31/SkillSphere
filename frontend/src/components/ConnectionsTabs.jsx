import React, { useState } from 'react';
import UserCard from './UserCard';

const ConnectionsTabs = ({ connections, onMessageClick }) => {
  const [activeTab, setActiveTab] = useState('all');
  
  const filteredConnections = Array.isArray(connections)
    ? connections.filter(conn => {
        if (activeTab === 'all') return true;
        if (activeTab === 'students') return conn.role === 'student';
        if (activeTab === 'mentors') return conn.role === 'mentor';
        return true;
      })
    : [];

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="border-b">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'all' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            All Connections
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'students' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Students
          </button>
          <button
            onClick={() => setActiveTab('mentors')}
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'mentors' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Mentors
          </button>
        </nav>
      </div>
      
      <div className="p-4">
        {filteredConnections.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No connections found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredConnections.map((connection, index) => (
              <UserCard
                key={index}
                user={connection} // Pass the profile data
                connectionStatus="accepted"
                onMessageClick={onMessageClick}
                hideConnectButton={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionsTabs;