const Group = require('../models/group.model');
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

module.exports = {
  listGroups: asyncHandler(listGroups),
  createGroup: asyncHandler(createGroup),
  updateGroup: asyncHandler(updateGroup),
  deleteGroup: asyncHandler(deleteGroup),
};
