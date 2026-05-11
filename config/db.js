const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

/**
 * Uses `process.env.MONGODB_URI` from `.env` unless a `uri` argument is passed.
 * Disconnects any existing pool first so URI changes (--watch reloads, new cluster) reconnect cleanly.
 */
async function connectDatabase(uri = process.env.MONGODB_URI) {
  const connectionString = uri?.trim?.() ?? uri;

  if (!connectionString) {
    throw new Error('MongoDB URI is missing. Set MONGODB_URI in your `.env` or environment.');
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(connectionString, {
    serverSelectionTimeoutMS: 20_000,
  });

  console.log('Database connected successfully');

  return mongoose.connection;
}

module.exports = { connectDatabase };
