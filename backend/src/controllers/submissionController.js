const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const User = require('../models/User');
const judgeService = require('../services/judgeService');
const aiService = require('../services/aiService');

// @desc    Submit code for a problem
// @route   POST /api/submissions
// @access  Private
const submitCode = async (req, res) => {
  try {
    const { problemId, language, code } = req.body;
    const userId = req.user.id;
    
    // Input validation
    if (!problemId || !language || !code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide problem ID, language, and code'
      });
    }
    
    // Validate language
    const supportedLanguages = ['cpp', 'java', 'python', 'javascript'];
    if (!supportedLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported programming language'
      });
    }
    
    // Check if problem exists and is published
    const problem = await Problem.findById(problemId);
    if (!problem || problem.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Problem not found or not available'
      });
    }
    
    // Rate limiting: Check if user has submitted too many times recently
    const recentSubmissions = await Submission.countDocuments({
      userId,
      createdAt: { $gte: new Date(Date.now() - 60000) } // Last 1 minute
    });
    
    if (recentSubmissions >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Too many submissions. Please wait a minute before submitting again.'
      });
    }
    
    // Create submission record
    const submission = await Submission.create({
      userId,
      problemId,
      language,
      code: code.trim(),
      status: 'pending',
      result: {
        verdict: 'Pending',
        totalTestCases: problem.testCases.length
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });
    
    // Update problem and user statistics
    await Promise.all([
      Problem.findByIdAndUpdate(problemId, {
        $inc: {
          'stats.totalSubmissions': 1,
          [`stats.submissionsByLanguage.${language}`]: 1
        }
      }),
      User.findByIdAndUpdate(userId, {
        $inc: { 'stats.totalSubmissions': 1 }
      })
    ]);
    
    // Send response immediately to user
    res.status(201).json({
      success: true,
      message: 'Code submitted successfully',
      data: {
        submissionId: submission._id,
        status: submission.status,
        verdict: submission.result.verdict
      }
    });
    
    // Process submission asynchronously
    processSubmissionAsync(submission._id, problem);
    
  } catch (error) {
    console.error('Submit code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting code'
    });
  }
};

// Async function to process submission in the background
const processSubmissionAsync = async (submissionId, problem) => {
  try {
    // Update submission status to judging
    await Submission.findByIdAndUpdate(submissionId, {
      status: 'judging',
      'result.verdict': 'Judging'
    });
    
    const submission = await Submission.findById(submissionId);
    
    // Execute code using judge service
    const judgeStartTime = Date.now();
    const judgeResult = await judgeService.executeCode({
      code: submission.code,
      language: submission.language,
      testCases: problem.testCases,
      constraints: problem.constraints
    });
    const judgeProcessingTime = Date.now() - judgeStartTime;
    
    // Process judge result and update submission
    const finalResult = await updateSubmissionResult(
      submissionId,
      judgeResult,
      judgeProcessingTime
    );
    
    // Update user and problem statistics if accepted
    if (finalResult.status === 'accepted') {
      await updateAcceptedSubmissionStats(submission.userId, submission.problemId, problem.difficulty);
    }
    
    // Generate AI analysis asynchronously (don't wait for this)
    generateAIAnalysis(submissionId, submission.code, submission.language);
    
  } catch (error) {
    console.error('Process submission error:', error);
    
    // Update submission with error status
    await Submission.findByIdAndUpdate(submissionId, {
      status: 'runtime_error',
      'result.verdict': 'Runtime Error',
      'result.runtimeError': 'Internal server error during execution'
    });
  }
};

// Helper function to update submission result based on judge output
const updateSubmissionResult = async (submissionId, judgeResult, processingTime) => {
  try {
    const updateData = {
      status: judgeResult.status,
      'result.verdict': judgeResult.verdict,
      'result.totalExecutionTime': judgeResult.totalExecutionTime,
      'result.maxMemoryUsed': judgeResult.maxMemoryUsed,
      'result.passedTestCases': judgeResult.passedTestCases,
      'result.testCaseResults': judgeResult.testCaseResults,
      'metadata.judgeProcessingTime': processingTime
    };
    
    // Add specific error messages based on result type
    if (judgeResult.compilationError) {
      updateData['result.compilationError'] = judgeResult.compilationError;
    }
    
    if (judgeResult.runtimeError) {
      updateData['result.runtimeError'] = judgeResult.runtimeError;
    }
    
    const updatedSubmission = await Submission.findByIdAndUpdate(
      submissionId,
      updateData,
      { new: true }
    );
    
    return updatedSubmission;
  } catch (error) {
    console.error('Update submission result error:', error);
    throw error;
  }
};

// Helper function to update statistics for accepted submissions
const updateAcceptedSubmissionStats = async (userId, problemId, difficulty) => {
  try {
    // Check if user has already solved this problem
    const previousAcceptedSubmission = await Submission.findOne({
      userId,
      problemId,
      status: 'accepted',
      createdAt: { $lt: new Date() }
    });
    
    // Only update stats if this is the first accepted submission for this problem
    if (!previousAcceptedSubmission) {
      const difficultyField = `stats.${difficulty}Problems`;
      
      await Promise.all([
        // Update user statistics
        User.findByIdAndUpdate(userId, {
          $inc: {
            'stats.problemsSolved': 1,
            'stats.acceptedSubmissions': 1,
            [difficultyField]: 1
          }
        }),
        // Update problem statistics
        Problem.findByIdAndUpdate(problemId, {
          $inc: { 'stats.acceptedSubmissions': 1 }
        })
      ]);
    } else {
      // Just increment accepted submissions count
      await User.findByIdAndUpdate(userId, {
        $inc: { 'stats.acceptedSubmissions': 1 }
      });
    }
  } catch (error) {
    console.error('Update accepted submission stats error:', error);
  }
};

