const express = require('express');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/me', protect, authController.getCurrentUser);
router.patch('/me', protect, authController.updateProfile);
router.patch('/me/password', protect, authController.changePassword);

module.exports = router;