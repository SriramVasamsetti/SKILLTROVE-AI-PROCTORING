const Quiz = require('../models/quiz.model');
const QuizAttempt = require('../models/quizAttempt.model');
const { QUIZ_TYPES, BLOOM_LEVELS } = require('../config/constants');
const { asyncHandler } = require('../middleware/asyncHandler');
const { generateMixedQuestions } = require('../utils/ai');
const { scoreAttempt } = require('../utils/evaluator');
const { bumpHeatmap, pushScoreEntry } = require('../utils/analyticsAggregator');
const ProctorLog = require('../models/proctoring.model');
const Notification = require('../models/notification.model');
const User = require('../models/user.model');

function shouldUseMockQuizGeneration() {
  const key = (process.env.OPENAI_API_KEY ?? '').trim();
  return key === 'mock_key' || key === '';
}

/**
 * Returns 10 scaffold questions tailored to `subject`:
 * 5 MCQ, 2 Fill-up, 2 Short Ans, 1 Coding (offline / no API key).
 */
function buildMockQuizQuestions(subjectRaw) {
  const cleaned = String(subjectRaw ?? '').trim().slice(0, 280);
  const s = cleaned.length ? cleaned : 'this subject';

  return [
    {
      type: 'MCQ',
      level: 'Remember',
      prompt: `Which option best captures a central learning outcome for "${s}"?`,
      options: [`Memorizing unrelated trivia`, `Building transferable skills grounded in "${s}"`, `Avoiding practice problems`, `"${s}" is only about intuition`],
      correctKey: '1',
      points: 10,
    },
    {
      type: 'MCQ',
      level: 'Understand',
      prompt: `"Understand" (Bloom's) in "${s}" most closely means:`,
      options: [`Recall facts verbatim only`, `Explain ideas using examples from "${s}"`, `Produce an invention with no rationale`, `Skip connecting concepts across "${s}"`],
      correctKey: '1',
      points: 10,
    },
    {
      type: 'MCQ',
      level: 'Apply',
      prompt: `You are given a real scenario tied to "${s}". Applying knowledge rather than quoting definitions is called:`,
      options: [`Remember`, `Understand`, `Apply`, `Memorization-only`],
      correctKey: '2',
      points: 10,
    },
    {
      type: 'MCQ',
      level: 'Analyze',
      prompt: `Breaking a "${s}" problem into assumptions, evidence, and conclusions primarily reflects:`,
      options: [`Apply`, `Analyze`, `Remember`, `Unrelated brainstorming`],
      correctKey: '1',
      points: 10,
    },
    {
      type: 'MCQ',
      level: 'Evaluate',
      prompt: `Defending why one "${s}" approach is better given criteria is aligned with:`,
      options: [`Create`, `Evaluate`, `Understand`, `Rote rehearsal`],
      correctKey: '1',
      points: 10,
    },
    {
      type: 'Fill-up',
      level: 'Apply',
      prompt: `Complete with one word: A reliable study plan for "${s}" blends deliberate practice with periodic _____.`,
      correctKey: 'review',
      points: 10,
    },
    {
      type: 'Fill-up',
      level: 'Remember',
      prompt: `The cognitive skill of retrieving core facts about "${s}" without aids maps to Bloom's level called _____. (one word: remember)`,
      correctKey: 'remember',
      points: 10,
    },
    {
      type: 'Short Ans',
      level: 'Analyze',
      prompt: `In 2–3 sentences, compare two misconceptions students often hold about "${s}" and how you would diagnose them.`,
      modelAnswer: `Name two misconceptions, cite how each affects performance, propose a quiz or probing question.`,
      correctKey: 'rubric-aligned response',
      points: 12,
    },
    {
      type: 'Short Ans',
      level: 'Evaluate',
      prompt: `Argue briefly which assessment format (timed MCQ vs project) better measures mastery of "${s}" for juniors, citing trade-offs.`,
      modelAnswer: `States a position; compares validity, authenticity, cheating risk, fairness; cites at least two trade-offs.`,
      correctKey: 'position+rationale',
      points: 12,
    },
    {
      type: 'Coding',
      level: 'Create',
      prompt: `Write minimal JavaScript that reads lines from stdin; first line count n (1–50), second line n ints; print their sum.`,
      correctKey: 'sum',
      modelAnswer: `Read input, split, accumulate sum, console.log.`,
      codingMeta: { language: 'javascript', stdin: '3\n1 5 10\n', expectedStdout: '16' },
      points: 16,
    },
  ];
}

