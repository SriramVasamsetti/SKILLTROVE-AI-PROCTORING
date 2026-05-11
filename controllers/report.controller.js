const QuizAttempt = require('../models/quizAttempt.model');
const Quiz = require('../models/quiz.model');
const User = require('../models/user.model');
const ProctorLog = require('../models/proctoring.model');
const { asyncHandler } = require('../middleware/asyncHandler');
const { generateStudentReportPdf } = require('../utils/pdf');

async function pdfReport(req, res) {
  const attempt = await QuizAttempt.findById(req.params.attemptId);
  if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
  const isOwner = String(attempt.userId) === String(req.user.userId);
  const isPrivileged = ['admin', 'faculty'].includes(req.user.role);

  if (!isOwner && !isPrivileged) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const [quiz, user] = await Promise.all([Quiz.findById(attempt.quizId), User.findById(attempt.userId)]);

  if (!quiz) return res.status(404).json({ message: 'Linked quiz missing' });
  if (!user) return res.status(404).json({ message: 'User record missing for this attempt' });

  let proctorSummary;
  if (attempt.proctoringSessionId) {
    let log = await ProctorLog.findOne({
      sessionId: attempt.proctoringSessionId,
      userId: attempt.userId,
    });
    if (!log) log = await ProctorLog.findOne({ sessionId: attempt.proctoringSessionId });
    if (log) {
      const eventCounts = log.events.reduce((acc, ev) => {
        acc[ev.type] = (acc[ev.type] || 0) + 1;
        return acc;
      }, {});
      proctorSummary = { webcamAllowed: log.webcamAllowed, eventCounts, lastUpdated: log.updatedAt };
    }
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="skilltrove-report-${attempt._id}.pdf"`);

  generateStudentReportPdf({
    stream: res,
    user,
    attempt,
    quiz,
    proctorSummary,
  });

  attempt.reportGeneratedAt = new Date();
  await attempt.save();
}

async function getAttemptReport(req, res) {
  const attempt = await QuizAttempt.findById(req.params.attemptId);
  if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
  const isOwner = String(attempt.userId) === String(req.user.userId);
  const isPrivileged = ['admin', 'faculty'].includes(req.user.role);

  if (!isOwner && !isPrivileged) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const quiz = await Quiz.findById(attempt.quizId);
  
  let proctorSummary = null;
  if (attempt.proctoringSessionId) {
    const log = await ProctorLog.findOne({
      sessionId: attempt.proctoringSessionId,
      userId: attempt.userId,
    });
    if (log) {
      proctorSummary = {
        webcamAllowed: log.webcamAllowed,
        eventCounts: log.events.reduce((acc, ev) => {
          acc[ev.type] = (acc[ev.type] || 0) + 1;
          return acc;
        }, {}),
      };
    }
  }

  res.json({
    attempt,
    quiz,
    proctorSummary,
    generatedAt: new Date()
  });
}

async function pdfDownload(req, res) {
  const latest = await QuizAttempt.findOne({ userId: req.user.userId, completedAt: { $exists: true, $ne: null } })
    .sort({ completedAt: -1 })
    .lean();
  if (!latest) {
    return res.status(404).json({ message: 'No completed attempts found for this user.' });
  }
  req.params.attemptId = String(latest._id);
  return pdfReport(req, res);
}

module.exports = {
  pdfReport: asyncHandler(pdfReport),
  getAttemptReport: asyncHandler(getAttemptReport),
  pdfDownload: asyncHandler(pdfDownload),
};
