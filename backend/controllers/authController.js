//backend/controllers/authController.js
import dotenv from "dotenv";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import nodemailer from 'nodemailer';
// Uncomment session import since we're now using it
import session from 'express-session';

dotenv.config();

// 📧 Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// 🔧 Send OTP utility
const sendOtp = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your SkillSphere OTP Code',
    text: `Hello! Your OTP is ${otp}. It is valid for 10 minutes. Welcome to SkillSphere.`,
  });
};

// --------------------------------- //
//              SIGNUP              //
// --------------------------------- //
export const signup = async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      fullName,
      username,
      email,
      password: hashedPassword,
      verified: false,
    });

    await newUser.save();

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.create({ email, otp: otpCode });

    await sendOtp(email, otpCode);

    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: 'Signup failed' });
  }
};

// --------------------------------- //
//            VERIFY OTP            //
// --------------------------------- //
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const validOtp = await Otp.findOne({ email, otp });

    if (!validOtp)
      return res.status(400).json({ message: 'Invalid or expired OTP' });

    await User.updateOne({ email }, { verified: true });
    await Otp.deleteMany({ email });

    res.status(200).json({ message: 'OTP verified. Account activated.' });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ message: 'OTP verification failed' });
  }
};

// --------------------------------- //
//         FORGOT PASSWORD          //
// --------------------------------- //
export const forgotPasswordController = async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findOne({ username, email });

    if (!user)
      return res.status(404).json({ msg: 'User not found with given credentials' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.create({ email, otp });
    
    // Send the OTP to user's email
    await sendOtp(email, otp);

    // Store email in session for later use in resetPasswordController
    if (req.session) {
      req.session.email = email;
      res.json({ msg: 'OTP sent to your email' });
    } else {
      // If session is not available, handle gracefully
      // Store email in a cookie as fallback
      res.cookie('resetEmail', email, { maxAge: 3600000, httpOnly: true });
      res.json({ msg: 'OTP sent to your email. Please use it within 10 minutes.' });
    }
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ msg: 'Failed to send OTP' });
  }
};

// --------------------------------- //
//         RESET PASSWORD           //
// --------------------------------- //
export const resetPasswordController = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    
    // Try to get email from session first
    let email = req.session?.email;
    
    // If not in session, try to get from cookie (our fallback)
    if (!email && req.cookies?.resetEmail) {
      email = req.cookies.resetEmail;
    }

    if (!email) {
      return res.status(400).json({ msg: 'Email not found in session. Please try the forgot password process again.' });
    }

    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ msg: 'Invalid or expired OTP.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ email }, { password: hashedPassword });
    await Otp.deleteMany({ email });

    // Clear session and cookie
    if (req.session) {
      req.session.email = null;
    }
    if (req.cookies?.resetEmail) {
      res.clearCookie('resetEmail');
    }

    res.json({ msg: 'Password updated successfully.' });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ msg: 'Failed to reset password.' });
  }
};

// --------------------------------- //
//             LOGIN                //
// --------------------------------- //
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if database is connected
    if (!global.dbConnected) {
      // Development mode fallback authentication
      console.log('Using fallback authentication (no database)');
      
      // Test credentials for development
      if (email === 'test@test.com' && password === 'test123') {
        // Generate a proper ObjectId for development
        const devUserId = new mongoose.Types.ObjectId();
        
        const token = jwt.sign(
          { id: devUserId.toString(), email: 'test@test.com' },
          process.env.JWT_SECRET,
          { expiresIn: '1d' }
        );

        const userData = {
          _id: devUserId.toString(),
          fullName: 'Test User',
          username: 'testuser',
          email: 'test@test.com',
          role: 'user'
        };

        return res.status(200).json({ 
          message: "Login successful (development mode)", 
          token,
          user: userData
        });
      } else {
        return res.status(401).json({ 
          message: "Development mode: Use test@test.com / test123" 
        });
      }
    }

    // Normal database authentication
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Invalid email" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    if (!user.verified) {
      return res.status(403).json({ message: "Please verify your email before logging in." });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Create user data object without sensitive information
    const userData = {
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      role: user.role
    };

    res.status(200).json({ 
      message: "Login successful", 
      token,
      user: userData
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
};

// -------------------- DASHBOARD --------------------
export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user?._id; // Use JWT-based user ID
    if (!userId) return res.status(401).json({ msg: "Unauthorized: No token" });

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ msg: "Failed to fetch dashboard data" });
  }
};

// --------------------------------- //
//             LOGOUT               //
// --------------------------------- //
// Updated logout function for JWT authentication
export const logout = (req, res) => {
  // For JWT-based authentication, server-side logout is minimal
  // The client is responsible for removing the token from storage
  
  // Just send a success response
  res.status(200).json({ message: "Logged out successfully." });
};

