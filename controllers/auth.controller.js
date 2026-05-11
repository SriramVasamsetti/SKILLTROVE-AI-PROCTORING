const User = require('../models/user.model');
const { asyncHandler } = require('../middleware/asyncHandler');
const { assertEmail, normalizeFaceDescriptor } = require('../middleware/validators');
const { faceMatch } = require('../utils/faceMatching');
const { ROLES, DEFAULT_FACE_DISTANCE_THRESHOLD } = require('../config/constants');
const { signAuthToken } = require('../utils/token');

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

  let user;
  try {
    user = await User.create({
      name,
      email,
      password,
      faceDescriptor,
      profileImage,
      role: chosenRole,
    });
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

  let token;
  try {
    token = signAuthToken({
      userId: String(user._id),
      email: user.email,
      role: user.role,
    });
  } catch (e) {
    console.error('[signup] JWT error:', e.message);
    return res.status(500).json({ message: 'Server auth configuration error (JWT_SECRET).' });
  }

  return res.status(201).json({
    token,
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

  const token = signAuthToken({
    userId: String(user._id),
    email: user.email,
    role: user.role,
  });

  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, profileImage: user.profileImage, faceDescriptor: user.faceDescriptor },
  });
}

module.exports = {
  signup: asyncHandler(signup),
  login: asyncHandler(login),
};
