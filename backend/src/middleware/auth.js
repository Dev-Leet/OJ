const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in different places
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Get token from Bearer header
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      // Get token from cookie
      token = req.cookies.token;
    }
    
    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token and attach to request
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized - user not found'
        });
      }
      
      req.user = user;
      next();
      
    } catch (error) {
      console.error('Token verification error:', error);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired'
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Optional protect - doesn't fail if no token, just doesn't set req.user
const optionalProtect = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in different places
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }
    
    // If no token, just continue without setting req.user
    if (!token) {
      return next();
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findById(decoded.userId);
      
      if (user) {
        req.user = user;
      }
      
      next();
      
    } catch (error) {
      // If token is invalid, just continue without setting req.user
      next();
    }
    
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    
    next();
  };
};

// Rate limiting middleware for submissions
const submissionRateLimit = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const Submission = require('../models/Submission');
    
    // Check submissions in the last minute
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentSubmissions = await Submission.countDocuments({
      userId: req.user.id,
      createdAt: { $gte: oneMinuteAgo }
    });
    
    if (recentSubmissions >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Maximum 5 submissions per minute.',
        retryAfter: 60
      });
    }
    
    // Check submissions in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const hourlySubmissions = await Submission.countDocuments({
      userId: req.user.id,
      createdAt: { $gte: oneHourAgo }
    });
    
    if (hourlySubmissions >= 100) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Maximum 100 submissions per hour.',
        retryAfter: 3600
      });
    }
    
    next();
    
  } catch (error) {
    console.error('Submission rate limit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in rate limiting'
    });
  }
};

// Check if user owns resource or is admin
const ownerOrAdmin = (resourceIdField = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Get resource ID from request parameters
      const resourceId = req.params[resourceIdField];
      
      // For submissions, check if user owns the submission
      if (req.baseUrl.includes('submissions')) {
        const Submission = require('../models/Submission');
        const submission = await Submission.findById(resourceId);
        
        if (!submission) {
          return res.status(404).json({
            success: false,
            message: 'Resource not found'
          });
        }
        
        if (submission.userId.toString() !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'Access denied - you can only access your own submissions'
          });
        }
      }
      
      next();
      
    } catch (error) {
      console.error('Owner or admin middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error in authorization'
      });
    }
  };
};

module.exports = {
  protect,
  optionalProtect,
  authorize,
  submissionRateLimit,
  ownerOrAdmin
};