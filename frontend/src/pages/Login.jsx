import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { toast } from 'react-toastify';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        'http://localhost:5000/api/auth/login',
        form,
        { withCredentials: true }
      );

      // Store both token and user data in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast.success('Login successful!');
      navigate('/auth/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-black text-white flex items-center justify-center relative overflow-hidden">
      

      {/* Gradient background blur effect */}
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <div className="absolute w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse top-10 left-10"></div>
        <div className="absolute w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse bottom-10 right-10"></div>
      </div>

      <form
        onSubmit={handleLogin}
        className="z-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 w-full max-w-md shadow-lg transition-all duration-300 hover:shadow-2xl"
      >
        <h2 className="text-3xl font-extrabold text-center mb-6 text-white drop-shadow-sm">
          Login to SkillSphere
        </h2>

        <input
          name="email"
          onChange={handleChange}
          placeholder="Email"
          className="w-full mb-4 px-4 py-3 rounded bg-white/10 text-white placeholder-gray-300 border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />
        <input
          name="password"
          type="password"
          onChange={handleChange}
          placeholder="Password"
          className="w-full mb-2 px-4 py-3 rounded bg-white/10 text-white placeholder-gray-300 border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />

        <div className="text-right mb-4">
          <Link
            to="/auth/forgot-password"
            className="text-sm text-indigo-300 hover:text-indigo-400 transition-all"
          >
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-md transition-all"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        {error && <p className="text-red-500 text-sm mt-2">Error: {error}</p>}

        <p className="text-sm text-center mt-6 text-gray-300">
          Don't have an account?{' '}
          <Link
            to="/auth/signup"
            className="text-indigo-300 hover:underline hover:text-indigo-400"
          >
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
}
