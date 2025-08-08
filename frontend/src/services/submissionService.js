// frontend/src/services/submissionService.js
import axios from 'axios';
import authService from './authService';

// Define the base URL for the submissions API endpoint
//const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api') + '/submissions/';
const API_URL = '/api/submissions';

// --- Helper function to get auth token ---
const getAuthHeader = () => {
  const user = authService.getCurrentUser();
  if (user && user.token) {
    return { Authorization: `Bearer ${user.token}` };
  }
  return {};
};

/**
 * Creates a new submission by sending the code and language to the backend.
 * @param {object} submissionData - Contains problemId, language, and code.
 * @returns {Promise<object>} The result of the submission evaluation.
 */
const createSubmission = async (submissionData) => {
  const config = {
    headers: getAuthHeader(),
  };
  const response = await axios.post(API_URL, submissionData, config);
  return response.data;
};

/**
 * Fetches all submissions for the currently logged-in user.
 * @returns {Promise<Array>} A list of the user's submissions.
 */
const getSubmissions = async () => {
  const config = {
    headers: getAuthHeader(),
  };
  const response = await axios.get(API_URL, config);
  return response.data;
};

/**
 * Fetches a single submission by its ID.
 * @param {string} id - The ID of the submission to fetch.
 * @returns {Promise<object>} The submission data.
 */
const getSubmissionById = async (id) => {
  const config = {
    headers: getAuthHeader(),
  };
  const response = await axios.get(API_URL + id, config);
  return response.data;
};

/**
 * Sends code to the backend for AI-powered analysis.
 * @param {object} analysisData - Contains the language and code to be analyzed.
 * @returns {Promise<object>} The analysis result from the AI.
 */
const analyzeCode = async (analysisData) => {
    const config = {
        headers: getAuthHeader(),
    };
    const response = await axios.post(API_URL + 'analyze', analysisData, config);
    return response.data;
};


const submissionService = {
  createSubmission,
  getSubmissions,
  getSubmissionById,
  analyzeCode,
};

export default submissionService;
