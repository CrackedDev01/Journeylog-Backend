const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check if Authorization header exists and starts with Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      let userRecord;
      try {
        userRecord = await User.findById(decoded.userId).select('-password');
      } catch (dbError) {
        // Database unreachable (DNS/Atlas blip) — this is NOT an auth
        // failure, so report 503 instead of misleading the client with 401.
        const error = new Error('Service temporarily unavailable, please try again');
        error.statusCode = 503;
        throw error;
      }
      req.user = userRecord;

      // Check if user exists
      if (!req.user) {
        const error = new Error('Not authorized, user not found');
        error.statusCode = 401;
        throw error;
      }

      // Check if user is active
      if (!req.user.isActive) {
        const error = new Error('Not authorized, user account is deactivated');
        error.statusCode = 401;
        throw error;
      }

      next();
    } catch (error) {
      if (!error.statusCode) {
        error.message = 'Not authorized, token failed';
        error.statusCode = 401;
      }
      throw error;
    }
  }

  if (!token) {
    const error = new Error('Not authorized, no token');
    error.statusCode = 401;
    throw error;
  }
});

module.exports = { protect };