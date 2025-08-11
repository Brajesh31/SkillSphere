import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Chatbot } from './components';

import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';
import RoomId from './pages/RoomId';
import ProfilePage from './pages/ProfilePage';
import ProfileEditor from './components/ProfileEditor';
import Explore from './pages/Explore';
import Connections from './pages/Connections';
import Recordings from './pages/Recordings';

// Wrapper component to conditionally render Chatbot based on route
const ChatbotWrapper = () => {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem('token') !== null;
  const isDashboardPage = location.pathname === '/auth/dashboard';
  
  // Only show Chatbot on dashboard page and when authenticated
  return isAuthenticated && isDashboardPage ? <Chatbot /> : null;
};

function App() {
  const isAuthenticated = localStorage.getItem('token') !== null; // Check for valid JWT token

  return (
    <Router>
      <ChatbotWrapper />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<Signup />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />

        {/* Protected Routes */}
        {isAuthenticated && (
          <>
            <Route path="/auth/dashboard" element={<Dashboard />} />
            <Route path="/create-room" element={<CreateRoom />} />
            <Route path="/join-room" element={<JoinRoom />} />
            <Route path="/room/:id" element={<RoomId />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/profile/:userId/edit" element={<ProfileEditor />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/connections" element={<Connections />} />
            <Route path="/recordings" element={<Recordings />} />
          </>
        )}

        {/* Redirect to login for unknown routes */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;