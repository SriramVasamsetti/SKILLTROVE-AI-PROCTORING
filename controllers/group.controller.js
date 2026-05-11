const Group = require('../models/group.model');
const Notification = require('../models/notification.model');
const { asyncHandler } = require('../middleware/asyncHandler');

async function listGroups(req, res) {
  const groups = await Group.find().sort({ createdAt: -1 }).lean();
  res.json(groups);
}

async function createGroup(req, res) {
  const { name, description } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: 'name is required' });
  }
  const doc = await Group.create({
    name: String(name).trim(),
    description: String(description ?? '').trim(),
    createdBy: req.user?.userId,
  });
  res.status(201).json(doc);
}

async function updateGroup(req, res) {
  const { name, description } = req.body;
  const doc = await Group.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Group not found' });

  if (name != null) doc.name = String(name).trim();
  if (description != null) doc.description = String(description).trim();
  await doc.save();
  res.json(doc);
}

async function deleteGroup(req, res) {
  const doc = await Group.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Group not found' });
  await doc.deleteOne();
  res.status(204).send();
}

/**
 * @function joinGroup
 * @description Adds the authenticated user to the group members list.
 */
async function joinGroup(req, res) {
  const { id } = req.params;
  const group = await Group.findById(id);
  if (!group) return res.status(404).json({ message: 'Group not found' });

  const userId = req.user.userId;
  if (group.members.includes(userId)) {
    return res.status(400).json({ message: 'Already a member' });
  }

  group.members.push(userId);
  await group.save();

  res.json({ message: 'Successfully joined group', group });

  // Notify group creator
  if (group.createdBy && String(group.createdBy) !== String(userId)) {
    try {
      await Notification.create({
        userId: group.createdBy,
        channel: 'discussion',
        title: 'New Group Member',
        detail: `Someone just joined your group: ${group.name}`,
        refModel: 'Group',
        refId: group._id
      });
    } catch (err) {
      console.error('[group/notify] Error:', err.message);
    }
  }
}

module.exports = {
  listGroups: asyncHandler(listGroups),
  createGroup: asyncHandler(createGroup),
  updateGroup: asyncHandler(updateGroup),
  deleteGroup: asyncHandler(deleteGroup),
  joinGroup: asyncHandler(joinGroup),
};
