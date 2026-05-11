const jwt = require('jsonwebtoken');

function authMiddleware(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
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

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden — insufficient role' });
    }
    next();
  };
}

module.exports = { authMiddleware, requireRoles };
