const jwt = require('jsonwebtoken');

/**
 * @function authMiddleware
 * @description Extracts JWT from Authorization header or HttpOnly Cookies.
 * @param {boolean} required - Whether authentication is mandatory for the route.
 */
function authMiddleware(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    let token = header.startsWith('Bearer ') ? header.slice(7) : null;
    
    // Fallback to cookie-based auth for enhanced security
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      req.user = null;
      return required ? res.status(401).json({ message: 'Unauthorized' }) : next();
    }

    const secret = process.env.JWT_SECRET?.trim?.() ?? '';
    if (!secret) {
      if (required) return res.status(500).json({ message: 'Server misconfigured: JWT_SECRET missing' });
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, secret);
      req.user = decoded;
      next();
    } catch {
      if (required) return res.status(401).json({ message: 'Invalid or expired token' });
      req.user = null;
      next();
    }
  };
}

/**
 * @function requireRoles
 * @description Checks if the authenticated user possesses the required permissions.
 */
function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden — Access Denied' });
    }
    next();
  };
}

module.exports = { authMiddleware, requireRoles };
