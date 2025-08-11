import React, { useState, useRef, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import ReactMarkdown from 'react-markdown';
import { PaperAirplaneIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';

const ChatbotWindow = ({ onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm SkillSphere AI. I can help with:\n\n- Learning resources\n- Mentorship advice\n- Technical questions\n- Career guidance\n\nHow can I assist you today?",
      sender: 'ai'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: messages.length + 1,
      text: input,
      sender: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data } = await axiosInstance.post('/api/ai/ask', {
        message: input,
        context: 'SkillSphere mentorship platform'
      });

      const aiMessage = {
        id: messages.length + 2,
        text: data.answer,
        sender: 'ai'
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        id: messages.length + 2,
        text: "⚠️ Sorry, I'm having trouble responding right now. Please try again later.",
        sender: 'ai'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  return (
    <motion.div
      className="fixed bottom-24 right-8 w-96 bg-white rounded-xl shadow-2xl overflow-hidden z-40 border border-gray-300"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
          <h3 className="font-bold text-lg">SkillSphere AI</h3>
        </div>
        <button 
          onClick={onClose} 
          className="text-white/80 hover:text-white transition-colors"
          aria-label="Close chat"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
      
      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 bg-white text-gray-800">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              className={`mb-4 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className={`inline-block p-3 rounded-lg max-w-xs ${message.sender === 'user' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-800 border border-gray-200'}`}
              >
                <div className={`prose prose-sm ${message.sender === 'user' ? 'prose-invert' : ''}`}>
                  <ReactMarkdown>
                    {message.text}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div
            className="text-left mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="inline-block p-3 rounded-lg bg-gray-100 border border-gray-200">
              <div className="flex items-center space-x-2">
                <ArrowPathIcon className="h-4 w-4 text-gray-600 animate-spin" />
                <span className="text-gray-600">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <form 
        onSubmit={handleSubmit} 
        className="p-4 border-t border-gray-200 flex bg-white"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything..."
          className="flex-1 bg-gray-50 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 placeholder-gray-500"
          disabled={isLoading}
          autoFocus
        />
        <button
          type="submit"
          className={`bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-r-lg hover:opacity-90 transition-opacity ${(!input.trim() || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!input.trim() || isLoading}
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </form>
    </motion.div>
  );
};

export default ChatbotWindow;