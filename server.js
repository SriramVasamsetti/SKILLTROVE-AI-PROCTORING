require('dotenv').config();

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason instanceof Error ? reason.stack : reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const { connectDatabase } = require('./config/db');
const { errorMiddleware } = require('./middleware/error.middleware');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const quizRoutes = require('./routes/quiz.routes');
const reportRoutes = require('./routes/report.routes');
const proctoringRoutes = require('./routes/proctoring.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const discussionRoutes = require('./routes/discussion.routes');
const notificationRoutes = require('./routes/notification.routes');
const codingRoutes = require('./routes/coding.routes');
const groupRoutes = require('./routes/group.routes');
const leaderboardRoutes = require('./routes/leaderboard.routes');

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }),
);
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => res.json({ ok: true, service: 'skilltrove', ts: Date.now() }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/proctor', proctoringRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/coding', codingRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.get('/', (req, res) => res.json({ status: 'SkillTrove API is Live' }));

app.use((req, res) => res.status(404).json({ message: 'Not found', path: req.path }));

app.use(errorMiddleware);

const port = Number(process.env.PORT || 5050);

connectDatabase(process.env.MONGODB_URI?.trim?.() ?? process.env.MONGODB_URI)
  .then(() => {
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Stop the other process or set PORT in .env to a free port.`);
      } else {
        console.error('HTTP server error:', err);
      }
      process.exit(1);
    });

    server.listen(port, () => {
      console.log(`SkillTrove backend listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed', err);
    process.exit(1);
  });

module.exports = { app, server };
