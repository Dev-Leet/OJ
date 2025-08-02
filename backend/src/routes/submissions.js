const express = require('express');
const router = express.Router();
const {
  submitCode,
  getSubmission,
  getUserSubmissions,
  getAllSubmissions,
  getSubmissionStats,
  rejudgeSubmission,
  deleteSubmission
} = require('../controllers/submissionController');
const { protect, authorize, submissionRateLimit, ownerOrAdmin } = require('../middleware/auth');

// @route   POST /api/submissions
// @desc    Submit code for a problem
// @access  Private (with rate limiting)
router.post('/', protect, submissionRateLimit, submitCode);

// @route   GET /api/submissions/stats
// @desc    Get user's submission statistics
// @access  Private
router.get('/stats', protect, getSubmissionStats);

// @route   GET /api/submissions/all
// @desc    Get all submissions (Admin only)
// @access  Private (Admin only)
router.get('/all', protect, authorize('admin'), getAllSubmissions);

// @route   GET /api/submissions
// @desc    Get user's submissions with pagination
// @access  Private
router.get('/', protect, getUserSubmissions);

// @route   GET /api/submissions/:id
// @desc    Get single submission by ID
// @access  Private (owner or admin)
router.get('/:id', protect, ownerOrAdmin('id'), getSubmission);

// @route   POST /api/submissions/:id/rejudge
// @desc    Rejudge a submission
// @access  Private (Admin only)
router.post('/:id/rejudge', protect, authorize('admin'), rejudgeSubmission);

// @route   DELETE /api/submissions/:id
// @desc    Delete a submission
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), deleteSubmission);

module.exports = router;