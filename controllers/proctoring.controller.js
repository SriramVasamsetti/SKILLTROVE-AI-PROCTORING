const ProctorLog = require('../models/proctoring.model');
const { asyncHandler } = require('../middleware/asyncHandler');

async function ingestEvents(req, res) {
  const { sessionId, quizId, attemptId, webcamAllowed, events } = req.body;
  if (!sessionId || !Array.isArray(events)) {
    return res.status(400).json({ message: 'sessionId and events[] required' });
  }

  const userId = req.user.userId;
  let doc = await ProctorLog.findOne({ sessionId, userId });
  if (!doc) {
    doc = await ProctorLog.create({
      sessionId,
      userId,
      quizId,
      attemptId,
      events: [],
      webcamAllowed: webcamAllowed !== false,
    });
  }

  if (quizId) doc.quizId = quizId;
  if (attemptId) doc.attemptId = attemptId;
  if (typeof webcamAllowed === 'boolean') doc.webcamAllowed = webcamAllowed;

  doc.events.push(
    ...events.map((ev) => ({
      type: ev.type,
      value: ev.value,
      message: ev.message,
      metadata: ev.metadata,
      at: ev.at ? new Date(ev.at) : new Date(),
    })),
  );

  if (doc.events.length > 5000) {
    doc.events = doc.events.slice(-5000);
  }

  await doc.save();

  /** Webcam revoked — server-side anomaly flag handled on submit via session lookup */
  res.status(202).json({ accepted: doc.events.length, sessionId });
}

async function webcamDeniedAlert(req, res) {
  return ingestEvents(req, res);
}

async function sessionSummary(req, res) {
  const doc = await ProctorLog.findOne({ sessionId: req.params.sessionId, userId: req.user.userId }).lean();
  if (!doc) return res.status(404).json({ message: 'Session not found' });
  res.json(doc);
}

module.exports = {
  ingestEvents: asyncHandler(ingestEvents),
  webcamDeniedAlert: asyncHandler(webcamDeniedAlert),
  sessionSummary: asyncHandler(sessionSummary),
};
