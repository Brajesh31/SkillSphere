import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ConnectionsTabs from '../components/ConnectionsTabs';
import Navbar from '../components/Navbar';
import { FiSend, FiPaperclip, FiSmile, FiImage, FiFile, FiX, FiDownload } from 'react-icons/fi';
import EmojiPicker from 'emoji-picker-react';

const Connections = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("You need to be logged in to view connections");
          setLoading(false);
          return;
        }

        // Clear the new connections notification
        localStorage.removeItem('hasNewConnections');

        // Get user data from localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          setCurrentUserId(userData._id);
        } else {
          try {
            const userRes = await axios.get("http://localhost:5000/api/auth/me", {
              headers: { Authorization: `Bearer ${token}` },
              withCredentials: true,
            });
            setCurrentUserId(userRes.data._id);
          } catch (userErr) {
            console.error("Error fetching user data:", userErr);
          }
        }

        // Fetch connections
        const { data } = await axios.get("http://localhost:5000/api/connections/all", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        
        // Set up connections with unread message indicators
        const connectionsWithUnreadState = await Promise.all(
          data.map(async (conn) => {
            try {
              // Check for unread messages
              const res = await axios.get(`http://localhost:5000/api/messages/unread-count/${conn.userId}`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
              });
              return {
                ...conn,
                hasUnreadMessages: res.data.count > 0,
                unreadCount: res.data.count
              };
            } catch (err) {
              return { ...conn, hasUnreadMessages: false, unreadCount: 0 };
            }
          })
        );
        
        setConnections(connectionsWithUnreadState);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching connections:", err);
        toast.error("Failed to fetch connections.");
        setLoading(false);
      }
    };

    fetchConnections();

    // Listen for new messages through a polling mechanism
    const intervalId = setInterval(() => {
      if (currentUserId) {
        checkForNewMessages();
      }
    }, 5000); // Check every 5 seconds

    // Listen for connection accepted events to refresh the list
    const handleConnectionAccepted = () => {
      fetchConnections();
    };

    window.addEventListener('connectionAccepted', handleConnectionAccepted);

    return () => {
      window.removeEventListener('connectionAccepted', handleConnectionAccepted);
      clearInterval(intervalId);
    };
  }, [currentUserId]);

  // Scroll to bottom of messages when they change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkForNewMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`http://localhost:5000/api/messages/check-new`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      if (data.hasNewMessages) {
        // Update connection with new message indicators
        setConnections((prev) =>
          prev.map((conn) =>
            data.senders.includes(conn.userId) ? 
              { ...conn, hasUnreadMessages: true, unreadCount: (conn.unreadCount || 0) + 1 } : 
              conn
          )
        );

        // If the user with new messages is the active chat, fetch those messages
        if (activeChat && data.senders.includes(activeChat)) {
          fetchMessages(activeChat);
        }
      }
    } catch (err) {
      console.error("Error checking for new messages:", err);
    }
  };

  const openChat = async (userId) => {
    try {
      setActiveChat(userId);
      const token = localStorage.getItem("token");

      // Fetch messages
      const { data } = await axios.get(`http://localhost:5000/api/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setMessages(data);

      // Mark messages as seen
      await axios.put(`http://localhost:5000/api/messages/mark-seen/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      // Update unread status in connections
      setConnections((prev) =>
        prev.map((conn) =>
          conn.userId === userId ? { ...conn, hasUnreadMessages: false, unreadCount: 0 } : conn
        )
      );
    } catch (err) {
      console.error("Error opening chat:", err);
      toast.error("Failed to open chat.");
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`http://localhost:5000/api/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setMessages(data);

      // Mark messages as seen if this is the active chat
      if (activeChat === userId) {
        await axios.put(`http://localhost:5000/api/messages/mark-seen/${userId}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        // Update unread status in connections
        setConnections((prev) =>
          prev.map((conn) =>
            conn.userId === userId ? { ...conn, hasUnreadMessages: false, unreadCount: 0 } : conn
          )
        );
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !activeChat) return;

    try {
      const token = localStorage.getItem("token");
      
      if (selectedFile) {
        setIsUploading(true);
        // Handle file upload
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('receiver', activeChat);
        
        const { data: fileData } = await axios.post(
          "http://localhost:5000/api/messages/send-file",
          formData,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            },
            withCredentials: true,
          }
        );
        
        setMessages((prev) => [...prev, fileData.data]);
        setSelectedFile(null);
        setIsUploading(false);
      }
      
      if (newMessage.trim()) {
        const { data } = await axios.post(
          "http://localhost:5000/api/messages/send",
          { receiver: activeChat, content: newMessage },
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        );
        setMessages((prev) => [...prev, data.data]);
      }
      
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Failed to send message.");
      setIsUploading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      toast.info(`File selected: ${e.target.files[0].name}`);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const onEmojiClick = (emojiObject) => {
    setNewMessage((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    
    if (imageExtensions.includes(extension)) {
      return <FiImage className="mr-2 text-blue-500" />;
    }
    return <FiFile className="mr-2 text-orange-500" />;
  };

  const renderFileName = (filePath) => {
    // Extract the filename from the path
    const fileName = filePath.split('/').pop();
    return fileName;
  };

  const isImageFile = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    return imageExtensions.includes(extension);
  };

  const renderConnectionsList = () => {
    return (
      <div className="w-1/3 border-r overflow-y-auto bg-white">
        <h2 className="text-xl font-semibold p-4 border-b bg-white">Connections</h2>
        {connections.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No connections yet</p>
        ) : (
          <ul>
            {connections.map((conn) => (
              <li 
                key={conn.userId}
                className={`flex items-center justify-between p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                  activeChat === conn.userId ? "bg-blue-50" : ""
                }`}
                onClick={() => openChat(conn.userId)}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {/* Connection avatar with fallback */}
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {conn.avatar ? (
                        <img
                          src={conn.avatar.includes('http')
                            ? conn.avatar
                            : `http://localhost:5000/uploads/profiles/${conn.avatar}`}
                          alt={conn.fullName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const parent = e.target.parentElement;
                            if (parent) {
                              // Show first letter of name or a user icon
                              const userInitial = conn.fullName?.charAt(0);
                              if (userInitial) {
                                parent.innerHTML = `<span class="text-lg font-semibold text-gray-500">${userInitial}</span>`;
                              } else {
                                parent.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
                              }
                            }
                          }}
                        />
                      ) : (
                        <span className="text-lg font-semibold text-gray-500">
                          {conn.fullName?.charAt(0) || (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                              <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                          )}
                        </span>
                      )}
                    </div>
                    {conn.hasUnreadMessages && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
                        {conn.unreadCount > 9 ? '9+' : conn.unreadCount}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{conn.fullName}</h3>
                    <p className="text-sm text-gray-600">{conn.role || "User"}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  const renderChatBox = () => {
    if (!activeChat) {
      return (
        <div className="w-2/3 flex items-center justify-center text-gray-500 bg-gray-50">
          <div className="text-center p-6">
            <div className="text-6xl mb-4 text-gray-300">💬</div>
            <h3 className="text-xl font-medium mb-2">Your Messages</h3>
            <p>Select a connection to start chatting</p>
          </div>
        </div>
      );
    }

    const activeConnection = connections.find((c) => c.userId === activeChat);

    return (
      <div className="w-2/3 flex flex-col h-full bg-white">
        <div className="border-b p-4 flex items-center space-x-3 bg-white shadow-sm">
          {/* Active connection avatar with fallback */}
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {activeConnection?.avatar ? (
              <img
                src={activeConnection.avatar.includes('http')
                  ? activeConnection.avatar
                  : `http://localhost:5000/uploads/profiles/${activeConnection.avatar}`}
                alt={activeConnection?.fullName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  // Show first letter of name
                  const initial = activeConnection?.fullName?.charAt(0) || '?';
                  e.target.parentElement.innerHTML = `<span class="text-lg font-semibold text-gray-500">${initial}</span>`;
                }}
              />
            ) : (
              <span className="text-lg font-semibold text-gray-500">
                {activeConnection?.fullName?.charAt(0) || '?'}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-medium">{activeConnection?.fullName}</h3>
            <p className="text-sm text-gray-600">{activeConnection?.role || "User"}</p>
          </div>
        </div>

        <div 
          ref={chatContainerRef}
          className="flex-1 p-4 overflow-y-auto bg-white"
          style={{ backgroundImage: 'radial-gradient(circle at center, #f3f4f6 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        >
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              No messages yet. Say hello!
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-3 ${
                  msg.sender === currentUserId ? "text-right" : "text-left"
                }`}
              >
                <div
                  className={`inline-block max-w-xs md:max-w-sm px-4 py-2 rounded-lg shadow-sm ${
                    msg.sender === currentUserId
                      ? "bg-blue-500 text-white rounded-tr-none"
                      : "bg-white text-gray-800 rounded-tl-none border border-gray-200"
                  }`}
                >
                  {msg.content.startsWith('file:') ? (
                    <div>
                      <div className="flex items-center">
                        {getFileIcon(msg.content)}
                        <span className="text-sm font-medium overflow-hidden text-ellipsis">
                          {renderFileName(msg.content.substring(5))}
                        </span>
                      </div>
                      
                      {isImageFile(msg.content) && (
                        <div className="mt-2 rounded-lg overflow-hidden border">
                          <img 
                            src={`http://localhost:5000/uploads/messages/${msg.content.substring(5)}`} 
                            alt="Image preview" 
                            className="max-w-full h-auto max-h-48 object-contain bg-white"
                          />
                        </div>
                      )}
                      
                      <a 
                        href={`http://localhost:5000/uploads/messages/${msg.content.substring(5)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`mt-2 inline-flex items-center text-xs px-2 py-1 rounded ${
                          msg.sender === currentUserId 
                            ? "bg-blue-600 hover:bg-blue-700" 
                            : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                        }`}
                        download
                      >
                        <FiDownload className="mr-1" /> Download
                      </a>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                  <span className="text-xs opacity-75 block mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4 bg-white">
          {selectedFile && (
            <div className="mb-2 p-2 bg-blue-50 rounded-lg border border-blue-100 flex justify-between items-center">
              <div className="flex items-center overflow-hidden">
                {getFileIcon(selectedFile.name)}
                <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
              </div>
              <button 
                onClick={() => setSelectedFile(null)} 
                className="text-red-500 hover:text-red-700 ml-2"
                title="Remove file"
              >
                <FiX />
              </button>
            </div>
          )}
          
          <div className="relative flex">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 border rounded-l-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="Type a message..."
              disabled={isUploading}
            />
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
            />
            <div className="flex border-t border-r border-b rounded-r-lg bg-white">
              <button 
                onClick={triggerFileInput} 
                className="px-3 py-2 text-gray-500 hover:text-blue-600 transition-colors"
                title="Attach file"
                disabled={isUploading}
              >
                <FiPaperclip />
              </button>
              <button 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                className="px-3 py-2 text-gray-500 hover:text-yellow-500 transition-colors"
                title="Add emoji"
                disabled={isUploading}
              >
                <FiSmile />
              </button>
              <button
                onClick={sendMessage}
                disabled={isUploading || (!newMessage.trim() && !selectedFile)}
                className={`px-4 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 transition-colors ${
                  isUploading || (!newMessage.trim() && !selectedFile) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isUploading ? 
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span> 
                  : <FiSend />
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMessageSection = () => {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden h-[calc(100vh-260px)] flex border border-gray-200">
        {renderConnectionsList()}
        {renderChatBox()}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-teal-800 connections-bg relative">
        <div className="absolute inset-0 web-dev-icons-overlay opacity-15 z-0"></div>
        <Navbar />
        <div className="container mx-auto py-8 px-4 relative z-10">
          <h1 className="text-2xl font-bold mb-6 text-white">My Connections</h1>
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-teal-200">Loading connections...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-teal-800 connections-bg relative">
      <div className="absolute inset-0 web-dev-icons-overlay opacity-15 z-0"></div>
      <Navbar />
      <div className="container mx-auto py-8 px-4 relative z-10">
        <h1 className="text-2xl font-bold mb-6 text-white">My Connections</h1>
        <div className="mb-6">
          <ConnectionsTabs 
            connections={connections} 
            onMessageClick={openChat} 
          />
        </div>
        <h2 className="text-xl font-semibold mb-4 text-white">Messages</h2>
        <div className="bg-white/85 backdrop-blur-md rounded-lg shadow-xl overflow-hidden h-[calc(100vh-260px)] flex border border-gray-200">
          {renderConnectionsList()}
          {renderChatBox()}
        </div>
      </div>
      
      <style jsx global>{`
        .connections-bg {
          position: relative;
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
        }
        
        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        .web-dev-icons-overlay {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800' opacity='0.15'%3E%3Cg fill='white'%3E%3Cpath d='M178 88l-40 68-40-68h-60l70 120-70 120h60l40-68 40 68h60l-70-120 70-120zM378 88h-120v240h120c66 0 120-54 120-120s-54-120-120-120zm0 190h-70v-140h70c39 0 70 31 70 70s-31 70-70 70zM590 88h-50v240h50zM650 208c0 44 36 80 80 80h20v40h-120v-40h20c44 0 80-36 80-80 0-30-17-58-42-72l-10-5-10-5-10-2-15-1-13 1c-9 1-17 3-25 8-8 4-16 10-23 18l35 35c8-9 19-15 33-15 15 0 25 10 25 25 0 14-11 25-25 25h-20v-80h-50v150h170v-80h-20c-44 0-80-36-80-80 0-26 13-51 35-67 23-16 48-18 72-10 12 4 24 12 33 22l10 14c11 18 17 39 17 61 0 66-54 120-120 120h-100v-240h100c5 0 10 0 15 1l13 2c17 5 33 14 46 26l11 14 9 17 8 40c0 4 1 9 1 14h-50c0-5 0-10-1-14l-7-26-2-5-3-4-3-4-7-7-4-3-5-3-5-2-9-2c-4-1-9-1-13-1zM720 68c15 0 30 15 30 30s-15 30-30 30-30-15-30-30 15-30 30-30z'/%3E%3C/g%3E%3C/svg%3E");
          background-size: 800px 800px;
          background-position: center;
          background-repeat: repeat;
          animation: floatingIcons 60s linear infinite;
        }
        
        @keyframes floatingIcons {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 800px 800px;
          }
        }
      `}</style>
    </div>
  );
};

export default Connections;