// Helper function to generate AI analysis
const generateAIAnalysis = async (submissionId, code, language) => {
  try {
    const analysis = await aiService.analyzeCode(code, language);
    
    await Submission.findByIdAndUpdate(submissionId, {
      'aiAnalysis.timeComplexity': analysis.timeComplexity,
      'aiAnalysis.spaceComplexity': analysis.spaceComplexity,
      'aiAnalysis.codeQuality': analysis.codeQuality,
      'aiAnalysis.suggestions': analysis.suggestions,
      'aiAnalysis.analysisCompleted': true
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    // Don't fail the submission if AI analysis fails
    await Submission.findByIdAndUpdate(submissionId, {
      'aiAnalysis.analysisCompleted': false
    });
  }
};

// @desc    Get submission status
// @route   GET /api/submissions/:id
// @access  Private
const getSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    
    const submission = await Submission.findById(id)
      .populate('problemId', 'title slug difficulty')
      .populate('userId', 'name');
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }
    
    // Check if user owns this submission or is admin
    if (submission.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.status(200).json({
      success: true,
      data: submission
    });
    
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching submission'
    });
  }
};

// @desc    Get user's submissions with pagination
// @route   GET /api/submissions
// @access  Private
const getUserSubmissions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      problemId,
      status,
      language
    } = req.query;
    
    // Build filter
    const filter = { userId: req.user.id };
    
    if (problemId) filter.problemId = problemId;
    if (status) filter.status = status;
    if (language) filter.language = language;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get submissions
    const submissions = await Submission.find(filter)
      .populate('problemId', 'title slug difficulty')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-code -result.testCaseResults'); // Exclude code and detailed results for performance
    
    // Get total count
    const totalSubmissions = await Submission.countDocuments(filter);
    const totalPages = Math.ceil(totalSubmissions / parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: submissions,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalSubmissions,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
    
  } catch (error) {
    console.error('Get user submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching submissions'
    });
  }
};

// @desc    Get all submissions (Admin only)
// @route   GET /api/submissions/all
// @access  Private (Admin only)
const getAllSubmissions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      language,
      problemId,
      userId
    } = req.query;
    
    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (language) filter.language = language;
    if (problemId) filter.problemId = problemId;
    if (userId) filter.userId = userId;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get submissions
    const submissions = await Submission.find(filter)
      .populate('userId', 'name email')
      .populate('problemId', 'title slug difficulty')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-code -result.testCaseResults');
    
    // Get total count
    const totalSubmissions = await Submission.countDocuments(filter);
    const totalPages = Math.ceil(totalSubmissions / parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: submissions,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalSubmissions,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
    
  } catch (error) {
    console.error('Get all submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching submissions'
    });
  }
};

// @desc    Get submission statistics
// @route   GET /api/submissions/stats
// @access  Private
const getSubmissionStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get overall stats
    const overallStats = await Submission.getSubmissionStats(userId);
    
    // Get language-wise stats
    const languageStats = await Submission.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$language',
          totalSubmissions: { $sum: 1 },
          acceptedSubmissions: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
          averageScore: { $avg: '$result.score' }
        }
      }
    ]);
    
    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentActivity = await Submission.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          submissions: { $sum: 1 },
          accepted: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    // Get difficulty-wise stats
    const difficultyStats = await Submission.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'problems',
          localField: 'problemId',
          foreignField: '_id',
          as: 'problem'
        }
      },
      { $unwind: '$problem' },
      {
        $group: {
          _id: '$problem.difficulty',
          totalAttempts: { $sum: 1 },
          solved: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        overall: overallStats,
        byLanguage: languageStats,
        recentActivity,
        byDifficulty: difficultyStats
      }
    });
    
  } catch (error) {
    console.error('Get submission stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching submission statistics'
    });
  }
};

// @desc    Rejudge submission (Admin only)
// @route   POST /api/submissions/:id/rejudge
// @access  Private (Admin only)
const rejudgeSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    
    const submission = await Submission.findById(id).populate('problemId');
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }
    
    // Reset submission status
    submission.status = 'pending';
    submission.result.verdict = 'Pending';
    submission.result.passedTestCases = 0;
    submission.result.totalExecutionTime = 0;
    submission.result.maxMemoryUsed = 0;
    submission.result.testCaseResults = [];
    submission.result.compilationError = undefined;
    submission.result.runtimeError = undefined;
    await submission.save();
    
    // Process submission again
    processSubmissionAsync(submission._id, submission.problemId);
    
    res.status(200).json({
      success: true,
      message: 'Submission queued for rejudging',
      data: {
        submissionId: submission._id,
        status: 'pending'
      }
    });
    
  } catch (error) {
    console.error('Rejudge submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejudging submission'
    });
  }
};

// @desc    Delete submission (Admin only)
// @route   DELETE /api/submissions/:id
// @access  Private (Admin only)
const deleteSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    
    const submission = await Submission.findById(id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }
    
    await Submission.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Submission deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting submission'
    });
  }
};

module.exports = {
  submitCode,
  getSubmission,
  getUserSubmissions,
  getAllSubmissions,
  getSubmissionStats,
  rejudgeSubmission,
  deleteSubmission
};