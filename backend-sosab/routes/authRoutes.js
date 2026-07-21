const express = require('express');
const { registerUser, loginUser, logoutUser } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/login', loginUser);

// Protected routes
router.post('/logout', protect, logoutUser);

// Admin-only routes
router.post('/register', protect, authorize('admin'), registerUser);

module.exports = router;
