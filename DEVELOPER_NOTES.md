# MediMatchPro — Developer Notes

Working notes on how the project is put together: how to run it, where the
important code lives, and how the recommendation pipeline fits together.

## Quick Start

```bash
# Start backend (port 5003)
npm run dev

# Start frontend (port 5173) — in a separate terminal
npx vite --port 5173
```

Open: http://localhost:5173

## Demo Credentials

These accounts are created by the seed script for local development.

| Role    | Email                           | Password  |
|---------|---------------------------------|-----------|
| Admin   | admin@medimatch.com             | admin123  |
| Doctor  | pradeep.bajracharya@example.com | doctor123 |
| Patient | (register via UI)               |           |

## Stack

- **Backend**: Express + tsx + Drizzle ORM + PostgreSQL
- **Frontend**: React 18 + Vite 5 + Tailwind + wouter + TanStack Query
- **Database**: Local PostgreSQL (port 5432, or Docker on 5433)
- **Classifier**: Bernoulli Naive Bayes trained from a Kaggle symptom dataset

## Key Files

### Server

- `server/index.ts` — Express entry point, starts the server on port 5003
- `server/routes.ts` — API routes (login, register, ai-recommendations, admin CRUD)
- `server/auth.ts` — Passport.js session auth (local strategy, express-session)
- `server/db.ts` — PostgreSQL connection via Drizzle (falls back between Neon and pg)
- `server/storage.ts` — Database operations (doctors, patients, appointments, doctor ranking)
- `server/vite.ts` — Vite dev server integration for production

### Classifier and evaluation

- `server/naiveBayes.ts` — `NaiveBayesClassifier` using a Bernoulli model, which
  scores both present and absent symptoms
- `server/specialtyMapping.ts` — Maps the 41 diseases to medical specialties
- `data/Training.csv` — Kaggle dataset (4,920 records, 41 diseases, 132 columns)
- `data/Testing.csv` — Held-out test set (42 records)
- `server/scripts/evaluate.ts` — Test-set evaluation: `npm run eval`
- `server/scripts/crossValidate.ts` — 5-fold cross-validation: `npm run cross-validate`
- `server/scripts/evaluateDoctors.ts` — Doctor ranking evaluation: `npm run eval-doctors`

### Database

- `shared/schema.ts` — Drizzle schema: users, patients, doctors, symptoms,
  doctorSymptoms, diseaseSymptoms, appointments, healthRecords, availability,
  reminders, specialties
- `server/seed.ts` — Seeds doctors, symptoms, associations and availability
- `server/scripts/improveMatching.ts` — Adds the later symptoms and doctors and
  rebuilds the doctor-symptom associations

### Frontend

- `client/src/components/patient/AISymptomChecker.tsx` — Symptom checker UI
  (symptom grid, autocomplete, results)
- `client/src/pages/patient/AISymptomChecker.tsx` — Re-exports the component
- `client/src/lib/auth.tsx` — Auth context (`useAuth` hook, session-based)
- `client/src/lib/queryClient.ts` — API client (fetch wrapper with `credentials: "include"`)
- `vite.config.ts` — Vite config with the `/api` proxy to `localhost:5003`

## Results

### Disease classification

| Metric             | Before | After                                  |
|--------------------|--------|----------------------------------------|
| Top-1 accuracy     | 92.86% | 97.62%                                 |
| 5-fold CV          | 94.88% | 100.00%                                |
| Misclassifications | 3      | 1 (Fungal infection → Chicken pox)     |

### Doctor ranking

| Metric        | Before | After  |
|---------------|--------|--------|
| Top-1 correct | 43.9%  | 90.2%  |
| Top-3 correct | 75.6%  | 97.6%  |
| Avg spec rank | N/A    | 1.2    |

Reproduce with `npm run eval`, `npm run cross-validate` and `npm run eval-doctors`.

### Seeded database

| Item                 | Count |
|----------------------|-------|
| Doctors              | 28    |
| Symptoms             | 152   |
| Doctor-symptom links | 1965  |
| Users                | 34    |

## Implementation Notes

### Bernoulli Naive Bayes (`server/naiveBayes.ts`)

`predict()` iterates over the entire symptom vocabulary rather than only the
symptoms the patient selected. For each symptom it adds `log(P(symptom|class))`
when present and `log(1 - P(symptom|class))` when absent, so a disease is
penalised when its characteristic symptoms are missing from the input. This
resolved the Heart attack → Tuberculosis and Hepatitis D → Hepatitis E
misclassifications produced by the earlier multinomial approach.

### Symptom vocabulary

The classifier vocabulary is built from the CSV headers with underscores
replaced by spaces, giving 131 usable symptoms. The database symptom catalogue
is larger (152), so symptoms outside the training vocabulary are ignored by the
classifier. Selecting symptoms that exist in the dataset gives the most reliable
predictions.

### Specialty mapping (`server/specialtyMapping.ts`)

`guessSpecialties` maps symptom groups to specialties: joint and muscle symptoms
map to Rheumatology as well as Orthopedics, thyroid/sugar/weight symptoms map to
Endocrinology rather than only Internal Medicine, and vertigo and dizziness map
to both ENT and Neurology.

### Frontend proxy (`vite.config.ts`)

`server.proxy` forwards `/api` to `http://localhost:5003` so the frontend on
port 5173 reaches the backend in development.

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
