const Discussion = require('../models/discussion.model');
const Notification = require('../models/notification.model');
const { asyncHandler } = require('../middleware/asyncHandler');

async function createDiscussion(req, res) {
  const { title, body, tags } = req.body;
  if (!title) return res.status(400).json({ message: 'title required' });
  const doc = await Discussion.create({
    title,
    body,
    tags: tags ?? [],
    authorId: req.user.userId,
  });
  res.status(201).json(doc);
}

async function listDiscussions(req, res) {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);
  const items = await Discussion.find()
    .sort({ updatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const total = await Discussion.countDocuments();
  res.json({ total, items });
}

async function getDiscussion(req, res) {
  const doc = await Discussion.findById(req.params.id).lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
}

async function commentOnThread(req, res) {
  const { body } = req.body;
  if (!body) return res.status(400).json({ message: 'body required' });

  const doc = await Discussion.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });

  doc.threadComments.push({ authorId: req.user.userId, body });

  const recipients = new Set();
  recipients.add(String(doc.authorId));
  doc.threadComments.forEach((c) => recipients.add(String(c.authorId)));
  recipients.delete(String(req.user.userId));

  const rows = [...recipients].map((uid) => ({
    userId: uid,
    channel: 'discussion',
    title: 'New comment on discussion',
    detail: doc.title.slice(0, 200),
    refModel: 'Discussion',
    refId: doc._id,
  }));
  if (rows.length) await Notification.insertMany(rows);

  await doc.save();
  res.status(201).json(doc.threadComments.slice(-1)[0]);
}

async function addQA(req, res) {
  const { question, answers } = req.body;
  if (!question) return res.status(400).json({ message: 'question required' });
  const doc = await Discussion.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  doc.posts.push({
    question,
    answers: answers ?? [],
    authorId: req.user.userId,
  });
  await doc.save();
  res.status(201).json(doc.posts.slice(-1)[0]);
}

async function replyToQA(req, res) {
  const { body } = req.body;
  if (!body) return res.status(400).json({ message: 'body required' });
  const { id, postId } = req.params;
  const doc = await Discussion.findById(id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  const post = doc.posts.id(postId);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  post.comments.push({ authorId: req.user.userId, body });

  await Notification.create({
    userId: post.authorId,
    channel: 'discussion',
    title: 'Reply to your Q&A',
    detail: body.slice(0, 280),
    refModel: 'Discussion',
    refId: doc._id,
  });

  await doc.save();
  res.status(201).json(post.comments.slice(-1)[0]);
}

async function deleteDiscussion(req, res) {
  const doc = await Discussion.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  if (String(doc.authorId) !== String(req.user.userId) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  await doc.deleteOne();
  res.status(204).send();
}

module.exports = {
  createDiscussion: asyncHandler(createDiscussion),
  listDiscussions: asyncHandler(listDiscussions),
  getDiscussion: asyncHandler(getDiscussion),
  commentOnThread: asyncHandler(commentOnThread),
  addQA: asyncHandler(addQA),
  replyToQA: asyncHandler(replyToQA),
  deleteDiscussion: asyncHandler(deleteDiscussion),
};
