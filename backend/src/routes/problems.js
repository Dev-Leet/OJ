const express = require('express');
const router = express.Router();
const { getProblems, getProblemById, createProblem, updateProblem, deleteProblem } = require('../controllers/problemController');
const { auth, admin } = require('../middleware/auth');

router.route('/').get(getProblems).post(auth, admin, createProblem);
router.route('/:id').get(getProblemById).put(auth, admin, updateProblem).delete(auth, admin, deleteProblem);

module.exports = router;
