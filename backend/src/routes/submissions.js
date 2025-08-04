const express = require('express');
const router = express.Router();
const { createSubmission, getSubmissions } = require('../controllers/submissionController');
const { auth } = require('../middleware/auth');

router.route('/').post(auth, createSubmission).get(auth, getSubmissions);

module.exports = router;
