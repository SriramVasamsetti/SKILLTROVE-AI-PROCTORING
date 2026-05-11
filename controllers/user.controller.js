const User = require('../models/user.model');
const Analytics = require('../models/analytics.model');
const QuizAttempt = require('../models/quizAttempt.model');
const ProctorLog = require('../models/proctoring.model');
const Notification = require('../models/notification.model');
const { asyncHandler } = require('../middleware/asyncHandler');
const { assertEmail } = require('../middleware/validators');

async function getProfile(req, res) {
  const user = await User.findById(req.user.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profileImage: user.profileImage,
    faceDescriptor: user.faceDescriptor,
  });
}

async function updateProfile(req, res) {
  const { name, email } = req.body;
  const user = await User.findById(req.user.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (name) user.name = name;
  if (email) {
    assertEmail(email);
    user.email = email;
  }

  await user.save();
  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
}

async function updatePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ message: 'currentPassword and newPassword (min 8) required.' });
  }
  const user = await User.findById(req.user.userId).select('+password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  const ok = await user.verifyPassword(currentPassword);
  if (!ok) return res.status(401).json({ message: 'Current password incorrect' });
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated.' });
}

async function deleteAccount(req, res) {
  const id = req.user.userId;
  await Promise.all([
    QuizAttempt.deleteMany({ userId: id }),
    Analytics.deleteMany({ userId: id }),
    Notification.deleteMany({ userId: id }),
    ProctorLog.deleteMany({ userId: id }),
  ]);

  await User.findByIdAndDelete(id);
  res.status(204).send();
}

module.exports = {
  getProfile: asyncHandler(getProfile),
  updateProfile: asyncHandler(updateProfile),
  updatePassword: asyncHandler(updatePassword),
  deleteAccount: asyncHandler(deleteAccount),
};
