import React, { useState, useEffect } from 'react';
import ChatbotIcon from './ChatbotIcon';
import ChatbotWindow from './ChatbotWindow';
import { AnimatePresence } from 'framer-motion';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  // Reset the new message indicator when chat is opened
  useEffect(() => {
    if (isOpen) {
      setHasNewMessages(false);
    }
  }, [isOpen]);

  // Toggle chatbot visibility
  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <ChatbotIcon 
        onClick={toggleChatbot} 
        isOpen={isOpen} 
        hasNewMessages={hasNewMessages} 
      />
      <AnimatePresence>
        {isOpen && <ChatbotWindow onClose={() => setIsOpen(false)} />}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;