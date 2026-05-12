# SkillTrove

AI-powered secure learning and assessment platform for educational institutions — combining AI proctoring, Bloom's Taxonomy quiz generation, automated evaluation, performance analytics, and community collaboration.

---

## System Architecture

### Backend
- **Runtime**: Node.js with Express.js framework
- **API**: RESTful endpoints under `/api/` (auth, quiz, proctoring, analytics, community)
- **Auth**: JWT tokens + bcrypt password hashing stored in HttpOnly cookies
- **Security**: Helmet.js, CORS, rate limiting on auth routes, centralized error middleware
- **Database**: MongoDB via Mongoose ODM
- **Pattern**: Layered architecture — `routes/` → `controllers/` → `utils/` → `models/`

### AI Proctoring (Browser-side)
- **Library**: face-api.js (TensorFlow.js based — runs entirely in browser, zero server round-trip)
- **Models**: TinyFaceDetector, FaceLandmark68Net, FaceRecognitionNet
- **Detection Features**:
  - Face presence detection (no-face alert, multi-face alert)
  - Identity verification with strict **0.42 threshold** FaceMatcher
  - Head movement detection via landmark geometry (yaw/pitch)
  - Eye blink detection via **Eye Aspect Ratio (EAR)** algorithm
- **Proctoring Loop**: Runs every 500ms during active exam (`useFacePresence.js`)
- **Termination Policy**: Auto-terminates after 2 identity mismatches or 3 general warnings

### Frontend
- **Framework**: React 18 + Tailwind CSS
- **Animation**: Framer Motion + glassmorphism UI
- **Face Pipeline**: descriptor capture at signup → matching at login → continuous verification during exam
- **Config**: `REACT_APP_API_BASE_URL` environment variable for API base URL

### AI Quiz Generation
- **Providers**: OpenAI (GPT-4.1-mini) and Google Gemini (gemini-2.0-flash)
- **Fallback**: Mock quiz generator for offline/development use
- **Taxonomy**: Bloom's Taxonomy levels (Remember → Create) integrated via `constants.js` BLOOM_LEVELS + `utils/ai.js` prompt engineering

---

## Project Structure

```
SKILLTROVE-AI-PROCTORING/
├── controllers/          # Route handlers (auth, quiz, proctoring, analytics, community)
├── middleware/           # JWT auth, error handling, asyncHandler wrapper
├── models/               # Mongoose schemas (User, Quiz, Analytics, Group)
├── routes/               # Express route definitions
├── utils/                # evaluator.js, faceMatching.js, ai.js, analyticsAggregator.js
├── config/               # DB connection, environment config
├── scripts/              # E2E smoke validation scripts
├── skilltrove_frontend/  # React 18 frontend
│   ├── src/
│   │   ├── components/   # UI components (Community, QuizInterface, Dashboard, etc.)
│   │   ├── hooks/        # useFacePresence.js — core proctoring hook
│   │   └── utils/        # Frontend helpers
│   └── public/
│       └── models/       # face-api.js model weight files
└── server.js             # Express app entry point
```

---

## Features

- **Face Biometric Authentication** — descriptor capture at signup, matching at login, continuous identity verification during exam with 0.42 threshold
- **AI Proctoring** — real-time face presence, identity mismatch, head movement, and eye blink detection via EAR algorithm
- **Bloom's Taxonomy Quiz Generation** — AI-generated questions mapped to all 6 cognitive levels
- **Automated Evaluation** — rubric-based answer scoring via `utils/evaluator.js`
- **Performance Analytics** — leaderboard, aggregated stats via `analyticsAggregator.js`
- **Community Hub** — group creation, discussion, persistence via `/api/groups`
- **Premium PDF Reports** — downloadable performance reports

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally or Atlas URI
- face-api.js model files in `skilltrove_frontend/public/models/`

### Backend
```bash
npm install
cp .env.example .env   # Fill in your keys
npm run dev
```
Backend base URL: `http://localhost:5050`

### Frontend
```bash
cd skilltrove_frontend
npm install
npm start
```
Frontend base URL: `http://localhost:3000`

### face-api.js Model Setup

Place model files under `skilltrove_frontend/public/models/`:
- `tiny_face_detector_model-weights_manifest.json`
- `face_landmark_68_model-weights_manifest.json`
- `face_recognition_model-weights_manifest.json`

Download from: https://github.com/justadudewhohacks/face-api.js/tree/master/weights

If models are missing, the UI shows a model-loading/missing fallback banner with retry option.

---

## E2E Validation

```bash
npm run validate:e2e
```

Validates:
- Auth signup/login with face descriptor
- Group creation + persistence fetch
- Quiz generation endpoint
- Proctoring no-face pulse logic validation

---

## Security Design

| Layer | Mechanism |
|---|---|
| Passwords | bcrypt (10 rounds) |
| Sessions | JWT in HttpOnly cookies (XSS protection) |
| Auth routes | Rate limiting (express-rate-limit) |
| HTTP headers | Helmet.js |
| CORS | Configurable via `CORS_ORIGIN` env var |
| Face identity | 0.42 FaceMatcher threshold (strict) |

---

## Environment Variables

### Backend (`.env`)
| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5050) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret (min 32 chars) |
| `OPENAI_API_KEY` | OpenAI API key for quiz generation |
| `GEMINI_API_KEY` | Google Gemini API key (alternative provider) |

### Frontend (`skilltrove_frontend/.env`)
| Variable | Description |
|---|---|
| `REACT_APP_API_BASE_URL` | Backend API base URL (e.g. `http://localhost:5050`) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| AI Proctoring | face-api.js (TensorFlow.js, browser-side) |
| Authentication | JWT, bcrypt, HttpOnly cookies |
| AI Quiz | OpenAI GPT-4.1-mini, Google Gemini 2.0 Flash |

---

## Future Enhancements

- Mobile application leveraging existing PWA manifest and responsive Tailwind architecture
- Advanced AI analytics extending the existing `analyticsAggregator.js` infrastructure
- Multi-language (i18n) support for regional accessibility
- Personalized learning path recommendations based on performance analytics
- Voice-based accessibility features
