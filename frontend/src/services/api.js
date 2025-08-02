import axios from 'axios';

// Create axios instance with base configuration
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Include cookies in requests
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor to add auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common error cases
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    if (error.response?.status === 429) {
      // Rate limit exceeded
      console.warn('Rate limit exceeded:', error.response.data.message);
    }
    
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: (credentials) => API.post('/auth/login', credentials),
  register: (userData) => API.post('/auth/register', userData),
  logout: () => API.post('/auth/logout'),
  getMe: () => API.get('/auth/me'),
  updateProfile: (profileData) => API.put('/auth/profile', profileData),
  changePassword: (passwordData) => API.put('/auth/change-password', passwordData),
  verifyToken: (token) => API.post('/auth/verify-token', { token })
};

// Problems API
export const problemsAPI = {
  getProblems: (params) => API.get('/problems', { params }),
  getProblem: (slug) => API.get(`/problems/${slug}`),
  createProblem: (problemData) => API.post('/problems', problemData),
  updateProblem: (id, problemData) => API.put(`/problems/${id}`, problemData),
  deleteProblem: (id) => API.delete(`/problems/${id}`),
  getProblemStats: (id) => API.get(`/problems/${id}/stats`),
  getEditorial: (slug) => API.get(`/problems/${slug}/editorial`),
  getAllTags: () => API.get('/problems/tags')
};

// Submissions API
export const submissionsAPI = {
  submitCode: (submissionData) => API.post('/submissions', submissionData),
  getSubmission: (id) => API.get(`/submissions/${id}`),
  getUserSubmissions: (params) => API.get('/submissions', { params }),
  getAllSubmissions: (params) => API.get('/submissions/all', { params }),
  getSubmissionStats: () => API.get('/submissions/stats'),
  rejudgeSubmission: (id) => API.post(`/submissions/${id}/rejudge`),
  deleteSubmission: (id) => API.delete(`/submissions/${id}`)
};

// Admin API
export const adminAPI = {
  getJudgeStats: () => API.get('/admin/judge-stats'),
  performCleanup: () => API.post('/admin/judge-cleanup'),
  getSystemHealth: () => API.get('/health')
};

// Utility functions
export const handleAPIError = (error, defaultMessage = 'An error occurred') => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return defaultMessage;
};

export const isNetworkError = (error) => {
  return !error.response && error.request;
};

export const getErrorStatus = (error) => {
  return error.response?.status || 0;
};

export default API;