// backend/controllers/problemController.js
const Problem = require('../models/Problem');

/**
 * @desc    Create a new problem
 * @route   POST /api/problems
 * @access  Private/Admin
 */
exports.createProblem = async (req, res) => {
  // Destructure problem details from the request body
  const { title, description, difficulty, tags, constraints, testCases } = req.body;

  try {
    // Create a new problem instance
    const problem = new Problem({
      title,
      description,
      difficulty,
      tags,
      constraints,
      testCases,
      createdBy: req.user._id, // The user ID is attached by the authMiddleware
    });

    // Save the new problem to the database
    const createdProblem = await problem.save();
    res.status(201).json(createdProblem);
  } catch (error) {
    console.error(`Error in createProblem: ${error.message}`);
    res.status(500).json({ message: 'Server error while creating the problem' });
  }
};

/**
 * @desc    Get all problems
 * @route   GET /api/problems
 * @access  Public
 */
exports.getProblems = async (req, res) => {
  try {
    // Fetch all problems and populate the 'createdBy' field with the user's name
    const problems = await Problem.find({}).populate('createdBy', 'name');
    res.json(problems);
  } catch (error) {
    console.error(`Error in getProblems: ${error.message}`);
    res.status(500).json({ message: 'Server error while fetching problems' });
  }
};

/**
 * @desc    Get a single problem by its ID
 * @route   GET /api/problems/:id
 * @access  Public
 */
exports.getProblemById = async (req, res) => {
  try {
    // Find the problem by the ID from the request parameters
    const problem = await Problem.findById(req.params.id);

    if (problem) {
      res.json(problem);
    } else {
      // If no problem is found, return a 404 error
      res.status(404).json({ message: 'Problem not found' });
    }
  } catch (error) {
    console.error(`Error in getProblemById: ${error.message}`);
    res.status(500).json({ message: 'Server error while fetching the problem' });
  }
};

/**
 * @desc    Update an existing problem
 * @route   PUT /api/problems/:id
 * @access  Private/Admin
 */
exports.updateProblem = async (req, res) => {
  const { title, description, difficulty, tags, constraints, testCases } = req.body;

  try {
    const problem = await Problem.findById(req.params.id);

    if (problem) {
      // Update fields if they are provided in the request body
      problem.title = title || problem.title;
      problem.description = description || problem.description;
      problem.difficulty = difficulty || problem.difficulty;
      problem.tags = tags || problem.tags;
      problem.constraints = constraints || problem.constraints;
      problem.testCases = testCases || problem.testCases;

      // Save the updated problem
      const updatedProblem = await problem.save();
      res.json(updatedProblem);
    } else {
      res.status(404).json({ message: 'Problem not found' });
    }
  } catch (error) {
    console.error(`Error in updateProblem: ${error.message}`);
    res.status(500).json({ message: 'Server error while updating the problem' });
  }
};

/**
 * @desc    Delete a problem
 * @route   DELETE /api/problems/:id
 * @access  Private/Admin
 */
exports.deleteProblem = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);

    if (problem) {
      // Remove the problem from the database
      await problem.deleteOne();
      res.json({ message: 'Problem removed successfully' });
    } else {
      res.status(404).json({ message: 'Problem not found' });
    }
  } catch (error) {
    console.error(`Error in deleteProblem: ${error.message}`);
    res.status(500).json({ message: 'Server error while deleting the problem' });
  }
};
