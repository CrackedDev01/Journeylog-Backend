require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');

const authController = {};

// Register a new user
authController.register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.register(req.body);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: {
      user,
      token
    }
  });
});

// Login user
authController.login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user,
      token
    }
  });
});

// Get current user
authController.getCurrentUser = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user._id);

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});

// Update current user profile
authController.updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user._id, req.body);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
});

// Change password
authController.changePassword = asyncHandler(async (req, res) => {
  const user = await authService.changePassword(req.user._id, req.body);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
    data: { user }
  });
});

module.exports = authController;