const OpenAI = require('openai');
const axios = require('axios');

/**
 * @function buildPrompt
 * @description Constructs a specialized prompt for AI quiz generation based on Bloom's Taxonomy.
 * @param {string} subject - The core topic (e.g., Computer Science).
 * @param {number} count - Number of questions to generate (max 10).
 * @param {string} type - Specific question type (MCQ, Coding, etc.).
 * @param {string} bloomLevel - Targeted Bloom's level (Remember, Apply, etc.).
 * @returns {string} - The formatted prompt.
 */
function buildPrompt(subject, count = 10, type = 'Mixed', bloomLevel = 'Mixed') {
  const bloomDescriptions = {
    'Remember': 'Retrieve relevant knowledge from long-term memory. Use "What is...", "Identify...", "Recall..."',
    'Understand': 'Determine the meaning of instructional messages. Use "Explain...", "Summarize...", "Paraphrase..."',
    'Apply': 'Carry out or use a procedure in a given situation. Use scenario-based "How would you use...", "Demonstrate..."',
    'Analyze': 'Break material into constituent parts. Use "Differentiate...", "Organize...", "Deconstruct..."',
    'Evaluate': 'Make judgments based on criteria and standards. Use "Critique...", "Justify...", "Check..."',
    'Create': 'Put elements together to form a novel, coherent whole. Use "Design...", "Generate...", "Plan..."',
    'Mixed': 'Cover various levels of Bloom\'s Taxonomy from Remember to Create.'
  };

  const typeDesc = type === 'Mixed' 
    ? 'mixed across types (some MCQ, some Fill-up, some Short Ans, some Coding)' 
    : `strictly of type "${type}"`;

  return `
You are an expert assessment author for SkillTrove. Produce EXACTLY ${count} JSON-safe quiz questions.
The questions must be ${typeDesc}.
Topic: "{{SUBJECT}}".
Target Bloom's Level: ${bloomLevel} - ${bloomDescriptions[bloomLevel] || ''}

CRITICAL REQUIREMENTS:
1. Language: Use Simple, Clear English (University intro level).
2. Cognitive Depth: Strictly follow the Bloom's Level provided. If "Apply" is selected, provide a realistic scenario.
3. Logical Consistency: Ensure options are plausible but clearly distinguished.

Respond with RAW JSON ONLY (no markdown), shape:
{
  "questions": [
    {
      "type": "${type === 'Mixed' ? 'MCQ" | "Fill-up" | "Short Ans" | "Coding' : type}",
      "level": "${bloomLevel === 'Mixed' ? 'Remember"|"Understand"|"Apply"|"Analyze"|"Evaluate"|"Create' : bloomLevel}",
      "prompt": "string",
      "options": ["only for MCQ, 4 choices"],
      "correctKey": "for MCQ: 0-3 index as string; for Fill-up: exact answer; for Short Ans: reference model answer; for Coding: expected stdout",
      "modelAnswer": "rubric for Short Ans or detailed explanation",
      "codingMeta": { "language": "javascript", "stdin": "optional", "expectedStdout": "string" }
    }
  ]
}

Rules:
- Exactly ${count} items in "questions".
- MCQ must have 4 options and correctKey "0","1","2", or "3".
- If type is "Coding", include codingMeta.
`.replace('{{SUBJECT}}', subject).trim();
}

/**
 * @function safeParseAiJson
 * @description Safely extracts and parses JSON from AI response strings.
 */
function safeParseAiJson(rawText) {
  const text = typeof rawText === 'string' ? rawText.trim() : '';
  const slice = /\{[\s\S]*\}/.exec(text);
  try {
    return JSON.parse(slice ? slice[0] : text);
  } catch {
    return null;
  }
}

/**
 * @function coerceQuestions
 * @description Validates and cleans the questions array from AI response.
 */
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

/**
 * @function generateQuizWithOpenAI
 */
