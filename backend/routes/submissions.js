// backend/routes/submissions.js
const express = require('express');
const router = express.Router();
const {
  createSubmission,
  getSubmissions,
  getSubmissionById,
  analyzeCode,
} = require('../controllers/submissionController');
const { protect } = require('../middleware/authMiddleware');

// --- Protected Routes ---
// The 'protect' middleware is applied to all routes in this file.
// It ensures that a user must be logged in to access any of these endpoints.

/**
 * @route   POST /api/submissions
 * @desc    Create a new code submission and evaluate it
 * @access  Private
 */
router.post('/', protect, createSubmission);

/**
 * @route   GET /api/submissions
 * @desc    Get all submissions for the currently logged-in user
 * @access  Private
 */
router.get('/', protect, getSubmissions);

/**
 * @route   POST /api/submissions/analyze
 * @desc    Analyze code for complexity and quality using AI
 * @access  Private
 */
router.post('/analyze', protect, analyzeCode);

/**
 * @route   GET /api/submissions/:id
 * @desc    Get a single submission by its ID
 * @access  Private
 */
router.get('/:id', protect, getSubmissionById);

module.exports = router;
