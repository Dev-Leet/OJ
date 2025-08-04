const Submission = require('../models/Submission');
const judgeService = require('../services/judgeService');

exports.createSubmission = async (req, res, next) => {
    const { problemId, code, language } = req.body;
    const userId = req.user.id;
    try {
        const submission = await Submission.create({ userId, problemId, code, language });
        res.status(201).json(submission);
        // Offload execution to the judge service
        judgeService.execute(submission);
    } catch (err) {
        next(err);
    }
};

exports.getSubmissions = async (req, res, next) => {
    try {
        const submissions = await Submission.find({ userId: req.user.id }).populate('problemId', 'title');
        res.json(submissions);
    } catch (err) {
        next(err);
    }
};
