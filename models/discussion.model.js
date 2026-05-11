const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true, maxlength: 8000 },
  createdAt: { type: Date, default: Date.now },
});

const qaPostSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answers: [{ type: String }],
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  solved: { type: Boolean, default: false },
  votes: { type: Number, default: 0 },
  comments: [commentSchema],
  createdAt: { type: Date, default: Date.now },
});

const discussionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 500 },
    body: String,
    tags: [String],
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    /** Q&A style threads nested in this discussion */
    posts: [qaPostSchema],
    /** Simple comment stream on discussion itself */
    threadComments: [commentSchema],
  },
  { timestamps: true },
);

discussionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Discussion', discussionSchema);
