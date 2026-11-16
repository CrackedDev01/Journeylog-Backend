const User = require('../models/user.model');
const generateToken = require('../utils/generateToken');
const { validateRegistration, validateLogin } = require('../validators/auth.validator');

const authService = {};

// Register a new user
authService.register = async (userData) => {
  // Validate input
  const { isValid, errors } = validateRegistration(userData);
  if (!isValid) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: userData.email.toLowerCase().trim() });
  if (existingUser) {
    const error = new Error('An account with this email already exists');
    error.statusCode = 409; // Conflict
    throw error;
  }

  // Create new user (password will be hashed by pre-save hook)
  const user = await User.create({
    name: userData.name.trim(),
    email: userData.email.toLowerCase().trim(),
    password: userData.password,
    timezone: userData.timezone || 'Africa/Lagos'
  });

  // Generate JWT token
  const token = generateToken(user._id);

  // Return user object without password
  const userObject = user.toObject();
  delete userObject.password;

  return {
    user: userObject,
    token
  };
};

// Login user
authService.login = async (loginData) => {
  // Validate input
  const { isValid, errors } = validateLogin(loginData);
  if (!isValid) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  // Find user by email and explicitly select password for comparison
  const user = await User.findOne({ email: loginData.email.toLowerCase().trim() }).select('+password');
  if (!user) {
    // Generic error to prevent email enumeration
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Check if account is active
  if (!user.isActive) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Compare passwords
  const isPasswordMatch = await user.comparePassword(loginData.password);
  if (!isPasswordMatch) {
    // Generic error to prevent email enumeration
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Generate JWT token
  const token = generateToken(user._id);

  // Return user object without password
  const userObject = user.toObject();
  delete userObject.password;

  return {
    user: userObject,
    token
  };
};

// Get current user
authService.getCurrentUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('User account is deactivated');
    error.statusCode = 403;
    throw error;
  }

  // Return user object without password
  const userObject = user.toObject();
  delete userObject.password;

  return userObject;
};

// Update current user profile (name, timezone; email intentionally read-only)
authService.updateProfile = async (userId, profileData) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const errors = {};
  if (profileData.name !== undefined) {
    const name = String(profileData.name || '').trim();
    if (!name) errors.name = 'Please provide a name';
    else if (name.length < 2) errors.name = 'Name must be at least 2 characters long';
    else if (name.length > 50) errors.name = 'Name must not exceed 50 characters';
  }
  if (profileData.timezone !== undefined) {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: String(profileData.timezone) });
    } catch {
      errors.timezone = 'Please provide a valid timezone';
    }
  }
  if (Object.keys(errors).length) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  if (profileData.name !== undefined) user.name = String(profileData.name).trim();
  if (profileData.timezone !== undefined) user.timezone = String(profileData.timezone);
  await user.save();

  const userObject = user.toObject();
  delete userObject.password;
  return userObject;
};

// Change password (verifies current password; sessions remain valid — stateless JWT)
authService.changePassword = async (userId, { currentPassword, newPassword }) => {
  if (!currentPassword || !newPassword) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = {
      ...(currentPassword ? {} : { currentPassword: 'Please provide your current password' }),
      ...(newPassword ? {} : { newPassword: 'Please provide a new password' }),
    };
    throw error;
  }
  if (String(newPassword).trim().length < 8) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = { newPassword: 'Password must be at least 8 characters long' };
    throw error;
  }

  const user = await User.findById(userId).select('+password');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    const error = new Error('Current password is incorrect');
    error.statusCode = 401;
    throw error;
  }

  user.password = newPassword;
  await user.save();

  const userObject = user.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = authService;