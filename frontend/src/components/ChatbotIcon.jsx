import React from 'react';
import { motion } from 'framer-motion';
import { ChatBubbleLeftRightIcon, XMarkIcon } from '@heroicons/react/24/solid';

const ChatbotIcon = ({ onClick, isOpen, hasNewMessages }) => {
  return (
    <motion.div
      className="fixed bottom-8 right-8 z-50"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 500 }}
    >
      <button
        onClick={onClick}
        className={`p-4 rounded-full shadow-lg ${isOpen ? 'bg-red-500' : 'bg-gradient-to-r from-indigo-600 to-purple-600'} text-white relative overflow-hidden`}
        aria-label="AI Chatbot"
      >
        {isOpen ? (
          <XMarkIcon className="h-8 w-8" />
        ) : (
          <>
            <ChatBubbleLeftRightIcon className="h-8 w-8 relative z-10" />
            <div className="absolute inset-0 rounded-full bg-white opacity-10 animate-pulse"></div>
            <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-[spin_10s_linear_infinite]"></div>
          </>
        )}
        
        {hasNewMessages && !isOpen && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>
    </motion.div>
  );
};

export default ChatbotIcon;