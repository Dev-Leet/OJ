// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Mongoose schema for the User model.
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['user', 'admin'], // The role can only be 'user' or 'admin'
    default: 'user', // Default role for new users is 'user'
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

/**
 * Mongoose pre-save middleware to hash the password before saving.
 * This function runs automatically before a document is saved to the database.
 */
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate a salt with 10 rounds
    const salt = await bcrypt.genSalt(10);
    // Hash the password with the generated salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema);
