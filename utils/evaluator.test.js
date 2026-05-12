const { scoreMcq, scoreFillUp, scoreQuestion } = require('./evaluator');

// ─── scoreMcq tests ───────────────────────────────────────────
describe('scoreMcq', () => {
  const q = { correctKey: '2', points: 10 };

  test('correct answer returns full points', () => {
    expect(scoreMcq(q, '2')).toBe(10);
  });

  test('wrong answer returns 0', () => {
    expect(scoreMcq(q, '3')).toBe(0);
  });

  test('invalid (non-numeric) answer returns 0', () => {
    expect(scoreMcq(q, 'abc')).toBe(0);
  });

  test('correctKey as number works', () => {
    expect(scoreMcq({ correctKey: 1, points: 10 }, '1')).toBe(10);
  });
});

// ─── scoreFillUp tests ────────────────────────────────────────
describe('scoreFillUp', () => {
  const q = { correctKey: 'Photosynthesis', points: 10 };

  test('exact match (case-insensitive) returns full points', () => {
    expect(scoreFillUp(q, 'photosynthesis')).toBe(10);
  });

  test('extra whitespace is ignored', () => {
    expect(scoreFillUp(q, '  Photosynthesis  ')).toBe(10);
  });

  test('wrong answer returns 0', () => {
    expect(scoreFillUp(q, 'mitosis')).toBe(0);
  });

  test('empty answer returns 0', () => {
    expect(scoreFillUp(q, '')).toBe(0);
  });
});

// ─── scoreQuestion tests ──────────────────────────────────────
describe('scoreQuestion', () => {
  test('MCQ correct returns score object with full points', async () => {
    const q = { type: 'MCQ', correctKey: '0', points: 10 };
    const result = await scoreQuestion(q, { answer: '0' });
    expect(result.score).toBe(10);
    expect(result.maxPoints).toBe(10);
    expect(result.feedback).toBe('Correct');
  });

  test('MCQ wrong returns 0 score', async () => {
    const q = { type: 'MCQ', correctKey: '0', points: 10 };
    const result = await scoreQuestion(q, { answer: '2' });
    expect(result.score).toBe(0);
  });

  test('Fill-up correct returns full points', async () => {
    const q = { type: 'Fill-up', correctKey: 'Newton', points: 5 };
    const result = await scoreQuestion(q, { answer: 'newton' });
    expect(result.score).toBe(5);
  });

  test('unsupported type returns 0', async () => {
    const q = { type: 'Essay', points: 10 };
    const result = await scoreQuestion(q, { answer: 'some answer' });
    expect(result.score).toBe(0);
    expect(result.feedback).toBe('Unsupported type.');
  });
});
