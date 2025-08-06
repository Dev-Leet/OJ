// backend/routes/problems.js
const express = require('express');
const router = express.Router();
const {
  createProblem,
  getProblems,
  getProblemById,
  updateProblem,
  deleteProblem,
} = require('../controllers/problemController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// --- Public Routes ---

/**
 * @route   GET /api/problems
 * @desc    Get all problems
 * @access  Public
 */
router.get('/', getProblems);

/**
 * @route   GET /api/problems/:id
 * @desc    Get a single problem by ID
 * @access  Public
 */
router.get('/:id', getProblemById);


// --- Admin-Only Routes ---

/**
 * @route   POST /api/problems
 * @desc    Create a new problem
 * @access  Private/Admin
 *
 * Middleware chain:
 * 1. `protect`: Verifies the user's JWT to ensure they are logged in.
 * 2. `admin`: Checks if the logged-in user has the 'admin' role.
 */
router.post('/', protect, admin, createProblem);

/**
 * @route   PUT /api/problems/:id
 * @desc    Update an existing problem
 * @access  Private/Admin
 */
router.put('/:id', protect, admin, updateProblem);

/**
 * @route   DELETE /api/problems/:id
 * @desc    Delete a problem
 * @access  Private/Admin
 */
router.delete('/:id', protect, admin, deleteProblem);

module.exports = router;
