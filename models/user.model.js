const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    /** Face landmark embedding — typically 128 floats from face-api.js */
    faceDescriptor: {
      type: [Number],
      validate: [
        {
          validator(v) {
            return (
              Array.isArray(v) &&
              v.length > 0 &&
              v.every((n) => typeof n === 'number' && Number.isFinite(n))
            );
          },
          message: 'faceDescriptor must be a non-empty array of finite numbers.',
        },
      ],
    },
    profileImage: { type: String },
    role: {
      type: String,
      enum: ROLES,
      default: 'student',
      index: true,
    },
    roll: { type: String, trim: true, sparse: true },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, select: false },
  },
  { timestamps: true },
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.verifyPassword = function verifyPassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
