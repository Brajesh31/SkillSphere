// 📁 backend/models/Otp.js
import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: String,
  otp: String,
  createdAt: { type: Date, default: Date.now, expires: 300 } // expires in 5 mins
});

const Otp = mongoose.model('Otp', otpSchema);
export default Otp;
