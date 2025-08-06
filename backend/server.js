// backend/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// --- Route Imports ---
const authRoutes = require('./routes/auth');
const problemRoutes = require('./routes/problems');
const submissionRoutes = require('./routes/submissions');

// --- Initial Setup ---

// Load environment variables from .env file
dotenv.config();

// Connect to the MongoDB database
connectDB();

// Initialize the Express application
const app = express();

// --- Middleware ---

// Enable Cross-Origin Resource Sharing (CORS) to allow requests from the frontend
app.use(cors());

// Enable the Express app to parse JSON formatted request bodies
app.use(express.json());

// --- API Routes ---

// Mount the authentication routes under the /api/auth prefix
app.use('/api/auth', authRoutes);

// Mount the problem routes under the /api/problems prefix
app.use('/api/problems', problemRoutes);

// Mount the submission routes under the /api/submissions prefix
app.use('/api/submissions', submissionRoutes);

// --- Server Startup ---

// Define the port the server will listen on, from environment variables or default to 5000
const PORT = process.env.PORT || 5000;

// Start the server and listen for incoming connections
app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
