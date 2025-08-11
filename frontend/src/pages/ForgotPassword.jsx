import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from '../components/Navbar';

export default function ForgotPassword() {
  const [form, setForm] = useState({ username: '', email: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(
        'http://localhost:5000/api/auth/forgot-password',
        form,
        { withCredentials: true }
      );
      toast.success("OTP sent successfully!", {
        position: 'top-center',
        icon: '✉️'
      });
      setTimeout(() => {
        navigate('/auth/reset-password');
      }, 1500);
    } catch (err) {
      toast.error("User not found or an error occurred", {
        position: 'top-center',
        icon: '❌'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 text-gray-800 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-r from-indigo-600 to-blue-500 transform -skew-y-3 -translate-y-16 z-0"></div>
      
      <Navbar />
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-500 py-6">
            <div className="flex justify-center mb-2">
              <div className="h-16 w-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                <span className="text-white text-2xl">🔐</span>
              </div>
            </div>
            <h2 className="text-center text-white text-2xl font-bold">
              Reset Your Password
            </h2>
            <p className="text-center text-indigo-100 text-sm mt-1">
              Enter your account details to receive an OTP
            </p>
          </div>
          
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <input
                    name="username"
                    onChange={handleChange}
                    placeholder="Enter your username"
                    className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 shadow-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </span>
                  <input
                    name="email"
                    type="email"
                    onChange={handleChange}
                    placeholder="Enter your email address"
                    className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 shadow-sm"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-semibold text-center transition-all duration-300 transform hover:scale-[1.01] hover:shadow-lg active:scale-[0.99] disabled:opacity-70 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  "Send Verification Code"
                )}
              </button>
              
              <div className="text-center mt-6">
                <p className="text-gray-600 text-sm">
                  Remember your password?{" "}
                  <a href="/auth/login" className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                    Back to login
                  </a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <ToastContainer theme="light" />
    </div>
  );
}