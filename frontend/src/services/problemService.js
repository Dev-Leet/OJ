// frontend/src/services/problemService.js
import axios from 'axios';
import authService from './authService';

// Define the base URL for the problems API endpoint
//const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api') + '/problems/';
const API_URL = '/api/problems';

// --- Helper function to get auth token ---
const getAuthHeader = () => {
  const user = authService.getCurrentUser();
  if (user && user.token) {
    return { Authorization: `Bearer ${user.token}` };
  }
  return {};
};


// --- Public Functions ---

/**
 * Fetches all problems from the backend.
 * @returns {Promise<Array>} A list of all problems.
 */
const getAllProblems = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

/**
 * Fetches a single problem by its ID.
 * @param {string} id - The ID of the problem to fetch.
 * @returns {Promise<object>} The problem data.
 */
const getProblemById = async (id) => {
  const response = await axios.get(API_URL + id);
  return response.data;
};


// --- Admin-Only Functions ---

/**
 * Creates a new problem. (Requires admin privileges)
 * @param {object} problemData - The data for the new problem.
 * @returns {Promise<object>} The newly created problem data.
 */
const createProblem = async (problemData) => {
  const config = {
    headers: getAuthHeader(),
  };
  const response = await axios.post(API_URL, problemData, config);
  return response.data;
};

/**
 * Updates an existing problem. (Requires admin privileges)
 * @param {string} id - The ID of the problem to update.
 * @param {object} problemData - The updated data for the problem.
 * @returns {Promise<object>} The updated problem data.
 */
const updateProblem = async (id, problemData) => {
  const config = {
    headers: getAuthHeader(),
  };
  const response = await axios.put(API_URL + id, problemData, config);
  return response.data;
};

/**
 * Deletes a problem. (Requires admin privileges)
 * @param {string} id - The ID of the problem to delete.
 * @returns {Promise<object>} A success message.
 */
const deleteProblem = async (id) => {
  const config = {
    headers: getAuthHeader(),
  };
  const response = await axios.delete(API_URL + id, config);
  return response.data;
};

const problemService = {
  getAllProblems,
  getProblemById,
  createProblem,
  updateProblem,
  deleteProblem,
};

export default problemService;
