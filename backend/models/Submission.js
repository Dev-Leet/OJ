// backend/models/Submission.js
const mongoose = require('mongoose');

/**
 * Mongoose schema for the Submission model.
 */
const submissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Links this field to the User model
    required: [true, 'User ID is required'],
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem', // Links this field to the Problem model
    required: [true, 'Problem ID is required'],
  },
  language: {
    type: String,
    required: [true, 'Programming language is required'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Code is required'],
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Runtime Error'],
    default: 'Pending',
  },
  resultDetails: {
    runtime: {
      type: Number, // Execution time in milliseconds
    },
    memory: {
      type: Number, // Memory usage in KB
    },
    output: {
      type: String, // The actual output from the user's code
    },
    error: {
      type: String, // Any error message from compilation or runtime
    },
    testCase: { // Details of the failed test case, if applicable
        input: String,
        expectedOutput: String,
    },
    actualOutput: {
        type: String,
    }
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Submission', submissionSchema);