function normalizeQuestion(q) {
  const rawType = String(q.type ?? '').trim();
  const typeKey = rawType.toLowerCase().replace(/\s|-|_/g, '');
  const synonyms = {
    mcq: 'MCQ',
    multiplechoice: 'MCQ',
    fillup: 'Fill-up',
    fillintheblank: 'Fill-up',
    shortanswer: 'Short Ans',
    shortans: 'Short Ans',
    sa: 'Short Ans',
    code: 'Coding',
    programming: 'Coding',
  };

  let typeNorm = QUIZ_TYPES.find((t) => t.toLowerCase().replace(/\s+/g, '') === typeKey) || synonyms[typeKey];
  if (!typeNorm) typeNorm = 'Short Ans';

  const rawBloom = String(q.level ?? q.bloom ?? '').trim();
  let bloomNorm = BLOOM_LEVELS.find((b) => b.toLowerCase() === rawBloom.toLowerCase());
  if (!bloomNorm && rawBloom) {
    const bKey = rawBloom.toLowerCase();
    bloomNorm = (
      {
        remembering: 'Remember',
        understanding: 'Understand',
        applying: 'Apply',
        analyzing: 'Analyze',
        evaluating: 'Evaluate',
        creating: 'Create',
      }[bKey] || bloomNorm
    );
  }
  if (!bloomNorm) bloomNorm = 'Understand';

  return {
    type: typeNorm,
    level: bloomNorm,
    prompt: q.prompt,
    options: q.options || [],
    correctKey: q.correctKey === undefined || q.correctKey === null ? undefined : String(q.correctKey),
    modelAnswer: q.modelAnswer,
    codingMeta: q.codingMeta,
    points: q.points || 10,
  };
}

async function generateAiQuiz(req, res) {
  const { 
    subject, 
    title,
    count = 10, 
    provider = 'gemini', 
    type = 'Mixed', 
    bloomLevel = 'Mixed',
    deadline 
  } = req.body;

  if (!subject) return res.status(400).json({ message: 'subject required' });
  if (!['openai', 'gemini'].includes(provider)) {
    return res.status(400).json({ message: 'provider must be openai or gemini' });
  }

  let rawQuestions;
  let aiProviderStored = provider;

  if (shouldUseMockQuizGeneration()) {
    rawQuestions = buildMockQuizQuestions(subject);
    aiProviderStored = 'mock';
  } else {
    rawQuestions = await generateMixedQuestions(subject, provider, count, type, bloomLevel);
  }

  let quiz;
  try {
    quiz = await Quiz.create({
      subject,
      title: title || `${subject} Assessment`,
      questions: rawQuestions.map((q) => normalizeQuestion(q)),
      aiProvider: aiProviderStored,
      type: type !== 'Mixed' ? type : undefined,
      bloomLevel: bloomLevel !== 'Mixed' ? bloomLevel : undefined,
      deadline: deadline ? new Date(deadline) : undefined,
      createdBy: req.user.userId,
      assignedBy: req.user.role === 'faculty' ? req.user.userId : undefined,
    });
  } catch (err) {
    console.error('[quiz/generate] Database error:', err.message);
    return res.status(503).json({ message: 'Could not save quiz.' });
  }

  res.status(201).json(quiz);

  // If assigned by faculty, create a notification for students
  if (quiz.assignedBy) {
    try {
      const students = await User.find({ role: 'student' }).select('_id').limit(100).lean();
      const notifications = students.map(s => ({
        userId: s._id,
        channel: 'quiz',
        title: 'New Assignment Assigned',
        detail: `Prof. ${req.user.name || 'Faculty'} assigned: ${quiz.title || quiz.subject}`,
        refModel: 'Quiz',
        refId: quiz._id
      }));
      await Notification.insertMany(notifications);
    } catch (err) {
      console.error('[quiz/notify] Error:', err.message);
    }
  }
}

