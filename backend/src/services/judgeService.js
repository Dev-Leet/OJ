const axios = require('axios');
const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const aiService = require('./aiService');

const JUDGE_ENGINE_URL = process.env.JUDGE_ENGINE_URL || 'http://localhost:5001';

exports.execute = async (submission) => {
    try {
        const problem = await Problem.findById(submission.problemId);
        const response = await axios.post(`${JUDGE_ENGINE_URL}/execute`, {
            code: submission.code,
            language: submission.language,
            testCases: problem.testCases,
        });

        const { verdict, output } = response.data;
        submission.verdict = verdict;
        submission.output = output;
        await submission.save();

        if (verdict === 'Accepted') {
            const analysis = await aiService.analyzeCode(submission.code);
            // You can save the analysis to the submission or handle it as needed
            console.log('AI Analysis:', analysis);
        }

    } catch (error) {
        console.error('Error executing submission:', error.message);
        submission.verdict = 'Error';
        submission.output = 'Error communicating with the judge engine.';
        await submission.save();
    }
};