const mongoose = require('mongoose');
const { QUIZ_TYPES, BLOOM_LEVELS } = require('../config/constants');

const questionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: QUIZ_TYPES, required: true },
    level: { type: String, enum: BLOOM_LEVELS, required: true },
    prompt: { type: String, required: true },
    options: [{ type: String }],
    /** Index for MCQ, exact string match for Fill-up */
    correctKey: String,
    /** Authoritative grading key rubric snippet for AI or teacher */
    modelAnswer: String,
    /** Mock coding sandbox: stdin + expectedStdout or test cases shape */
    codingMeta: {
      language: String,
      stdin: String,
      expectedStdout: String,
    },
    /** Optional points weight per question */
    points: { type: Number, default: 10, min: 1 },
  },
  { _id: false },
);

const quizSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true, index: true },
    title: { type: String, trim: true },
    /** AI-produced question set — hard cap 10 enforced in controller utils */
    questions: {
      type: [questionSchema],
      validate: [
        {
          validator(v) {
            return v.length <= 10;
          },
          message: 'Cannot store more than 10 questions.',
        },
      ],
    },
    type: { type: String, enum: QUIZ_TYPES },
    bloomLevel: { type: String, enum: BLOOM_LEVELS },
    deadline: { type: Date },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    aiProvider: {
      type: String,
      enum: ['openai', 'gemini', 'manual', 'mock'],
      default: 'manual',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Quiz', quizSchema);
