const mongoose = require('mongoose');

// Test case schema for individual test cases within a problem
const testCaseSchema = new mongoose.Schema({
  input: {
    type: String,
    required: true
  },
  output: {
    type: String,
    required: true
  },
  // Flag to distinguish between example cases (shown to users) and hidden cases
  isExample: {
    type: Boolean,
    default: false
  },
  // Optional explanation for example test cases
  explanation: {
    type: String
  }
});

// Main problem schema
const problemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Problem title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Problem description is required']
  },
  // Detailed problem constraints and requirements
  constraints: {
    timeLimit: {
      type: Number,
      required: true,
      default: 2000, // milliseconds
      min: [100, 'Time limit must be at least 100ms'],
      max: [10000, 'Time limit cannot exceed 10 seconds']
    },
    memoryLimit: {
      type: Number,
      required: true,
      default: 256, // MB
      min: [64, 'Memory limit must be at least 64MB'],
      max: [1024, 'Memory limit cannot exceed 1GB']
    },
    // Input constraints as descriptive text
    inputConstraints: {
      type: String,
      required: true
    }
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  // Tags help users filter and search problems
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  // Test cases array using the testCase schema
  testCases: {
    type: [testCaseSchema],
    required: true,
    validate: {
      validator: function(testCases) {
        // Ensure at least one example and one hidden test case
        const exampleCases = testCases.filter(tc => tc.isExample);
        const hiddenCases = testCases.filter(tc => !tc.isExample);
        return exampleCases.length >= 1 && hiddenCases.length >= 1;
      },
      message: 'Problem must have at least 1 example test case and 1 hidden test case'
    }
  },
  // Who created this problem (reference to User model)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Problem statistics for analytics
  stats: {
    totalSubmissions: {
      type: Number,
      default: 0
    },
    acceptedSubmissions: {
      type: Number,
      default: 0
    },
    // Track submissions by difficulty for analytics
    submissionsByLanguage: {
      cpp: { type: Number, default: 0 },
      java: { type: Number, default: 0 },
      python: { type: Number, default: 0 },
      javascript: { type: Number, default: 0 }
    }
  },
  // Code templates for different languages (optional starter code)
  codeTemplates: {
    cpp: {
      type: String,
      default: '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}'
    },
    java: {
      type: String,
      default: 'import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Your code here\n    }\n}'
    },
    python: {
      type: String,
      default: '# Your code here\n'
    },
    javascript: {
      type: String,
      default: '// Your code here\nconst readline = require(\'readline\');\nconst rl = readline.createInterface({\n    input: process.stdin,\n    output: process.stdout\n});\n'
    }
  },
  // Status of the problem
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  // Editorial/solution explanation (optional, only visible after solving)
  editorial: {
    explanation: String,
    solutionCode: {
      cpp: String,
      java: String,
      python: String,
      javascript: String
    },
    timeComplexity: String,
    spaceComplexity: String
  }
}, {
  timestamps: true
});

// Pre-save middleware to generate slug from title
problemSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    // Create URL-friendly slug from title
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .trim();
  }
  next();
});

// Virtual field to get acceptance rate
problemSchema.virtual('acceptanceRate').get(function() {
  if (this.stats.totalSubmissions === 0) return 0;
  return ((this.stats.acceptedSubmissions / this.stats.totalSubmissions) * 100).toFixed(2);
});

// Instance method to get example test cases (visible to users)
problemSchema.methods.getExampleTestCases = function() {
  return this.testCases.filter(testCase => testCase.isExample);
};

// Instance method to get hidden test cases (for judging)
problemSchema.methods.getHiddenTestCases = function() {
  return this.testCases.filter(testCase => !testCase.isExample);
};

// Instance method to get all test cases (admin only)
problemSchema.methods.getAllTestCases = function() {
  return this.testCases;
};

// Static method to find published problems with pagination
problemSchema.statics.findPublished = function(page = 1, limit = 10, filters = {}) {
  const query = { status: 'published', ...filters };
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .select('-testCases') // Don't include test cases in list view
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to search problems by title or tags
problemSchema.statics.searchProblems = function(searchTerm, filters = {}) {
  const searchRegex = new RegExp(searchTerm, 'i');
  const query = {
    status: 'published',
    $or: [
      { title: searchRegex },
      { tags: { $in: [searchRegex] } }
    ],
    ...filters
  };
  
  return this.find(query)
    .select('-testCases')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });
};

// Add indexes for better query performance
problemSchema.index({ status: 1, createdAt: -1 });
problemSchema.index({ slug: 1 });
problemSchema.index({ title: 'text', tags: 'text' }); // Text search index
problemSchema.index({ difficulty: 1, status: 1 });
problemSchema.index({ tags: 1, status: 1 });

// Ensure virtual fields are included when converting to JSON
problemSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Problem', problemSchema);