import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Signup() {
  const [form, setForm] = useState({ fullName: '', username: '', email: '', password: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [activeField, setActiveField] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const sendOtp = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/signup', form);
      setOtpSent(true);
    } catch (err) {
      toast.error("Signup failed: " + err.response?.data?.message || "Try again", {
        position: 'top-center',
        icon: '🚫'
      });
    }
  };

  const verifyAndRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/verify-otp', {
        email: form.email,
        otp: otp,
        fullName: form.fullName,
        username: form.username,
        password: form.password,
      });

      toast.success('Registration successful! Redirecting to login...', {
        position: 'top-center',
        autoClose: 1500,
        icon: '🎉'
      });

      setTimeout(() => {
        navigate('/auth/login');
      }, 1500);
    } catch (err) {
      toast.error("OTP verification failed", {
        position: 'top-center',
        icon: '❌'
      });
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 text-gray-800 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-r from-blue-600 to-cyan-500 transform -skew-y-3 -translate-y-16 z-0"></div>
      
      <Navbar />
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 py-6">
            <h2 className="text-center text-white text-2xl font-bold">
              {otpSent ? "Verify Your Account" : "Create an Account"}
            </h2>
            <p className="text-center text-blue-100 text-sm mt-1">
              {otpSent ? "Check your email for the verification code" : "Join SkillSphere and unlock your potential"}
            </p>
          </div>
          
          <div className="p-8">
            <form onSubmit={otpSent ? verifyAndRegister : sendOtp} className="space-y-6">
              {!otpSent ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <div className={`transition-all duration-300 ${activeField === 'fullName' ? 'transform scale-[1.01]' : ''}`}>
                      <input
                        name="fullName"
                        onChange={handleChange}
                        onFocus={() => setActiveField('fullName')}
                        onBlur={() => setActiveField(null)}
                        placeholder="Enter your full name"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 shadow-sm"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                    <div className={`transition-all duration-300 ${activeField === 'username' ? 'transform scale-[1.01]' : ''}`}>
                      <input
                        name="username"
                        onChange={handleChange}
                        onFocus={() => setActiveField('username')}
                        onBlur={() => setActiveField(null)}
                        placeholder="Choose a unique username"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 shadow-sm"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    <div className={`transition-all duration-300 ${activeField === 'email' ? 'transform scale-[1.01]' : ''}`}>
                      <input
                        name="email"
                        type="email"
                        onChange={handleChange}
                        onFocus={() => setActiveField('email')}
                        onBlur={() => setActiveField(null)}
                        placeholder="Your email address"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 shadow-sm"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                    <div className={`transition-all duration-300 ${activeField === 'password' ? 'transform scale-[1.01]' : ''}`}>
                      <input
                        type="password"
                        name="password"
                        onChange={handleChange}
                        onFocus={() => setActiveField('password')}
                        onBlur={() => setActiveField(null)}
                        placeholder="Create a secure password"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 shadow-sm"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-4">
                  <div className="flex justify-center mb-6">
                    <div className="h-24 w-24 bg-blue-50 rounded-full flex items-center justify-center">
                      <span className="text-4xl">✉️</span>
                    </div>
                  </div>
                  
                  <p className="text-center text-gray-600 mb-6">
                    We've sent a verification code to your email.
                    <br />Please check your inbox and enter the code below.
                  </p>
                  
                  <div className={`transition-all duration-300 ${activeField === 'otp' ? 'transform scale-[1.01]' : ''}`}>
                    <input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      onFocus={() => setActiveField('otp')}
                      onBlur={() => setActiveField(null)}
                      placeholder="Enter verification code"
                      className="w-full px-4 py-3 text-center text-xl tracking-widest font-mono rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 shadow-sm"
                    />
                  </div>
                </div>
              )}
              
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-center transition-all duration-300 transform hover:scale-[1.01] hover:shadow-lg active:scale-[0.99]"
              >
                {otpSent ? "Verify & Complete Registration" : "Create Account"}
              </button>
              
              <div className="text-center mt-6">
                <p className="text-gray-600 text-sm">
                  Already have an account?{" "}
                  <a href="/auth/login" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
                    Sign In
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