const Problem = require('../models/Problem');
const Submission = require('../models/Submission');

// @desc    Get all problems with pagination and filters
// @route   GET /api/problems
// @access  Public
const getProblems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      difficulty,
      tags,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build filter object
    const filters = { status: 'published' };
    
    if (difficulty) {
      filters.difficulty = difficulty;
    }
    
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      filters.tags = { $in: tagArray };
    }
    
    // Build query
    let query = Problem.find(filters);
    
    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query = query.or([
        { title: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } }
      ]);
    }
    
    // Add sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    query = query.sort(sortOptions);
    
    // Add pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    query = query.skip(skip).limit(parseInt(limit));
    
    // Select fields and populate creator info
    query = query
      .select('-testCases -editorial') // Don't include test cases and editorial in list view
      .populate('createdBy', 'name');
    
    const problems = await query;
    
    // Get total count for pagination
    const totalProblems = await Problem.countDocuments(filters);
    const totalPages = Math.ceil(totalProblems / parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: problems,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProblems,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
    
  } catch (error) {
    console.error('Get problems error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching problems'
    });
  }
};

// @desc    Get single problem by slug
// @route   GET /api/problems/:slug
// @access  Public
const getProblem = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const problem = await Problem.findOne({ slug, status: 'published' })
      .populate('createdBy', 'name')
      .select('-testCases'); // Don't include test cases for security
    
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }
    
    // Get only example test cases for display
    const exampleTestCases = problem.testCases ? problem.getExampleTestCases() : [];
    
    // If user is logged in, get their submission history for this problem
    let userSubmissions = [];
    if (req.user) {
      userSubmissions = await Submission.getUserSubmissions(req.user.id, problem._id, 10);
    }
    
    res.status(200).json({
      success: true,
      data: {
        ...problem.toObject(),
        exampleTestCases,
        userSubmissions
      }
    });
    
  } catch (error) {
    console.error('Get problem error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching problem'
    });
  }
};

// @desc    Create new problem
// @route   POST /api/problems
// @access  Private (Admin only)
const createProblem = async (req, res) => {
  try {
    const {
      title,
      description,
      difficulty,
      tags,
      constraints,
      testCases,
      codeTemplates,
      editorial
    } = req.body;
    
    // Input validation
    if (!title || !description || !difficulty || !testCases || !constraints) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
    
    // Validate test cases
    if (!Array.isArray(testCases) || testCases.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 test cases are required'
      });
    }
    
    // Ensure at least one example test case
    const hasExampleCase = testCases.some(tc => tc.isExample);
    if (!hasExampleCase) {
      return res.status(400).json({
        success: false,
        message: 'At least one test case must be marked as example'
      });
    }
    
    // Create problem
    const problem = await Problem.create({
      title: title.trim(),
      description: description.trim(),
      difficulty,
      tags: tags ? tags.map(tag => tag.trim().toLowerCase()) : [],
      constraints: {
        timeLimit: constraints.timeLimit || 2000,
        memoryLimit: constraints.memoryLimit || 256,
        inputConstraints: constraints.inputConstraints
      },
      testCases,
      codeTemplates: codeTemplates || {},
      editorial: editorial || {},
      createdBy: req.user.id,
      status: 'published'
    });
    
    res.status(201).json({
      success: true,
      message: 'Problem created successfully',
      data: problem
    });
    
  } catch (error) {
    console.error('Create problem error:', error);
    
    // Handle duplicate title error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Problem with this title already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating problem'
    });
  }
};

// @desc    Update problem
// @route   PUT /api/problems/:id
// @access  Private (Admin only)
const updateProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updateFields.createdBy;
    delete updateFields.stats;
    delete updateFields.slug;
    
    const problem = await Problem.findByIdAndUpdate(
      id,
      updateFields,
      {
        new: true,
        runValidators: true
      }
    ).populate('createdBy', 'name');
    
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Problem updated successfully',
      data: problem
    });
    
  } catch (error) {
    console.error('Update problem error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating problem'
    });
  }
};

// @desc    Delete problem
// @route   DELETE /api/problems/:id
// @access  Private (Admin only)
const deleteProblem = async (req, res) => {
  try {
    const { id } = req.params;
    
    const problem = await Problem.findById(id);
    
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }
    
    // Check if there are any submissions for this problem
    const submissionCount = await Submission.countDocuments({ problemId: id });
    
    if (submissionCount > 0) {
      // Instead of deleting, archive the problem
      problem.status = 'archived';
      await problem.save();
      
      return res.status(200).json({
        success: true,
        message: 'Problem archived successfully (has existing submissions)'
      });
    }
    
    // Safe to delete if no submissions exist
    await Problem.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Problem deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete problem error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting problem'
    });
  }
};

// @desc    Get problem statistics
// @route   GET /api/problems/:id/stats
// @access  Private (Admin only)
const getProblemStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const problem = await Problem.findById(id);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }
    
    // Get submission statistics
    const submissionStats = await Submission.getSubmissionStats(null, id);
    
    // Get recent submissions for this problem
    const recentSubmissions = await Submission.find({ problemId: id })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('userId status result.verdict createdAt language');
    
    // Language distribution
    const languageStats = await Submission.aggregate([
      { $match: { problemId: mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: '$language',
          count: { $sum: 1 },
          accepted: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        problemInfo: {
          title: problem.title,
          difficulty: problem.difficulty,
          tags: problem.tags
        },
        submissionStats,
        languageStats,
        recentSubmissions,
        acceptanceRate: problem.acceptanceRate
      }
    });
    
  } catch (error) {
    console.error('Get problem stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching problem statistics'
    });
  }
};

// @desc    Get editorial for a problem
// @route   GET /api/problems/:slug/editorial
// @access  Private (must have solved the problem)
const getEditorial = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const problem = await Problem.findOne({ slug, status: 'published' });
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }
    
    // Check if user has solved this problem
    const acceptedSubmission = await Submission.findOne({
      userId: req.user.id,
      problemId: problem._id,
      status: 'accepted'
    });
    
    if (!acceptedSubmission) {
      return res.status(403).json({
        success: false,
        message: 'You must solve the problem first to view the editorial'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        editorial: problem.editorial,
        problemTitle: problem.title
      }
    });
    
  } catch (error) {
    console.error('Get editorial error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching editorial'
    });
  }
};

// @desc    Get all available tags
// @route   GET /api/problems/tags
// @access  Public
const getAllTags = async (req, res) => {
  try {
    const tags = await Problem.distinct('tags', { status: 'published' });
    
    res.status(200).json({
      success: true,
      data: tags.sort()
    });
    
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tags'
    });
  }
};

module.exports = {
  getProblems,
  getProblem,
  createProblem,
  updateProblem,
  deleteProblem,
  getProblemStats,
  getEditorial,
  getAllTags
};