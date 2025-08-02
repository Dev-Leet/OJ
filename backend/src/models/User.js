const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User schema defines the structure of user documents in MongoDB
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // This ensures password is not returned in queries by default
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  // User statistics for the dashboard
  stats: {
    problemsSolved: {
      type: Number,
      default: 0
    },
    totalSubmissions: {
      type: Number,
      default: 0
    },
    acceptedSubmissions: {
      type: Number,
      default: 0
    },
    // Track difficulty-wise problem solving
    easyProblems: {
      type: Number,
      default: 0
    },
    mediumProblems: {
      type: Number,
      default: 0
    },
    hardProblems: {
      type: Number,
      default: 0
    }
  },
  // Track user's preferred programming languages
  preferredLanguages: [{
    type: String,
    enum: ['cpp', 'java', 'python', 'javascript']
  }],
  // User profile information
  profile: {
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    university: String,
    year: Number,
    linkedinUrl: String,
    githubUrl: String
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Pre-save middleware to hash password before saving to database
// This ensures passwords are never stored in plain text
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check if provided password matches the stored password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // Since password field has select: false, we need to explicitly get it
    if (!this.password) {
      const user = await mongoose.model('User').findById(this._id).select('+password');
      return await bcrypt.compare(candidatePassword, user.password);
    }
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Instance method to get user's success rate
userSchema.methods.getSuccessRate = function() {
  if (this.stats.totalSubmissions === 0) return 0;
  return ((this.stats.acceptedSubmissions / this.stats.totalSubmissions) * 100).toFixed(2);
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Add index on email for faster queries
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);