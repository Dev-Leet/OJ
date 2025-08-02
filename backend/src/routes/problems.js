const express = require('express');
const router = express.Router();
const {
  getProblems,
  getProblem,
  createProblem,
  updateProblem,
  deleteProblem,
  getProblemStats,
  getEditorial,
  getAllTags
} = require('../controllers/problemController');
const { protect, optionalProtect, authorize } = require('../middleware/auth');

// @route   GET /api/problems/tags
// @desc    Get all available tags
// @access  Public
router.get('/tags', getAllTags);

// @route   GET /api/problems
// @desc    Get all problems with pagination and filters
// @access  Public
router.get('/', optionalProtect, getProblems);

// @route   GET /api/problems/:slug
// @desc    Get single problem by slug
// @access  Public (but shows user submissions if logged in)
router.get('/:slug', optionalProtect, getProblem);

// @route   POST /api/problems
// @desc    Create new problem
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), createProblem);

// @route   PUT /api/problems/:id
// @desc    Update problem
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), updateProblem);

// @route   DELETE /api/problems/:id
// @desc    Delete problem
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), deleteProblem);

// @route   GET /api/problems/:id/stats
// @desc    Get problem statistics
// @access  Private (Admin only)
router.get('/:id/stats', protect, authorize('admin'), getProblemStats);

// @route   GET /api/problems/:slug/editorial
// @desc    Get editorial for a problem (must have solved it first)
// @access  Private
router.get('/:slug/editorial', protect, getEditorial);

module.exports = router;