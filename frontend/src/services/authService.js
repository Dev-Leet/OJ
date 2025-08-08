// frontend/src/services/authService.js
import axios from 'axios';

// Define the base URL for the API. In development, this might be 'http://localhost:5000/api'.
// In production, this would be your deployed backend URL.
//const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_URL = '/api';

/**
 * Registers a new user by sending a POST request to the backend.
 * @param {object} userData - The user's registration data (name, email, password).
 * @returns {Promise<object>} The response data from the server.
 */
const register = async (userData) => {
  const response = await axios.post(`${API_URL}/auth/register`, userData);
  return response.data;
};

/**
 * Logs in a user.
 * On successful login, it stores the user data (including the token) in localStorage.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<object>} The user data from the server.
 */
const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email,
    password,
  });

  // If the response contains data (i.e., successful login), store it.
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }

  return response.data;
};

/**
 * Logs out the user by removing their data from localStorage.
 */
const logout = () => {
  localStorage.removeItem('user');
};

/**
 * Retrieves the current user's data from localStorage.
 * @returns {object|null} The parsed user object or null if not found.
 */
const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch (error) {
    // If parsing fails (e.g., corrupted data), return null
    console.error("Could not parse user from localStorage", error);
    return null;
  }
};

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
};

export default authService;
