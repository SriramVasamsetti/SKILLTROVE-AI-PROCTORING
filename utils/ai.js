const OpenAI = require('openai');
const axios = require('axios');

const MIXED_PROMPT_TEMPLATE = `
You are an assessment author for SkillTrove. Produce EXACTLY 10 JSON-safe quiz questions mixed across types:
some MCQ, some Fill-up, some Short Ans, some Coding problems.
Subjects: STEM and general knowledge tuned to "{{SUBJECT}}" at university intro level.

CRITICAL REQUIREMENT: Questions MUST explicitly follow Bloom's Taxonomy levels, focusing deeply on Apply, Analyze, and Evaluate scenarios.
Provide scenario-based prompts and highly logical options instead of rote definitions.

Respond with RAW JSON ONLY (no markdown), shape:
{
  "questions": [
    {
      "type": "MCQ" | "Fill-up" | "Short Ans" | "Coding",
      "level": "Remember"|"Understand"|"Apply"|"Analyze"|"Evaluate"|"Create",
      "prompt": "string",
      "options": ["only for MCQ, 4 choices"],
      "correctKey": "for MCQ: 0-3 index as string; for Fill-up: exact answer (case-insensitive match); for Short Ans: reference model answer; for Coding: expected stdout after mock run",
      "modelAnswer": "model answer or rubric for Short Ans / explanation",
      "codingMeta": { "language": "javascript", "stdin": "optional", "expectedStdout": "string" }
    }
  ]
}

Rules:
- Exactly 10 items in "questions".
- Spread types (at least 2 MCQ, 2 Fill-up, 2 Short Ans, 2 Coding if possible).
- MCQ must have 4 options and correctKey "0","1","2", or "3".
- Coding must include codingMeta.language and codingMeta.expectedStdout (simple stdout match for mock compiler).
`.trim();

function buildPrompt(subject, count = 10) {
  return MIXED_PROMPT_TEMPLATE
    .replace('{{SUBJECT}}', subject)
    .replace('EXACTLY 10', `EXACTLY ${count}`)
    .replace('Exactly 10 items', `Exactly ${count} items`);
}

function safeParseAiJson(rawText) {
  const text = typeof rawText === 'string' ? rawText.trim() : '';
  const slice = /\{[\s\S]*\}/.exec(text);
  try {
    return JSON.parse(slice ? slice[0] : text);
  } catch {
    return null;
  }
}

function coerceQuestions(rawText) {
  const cleaned = typeof rawText === 'string' ? rawText.trim() : '';
  const jsonStart = cleaned.indexOf('{');
  const jsonSlice = jsonStart >= 0 ? cleaned.slice(jsonStart) : cleaned;
  const parsed = safeParseAiJson(jsonSlice);
  if (!parsed?.questions || !Array.isArray(parsed.questions)) {
    throw new Error('Malformed AI response');
  }
  return parsed.questions.slice(0, 10);
}

async function generateQuizWithOpenAI(subject, count) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY missing');
  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    messages: [{ role: 'user', content: buildPrompt(subject, count) }],
    temperature: 0.4,
    max_tokens: 4096,
  });
  const text = response.choices[0]?.message?.content ?? '';
  return coerceQuestions(text);
}

async function generateQuizWithGemini(subject, count) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY missing');
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const { data } = await axios.post(
    url,
    {
      contents: [{ parts: [{ text: buildPrompt(subject, count) }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 4096 },
    },
    { timeout: 120_000 },
  );
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
  return coerceQuestions(text);
}

/**
 * @param {'openai'|'gemini'} provider
 */
async function generateMixedQuestions(subject, provider, count) {
  if (provider === 'gemini') return generateQuizWithGemini(subject, count);
  return generateQuizWithOpenAI(subject, count);
}

async function gradeWithOpenAIJson(instruction) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY missing');
  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    messages: [{ role: 'user', content: instruction }],
    temperature: 0.1,
    max_tokens: 512,
  });
  const text = response.choices[0]?.message?.content ?? '';
  const parsed =
    safeParseAiJson(text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()) || {};
  return {
    scoreRatio: Math.min(Math.max(Number(parsed.scoreRatio) || 0, 0), 1),
    feedback: String(parsed.feedback || ''),
  };
}

async function gradeWithGeminiJson(instruction) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY missing');
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const { data } = await axios.post(
    url,
    {
      contents: [{ parts: [{ text: `${instruction}\nRespond with JSON only: { "scoreRatio": 0-1, "feedback": "..." }` }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
    },
    { timeout: 60_000 },
  );
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
  const parsed =
    safeParseAiJson(text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()) || {};
  return {
    scoreRatio: Math.min(Math.max(Number(parsed.scoreRatio) || 0, 0), 1),
    feedback: String(parsed.feedback || ''),
  };
}

function useMockOpenAiKey() {
  const k = (process.env.OPENAI_API_KEY || '').trim();
  return k === '' || k === 'mock_key';
}

function buildShortAnswerInstruction(q, studentAnswer) {
  return `
You grade a short answer.
Question: ${q.prompt}
Model answer: ${q.modelAnswer || 'N/A'}
Student answer: ${studentAnswer}
Return JSON: { "scoreRatio": number between 0 and 1, "feedback": string }
`.trim();
}

function buildCodingInstruction(q, studentCode) {
  return `
You grade a coding exercise for logical correctness vs model (not execution).
Language hint: ${q.codingMeta?.language || 'unspecified'}
Problem: ${q.prompt}
Reference solution key: ${q.modelAnswer || q.correctKey || 'N/A'}
Student code:
${studentCode}
Return JSON: { "scoreRatio": number between 0 and 1, "feedback": string }
`.trim();
}

/** @param {'openai'|'gemini'} provider */
async function gradeShortAnswer(q, studentAnswer, provider) {
  if (provider !== 'gemini' && useMockOpenAiKey()) {
    const text = String(studentAnswer ?? '').trim();
    const len = text.length;
    const ratio = len >= 140 ? 0.88 : len >= 40 ? 0.72 : len > 0 ? 0.45 : 0;
    return {
      scoreRatio: ratio,
      feedback:
        ratio >= 0.72 ? '[mock] Strong detail for offline grading.' : len ? '[mock] Add more specificity.' : '[mock] No answer provided.',
    };
  }
  const instruction = buildShortAnswerInstruction(q, studentAnswer);
  if (provider === 'gemini') return gradeWithGeminiJson(instruction);
  return gradeWithOpenAIJson(instruction);
}

/** @param {'openai'|'gemini'} provider */
async function gradeCoding(q, studentCode, provider) {
  if (provider !== 'gemini' && useMockOpenAiKey()) {
    const raw = String(studentCode ?? '').trim();
    const lines = raw.split(/\n/).filter((l) => l.trim()).length;
    const ratio =
      raw.includes('console.log') && (raw.includes('split') || raw.includes('stdin')) ? 0.86 : lines >= 4 ? 0.74 : raw.length ? 0.42 : 0;
    return {
      scoreRatio: ratio,
      feedback:
        ratio >= 0.74 ? '[mock] Looks structurally plausible offline.' : raw.length ? '[mock] Incomplete solution.' : '[mock] Missing code.',
    };
  }
  const instruction = buildCodingInstruction(q, studentCode);
  if (provider === 'gemini') return gradeWithGeminiJson(instruction);
  return gradeWithOpenAIJson(instruction);
}

module.exports = {
  generateMixedQuestions,
  gradeShortAnswer,
  gradeCoding,
};
