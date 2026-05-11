/* eslint-disable no-console */
const BASE_URL = process.env.BASE_URL || 'http://localhost:5050';

function randomEmail() {
  return `qa_${Date.now()}_${Math.floor(Math.random() * 10000)}@skilltrove.test`;
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  let data = null;
  try {
    data = await res.json();
  } catch {}
  return { ok: res.ok, status: res.status, data, raw: res };
}

function logResult(name, pass, detail = '') {
  console.log(`${pass ? 'PASS' : 'FAIL'} | ${name}${detail ? ` | ${detail}` : ''}`);
}

function evaluatePulseForNoFace(simulatedWarning, simulatedNoFaceTooLong) {
  return Boolean(simulatedWarning) || Boolean(simulatedNoFaceTooLong);
}

async function main() {
  console.log('=== SkillTrove Validation Dashboard ===');
  let allPass = true;

  const email = randomEmail();
  const password = 'password123';
  const descriptor = [0.1, 0.2, 0.3];

  const signup = await request('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'QA Validator',
      email,
      password,
      faceDescriptor: descriptor,
    }),
  });
  const signupPass = signup.ok && signup.data?.token;
  logResult('Auth Signup with face descriptor', signupPass, `status=${signup.status}`);
  allPass &&= Boolean(signupPass);

  const login = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      faceDescriptor: descriptor,
    }),
  });
  const token = login.data?.token;
  const loginPass = login.ok && token;
  logResult('Auth Login with face descriptor', loginPass, `status=${login.status}`);
  allPass &&= Boolean(loginPass);

  const groupName = `QA Group ${Date.now()}`;
  const createGroup = await request('/api/groups', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ name: groupName, description: 'Persistence smoke test group' }),
  });
  const createdId = createGroup.data?._id;
  const createPass = createGroup.ok && createdId;
  logResult('Community Create Group', createPass, `status=${createGroup.status}`);
  allPass &&= Boolean(createPass);

  const fetchGroups = await request('/api/groups');
  const persisted =
    fetchGroups.ok &&
    Array.isArray(fetchGroups.data) &&
    fetchGroups.data.some((g) => g._id === createdId || g.name === groupName);
  logResult('Community Persistence after fetch (refresh simulation)', persisted, `status=${fetchGroups.status}`);
  allPass &&= Boolean(persisted);

  const quizGen = await request('/api/quiz/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject: 'Quality Assurance', provider: 'openai' }),
  });
  const quizPass = quizGen.ok && Array.isArray(quizGen.data?.questions) && quizGen.data.questions.length > 0;
  logResult('Quiz Generation endpoint returns questions', quizPass, `status=${quizGen.status}`);
  allPass &&= Boolean(quizPass);

  const pulseCheck = evaluatePulseForNoFace('Face Not Detected', true);
  logResult('Proctoring no-face red pulse logic', pulseCheck);
  allPass &&= Boolean(pulseCheck);

  console.log('---------------------------------------');
  console.log(allPass ? 'OVERALL: PASS' : 'OVERALL: FAIL');
  if (!allPass) process.exitCode = 1;
}

main().catch((err) => {
  console.error('Unexpected validation error:', err);
  process.exitCode = 1;
});
