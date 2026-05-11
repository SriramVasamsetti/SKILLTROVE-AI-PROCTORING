const { gradeCoding, gradeShortAnswer } = require('./ai');

function normalizeAnswer(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function scoreMcq(q, reply) {
  const idx = parseInt(reply, 10);
  const key = typeof q.correctKey === 'string' ? parseInt(q.correctKey, 10) : q.correctKey;
  const ok = !Number.isNaN(idx) && idx === Number(key);
  return ok ? q.points || 10 : 0;
}

function scoreFillUp(q, reply) {
  const expected = normalizeAnswer(q.correctKey);
  const got = normalizeAnswer(reply);
  return got === expected ? q.points || 10 : 0;
}

/**
 * @param {*} q Quiz question snapshot
 * @param {*} reply client answer payload
 */
async function scoreQuestion(q, reply, aiProvider = 'openai') {
  const max = q.points || 10;
  const ans = reply?.answer;

  switch (q.type) {
    case 'MCQ': {
      const pts = scoreMcq(q, ans);
      return { score: pts, maxPoints: max, feedback: pts >= max ? 'Correct' : 'Incorrect option.' };
    }
    case 'Fill-up': {
      const pts = scoreFillUp(q, ans);
      return { score: pts, maxPoints: max, feedback: pts >= max ? 'Exact match.' : 'Does not match expected answer.' };
    }
    case 'Short Ans': {
      const graded = await gradeShortAnswer(q, ans, aiProvider);
      const ratio = Math.min(Math.max(Number(graded.scoreRatio) || 0, 0), 1);
      return {
        score: ratio * max,
        maxPoints: max,
        feedback: graded.feedback || '',
      };
    }
    case 'Coding': {
      const graded = await gradeCoding(q, ans, aiProvider);
      const ratio = Math.min(Math.max(Number(graded.scoreRatio) || 0, 0), 1);
      return {
        score: ratio * max,
        maxPoints: max,
        feedback: graded.feedback || '',
      };
    }
    default:
      return { score: 0, maxPoints: max, feedback: 'Unsupported type.' };
  }
}

async function scoreAttempt(questions, responses, aiProvider) {
  const answersByIndex = new Map(responses.map((r) => [r.questionIndex, r]));
  const detailed = [];
  let total = 0;
  let maxTotal = 0;

  for (let i = 0; i < questions.length; i += 1) {
    const q = questions[i];
    const payload = answersByIndex.get(i) ?? { answer: '' };
    const result = await scoreQuestion(q, payload, aiProvider);
    maxTotal += result.maxPoints;
    total += result.score;
    detailed.push({
      questionIndex: i,
      type: q.type,
      answer: payload.answer,
      score: result.score,
      maxPoints: result.maxPoints,
      feedback: result.feedback,
    });
  }

  return { totalScore: total, maxScore: maxTotal, detailed };
}

module.exports = { scoreQuestion, scoreAttempt, scoreMcq, scoreFillUp };
