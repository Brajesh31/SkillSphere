const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mentor', // Replace 'Mentor' with the correct model name
  },
});

module.exports = mongoose.model('Session', sessionSchema);