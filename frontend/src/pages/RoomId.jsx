import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import { Peer } from 'peerjs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMic, FiMicOff, FiVideo, FiVideoOff, FiMonitor, FiStopCircle,
  FiMessageSquare, FiSend, FiUsers, FiX, FiCopy, FiUser, FiDownload,
  FiMessageCircle, FiSmile, FiPhoneOff, FiMoreVertical, FiShield, 
  FiRadio
} from 'react-icons/fi';
import EmojiPicker from 'emoji-picker-react';
import { v4 as uuidv4 } from 'uuid';
import '../styles/Room.css'; // Import the Room.css styles

const socket = io('http://localhost:5000', {
  withCredentials: true,
  transports: ['websocket']
});

const RoomId = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [peers, setPeers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [userStream, setUserStream] = useState(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [pinnedUser, setPinnedUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isRaiseHand, setIsRaiseHand] = useState(false);
  const [raisedHands, setRaisedHands] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [activeScreenShare, setActiveScreenShare] = useState(null);
  const [awaitingScreenSharePermission, setAwaitingScreenSharePermission] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareRequests, setScreenShareRequests] = useState([]);
  
  // Add recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Add state for pinned participant
  const [pinnedParticipant, setPinnedParticipant] = useState(null);

  // Refs
  const userVideoRef = useRef();
  const peersRef = useRef([]);
  const messagesEndRef = useRef();
  const mediaStreamRef = useRef(null);
  const screenShareRef = useRef(null);
  const peerUserIdsRef = useRef(new Set());
  const videoRefs = useRef({});
  const socketRef = useRef(socket);
  const participantRefs = useRef({});

  // Add CSS class styles at the top of your component
  const hostVideoStyles = `
    .host-video {
      order: -1; /* Ensure host appears first */
    }
    
    .pinned-video {
      width: 100% !important;
      height: auto !important;
      grid-column: span 3;
      grid-row: span 2;
      z-index: 10;
    }
    
    @media (max-width: 640px) {
      .pinned-video {
        grid-column: span 2;
      }
    }
  `;

  // Update video grid styles for proper layout management
  const videoGridStyles = `
    .video-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 0.5rem;
      padding: 0.75rem;
      width: 100%;
      height: calc(100vh - 160px);
    }

    /* When screen sharing is active */
    .video-grid.has-screen-share {
      display: flex;
      flex-direction: column;
    }

    .video-grid.has-screen-share .screen-share-container {
      flex: 1;
      max-height: 65vh;
      width: 100%;
      margin-bottom: 0.75rem;
    }

    .video-grid.has-screen-share .participants-container {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      justify-content: center;
      height: 30%;
      min-height: 120px;
    }

    .video-grid.has-screen-share .participants-container .video-container {
      width: 180px;
      height: 100px;
      flex-shrink: 0;
    }

    .video-grid .video-container {
      position: relative;
      border-radius: 0.5rem;
      overflow: hidden;
      background-color: #1a1a1a;
      aspect-ratio: 16/9;
      height: auto;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    /* Make video tiles smaller to fit more in the space */
    .video-grid:not(.has-screen-share) {
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    }

    @media (min-width: 1024px) {
      .video-grid:not(.has-screen-share) {
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        grid-auto-rows: minmax(100px, auto);
      }
    }

    @media (min-width: 1280px) {
      .video-grid:not(.has-screen-share) {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    /* Rest of the styles */
    .video-grid .video-container.host-video {
      border: 2px solid #4f46e5;
    }

    .video-grid .video-container video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .video-grid .video-container.screen-share {
      width: 100%;
    }

    .video-grid .video-container.screen-share video {
      object-fit: contain;
      background-color: #1a1a1a;
    }

    /* When screen sharing stops */
    .video-grid .video-container.screen-share-end {
      transition: all 0.3s ease;
    }

    /* Participant video layouts by count */
    .video-grid[data-participant-count="1"] {
      grid-template-columns: 1fr;
    }

    .video-grid[data-participant-count="2"] {
      grid-template-columns: repeat(2, 1fr);
    }

    .video-grid[data-participant-count="3"],
    .video-grid[data-participant-count="4"] {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (min-width: 1024px) {
      .video-grid[data-participant-count="3"],
      .video-grid[data-participant-count="4"] {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .video-grid[data-participant-count="5"],
      .video-grid[data-participant-count="6"],
      .video-grid[data-participant-count="7"],
      .video-grid[data-participant-count="8"] {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    /* Side-by-side layout for normal display */
    .video-grid:not(.has-screen-share) .side-by-side-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 0.5rem;
      width: 100%;
    }

    /* Transition effects for smooth layout changes */
    .video-grid .video-container {
      transition: all 0.3s ease-in-out;
    }
  `;

  useEffect(() => {
    // Inject the CSS styles
    const styleElement = document.createElement('style');
    styleElement.textContent = hostVideoStyles + videoGridStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Define cleanupMedia first, before it's used in useEffects
  const cleanupMedia = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (screenShareRef.current) {
      screenShareRef.current.getTracks().forEach(track => track.stop());
      screenShareRef.current = null;
    }
    
    peersRef.current.forEach(({ peer }) => peer.destroy());
    peersRef.current = [];
    setPeers([]);
    peerUserIdsRef.current.clear();
  }, []);

  // Move scrollToBottom here, before it's used in other functions
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Copy meeting ID to clipboard
  const copyMeetingId = useCallback(() => {
    if (room?.meetingId) {
      navigator.clipboard.writeText(room.meetingId)
        .then(() => {
          toast.success('Meeting ID copied to clipboard!');
        })
        .catch((error) => {
          console.error('Failed to copy Meeting ID:', error);
          toast.error('Failed to copy Meeting ID. Please try again.');
        });
    } else {
      toast.error('Meeting ID not available');
    }
  }, [room]);

  // Add the missing function for formatting time (used in the recording feature)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Add the missing toggleChat function
  const toggleChat = useCallback(() => {
    setShowChat(!showChat);
    if (!showChat) {
      setShowParticipants(false);
    }
  }, [showChat]);

  // Add the missing addEmoji function
  const addEmoji = useCallback((emoji) => {
    setNewMessage(prev => prev + emoji.emoji);
    setShowEmojiPicker(false);
  }, []);

  // Fix chat message transmission between host and participants
  const sendMessage = useCallback(() => {
    if (newMessage.trim() === '') return;
    
    // Create unique message ID to prevent duplicates
    const messageId = uuidv4();
    
    // Create message object with all necessary information
    const messageObj = {
      id: messageId,
      senderId: userInfo._id,
      senderName: userInfo.fullName || 'You',
      message: newMessage,
      timestamp: new Date().toISOString(),
      isSentByMe: true
    };
    
    // Add to local state first for immediate display
    setChatMessages(prev => [...prev, messageObj]);
    
    // Then emit to other participants
    socket.emit('send-message', {
      roomId: room.meetingId,
      messageId: messageId,
      senderId: userInfo._id,
      senderName: userInfo.fullName || 'Anonymous',
      message: newMessage,
      timestamp: messageObj.timestamp
    });
    
    // Clear input and scroll to bottom
    setNewMessage('');
    setTimeout(scrollToBottom, 50);
  }, [newMessage, userInfo, room, scrollToBottom]);

  // Modify the useEffect for chat message handling
  useEffect(() => {
    if (socketRef.current) {
      // When a new chat message is received
      socketRef.current.on("receiveMessage", (data) => {
        // Check if this is our own message that we just sent
        const isOwnMessage = data.senderId === userInfo._id;
        
        // Only add messages from others (our own messages are already added on send)
        if (!isOwnMessage) {
          const newMessage = {
            id: uuidv4(),
            senderId: data.senderId,
            senderName: data.senderName,
            message: data.message,
            timestamp: new Date().toISOString(),
          };
          setChatMessages((prev) => [...prev, newMessage]);
        }
      });

      return () => {
        socketRef.current.off("receiveMessage");
      };
    }
  }, [socketRef, userInfo]);

  const muteParticipant = useCallback((participantId, participantName) => {
    if (!isHost || !room) return;
    
    socket.emit('host-action', { 
      roomId: room.meetingId, 
      action: 'mute',
      targetId: participantId,
      hostName: userInfo?.fullName || 'Host'
    });
    
    toast.success(`${participantName} has been muted`);
  }, [isHost, room, userInfo]);

  const removeParticipant = useCallback((participantId, participantName) => {
    if (!isHost || !room) return;
    
    socket.emit('host-action', { 
      roomId: room.meetingId, 
      action: 'remove',
      targetId: participantId,
      hostName: userInfo?.fullName || 'Host'
    });
    
    toast.success(`${participantName} has been removed from the room`);
  }, [isHost, room, userInfo]);

  const togglePinVideo = useCallback((peerId) => {
    setPeers(prev => {
      const newPeers = { ...prev };
      
      // First unpin all videos
      Object.keys(newPeers).forEach(key => {
        if (key !== peerId) {
          newPeers[key] = {
            ...newPeers[key],
            isPinned: false
          };
        }
      });
      
      // Then toggle the selected video
      newPeers[peerId] = {
        ...newPeers[peerId],
        isPinned: !newPeers[peerId]?.isPinned
      };
      
      return newPeers;
    });
  }, []);

  const handlePinParticipant = (participantId) => {
    if (pinnedParticipant === participantId) {
      setPinnedParticipant(null); // Unpin if clicking the same participant
    } else {
      setPinnedParticipant(participantId); // Pin the new participant
    }
  };

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('You need to be logged in to join a room');
          navigate('/auth/login');
          return;
        }

        const { data: roomData } = await axios.get(`http://localhost:5000/api/rooms/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });

        setRoom(roomData.room);
        
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          setUserInfo(userData);
          
          setIsHost(roomData.room.isCurrentUserHost === true);
        }
      } catch (error) {
        console.error('Error fetching room data:', error);
        toast.error(error.response?.data?.message || 'Failed to fetch room details');
        navigate('/auth/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [id, navigate]);

  useEffect(() => {
    if (!room || !userInfo) return;

    let cleanupFunction = () => {};

    const initMedia = async () => {
      try {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
          });
          
          mediaStreamRef.current = stream;
          setUserStream(stream);

          if (userVideoRef.current) {
            userVideoRef.current.srcObject = stream;
          }
        } catch (initialError) {
          console.error('Initial media error:', initialError);
          try {
            toast.info('Could not access camera. Joining with audio only.');
            const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ 
              video: false, 
              audio: true 
            });
            
            mediaStreamRef.current = audioOnlyStream;
            setUserStream(audioOnlyStream);
            setVideoOff(true);
            
            if (userVideoRef.current) {
              userVideoRef.current.srcObject = audioOnlyStream;
            }
          } catch (audioError) {
            console.error('Audio-only error:', audioError);
            toast.error('Could not access microphone. You can still join but won\'t be able to speak or be seen.');
            const emptyStream = new MediaStream();
            mediaStreamRef.current = emptyStream;
            setUserStream(emptyStream);
            setMuted(true);
            setVideoOff(true);
          }
        }

        socket.emit('join-room', { 
          roomId: room.meetingId, 
          userId: userInfo._id,
          name: userInfo.fullName || 'Anonymous',
          isHost: room.isCurrentUserHost === true
        });
        
        cleanupFunction = () => {
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
          }
          socket.emit('leave-room', { roomId: room.meetingId });
        };
      } catch (error) {
        console.error('Fatal media error:', error);
        toast.error('Failed to join the meeting: ' + (error.message || 'Unknown error'));
        navigate('/auth/dashboard');
      }
    };

    const handleReceiveMessage = (message) => {
      if (!message.isSentByMe) {
        setChatMessages((prev) => {
          const isDuplicate = prev.some(m => 
            (m.id && m.id === message.id) || 
            (m.timestamp && m.timestamp === message.timestamp && m.sender === message.sender)
          );
          
          if (isDuplicate) return prev;
          return [...prev, message];
        });
        
        scrollToBottom();
        
        if (!showChat) {
          toast.info(`${message.sender}: ${message.text.substring(0, 30)}${message.text.length > 30 ? '...' : ''}`);
        }
      }
    };

    const handleUpdateParticipants = (participants) => {
      const prevParticipantIds = new Set(peers.map(p => p.id));
      
      const uniqueParticipants = [];
      const seenUserIds = new Set();
      
      for (const participant of participants) {
        if (participant.userId === userInfo._id) continue;
        
        if (!seenUserIds.has(participant.userId)) {
          seenUserIds.add(participant.userId);
          uniqueParticipants.push(participant);
        }
      }
      
      setPeers(uniqueParticipants);
      
      for (const participant of participants) {
        if (!prevParticipantIds.has(participant.id) && participant.id !== socket.id) {
          toast.info(`${participant.name} joined the room`);
        }
      }
    };

    const handleScreenShareStarted = ({ userId }) => {
      setPinnedUser(userId);
      setActiveScreenShare(userId);
      const participantName = peers.find(p => p.userId === userId)?.name || 'a participant';
      toast.info(`Screen sharing started by ${participantName}`);
    };
    
    const handleScreenShareStopped = ({ userId }) => {
      if (pinnedUser === userId) {
        setPinnedUser(null);
      }
      setActiveScreenShare(null);
      const participantName = peers.find(p => p.userId === userId)?.name || 'a participant';
      toast.info(`Screen sharing stopped by ${participantName}`);
    };
    
    const handleRaiseHand = ({ userId, name }) => {
      setRaisedHands(prev => [...prev, { userId, name }]);
      toast.info(`${name} raised their hand`);
      
      setTimeout(() => {
        setRaisedHands(prev => prev.filter(user => user.userId !== userId));
      }, 10000);
    };
    
    const handleHostAction = ({ action, targetId, hostName }) => {
      if (action === 'mute') {
        if (userInfo._id === targetId) {
          if (mediaStreamRef.current) {
            const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
            audioTrack.enabled = false;
            setMuted(true);
            toast.warning(`You were muted by the host (${hostName})`);
          }
        }
      }
    };

    const handleScreenShareRejected = ({ reason }) => {
      setAwaitingScreenSharePermission(false);
      toast.error(reason || 'Screen sharing was rejected');
    };
    
    const handleScreenShareApproved = async () => {
      setAwaitingScreenSharePermission(false);
      
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        screenShareRef.current = screenStream;
        setScreenSharing(true);
        
        screenStream.getVideoTracks()[0].onended = () => {
          stopScreenSharing();
        };
        
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = screenStream;
        }
        
        setUserStream(screenStream);
        
        socket.emit('screen-share-started', { 
          roomId: room.meetingId, 
          userId: userInfo._id 
        });
        
        toast.success('Screen sharing started');
      } catch (error) {
        console.error('Screen share error:', error);
        toast.error('Failed to share screen: ' + (error.message || 'Unknown error'));
      }
    };
    
    socket.on('screen-share-approved', handleScreenShareApproved);
    socket.on('receive-message', handleReceiveMessage);
    socket.on('update-participants', handleUpdateParticipants);
    socket.on('screen-share-started', handleScreenShareStarted);
    socket.on('screen-share-stopped', handleScreenShareStopped);
    socket.on('raise-hand', handleRaiseHand);
    socket.on('host-action', handleHostAction);
    socket.on('screen-share-rejected', handleScreenShareRejected);

    initMedia();

    return () => {
      socket.off('receive-message', handleReceiveMessage);
      socket.off('update-participants', handleUpdateParticipants);
      socket.off('screen-share-started', handleScreenShareStarted);
      socket.off('screen-share-stopped', handleScreenShareStopped);
      socket.off('raise-hand', handleRaiseHand);
      socket.off('host-action', handleHostAction);
      socket.off('screen-share-rejected', handleScreenShareRejected);
      socket.off('screen-share-approved', handleScreenShareApproved);
      
      cleanupFunction();
    };
  }, [room, userInfo]);

  useEffect(() => {
    if (!room || !userInfo) return;

    const handleScreenShareRequest = ({ userId, name }) => {
      if (isHost) {
        setScreenShareRequests(prev => [...prev, { userId, name }]);
        
        toast.info(
          <div>
            <p>{name} wants to share their screen</p>
            <div className="flex justify-between mt-2">
              <button 
                onClick={() => approveScreenShare(userId)}
                className="px-2 py-1 bg-green-500 text-white text-xs rounded"
              >
                Approve
              </button>
              <button 
                onClick={() => rejectScreenShare(userId)}
                className="px-2 py-1 bg-red-500 text-white text-xs rounded"
              >
                Reject
              </button>
            </div>
          </div>,
          { autoClose: false, closeOnClick: false }
        );
      }
    };

    const handleScreenShareRequestSent = ({ hostName }) => {
      toast.info(`Your screen sharing request was sent to ${hostName}`);
    };

    const handleMeetingEnded = ({ hostName }) => {
      toast.info(`The meeting was ended by ${hostName}`);
      cleanupMedia();
      navigate('/auth/dashboard');
    };

    const handleYouWereRemoved = ({ hostName }) => {
      toast.warning(`You were removed from the meeting by ${hostName}`);
      cleanupMedia();
      navigate('/auth/dashboard');
    };

    const handleNewHost = ({ userId, name }) => {
      if (userInfo._id === userId) {
        setIsHost(true);
        toast.success("You are now the host of this meeting");
      } else {
        toast.info(`${name} is now the host of this meeting`);
      }
    };

    socket.on('screen-share-request', handleScreenShareRequest);
    socket.on('screen-share-request-sent', handleScreenShareRequestSent);
    socket.on('meeting-ended', handleMeetingEnded);
    socket.on('you-were-removed', handleYouWereRemoved);
    socket.on('new-host', handleNewHost);

    return () => {
      socket.off('screen-share-request', handleScreenShareRequest);
      socket.off('screen-share-request-sent', handleScreenShareRequestSent);
      socket.off('meeting-ended', handleMeetingEnded);
      socket.off('you-were-removed', handleYouWereRemoved);
      socket.off('new-host', handleNewHost);
    };
  }, [room, userInfo, isHost, navigate, cleanupMedia]);

  const connectToNewUser = useCallback((userData, stream) => {
    if (peersRef.current.some(p => p.socketId === userData.socketId)) return;
    if (peerUserIdsRef.current.has(userData.userId)) return;
    
    peerUserIdsRef.current.add(userData.userId);
    
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream
    });
    
    peer.on('signal', signal => {
      socket.emit('sending-signal', { 
        userToSignal: userData.socketId,
        callerId: socket.id,
        callerUserId: userInfo._id,
        callerName: userInfo.fullName || 'Anonymous',
        isCallerHost: isHost,
        signal
      });
    });
    
    peer.on('stream', incomingStream => {
      setPeers(prevPeers => {
        const existingPeerIndex = prevPeers.findIndex(p => p.userId === userData.userId);
        
        if (existingPeerIndex >= 0) {
          const updatedPeers = [...prevPeers];
          updatedPeers[existingPeerIndex] = {
            ...updatedPeers[existingPeerIndex],
            stream: incomingStream
          };
          return updatedPeers;
        }
        
        return [...prevPeers, {
          userId: userData.userId,
          socketId: userData.socketId,
          name: userData.name,
          stream: incomingStream,
          isHost: userData.isHost
        }];
      });
    });
    
    peer.on('close', () => {
      removePeer(userData.socketId);
    });
    
    peer.on('error', err => {
      console.error('Peer connection error:', err);
      removePeer(userData.socketId);
    });
    
    peersRef.current.push({
      socketId: userData.socketId,
      userId: userData.userId,
      peer
    });
    
    return peer;
  }, [userInfo, isHost]);

  const removePeer = useCallback((socketId) => {
    const peerObj = peersRef.current.find(p => p.socketId === socketId);
    if (peerObj) {
      peerObj.peer.destroy();
      peerUserIdsRef.current.delete(peerObj.userId);
    }

    peersRef.current = peersRef.current.filter(p => p.socketId !== socketId);
    setPeers(prev => prev.filter(p => p.socketId !== socketId));
  }, []);

  const toggleAudio = useCallback(() => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setMuted(!audioTrack.enabled);
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setVideoOff(!videoTrack.enabled);
    }
  }, []);

  const toggleParticipants = useCallback(() => {
    setShowParticipants(!showParticipants);
    if (!showParticipants) {
      setShowChat(false);
    }
  }, [showParticipants]);

  const leaveMeeting = useCallback(() => {
    if (room && room.meetingId) {
      socket.emit('leave-room', { roomId: room.meetingId });
    }
    cleanupMedia();
    navigate('/auth/dashboard');
    toast.info('You have left the meeting');
  }, [navigate, cleanupMedia, room]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);
      
      socket.emit('screen-share-stopped', { 
        roomId: room.meetingId, 
        userId: userInfo._id 
      });
      
      if (mediaStreamRef.current && userVideoRef.current) {
        userVideoRef.current.srcObject = mediaStreamRef.current;
      }
      
      toast.info('Screen sharing stopped');
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: { cursor: 'always' },
          audio: true 
        });
        
        stream.getVideoTracks()[0].onended = () => {
          if (isScreenSharing) {
            toggleScreenShare();
          }
        };
        
        setScreenStream(stream);
        setIsScreenSharing(true);
        
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
        }
        
        socket.emit('screen-share-started', { 
          roomId: room.meetingId, 
          userId: userInfo._id 
        });
        
        toast.success('Screen sharing started');
      } catch (error) {
        console.error('Error sharing screen:', error);
        toast.error('Failed to share screen: ' + (error.message || 'Unknown error'));
      }
    }
  }, [isScreenSharing, screenStream, room, userInfo, mediaStreamRef]);

  const approveScreenShare = useCallback((userId) => {
    if (!isHost || !room) return;
    
    socket.emit('approve-screen-share', {
      roomId: room.meetingId,
      userId
    });
    
    setScreenShareRequests(prev => prev.filter(r => r.userId !== userId));
    
    toast.success('Screen sharing request approved');
  }, [isHost, room]);
  
  const rejectScreenShare = useCallback((userId) => {
    if (!isHost || !room) return;
    
    socket.emit('reject-screen-share', {
      roomId: room.meetingId,
      userId,
      reason: 'The host rejected your screen sharing request'
    });
    
    setScreenShareRequests(prev => prev.filter(r => r.userId !== userId));
    
    toast.success('Screen sharing request rejected');
  }, [isHost, room]);

  // Define stopRecording first, before it's used in startRecording's dependencies
  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current) return;
    
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    
    if (recordingInterval) {
      clearInterval(recordingInterval);
      setRecordingInterval(null);
    }
    
    setRecordingTime(0);
    toast.success('Recording stopped. Processing...');
  }, [recordingInterval]);
  
  // Now define startRecording which can reference stopRecording
  const startRecording = useCallback(async () => {
    try {
      // Always prioritize screen content for recording
      let streamToRecord = null;
      let isUsingDisplayCapture = false;
      
      // Check for active screen sharing (either by host or participants)
      if (isScreenSharing && screenStream) {
        // If host is sharing screen, record that
        streamToRecord = screenStream;
        toast.info('Recording your screen sharing');
      } else if (activeScreenShare) {
        // If a participant is sharing screen, record their screen
        const sharingPeer = peers.find(p => p.userId === activeScreenShare);
        if (sharingPeer && sharingPeer.stream) {
          streamToRecord = sharingPeer.stream;
          toast.info(`Recording screen shared by ${sharingPeer.name}`);
        }
      } else {
        // If no screen sharing, capture the main meeting view
        try {
          // Try to capture the entire meeting content
          const displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: { 
              displaySurface: "window",
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 30 }
            },
            audio: true
          });
          
          // Make sure we handle when user stops sharing
          displayStream.getVideoTracks()[0].onended = () => {
            if (isRecording) {
              stopRecording();
              toast.info('Recording stopped because screen capture ended');
            }
          };
          
          streamToRecord = displayStream;
          isUsingDisplayCapture = true;
          toast.info('Recording meeting content - please select this meeting window');
        } catch (displayError) {
          console.error('First display capture attempt error:', displayError);
          
          // Try again with simpler options
          try {
            toast.info('Retrying screen capture...');
            const simpleDisplayStream = await navigator.mediaDevices.getDisplayMedia({
              video: true,
              audio: true
            });
            
            simpleDisplayStream.getVideoTracks()[0].onended = () => {
              if (isRecording) {
                stopRecording();
                toast.info('Recording stopped because screen capture ended');
              }
            };
            
            streamToRecord = simpleDisplayStream;
            isUsingDisplayCapture = true;
            toast.info('Recording meeting window - please select this meeting window');
          } catch (retryError) {
            console.error('Retry display capture error:', retryError);
            
            // Fall back to the host's camera as last resort
            if (mediaStreamRef.current) {
              streamToRecord = mediaStreamRef.current;
              toast.warning('Could not capture screen - using camera view for recording');
            } else {
              toast.error('No media available for recording');
              return;
            }
          }
        }
      }
      
      if (!streamToRecord) {
        toast.error('No content available to record');
        return;
      }
      
      // Create a combined stream with video from screen and audio from meeting
      const combinedStream = new MediaStream();
      
      // Add video track from the selected stream
      const videoTracks = streamToRecord.getVideoTracks();
      if (videoTracks.length > 0) {
        combinedStream.addTrack(videoTracks[0]);
      }
      
      // Handle audio appropriately based on recording source
      if (isUsingDisplayCapture) {
        // For display capture, we might get system audio already
        const captureAudioTracks = streamToRecord.getAudioTracks();
        if (captureAudioTracks.length > 0) {
          combinedStream.addTrack(captureAudioTracks[0]);
        }
        
        // Add microphone audio if not muted (this ensures host's voice is included)
        if (mediaStreamRef.current && !muted) {
          const micAudioTracks = mediaStreamRef.current.getAudioTracks();
          if (micAudioTracks.length > 0) {
            // Avoid duplicate tracks from the same device
            if (!captureAudioTracks.some(track => track.id === micAudioTracks[0].id)) {
              combinedStream.addTrack(micAudioTracks[0]);
            }
          }
        }
      } else {
        // For camera or screen share, use the original audio tracks
        const audioTracks = streamToRecord.getAudioTracks();
        audioTracks.forEach(track => {
          combinedStream.addTrack(track);
        });
      }
      
      // Check if we have any tracks to record
      if (combinedStream.getTracks().length === 0) {
        toast.error('No media tracks available for recording');
        return;
      }
      
      // Select the best available format for recording
      let mimeType = '';
      let options = {};
      
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
        mimeType = 'video/webm;codecs=vp9,opus';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        mimeType = 'video/webm;codecs=vp8,opus';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
      }
      
      if (mimeType) {
        options = { mimeType, videoBitsPerSecond: 3000000 }; // 3 Mbps for good quality
      }
      
      // Initialize the MediaRecorder
      const mediaRecorder = new MediaRecorder(combinedStream, options);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        saveRecording();
      };
      
      // Start recording
      mediaRecorder.start(1000);
      setIsRecording(true);
      
      // Setup recording timer
      const interval = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
      
      setRecordingInterval(interval);
      
      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording: ' + (error.message || 'Unknown error'));
    }
  }, [userStream, screenStream, isScreenSharing, activeScreenShare, peers, muted, mediaStreamRef, isRecording, stopRecording]);
  
  const saveRecording = async () => {
    if (!recordedChunksRef.current.length) return;
    
    try {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      
      const downloadUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = `recording-${room.name || 'meeting'}-${new Date().toISOString().replace(/:/g, '-')}.webm`;
      
      toast.info('Saving recording to server...');
      
      const formData = new FormData();
      formData.append('recording', blob, downloadLink.download);
      formData.append('roomId', room.meetingId);
      formData.append('roomName', room.name || 'Meeting');
      
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/rooms/recordings', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.success) {
        toast.success('Recording saved successfully to server!');
        
        toast.info(
          <div>
            <p>Recording also available for direct download</p>
            <button 
              onClick={() => {
                document.body.appendChild(downloadLink);
                downloadLink.click();
                setTimeout(() => {
                  document.body.removeChild(downloadLink);
                  window.URL.revokeObjectURL(downloadUrl);
                }, 100);
              }}
              className="mt-2 bg-blue-500 text-white px-2 py-1 rounded text-sm"
            >
              Download Now
            </button>
          </div>,
          { autoClose: false, closeOnClick: false }
        );
      } else {
        throw new Error('Server upload responded but indicated failure');
      }
      
      recordedChunksRef.current = [];
    } catch (error) {
      console.error('Error saving recording:', error);
      
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `recording-${room.name || 'meeting'}-${new Date().toISOString().replace(/:/g, '-')}.webm`;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast.error('Error uploading to server. Recording downloaded locally instead.');
    }
  };

  const endMeetingForAll = useCallback(() => {
    if (!isHost || !room) {
      toast.error("Only the host can end the meeting for all participants");
      return;
    }
    
    if (window.confirm("Are you sure you want to end the meeting for all participants?")) {
      socket.emit('host-action', { 
        roomId: room.meetingId, 
        action: 'end-meeting',
        hostName: userInfo?.fullName || 'Host'
      });
      
      cleanupMedia();
      
      navigate('/auth/dashboard');
      
      toast.info('You have ended the meeting for all participants');
    }
  }, [isHost, room, userInfo, navigate, cleanupMedia]);

  const raiseHand = useCallback(() => {
    if (!userInfo || !room) return;
    
    setIsRaiseHand(true);
    socket.emit('raise-hand', { 
      roomId: room.meetingId, 
      userId: userInfo._id,
      name: userInfo.fullName || 'Anonymous'
    });
    
    setTimeout(() => {
      setIsRaiseHand(false);
    }, 10000);
    
    toast.info('You raised your hand');
  }, [room, userInfo]);

  const VideoGrid = () => {
    const containerRef = useRef(null);
  
    // Organize participants with host always at the top
    const hostParticipant = userInfo && isHost ? 
      {
        id: userInfo._id,
        name: userInfo?.fullName || 'You (Host)',
        stream: userStream,
        isHost: true,
        isSelf: true,
        isScreenSharing: isScreenSharing
      } : peers.find(p => p.isHost);
      
    const regularParticipants = [
      ...(isHost ? [] : [{
        id: userInfo?._id,
        name: userInfo?.fullName || 'You',
        stream: userStream,
        isHost: false,
        isSelf: true,
        isScreenSharing: isScreenSharing
      }]),
      ...peers.filter(p => !p.isHost)
    ];
    
    // Determine if there's active screen sharing and who's doing it
    const screenSharingPerson = isScreenSharing ? 
      { id: userInfo._id, stream: screenStream, name: userInfo?.fullName || 'You', isSelf: true } : 
      peers.find(p => p.userId === activeScreenShare);
      
    const hasScreenShare = Boolean(isScreenSharing || activeScreenShare);
  
    return (
      <div 
        ref={containerRef}
        className={`video-grid ${hasScreenShare ? 'has-screen-share' : ''}`}
        data-participant-count={1 + peers.length}
      >
        {/* Screen share container */}
        {hasScreenShare && (
          <div className="screen-share-container">
            <div className="video-container screen-share">
              <video
                ref={el => {
                  if (el) {
                    if (isScreenSharing && screenStream) {
                      // If this user is screen sharing, show that stream
                      el.srcObject = screenStream;
                    } else if (activeScreenShare && peers.find(p => p.userId === activeScreenShare)?.stream) {
                      // If another user is screen sharing, show their stream
                      el.srcObject = peers.find(p => p.userId === activeScreenShare)?.stream;
                    }
                    
                    // Ensure autoplay works
                    el.play().catch(err => console.error("Autoplay failed:", err));
                  }
                }}
                autoPlay
                playsInline
                muted={isScreenSharing} // Only mute if it's our own screen share
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-md text-sm flex items-center">
                {isScreenSharing ? userInfo?.fullName || 'You' : peers.find(p => p.userId === activeScreenShare)?.name || 'Unknown'} - Screen Sharing
              </div>
            </div>
          </div>
        )}
        
        {/* Participants container */}
        <div className={hasScreenShare ? "participants-container" : "side-by-side-container"}>
          {/* Always show host first */}
          {hostParticipant && (
            <div 
              key={`host-${hostParticipant.id}`}
              className="video-container host-video"
            >
              <video
                ref={el => {
                  if (el) {
                    // Critical fix: Always show camera for host's video tile
                    if (hostParticipant.isSelf) {
                      // If host is screen sharing, we need to use the original camera stream
                      // not the screen sharing stream for this video element
                      if (isScreenSharing) {
                        // Use the original camera stream stored in mediaStreamRef
                        el.srcObject = mediaStreamRef.current;
                      } else {
                        // If not screen sharing, use the normal user stream
                        el.srcObject = userStream;
                      }
                    } else if (hostParticipant.stream) {
                      el.srcObject = hostParticipant.stream;
                    }
                    
                    // Ensure autoplay works
                    el.play().catch(err => console.error("Autoplay failed:", err));
                  }
                }}
                autoPlay
                playsInline
                muted={hostParticipant.isSelf}
              />
              
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-md text-sm flex items-center">
                {hostParticipant.name}
                <span className="ml-1 bg-blue-600 text-xs px-1 py-0.5 rounded">Host</span>
                {hostParticipant.isSelf && <span className="ml-1 text-blue-300">(You)</span>}
              </div>
            </div>
          )}
          
          {/* Show all other participants */}
          {regularParticipants.map(participant => (
            <div 
              key={participant.id}
              className="video-container"
            >
              <video
                ref={el => {
                  if (el) {
                    if (participant.isSelf) {
                      // If this user is screen sharing, we need to use the original camera stream
                      // for this video element, not the screen sharing stream
                      if (isScreenSharing) {
                        // Use the original camera stream stored in mediaStreamRef
                        el.srcObject = mediaStreamRef.current;
                      } else {
                        // If not screen sharing, use the normal user stream
                        el.srcObject = userStream;
                      }
                    } else if (participant.stream) {
                      el.srcObject = participant.stream;
                    }
                    
                    // Ensure autoplay works
                    el.play().catch(err => console.error("Autoplay failed:", err));
                  }
                }}
                autoPlay
                playsInline
                muted={participant.isSelf}
              />
              
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-md text-sm flex items-center">
                {participant.name}
                {participant.isSelf && <span className="ml-1 text-blue-300">(You)</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-white text-xl">Loading meeting...</div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Room not found</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-blue-50 text-gray-800 overflow-hidden">
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-800">{room?.name || 'Meeting Room'}</h1>
          {isHost && (
            <div className="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">Host</div>
          )}
          <button
            onClick={copyMeetingId}
            className="ml-4 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded flex items-center text-sm"
          >
            <FiCopy className="mr-1" /> {room?.meetingId || 'Loading...'}
          </button>
          {isRecording && (
            <div className="ml-4 flex items-center text-red-600 animate-pulse">
              <FiRadio className="mr-1" /> {formatTime(recordingTime)}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleParticipants}
            className={`flex items-center ${showParticipants ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} px-3 py-1 rounded`}
          >
            <FiUsers className="mr-1" /> {peers.length + 1}
          </button>
          <button
            onClick={leaveMeeting}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded flex items-center"
          >
            <FiPhoneOff className="mr-1" /> Leave
          </button>
          {isHost && (
            <button
              onClick={endMeetingForAll}
              className="bg-red-800 hover:bg-red-900 text-white px-4 py-1 rounded flex items-center"
            >
              <FiX className="mr-1" /> End for all
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className={`flex-1 ${showParticipants || showChat ? 'lg:w-3/4' : 'w-full'} p-4 overflow-auto bg-blue-50`}>
          <VideoGrid />
        </div>

        {showParticipants && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="hidden lg:block w-1/4 bg-white border-l border-gray-200 p-4 overflow-y-auto shadow-lg"
          >
            <h2 className="text-lg font-bold mb-4 flex items-center text-gray-800">
              <FiUsers className="mr-2" /> Participants ({peers.length + 1})
            </h2>
            <ul className="space-y-3">
              <li className="flex items-center justify-between p-2 bg-blue-50 rounded">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3 text-white">
                    {isHost ? <FiShield /> : <FiUser />}
                  </div>
                  <div>
                    <p className="font-medium truncate text-gray-800">{userInfo?.fullName || 'You'} (You)</p>
                    {isHost && <p className="text-xs text-blue-600">Host</p>}
                    {isRaiseHand && <p className="text-xs text-yellow-600">✋ Hand raised</p>}
                  </div>
                </div>
              </li>
              
              {peers.map(peer => (
                <li key={peer.userId} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 ${peer.isHost ? 'bg-blue-500' : 'bg-gray-500'} rounded-full flex items-center justify-center mr-3 text-white`}>
                      {peer.isHost ? <FiShield /> : <FiUser />}
                    </div>
                    <div>
                      <p className="truncate text-gray-800">{peer.name}</p>
                      {peer.isHost && <p className="text-xs text-blue-600">Host</p>}
                      {raisedHands.some(hand => hand.userId === peer.userId) && (
                        <p className="text-xs text-yellow-600">✋ Hand raised</p>
                      )}
                    </div>
                  </div>
                  
                  {isHost && peer.id !== socket.id && (
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => muteParticipant(peer.userId, peer.name)}
                        className="text-gray-600 hover:text-gray-800"
                        title="Mute participant"
                      >
                        <FiMicOff size={16} />
                      </button>
                      <button 
                        onClick={() => removeParticipant(peer.userId, peer.name)}
                        className="text-red-500 hover:text-red-700"
                        title="Remove participant"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {showChat && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="hidden lg:block w-1/4 bg-white border-l border-gray-200 p-4 overflow-y-auto shadow-lg"
          >
            <h2 className="text-lg font-bold mb-4 flex items-center text-gray-800">
              <FiMessageCircle className="mr-2" /> Chat
            </h2>
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto space-y-3">
                {chatMessages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-2 rounded-lg ${
                      msg.senderId === userInfo?._id 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    } ${msg.senderId === userInfo?._id ? 'ml-auto mr-0 max-w-[80%]' : 'ml-0 mr-auto max-w-[80%]'}`}
                  >
                    <p className="text-sm font-medium">
                      {msg.senderName} {msg.senderId === userInfo?._id && <span className="text-xs">(You)</span>}
                    </p>
                    <p className="break-words">{msg.message}</p>
                    <p className={`text-xs ${msg.senderId === userInfo?._id ? 'text-blue-100' : 'text-gray-500'} mt-1`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="mt-4 flex items-center">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                  aria-label="Emoji picker"
                >
                  <FiSmile />
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-16 left-0 z-10">
                    <EmojiPicker onEmojiClick={addEmoji} />
                  </div>
                )}
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  className="ml-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  aria-label="Send message"
                >
                  <FiSend />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="bg-white border-t border-gray-200 p-4 flex justify-center items-center space-x-6 shadow-lg">
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full ${muted ? 'bg-red-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <FiMicOff size={20} /> : <FiMic size={20} />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full ${videoOff ? 'bg-red-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
          title={videoOff ? 'Turn on video' : 'Turn off video'}
        >
          {videoOff ? <FiVideoOff size={20} /> : <FiVideo size={20} />}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-full ${isScreenSharing ? 'bg-green-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          disabled={!isHost && isScreenSharing}
        >
          {isScreenSharing ? <FiStopCircle size={20} /> : <FiMonitor size={20} />}
        </button>

        <button
          onClick={raiseHand}
          className={`p-3 rounded-full ${isRaiseHand ? 'bg-yellow-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
          title={isRaiseHand ? 'Lower hand' : 'Raise hand'}
        >
          <span>✋</span>
        </button>

        {isHost && (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-3 rounded-full ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
            title={isRecording ? 'Stop recording' : 'Start recording'}
          >
            <FiRadio size={20} />
          </button>
        )}

        <button
          onClick={toggleChat}
          className={`p-3 rounded-full ${showChat ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
          title="Chat"
        >
          <FiMessageSquare size={20} />
        </button>

        <button
          onClick={toggleParticipants}
          className={`p-3 rounded-full ${showParticipants ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
          title="Participants"
        >
          <FiUsers size={20} />
        </button>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-3 rounded-full ${showSettings ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
          title="More options"
        >
          <FiMoreVertical size={20} />
        </button>
      </div>

      {showSettings && (
        <div className="absolute bottom-24 right-8 bg-white rounded-lg shadow-lg border border-gray-300 p-4 w-64">
          <h3 className="font-bold mb-2 text-gray-800">Settings</h3>
          <ul className="space-y-2">
            <li>
              <button 
                className="flex items-center text-gray-700 hover:text-blue-600 w-full"
                onClick={() => {
                  setShowSettings(false);
                }}
              >
                Change audio device
              </button>
            </li>
            <li>
              <button 
                className="flex items-center text-gray-700 hover:text-blue-600 w-full"
                onClick={() => {
                  setShowSettings(false);
                }}
              >
                Change video device
              </button>
            </li>
            {isHost && (
              <>
                <li>
                  <button 
                    className="flex items-center text-gray-700 hover:text-blue-600 w-full"
                    onClick={() => {
                      isRecording ? stopRecording() : startRecording();
                      setShowSettings(false);
                    }}
                  >
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                  </button>
                </li>
                <li>
                  <button 
                    className="flex items-center text-red-600 hover:text-red-700 w-full"
                    onClick={endMeetingForAll}
                  >
                    End meeting for all
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RoomId;
