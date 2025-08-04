const Problem = require('../models/Problem');

exports.getProblems = async (req, res, next) => {
    try {
        const problems = await Problem.find();
        res.json(problems);
    } catch (err) {
        next(err);
    }
};

exports.getProblemById = async (req, res, next) => {
    try {
        const problem = await Problem.findById(req.params.id);
        if (!problem) {
            return res.status(404).json({ msg: 'Problem not found' });
        }
        res.json(problem);
    } catch (err) {
        next(err);
    }
};

exports.createProblem = async (req, res, next) => {
    try {
        const problem = await Problem.create(req.body);
        res.status(201).json(problem);
    } catch (err) {
        next(err);
    }
};

exports.updateProblem = async (req, res, next) => {
    try {
        const problem = await Problem.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!problem) {
            return res.status(404).json({ msg: 'Problem not found' });
        }
        res.json(problem);
    } catch (err) {
        next(err);
    }
};

exports.deleteProblem = async (req, res, next) => {
    try {
        const problem = await Problem.findByIdAndDelete(req.params.id);
        if (!problem) {
            return res.status(404).json({ msg: 'Problem not found' });
        }
        res.json({ msg: 'Problem removed' });
    } catch (err) {
        next(err);
    }
};
