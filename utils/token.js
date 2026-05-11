const jwt = require('jsonwebtoken');

function signAuthToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    },
    secret,
    { expiresIn: process.env.JWT_EXPIRY || '7d' },
  );
}

module.exports = { signAuthToken };
