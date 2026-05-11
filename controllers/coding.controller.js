const { asyncHandler } = require('../middleware/asyncHandler');
const { mockRun } = require('../utils/codingSandbox');
const Quiz = require('../models/quiz.model');

/**
 * Executes mock JS sandbox and compares stdout to quiz question expected output when quizId+qIndex supplied.
 */
async function submitCoding(req, res) {
  const { language, source, stdin, quizId, questionIndex } = req.body;
  if (!source && source !== '') return res.status(400).json({ message: 'source required' });

  const result = mockRun({ language: language || 'javascript', source, stdin: stdin ?? '' });

  let graded;
  if (quizId !== undefined && questionIndex !== undefined) {
    const quiz = await Quiz.findById(quizId).lean();
    const q = quiz?.questions?.[questionIndex];
    if (quiz && q?.type === 'Coding' && q.codingMeta?.expectedStdout != null) {
      const trimmed = String(result.stdout ?? '').trim();
      const expected = String(q.codingMeta.expectedStdout).trim();
      const matchesExpected = trimmed === expected;
      graded = {
        matchesExpected,
        hint: matchesExpected ? 'Passes mock IO check.' : 'Stdout differs from instructor key.',
      };
    }
  }

  res.json({ ...result, graded });
}

module.exports = {
  submitCoding: asyncHandler(submitCoding),
};
