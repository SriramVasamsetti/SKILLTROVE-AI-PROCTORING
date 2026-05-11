const Notification = require('../models/notification.model');
const { asyncHandler } = require('../middleware/asyncHandler');

async function mine(req, res) {
  const items = await Notification.find({ userId: req.user.userId }).sort({ createdAt: -1 }).limit(80).lean();
  res.json(items);
}

async function markRead(req, res) {
  await Notification.updateOne(
    { _id: req.params.id, userId: req.user.userId },
    { $set: { readAt: new Date() } },
  );
  res.json({ ok: true });
}

module.exports = {
  mine: asyncHandler(mine),
  markRead: asyncHandler(markRead),
};
