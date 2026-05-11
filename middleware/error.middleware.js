const mongoose = require('mongoose');

// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: 'Invalid identifier', path: err.path });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ message: 'Validation failed', errors: err.errors });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate key', detail: err.keyValue });
  }

  const body = {
    message: err.message || 'Internal Server Error',
  };
  if (!isProd && err.stack) body.stack = err.stack;

  res.status(Number.isFinite(status) ? status : 500).json(body);
}

module.exports = { errorMiddleware };
