const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protects routes by validating the Bearer JWT token.
 * Attaches the decoded user (including role) to req.user.
 *
 * Usage:  router.get('/protected', protect, controller)
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'No token provided. Please log in.',
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Token is invalid or expired. Please log in again.',
      });
    }

    // Fetch user — explicitly select role (not returned by default)
    const user = await User.findById(decoded.userId).select('+role');
    if (!user) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'User belonging to this token no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Account is inactive.',
      });
    }

    req.user = user; // user.role is now available to downstream middleware
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Restricts a route to admin users only.
 * Must be used AFTER protect middleware.
 *
 * Usage:  router.get('/admin-only', protect, adminOnly, controller)
 */
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Access denied. Admin privileges required.',
    });
  }
  next();
};

module.exports = { protect, adminOnly };
