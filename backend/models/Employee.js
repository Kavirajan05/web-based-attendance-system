const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true, // Allows multiple null values
    trim: true,
    lowercase: true
  },
  department: {
    type: String,
    required: false,
    trim: true
  },
  position: {
    type: String,
    required: false,
    trim: true
  },
  photo: {
    type: String, // Base64 encoded image or file path
    required: true
  },
  photoPath: {
    type: String, // File system path to photo
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  lastAttendance: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster searches
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ name: 1 });
employeeSchema.index({ isActive: 1 });

module.exports = mongoose.model('Employee', employeeSchema);