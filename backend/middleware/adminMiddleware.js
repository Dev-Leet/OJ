// backend/middleware/adminMiddleware.js

/**
 * @desc    Middleware to check if the user is an admin.
 * This should be used after the 'protect' middleware.
 * @param   {object} req - Express request object (should have req.user from 'protect' middleware).
 * @param   {object} res - Express response object.
 * @param   {function} next - Express next middleware function.
 */
exports.admin = (req, res, next) => {
  // Check if the user object is attached to the request and if the user's role is 'admin'
  if (req.user && req.user.role === 'admin') {
    // If the user is an admin, proceed to the next middleware or route handler
    next();
  } else {
    // If the user is not an admin, send a 401 Unauthorized status
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};