async function createManualQuiz(req, res) {
  const { subject, questions } = req.body;
  if (!subject || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: 'subject and questions[] required' });
  }
  if (questions.length > 10) return res.status(400).json({ message: 'Max 10 questions' });

  const quiz = await Quiz.create({
    subject,
    questions,
    aiProvider: 'manual',
    createdBy: req.user.userId,
  });
  res.status(201).json(quiz);
}

async function listQuizzes(req, res) {
  const { subject, assignedOnly } = req.query;
  const filter = { archived: false };
  
  if (assignedOnly === 'true') {
    filter.assignedBy = { $exists: true };
  } else {
    filter.assignedBy = { $exists: false };
  }

  if (subject) filter.subject = new RegExp(subject, 'i');
  
  const items = await Quiz.find(filter)
    .sort({ createdAt: -1 })
    .populate('assignedBy', 'name')
    .limit(100)
    .lean();
  res.json(items);
}

async function getQuiz(req, res) {
  const quiz = await Quiz.findById(req.params.id).lean();
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

  const privileged =
    req.user &&
    (req.user.role === 'admin' ||
      req.user.role === 'faculty' ||
      String(quiz.createdBy) === String(req.user.userId));

  if (!privileged && quiz.questions?.length) {
    quiz.questions = quiz.questions.map((q) => {
      const safe = {
        ...q,
        correctKey: undefined,
        modelAnswer: undefined,
      };
      if (safe.codingMeta) {
        safe.codingMeta = {
          language: safe.codingMeta.language,
          stdin: safe.codingMeta.stdin,
        };
      }
      return safe;
    });
  }

  res.json(quiz);
}

async function archiveQuiz(req, res) {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ message: 'Not found' });
  if (String(quiz.createdBy) !== String(req.user.userId) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  quiz.archived = true;
  await quiz.save();
  res.json({ message: 'Archived' });
}

async function submitQuiz(req, res) {
  const { responses, proctoringSessionId, aiProvider = 'openai' } = req.body;
  if (!Array.isArray(responses)) return res.status(400).json({ message: 'responses[] required' });

  const quiz = await Quiz.findById(req.params.id);
  if (!quiz || quiz.archived) return res.status(404).json({ message: 'Quiz not found' });

  const { totalScore, maxScore, detailed } = await scoreAttempt(quiz.questions, responses, aiProvider);

  let flagged = false;
  if (proctoringSessionId) {
    const log = await ProctorLog.findOne({ sessionId: proctoringSessionId, userId: req.user.userId });
    if (log) {
      const bad = log.events.some((e) => {
        if (e.type !== 'webcam-status') return false;
        if (typeof e.value === 'object' && e.value && e.value.allowed === false) return true;
        return String(e.message || '').toLowerCase().includes('denied');
      });
      flagged = bad || log.webcamAllowed === false;
    }
  }

  const attempt = await QuizAttempt.create({
    userId: req.user.userId,
    quizId: quiz._id,
    responses: detailed,
    totalScore,
    maxScore,
    proctoringSessionId,
    flagged,
    completedAt: new Date(),
  });

  if (proctoringSessionId) {
    await ProctorLog.updateOne(
      { sessionId: proctoringSessionId, userId: req.user.userId },
      { $set: { attemptId: attempt._id } },
    );
  }

  await bumpHeatmap(req.user.userId);
  await pushScoreEntry(req.user.userId, {
    attemptId: attempt._id,
    quizId: quiz._id,
    score: totalScore,
    maxScore,
    pct: maxScore ? totalScore / maxScore : 0,
    at: attempt.completedAt,
  });

  res.status(201).json({ attempt });
}

async function listMyAttempts(req, res) {
  const items = await QuizAttempt.find({ userId: req.user.userId })
    .sort({ completedAt: -1 })
    .limit(50)
    .populate('quizId')
    .lean();
  res.json(items);
}

module.exports = {
  generateAiQuiz: asyncHandler(generateAiQuiz),
  createManualQuiz: asyncHandler(createManualQuiz),
  listQuizzes: asyncHandler(listQuizzes),
  getQuiz: asyncHandler(getQuiz),
  archiveQuiz: asyncHandler(archiveQuiz),
  submitQuiz: asyncHandler(submitQuiz),
  listMyAttempts: asyncHandler(listMyAttempts),
};
