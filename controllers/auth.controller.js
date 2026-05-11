const User = require('../models/user.model');
const { asyncHandler } = require('../middleware/asyncHandler');
const { assertEmail, normalizeFaceDescriptor } = require('../middleware/validators');
const { faceMatch } = require('../utils/faceMatching');
const { ROLES, DEFAULT_FACE_DISTANCE_THRESHOLD } = require('../config/constants');
const { signAuthToken } = require('../utils/token');
const { sendVerificationEmail } = require('../utils/email');
const crypto = require('crypto');

async function signup(req, res) {
  const { name, email, password, role, profileImage } = req.body;
  assertEmail(email);

  if (!name || !password || String(password).length < 8) {
    return res.status(400).json({ message: 'name and password (min 8 characters) are required' });
  }

  const faceDescriptor = normalizeFaceDescriptor(req.body.faceDescriptor);
  const chosenRole = role && ROLES.includes(role) ? role : 'student';

  // BIOMETRIC IDENTITY CHECK
  const allUsers = await User.find({ faceDescriptor: { $exists: true, $ne: [] } }).select('faceDescriptor').lean();
  for (const existingUser of allUsers) {
    if (faceMatch(existingUser.faceDescriptor, faceDescriptor, 0.4)) {
      return res.status(409).json({ 
        message: 'Biometric Identity Already Registered. Please login with your existing account.',
        code: 'BIOMETRIC_DUPLICATE'
      });
    }
  }

  // Generate unique verification token
  const vToken = crypto.randomBytes(32).toString('hex');

  let user;
  try {
    user = await User.create({
      name,
      email,
      password,
      faceDescriptor,
      profileImage,
      role: chosenRole,
      verificationToken: vToken,
      isVerified: false
    });
    
    // Send verification link
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${vToken}`;
    sendVerificationEmail(email, verificationLink);
    
  } catch (dbErr) {
    if (dbErr.code === 11000) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    console.error('[signup] Database error:', dbErr.message);
    return res.status(503).json({
      message: 'Could not save user. Check database connection and try again.',
      ...(process.env.NODE_ENV !== 'production' && { detail: dbErr.message }),
    });
  }

  let authToken;
  try {
    authToken = signAuthToken({
      userId: String(user._id),
      email: user.email,
      role: user.role,
    });
  } catch (e) {
    console.error('[signup] JWT error:', e.message);
    return res.status(500).json({ message: 'Server auth configuration error (JWT_SECRET).' });
  }

  // Set HttpOnly Cookies for enhanced security (XSS prevention)
  res.cookie('token', authToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
  res.cookie('role', user.role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  });

  return res.status(201).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      faceDescriptor: user.faceDescriptor,
    },
  });
}

async function login(req, res) {
  const { email, password } = req.body;
  assertEmail(email);

  const faceProbe = normalizeFaceDescriptor(req.body.faceDescriptor);

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const passOk = await user.verifyPassword(password);
  const stored = normalizeFaceDescriptor(user.faceDescriptor);
  const faceOk = faceMatch(stored, faceProbe, DEFAULT_FACE_DISTANCE_THRESHOLD);
  if (!passOk || !faceOk) {
    const err = new Error('Invalid credentials or face mismatch');
    err.statusCode = 401;
    throw err;
  }

  if (!user.isVerified) {
    return res.status(403).json({ 
      message: 'Email not verified. Please verify your account to login.',
      code: 'EMAIL_UNVERIFIED'
    });
  }

  const token = signAuthToken({
    userId: String(user._id),
    email: user.email,
    role: user.role,
  });

  // Set HttpOnly Cookies
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  });
  res.cookie('role', user.role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  });

  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      faceDescriptor: user.faceDescriptor,
    },
  });
}

/**
 * @function logout
 * @description Clears security cookies to end session.
 */
async function logout(req, res) {
  res.clearCookie('token');
  res.clearCookie('role');
  res.json({ message: 'Logged out successfully' });
}

/**
 * @function verifyEmail
 * @description Verifies the user's email using the unique hex token.
 */
async function verifyEmail(req, res) {
  const { token } = req.params;
  if (!token) {
    return res.status(400).json({ message: 'Verification token is required' });
  }

  const user = await User.findOne({ verificationToken: token }).select('+verificationToken');
  if (!user) {
    return res.status(404).json({ message: 'Invalid or expired verification token' });
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save();

  res.json({ message: 'Account verified successfully. You can now login.' });
}

module.exports = {
  signup: asyncHandler(signup),
  login: asyncHandler(login),
  logout: asyncHandler(logout),
  verifyEmail: asyncHandler(verifyEmail),
};
