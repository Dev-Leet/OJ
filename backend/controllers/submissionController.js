// backend/controllers/submissionController.js
const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const { executeCode } = require('../../judge-engine/judge');
const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * @desc    Create a new submission and evaluate it
 * @route   POST /api/submissions
 * @access  Private
 */
exports.createSubmission = async (req, res) => {
  const { problemId, language, code } = req.body;
  const userId = req.user._id;

  if (!problemId || !language || !code) {
    return res.status(400).json({ message: 'Please provide problemId, language, and code' });
  }

  try {
    // 1. Create a submission document with a 'Pending' status
    const pendingSubmission = await Submission.create({
      userId,
      problemId,
      language,
      code,
      status: 'Pending',
    });

    // 2. Fetch the problem to get its test cases
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // 3. Evaluate the code against each test case
    let finalStatus = 'Accepted';
    let resultDetails = {};

    for (const testCase of problem.testCases) {
      try {
        // The judge.js executeCode function handles running the docker container
        const output = await executeCode(language, code, testCase.input);

        // Trim whitespace from both actual and expected outputs for a robust comparison
        if (output.trim() !== testCase.output.trim()) {
          finalStatus = 'Wrong Answer';
          resultDetails = {
            testCase: { input: testCase.input, expectedOutput: testCase.output },
            actualOutput: output.trim(),
          };
          break; // Stop on the first failed test case
        }
      } catch (err) {
        // Handle runtime errors from the execution engine
        finalStatus = 'Runtime Error';
        resultDetails = {
          error: err.stderr || err.message || 'An unknown runtime error occurred',
          testCase: { input: testCase.input },
        };
        break; // Stop on runtime error
      }
    }

    // 4. Update the submission with the final result
    const finalSubmission = await Submission.findByIdAndUpdate(
      pendingSubmission._id,
      { status: finalStatus, resultDetails },
      { new: true } // Return the updated document
    ).populate('problemId', 'title');

    res.status(201).json(finalSubmission);

  } catch (error) {
    console.error(`Error in createSubmission: ${error.message}`);
    res.status(500).json({ message: 'Server error while processing submission' });
  }
};

/**
 * @desc    Get all submissions for the logged-in user
 * @route   GET /api/submissions
 * @access  Private
 */
exports.getSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ userId: req.user._id })
      .populate('problemId', 'title difficulty') // Populate with problem title and difficulty
      .sort({ createdAt: -1 }); // Show the most recent submissions first
    res.json(submissions);
  } catch (error) {
    console.error(`Error in getSubmissions: ${error.message}`);
    res.status(500).json({ message: 'Server error while fetching submissions' });
  }
};

/**
 * @desc    Get a single submission by its ID
 * @route   GET /api/submissions/:id
 * @access  Private
 */
exports.getSubmissionById = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('problemId', 'title description');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Ensure the user owns the submission or is an admin
    if (submission.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(401).json({ message: 'Not authorized to view this submission' });
    }

    res.json(submission);
  } catch (error) {
    console.error(`Error in getSubmissionById: ${error.message}`);
    res.status(500).json({ message: 'Server error while fetching submission' });
  }
};


/**
 * @desc    Analyze code for time/space complexity and comments
 * @route   POST /api/submissions/analyze
 * @access  Private
 */
exports.analyzeCode = async (req, res) => {
    const { code, language } = req.body;

    if (!code || !language) {
        return res.status(400).json({ message: 'Code and language are required for analysis.' });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `Analyze the following ${language} code. Provide its time complexity and space complexity. Also, add comments about the code's quality, style, and potential improvements.\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ analysis: text });
    } catch (error) {
        console.error("Error analyzing code with Gemini:", error);
        res.status(500).json({ message: "Failed to analyze code due to a server error." });
    }
};
