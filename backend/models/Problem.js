// backend/models/Problem.js
const mongoose = require('mongoose');

/**
 * Mongoose sub-schema for individual test cases.
 * Each test case has an input and its corresponding expected output.
 */
const testCaseSchema = new mongoose.Schema({
  input: {
    type: String,
    required: [true, 'Test case input is required'],
  },
  output: {
    type: String,
    required: [true, 'Test case output is required'],
  },
});

/**
 * Mongoose schema for the Problem model.
 */
const problemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Problem title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Problem description is required'],
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: [true, 'Problem difficulty is required'],
  },
  tags: {
    type: [String], // An array of strings for tags like "Arrays", "DP", etc.
    default: [],
  },
  constraints: {
    type: String,
    required: [true, 'Problem constraints are required'],
  },
  testCases: {
    type: [testCaseSchema], // An array of test cases using the sub-schema
    validate: [v => Array.isArray(v) && v.length > 0, 'At least one test case is required.'],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the User who created the problem
    required: true,
    ref: 'User', // Links this field to the User model
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Problem', problemSchema);
