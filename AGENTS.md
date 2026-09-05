# MediMatchPro — Project Memory

## Quick Start
```bash
# Start backend (port 5003)
npm run dev

# Start frontend (port 5173) — in separate terminal
npx vite --port 5173
```
Open: http://localhost:5173

## Credentials
| Role  | Email                          | Password  |
|-------|--------------------------------|-----------|
| Admin | admin@medimatch.com            | admin123  |
| Doctor| pradeep.bajracharya@example.com| doctor123 |
| Patient| (register via UI)              |           |

## Stack
- **Backend**: Express + tsx + Drizzle ORM + PostgreSQL
- **Frontend**: React 18 + Vite 5 + Tailwind + wouter + TanStack Query
- **DB**: Local PostgreSQL (port 5432, or Docker on 5433)
- **AI**: Naive Bayes classifier (Bernoulli model) from Kaggle dataset

## Key Files

### Architecture
- `server/index.ts` — Express entry point, starts server on port 5003
- `server/routes.ts` — All API routes (login, register, ai-recommendations, admin CRUD)
- `server/auth.ts` — Passport.js session auth (local strategy, express-session)
- `server/db.ts` — PostgreSQL connection via Drizzle (falls back between Neon and pg)
- `server/storage.ts` — Database operations (doctors, patients, appointments, doctor ranking)
- `server/vite.ts` — Vite dev server integration for production

### AI / Naive Bayes
- `server/naiveBayes.ts` — NaiveBayesClassifier class with Bernoulli model (present + absent symptom evidence)
- `server/specialtyMapping.ts` — Maps 41 diseases to specialist specialties
- `data/Training.csv` — Kaggle dataset (4920 records, 41 diseases, 132 symptoms)
- `data/Testing.csv` — Held-out test set (42 records)
- `server/scripts/evaluate.ts` — Run evaluation: `npm run eval`
- `server/scripts/crossValidate.ts` — 5-fold CV: `npm run cross-validate`
- `server/scripts/evaluateDoctors.ts` — Doctor ranking eval: `npm run eval-doctors`

### Database
- `shared/schema.ts` — Drizzle schema (12 tables: users, patients, doctors, symptoms, doctorSymptoms, diseaseSymptoms, appointments, healthRecords, availability, reminders, specialties, appointments)
- `server/seed.ts` — Seeds DB with 25 doctors, 134+ symptoms, associations, availability
- `server/scripts/improveMatching.ts` — Migration to add 18 new symptoms, 3 doctors, rebuild associations

### Frontend
- `client/src/components/patient/AISymptomChecker.tsx` — AI symptom checker UI (symptom grid + autocomplete + results)
- `client/src/pages/patient/AISymptomChecker.tsx` — Re-exports component
- `client/src/lib/auth.tsx` — Auth context (useAuth hook, session-based)
- `client/src/lib/queryClient.ts` — API client (fetch wrapper with credentials: "include")
- `vite.config.ts` — Vite config with `/api` proxy to `localhost:5003`

## Performance Metrics

### Naive Bayes (after Bernoulli fix)
| Metric        | Before  | After   |
|---------------|---------|---------|
| Top-1 Accuracy| 92.86%  | 97.62%  |
| 5-fold CV     | 94.88%  | 100.00% |
| Misclassifications | 3  | 1 (Fungal→Chicken pox, borderline case) |

### Doctor Ranking (after improvements)
| Metric        | Before  | After   |
|---------------|---------|---------|
| Top-1 correct | 43.9%   | 90.2%   |
| Top-3 correct | 75.6%   | 97.6%   |
| Avg spec rank | N/A     | 1.2     |

### Database
| Item        | Count |
|-------------|-------|
| Doctors     | 28    |
| Symptoms    | 152   |
| Doctor-symptom links | 1965 |
| Users       | 29 (26 doctors + admin + 2 patients) |

## Changes Made (26 June 2026)

### 1. Bernoulli Naive Bayes (`server/naiveBayes.ts`)
- Changed `predict()` to iterate over **entire vocabulary**, not just present symptoms
- For each symptom: if present → `log(P(symptom|class))`, if absent → `log(1-P(symptom|class))`
- This penalizes diseases whose characteristic symptoms are missing from input
- Fixed: Heart attack→Tuberculosis, Hepatitis D→Hepatitis E misclassifications

### 2. Frontend Proxy (`vite.config.ts`)
- Added `server.proxy` for `/api` → `http://localhost:5003`
- Frontend requests to `/api/*` now reach the backend

### 3. New Symptoms & Doctors (`server/scripts/improveMatching.ts`)
- 18 new symptoms: slow healing, hair thinning, heat intolerance, tremors, ear pain, hearing loss, tinnitus, leg cramps, morning stiffness, joint deformity, insomnia, memory loss, numbness, tingling, fainting, shoulder pain, foot pain, wrist pain
- 3 new doctors: Sagar Pokharel (Endocrinology), Asha Khadka (Endocrinology), Rabi Bhusal (Rheumatology) — all password: `doctor123`
- Rebuilt 1965 doctor-symptom associations with improved specialty-specific expertise rules

### 4. Doctor Matching Fixes
- Updated `guessSpecialties` in `seed.ts` and `evaluateDoctors.ts`:
  - Joint/muscle symptoms now map to **Rheumatology** (not just Orthopedics)
  - Thyroid/sugar/weight symptoms map to **Endocrinology** (not just Internal Medicine)
  - Vertigo/dizziness maps to **ENT + Neurology**
  - Added new symptom keywords (numbness, tingling, insomnia, etc.)

### 5. Frontend UI (`AISymptomChecker.tsx`)
- Added new symptoms to `SYMPTOM_GROUPS` (ENT category, expanded Musculo/Cardiac/General)
- Added all new symptom icons to `SYMPTOM_ICONS`
- Added `GROUP_STYLES` entry for ENT

## Known Pre-existing TypeScript Errors (not introduced by us)
- `auth.ts` — `createdAt: Date | null` vs `Date | undefined` mismatch
- `db.ts` — Pool type mismatch (`pg` vs `@neondatabase/serverless`)
- `routes.ts`, `storage.ts` — Various `req.user` and nullable field type issues
- `vite.ts` — `allowedHosts: boolean` vs `true | string[]`
- These do not affect runtime behavior (all pass with tsx/esbuild)

## Data Flow: AI Recommendations
```
User selects symptoms → POST /api/ai-recommendations { symptomNames: [...] }
  → routes.ts calls classifier.predict(symptoms)
    → Bernoulli Naive Bayes scores 41 diseases
    → Returns top prediction + confidence + entropy
  → routes.ts resolves specialty via specialtyMapping.ts
  → routes.ts calls storage.getDoctorsBySpecialtyRanked()
    → Fetches doctors by specialty + relevance multiplier
    → Ranks by symptom matches + expertise + experience + rating
  → Returns { prediction, resolvedSpecialty, doctors }
```
