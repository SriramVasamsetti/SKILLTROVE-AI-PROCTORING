const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

/**
 * Uses `process.env.MONGODB_URI` from `.env` unless a `uri` argument is passed.
 * Disconnects any existing pool first so URI changes (--watch reloads, new cluster) reconnect cleanly.
 */
async function connectDatabase(uri = process.env.MONGODB_URI || process.env.MONGO_URI) {
  const connectionString = uri?.trim?.() ?? uri;

  if (!connectionString) {
    throw new Error('MongoDB URI is missing. Set MONGODB_URI or MONGO_URI in your `.env`.');
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  return mongoose.connect(connectionString, {
    serverSelectionTimeoutMS: 30000,
    family: 4
  })
  .then(() => {
    console.log("🚀 SkillTrove Database Connected Successfully");
    return mongoose.connection;
  })
  .catch(err => {
    console.error("❌ MongoDB Atlas Error:", err.message);
  });
}

module.exports = { connectDatabase };
