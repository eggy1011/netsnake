# 🐍⚡ NetSnake — Learn Networking by Keeping a Snake Alive

> A retro-arcade Snake game where the only way to survive is to answer networking questions — graded on **meaning, not exact wording** — with spaced review, verified authoritative sources, and customer-facing Solution Engineer practice.

![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Tests](https://img.shields.io/badge/tests-65%20passing-4ade80)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## What is this?

**For anyone:** studying networking means memorising a lot — protocols, devices, addressing, troubleshooting steps. Flashcards work but are boring; quiz sites reject answers that don't match the stored wording. NetSnake turns study into an arcade game: your snake burns energy with every move, and the only refill is answering a question *in your own words*. Miss a question and it comes back sooner. Master a topic and it fades away. You keep playing because the snake needs you.

**For engineers/recruiters:** this is a full-stack TypeScript project — a canvas game engine, a semantic answer-evaluation pipeline (local concept rubric + optional LLM grading behind a key-protected backend), a spaced-repetition learning engine, and a 374-question content system where every question links to a verified authoritative source (IETF RFCs, NIST, CISA, official vendor docs).

Built while preparing for **network engineering and Solution Engineer roles** — including 80 original customer scenarios practising discovery questions, objection handling, and translating technology into business value.

---

## 📸 Demo & Screenshots

> _Placeholders — add captures to `docs/screenshots/` and update the paths below._

| Landing page | Gameplay | Question grading |
|---|---|---|
| ![Landing](docs/screenshots/landing.png) | ![Gameplay](docs/screenshots/gameplay.png) | ![Question](docs/screenshots/question.png) |

| Course Library | Progress analytics | Source registry |
|---|---|---|
| ![Courses](docs/screenshots/courses.png) | ![Progress](docs/screenshots/progress.png) | ![Sources](docs/screenshots/sources.png) |

🎬 _Demo GIF placeholder: `docs/screenshots/demo.gif`_

---

## ✨ Features

- **Snake, but educational** — classic gameplay (growth, collisions, bonus food, obstacles, wall-wrap mode, optional timed runs) with an energy bar that forces regular question breaks. Game difficulty ramps with score and is fully decoupled from learning content.
- **Semantic answer grading** — "DNS converts website names into IP addresses", "it resolves hostnames to IPs", and "check name resolution" all pass the DNS question. Typos and grammar slips are tolerated; confidently wrong claims are penalised via per-question contradiction rubrics.
- **Hybrid AI evaluation** — simple factual answers grade instantly with a local concept rubric; ambiguous answers on open-ended questions escalate to the Gemini API (free tier) through a small Express backend. Results are cached (LRU) and every failure mode falls back to the local rubric — the game is fully playable offline with **no API key at all**.
- **8 course packs, 374 original questions** — Networking Foundations, Devices & Infrastructure, IP Addressing & Troubleshooting, Configuration & Simulation, Security Fundamentals, Cloud & Hybrid Networking, Solution Engineer Customer Scenarios, and a weighted Mixed Preparation mode.
- **Verified sources everywhere** — a central registry of 26 authoritative sources (IETF RFCs, NIST CSF & SP 800-207, CISA, Wi-Fi Alliance, Microsoft Learn, Cisco, AWS/Azure/GCP docs). Every module cites ≥2, every question ≥1, protocol questions cite their RFC directly.
- **Learning engine** — per-question mastery tracking, spaced review scheduling, weak-topic boosting, non-repeating selection, foundation-first ordering for new learners, and a filterable review screen with per-module accuracy analytics.

---

## 🏗️ Architecture

```
┌──────────────────────────── Browser ────────────────────────────┐
│  React UI (landing / library / game / progress / review)        │
│        │                                                         │
│  useSnakeGame (pure reducer) ←── useGameLoop (fixed-step rAF)    │
│        │ question needed            │ answer submitted           │
│  questionSelector ──────────► HybridEvaluationService           │
│   (course/module filter,       1. cache (LRU, localStorage)     │
│    spaced review, weak-topic   2. local concept rubric          │
│    weighting, non-repeat)      3. AI provider (if ambiguous) ───┼──► Express backend
│        │                       4. local fallback + notice       │    /api/evaluate-answer
│  courseRegistry + sourceRegistry (374 questions, 26 sources)    │    Zod validation · retry
│  localStorage: progress, stats, settings, eval cache            │    GEMINI_API_KEY (.env only)
└──────────────────────────────────────────────────────────────────┘
```

Key design decisions, briefly:

- **Game state is one pure reducer** — every tick is a deterministic state transition, which made the energy/question/pause interactions easy to reason about and test.
- **Learning is decoupled from difficulty** — game speed ("challenge intensity") scales with score; question selection depends only on the chosen course and the learner's history.
- **The AI is optional by design** — provider-independent `AnswerEvaluationProvider` interface, schema-validated responses, prompt hardened against injection (learner answers are untrusted content), and energy rewards recomputed client-side rather than trusted from the wire.
- **Content is data, not code** — courses are declarative seed files expanded by a builder that attaches sources, rewards, and metadata; adding a course touches no game logic.

---

## 🚀 Getting started

```bash
git clone https://github.com/eggy1011/netsnake.git
cd netsnake
npm install
npm run dev          # → http://localhost:5173
```

That's it — the game runs entirely in the browser with the local rubric evaluator.

### Optional: enable AI answer grading

```bash
cp .env.example .env          # add your free GEMINI_API_KEY (aistudio.google.com/apikey)
npm run server                # terminal 1 — backend on :8787
npm run dev                   # terminal 2 — vite proxies /api to it
```

The key is read **only** by `server/index.mjs` and never ships to the browser.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the game (Vite dev server) |
| `npm run server` | Start the AI evaluation backend |
| `npm test` | Run the 65-test Vitest suite (AI always mocked) |
| `npm run build` | Type-check (strict) + production build |
| `npm run preview` | Serve the production build |

---

## 🎮 How to play

1. **Pick a course** from the library (and optionally specific modules, weak topics, or previously missed questions).
2. **Choose gameplay settings** — snake speed, energy drain, timed or endless, solid walls or wrap-around.
3. **Play**: arrows/WASD to move, Space/P to pause. Eat packets to grow; watch the energy bar.
4. **Answer to survive**: at zero energy the game pauses for a mandatory question. Use the *Answer Question* button to refill early, and grab purple **?** packets for bonus-reward questions.
5. **Review**: after each run, see per-question feedback; the Progress screen tracks mastery, weak topics, and questions due for review.

**Example** — question: *"A user can reach a server by IP but not by hostname. What do you investigate first?"* — all of these earn credit: `check dns`, `name resolution is probably broken`, `the ip works so its not connectivity, id look at the dns server`.

---

## 🧪 Testing

65 tests cover the answer evaluator (paraphrases, typos, partial credit, contradictions, prompt-injection attempts), the hybrid AI pipeline (fallback, invalid JSON, timeouts, rate limits, cache reuse, duplicate-submission guard), question selection (course/module filtering, non-repetition, spaced review, weak-topic weighting), source integrity (every question has valid sources, every URL well-formed and official), and localStorage migration. The real Gemini API is never called from tests.

```bash
npm test
```

---

## 📁 Project structure

```
server/index.mjs          # Express backend: /api/evaluate-answer (holds the API key)
src/
  components/             # UI — landing, nav, course library, game, progress, review
  courses/                # content — 8 course packs, source registry, course builder
  questions/              # learning engine — selector, progress, evaluators, cache
  hooks/                  # useSnakeGame (game reducer), useGameLoop, useLocalStorage
  utils/                  # collision, food spawning, challenge tiers, sound, migration
  types/                  # domain types (game + learning)
  __tests__/              # vitest suite
docs/screenshots/         # README images (placeholders)
```

---

## 🗺️ Future improvements

- [ ] Course import UI — paste learning objectives / JSON question banks (schema already defined)
- [ ] AI-generated questions from user-provided study notes
- [ ] Per-topic adaptive difficulty and smarter interleaving
- [ ] Leaderboards and shareable run summaries
- [ ] PWA packaging for offline mobile play
- [ ] Additional evaluation providers behind the existing interface
- [ ] Accessibility pass (reduced motion, screen-reader flow for questions)

---

## 📜 License & attribution

MIT — see [LICENSE](LICENSE).

All questions are original, written against public learning objectives and technical documentation. Sources are attributed in-app (per course and per question) and in `src/courses/sourceRegistry.ts`.

> This application provides independently created supplementary practice. It is not an official assessment and is not endorsed by the source organisations listed (IETF, NIST, CISA, Cisco, Microsoft, AWS, Google, Wi-Fi Alliance).