async function generateQuizWithOpenAI(subject, count, type, bloomLevel) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY missing');
  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [{ role: 'user', content: buildPrompt(subject, count, type, bloomLevel) }],
    temperature: 0.45,
    max_tokens: 4096,
  });
  const text = response.choices[0]?.message?.content ?? '';
  return coerceQuestions(text);
}

/**
 * @function generateQuizWithGemini
 */
async function generateQuizWithGemini(subject, count, type, bloomLevel) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY missing');
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const { data } = await axios.post(
    url,
    {
      contents: [{ parts: [{ text: buildPrompt(subject, count, type, bloomLevel) }] }],
      generationConfig: { temperature: 0.45, maxOutputTokens: 4096 },
    },
    { timeout: 120_000 },
  );
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
  return coerceQuestions(text);
}

/**
 * @function generateMixedQuestions
 * @description Core entry point for AI question generation with advanced taxonomy controls.
 */
async function generateMixedQuestions(subject, provider, count, type = 'Mixed', bloomLevel = 'Mixed') {
  if (provider === 'gemini') return generateQuizWithGemini(subject, count, type, bloomLevel);
  return generateQuizWithOpenAI(subject, count, type, bloomLevel);
}

/**
 * AI Grading Utilities
 */
async function gradeWithOpenAIJson(instruction) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY missing');
  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [{ role: 'user', content: instruction }],
    temperature: 0.1,
    max_tokens: 512,
  });
  const text = response.choices[0]?.message?.content ?? '';
  const parsed = safeParseAiJson(text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()) || {};
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
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
  const parsed = safeParseAiJson(text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()) || {};
  return {
    scoreRatio: Math.min(Math.max(Number(parsed.scoreRatio) || 0, 0), 1),
    feedback: String(parsed.feedback || ''),
  };
}

function useMockOpenAiKey() {
  const k = (process.env.OPENAI_API_KEY || '').trim();
  return k === '' || k === 'mock_key';
}

/**
 * @function gradeShortAnswer
 */
async function gradeShortAnswer(q, studentAnswer, provider) {
  if (provider !== 'gemini' && useMockOpenAiKey()) {
    const text = String(studentAnswer ?? '').trim();
    const len = text.length;
    const ratio = len >= 140 ? 0.88 : len >= 40 ? 0.72 : len > 0 ? 0.45 : 0;
    return {
      scoreRatio: ratio,
      feedback: ratio >= 0.72 ? '[mock] Strong detail.' : len ? '[mock] Needs specificity.' : '[mock] No answer.',
    };
  }
  const instruction = `Grade short answer. Q: ${q.prompt}, Model: ${q.modelAnswer}, Student: ${studentAnswer}. Return JSON: { scoreRatio, feedback }`;
  if (provider === 'gemini') return gradeWithGeminiJson(instruction);
  return gradeWithOpenAIJson(instruction);
}

/**
 * @function gradeCoding
 */
async function gradeCoding(q, studentCode, provider) {
  if (provider !== 'gemini' && useMockOpenAiKey()) {
    const raw = String(studentCode ?? '').trim();
    const lines = raw.split(/\n/).filter((l) => l.trim()).length;
    const ratio = raw.includes('console.log') && (raw.includes('split') || raw.includes('stdin')) ? 0.86 : lines >= 4 ? 0.74 : raw.length ? 0.42 : 0;
    return {
      scoreRatio: ratio,
      feedback: ratio >= 0.74 ? '[mock] Correct structure.' : raw.length ? '[mock] Incomplete.' : '[mock] Missing.',
    };
  }
  const instruction = `Grade coding. Prob: ${q.prompt}, Student: ${studentCode}. Return JSON: { scoreRatio, feedback }`;
  if (provider === 'gemini') return gradeWithGeminiJson(instruction);
  return gradeWithOpenAIJson(instruction);
}

module.exports = {
  generateMixedQuestions,
  gradeShortAnswer,
  gradeCoding,
};
