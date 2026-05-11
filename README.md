# SkillTrove

AI-powered learning and proctoring platform with face-auth, Bloom-mapped quiz generation, and community collaboration.

## Quick Start

### Backend

```bash
npm install
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

## Features

- Face-based authentication (Signup/Login with face descriptor capture and matching)
- AI quiz generation with Bloom’s taxonomy style flow
- Real-time proctoring UX (no-face, multi-face, motion warning pulse)
- Community hub with group CRUD and persistence (`/api/groups`)
- Leaderboard analytics and premium PDF report download
- 3D/antigravity UX with Framer Motion + glassmorphism

## E2E Validation

Run smoke validation from project root:

```bash
npm run validate:e2e
```

This script checks:

- Auth signup/login with face descriptor
- Group creation + persistence fetch
- Quiz generation endpoint
- Proctoring no-face pulse logic validation

## face-api.js Model Setup

For face detection/recognition pages, place model files under:

`skilltrove_frontend/public/models`

Required models include:

- tiny face detector model
- face landmark model
- face recognition model

If models are missing, the UI shows a model-loading/missing fallback banner with retry.
