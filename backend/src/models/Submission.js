const mongoose = require('mongoose');

// Schema for individual test case results
const testCaseResultSchema = new mongoose.Schema({
  // Reference to the specific test case
  testCaseId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  // Whether this test case passed or failed
  passed: {
    type: Boolean,
    required: true
  },
  // The actual output produced by the user's code
  actualOutput: {
    type: String,
    required: true
  },
  // Expected output for comparison
  expectedOutput: {
    type: String,
    required: true
  },
  // Execution time for this specific test case (in milliseconds)
  executionTime: {
    type: Number,
    required: true
  },
  // Memory used for this test case (in bytes)
  memoryUsed: {
    type: Number,
    required: true
  },
  // Any error message if the test case failed
  errorMessage: {
    type: String
  }
});

// Main submission schema - represents each code submission by a user
const submissionSchema = new mongoose.Schema({
  // Reference to the user who made the submission
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Index for faster queries by user
  },
  // Reference to the problem being solved
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true,
    index: true // Index for faster queries by problem
  },
  // Programming language used for the submission
  language: {
    type: String,
    enum: ['cpp', 'java', 'python', 'javascript'],
    required: true
  },
  // The actual code submitted by the user
  code: {
    type: String,
    required: true,
    maxlength: [10000, 'Code cannot exceed 10000 characters']
  },
  // Overall status of the submission
  status: {
    type: String,
    enum: [
      'pending',    // Submission received, waiting to be judged
      'judging',    // Currently being evaluated
      'accepted',   // All test cases passed
      'wrong_answer', // One or more test cases failed with incorrect output
      'time_limit_exceeded', // Code took too long to execute
      'memory_limit_exceeded', // Code used too much memory
      'runtime_error', // Code crashed during execution
      'compilation_error' // Code failed to compile
    ],
    default: 'pending'
  },
  // Detailed results from the judge engine
  result: {
    // Overall verdict - more detailed than status
    verdict: {
      type: String,
      enum: [
        'Accepted',
        'Wrong Answer',
        'Time Limit Exceeded',
        'Memory Limit Exceeded',
        'Runtime Error',
        'Compilation Error',
        'Judging',
        'Pending'
      ],
      default: 'Pending'
    },
    // Total execution time across all test cases
    totalExecutionTime: {
      type: Number,
      default: 0
    },
    // Maximum memory used across all test cases
    maxMemoryUsed: {
      type: Number,
      default: 0
    },
    // Number of test cases that passed
    passedTestCases: {
      type: Number,
      default: 0
    },
    // Total number of test cases
    totalTestCases: {
      type: Number,
      default: 0
    },
    // Compilation error message (if applicable)
    compilationError: {
      type: String
    },
    // Runtime error message (if applicable)
    runtimeError: {
      type: String
    },
    // Detailed results for each test case (not always stored for performance)
    testCaseResults: [testCaseResultSchema],
    // Score based on number of test cases passed (useful for partial scoring)
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  // AI-generated analysis of the code (using Google AI Studio)
  aiAnalysis: {
    timeComplexity: {
      type: String
    },
    spaceComplexity: {
      type: String
    },
    codeQuality: {
      type: String
    },
    suggestions: [{
      type: String
    }],
    // Whether AI analysis has been completed
    analysisCompleted: {
      type: Boolean,
      default: false
    }
  },
  // Metadata for tracking and debugging
  metadata: {
    // IP address of the user (for rate limiting and fraud detection)
    ipAddress: String,
    // User agent string
    userAgent: String,
    // Judge server that processed this submission
    judgeServerId: String,
    // Time taken by the judge to process the submission
    judgeProcessingTime: Number
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Pre-save middleware to calculate score based on test case results
submissionSchema.pre('save', function(next) {
  if (this.result.totalTestCases > 0) {
    this.result.score = Math.round((this.result.passedTestCases / this.result.totalTestCases) * 100);
  }
  next();
});

// Instance method to check if submission is accepted
submissionSchema.methods.isAccepted = function() {
  return this.status === 'accepted' && this.result.verdict === 'Accepted';
};

// Instance method to get execution summary
submissionSchema.methods.getExecutionSummary = function() {
  return {
    status: this.status,
    verdict: this.result.verdict,
    executionTime: this.result.totalExecutionTime,
    memoryUsed: this.result.maxMemoryUsed,
    score: this.result.score,
    passedTests: `${this.result.passedTestCases}/${this.result.totalTestCases}`
  };
};

// Instance method to get user-friendly status message
submissionSchema.methods.getStatusMessage = function() {
  const statusMessages = {
    'pending': 'Your submission is in queue...',
    'judging': 'Evaluating your code...',
    'accepted': 'Congratulations! All test cases passed.',
    'wrong_answer': `Wrong answer on test case ${this.result.passedTestCases + 1}`,
    'time_limit_exceeded': 'Your code exceeded the time limit.',
    'memory_limit_exceeded': 'Your code used too much memory.',
    'runtime_error': 'Your code crashed during execution.',
    'compilation_error': 'Your code failed to compile.'
  };
  
  return statusMessages[this.status] || 'Unknown status';
};

// Static method to get user's submission history for a problem
submissionSchema.statics.getUserSubmissions = function(userId, problemId = null, limit = 50) {
  const query = { userId };
  if (problemId) query.problemId = problemId;
  
  return this.find(query)
    .populate('problemId', 'title slug difficulty')
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-code -result.testCaseResults'); // Exclude code and detailed results for performance
};

// Static method to get recent submissions (for admin monitoring)
submissionSchema.statics.getRecentSubmissions = function(limit = 100) {
  return this.find()
    .populate('userId', 'name email')
    .populate('problemId', 'title slug')
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-code -result.testCaseResults');
};

// Static method to get submission statistics
submissionSchema.statics.getSubmissionStats = async function(userId = null, problemId = null) {
  const matchQuery = {};
  if (userId) matchQuery.userId = mongoose.Types.ObjectId(userId);
  if (problemId) matchQuery.problemId = mongoose.Types.ObjectId(problemId);
  
  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalSubmissions: { $sum: 1 },
        acceptedSubmissions: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
        averageScore: { $avg: '$result.score' },
        languageDistribution: {
          $push: '$language'
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalSubmissions: 0,
    acceptedSubmissions: 0,
    averageScore: 0,
    languageDistribution: []
  };
};

// Create compound indexes for efficient queries
submissionSchema.index({ userId: 1, createdAt: -1 });
submissionSchema.index({ problemId: 1, status: 1 });
submissionSchema.index({ status: 1, createdAt: -1 });
submissionSchema.index({ userId: 1, problemId: 1, createdAt: -1 });

// Create a TTL (Time To Live) index for old submissions (optional cleanup)
// This will automatically delete submissions older than 1 year
submissionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

module.exports = mongoose.model('Submission', submissionSchema);