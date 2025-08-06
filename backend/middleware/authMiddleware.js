// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * @desc    Middleware to protect routes that require authentication.
 * It verifies the JWT from the Authorization header.
 * @param   {object} req - Express request object.
 * @param   {object} res - Express response object.
 * @param   {function} next - Express next middleware function.
 */
exports.protect = async (req, res, next) => {
  let token;

  // Check if the Authorization header exists and is correctly formatted
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 1. Extract the token from the header (e.g., "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // 2. Verify the token using the secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Find the user by the ID from the decoded token payload
      //    and attach the user object to the request, excluding the password
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // 4. Proceed to the next middleware or route handler
      next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // If no token is found in the header, send an unauthorized error
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};
