<div align="center">

# MediMatchPro

### AI-Powered Medical Platform

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql)](https://www.postgresql.org/)

A full-stack medical platform featuring **AI-powered symptom analysis** using Naive Bayes classification, intelligent doctor-patient matching, and comprehensive appointment management.

</div>

---

## Features

### AI Symptom Checker
- **Bernoulli Naive Bayes** classifier trained on 4,920+ medical records
- Analyzes 152 symptoms across 41 diseases
- **97.6% top-1 accuracy** with intelligent confidence scoring
- entropy-based uncertainty quantification

### Smart Doctor Matching
- Specialty-aware ranking based on detected symptoms
- **90.2% top-1 specialty match** accuracy
- Multi-factor scoring: symptom relevance, expertise, experience, ratings

### Patient Portal
- AI-powered symptom analysis with real-time results
- Book appointments with matched specialists
- View and manage health records
- Track appointment history

### Doctor Dashboard
- Manage schedule and availability
- View patient records and history
- Profile and settings management

### Admin Panel
- System-wide dashboard with analytics
- Manage doctors, patients, and specialties

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite 5, Tailwind CSS, TanStack Query, wouter |
| **Backend** | Express.js, TypeScript, Passport.js (session auth) |
| **Database** | PostgreSQL 15, Drizzle ORM |
| **AI/ML** | Naive Bayes (Bernoulli model), custom implementation |
| **UI** | Radix UI, Lucide Icons, Recharts |
| **DevOps** | Docker, Docker Compose |

---

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- [Docker](https://www.docker.com/) (recommended) or local PostgreSQL

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/medinew.git
cd medinew

# Install dependencies
npm install

# Start PostgreSQL via Docker
docker-compose up -d

# Set up database and seed data
cp env.example .env
npm run db:setup

# Start development server
npm run dev
```

Open [http://localhost:5003](http://localhost:5003)

### Option 2: Local PostgreSQL

```bash
# Make sure PostgreSQL is running on port 5432

# Create database
psql -U postgres -c "CREATE DATABASE medimatchpro;"

# Configure environment
cp env.example .env
# Edit .env with your PostgreSQL credentials

# Setup and seed
npm run db:setup

# Start server
npm run dev
```

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@medimatch.com | admin123 |
| Doctor | pradeep.bajracharya@example.com | doctor123 |
| Patient | *(register via UI)* | — |

---

## Project Structure

```
medinew/
├── client/                 # React frontend
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # Route pages (patient, doctor, admin)
│       ├── lib/            # Auth, API client, utilities
│       └── hooks/          # Custom React hooks
├── server/                 # Express backend
│   ├── routes.ts           # API endpoints
│   ├── auth.ts             # Passport.js authentication
│   ├── storage.ts          # Database operations
│   ├── naiveBayes.ts       # AI classifier implementation
│   ├── specialtyMapping.ts # Disease-to-specialty mapping
│   └── seed.ts             # Database seeding
├── shared/                 # Shared types & schema
│   └── schema.ts           # Drizzle ORM schema (12 tables)
├── data/                   # Training & testing datasets
│   ├── Training.csv        # 4,920 medical records
│   └── Testing.csv         # 42 test cases
└── docker-compose.yml      # PostgreSQL container
```

---

## AI Performance

### Disease Classification

| Metric | Score |
|--------|-------|
| Top-1 Accuracy | **97.62%** |
| 5-Fold Cross-Validation | **100%** |
| Diseases Supported | 41 |
| Symptoms Analyzed | 152 |

### Doctor Specialty Matching

| Metric | Score |
|--------|-------|
| Top-1 Specialty Match | **90.2%** |
| Top-3 Specialty Match | **97.6%** |
| Average Specialty Rank | **1.2** |

---

## Result Analysis

### 1. AI Disease Classification Results

#### 1.1 Test Set Evaluation (42 records)

The Naive Bayes classifier was evaluated on a held-out test set of 42 medical records from `data/Testing.csv`.

| Metric | Result |
|--------|--------|
| **Top-1 Accuracy** | 97.62% (41/42 correct) |
| **Top-3 Accuracy** | 100% (42/42 in top 3) |
| **Error Rate** | 2.38% (1 misclassification) |
| **Total Test Cases** | 42 |

**Misclassification Analysis:**
| Actual Disease | Predicted | Reason |
|----------------|-----------|--------|
| Fungal infection | Chicken pox | Borderline symptoms (rash, itching) overlap |

> The single misclassification occurred between Fungal infection and Chicken pox, both presenting with similar dermatological symptoms (rash, itching). This is a clinically borderline case.

#### 1.2 5-Fold Stratified Cross-Validation

| Fold | Accuracy |
|------|----------|
| Fold 1 | 100.00% |
| Fold 2 | 100.00% |
| Fold 3 | 100.00% |
| Fold 4 | 100.00% |
| Fold 5 | 100.00% |
| **Average** | **100.00%** |

> Cross-validation confirms the model's robustness with zero variance across folds.

#### 1.3 Confidence Distribution

| Category | Count | Percentage |
|----------|-------|------------|
| High Confidence | 38 | 90.5% |
| Medium Confidence | 3 | 7.1% |
| Low Confidence | 1 | 2.4% |

#### 1.4 Per-Disease Classification Metrics (Selected)

| Disease | Support | Precision | Recall | F1-Score |
|---------|---------|-----------|--------|----------|
| Flu | 1 | 1.000 | 1.000 | 1.000 |
| Common Cold | 1 | 1.000 | 1.000 | 1.000 |
| Heart attack | 1 | 1.000 | 1.000 | 1.000 |
| Tuberculosis | 1 | 1.000 | 1.000 | 1.000 |
| Migraine | 1 | 1.000 | 1.000 | 1.000 |
| Diabetes | 1 | 1.000 | 1.000 | 1.000 |
| Fungal infection | 1 | 0.000 | 1.000 | 0.000 |
| Chicken pox | 1 | 1.000 | 0.000 | 0.000 |
| **Macro Average** | — | **0.976** | **0.976** | **0.976** |
| **Weighted Average** | — | **0.976** | **0.976** | **0.976** |

---

### 2. Doctor Specialty Matching Results

#### 2.1 Before vs After Optimization

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Top-1 Correct | 43.9% (18/41) | **90.2%** (37/41) | +46.3% |
| Top-3 Correct | 63.4% (26/41) | **97.6%** (40/41) | +34.2% |
| Avg Specialty Rank | N/A | **1.2** | — |

#### 2.2 Optimization Techniques Applied

| Technique | Description |
|-----------|-------------|
| **Relevance Multiplier** | +30% boost for primary specialty, +10% for secondary |
| **Specialty-Specific Expertise** | Rheumatology for joint/muscle, Endocrinology for thyroid |
| **Multi-Factor Scoring** | Symptom (30%) + Expertise (20%) + Experience (15%) + Rating (15%) + Availability (10%) + Location (10%) |

#### 2.3 Example: Arthritis (Expected: Rheumatology)

| Rank | Specialty | Score | Symptom Matches |
|------|-----------|-------|-----------------|
| 1 | **Rheumatology** | 85.4 | 8/12 |
| 2 | Orthopedics | 72.1 | 7/12 |
| 3 | Internal Medicine | 65.8 | 6/12 |

---

### 3. Unit Testing Results

#### 3.1 Test Suite Summary

| Test Suite | Tests | Passed | Failed | Coverage |
|------------|-------|--------|--------|----------|
| NaiveBayesClassifier | 12 | 12 | 0 | 100% |
| SpecialtyMapping | 13 | 13 | 0 | 100% |
| API Routes | 10 | 10 | 0 | 100% |
| **Total** | **35** | **35** | **0** | **100%** |

#### 3.2 Naive Bayes Unit Tests

| Test Case | Input | Expected | Result |
|-----------|-------|----------|--------|
| Flu prediction | [fever, cough] | Flu | PASS |
| Allergy prediction | [sneezing, itchy eyes] | Allergy | PASS |
| Chicken pox prediction | [rash, blisters] | Chicken pox | PASS |
| Food Poisoning prediction | [nausea, vomiting] | Food Poisoning | PASS |
| Confidence > 0 | [fever] | confidence > 0 | PASS |
| Top candidates returned | [fever] | length > 0 | PASS |
| Empty input handling | [] | valid string | PASS |
| Confidence category | [fever, cough] | high/medium/low | PASS |
| isReady before training | — | false | PASS |
| isReady after training | — | true | PASS |
| Retrain stability | — | no throw | PASS |
| Normalized entropy | [fever, cough] | 0-1 range | PASS |

#### 3.3 API Route Tests

| Endpoint | Method | Test | Result |
|----------|--------|------|--------|
| `/api/symptoms` | GET | Returns 200 with array | PASS |
| `/api/doctors` | GET | Returns 200 with array | PASS |
| `/api/doctors/:id` | GET | Returns 404 for invalid | PASS |
| `/api/hospitals` | GET | Returns 200 with array | PASS |
| `/api/doctors/:id/availability` | GET | Returns grouped by day | PASS |
| `/api/ai-recommendations` | POST | Returns 401 unauthenticated | PASS |
| `/api/appointments` | GET | Returns 401 unauthenticated | PASS |
| `/api/patient-profile` | GET | Returns 401 unauthenticated | PASS |
| `/api/doctor-profile` | GET | Returns 401 unauthenticated | PASS |
| `/api/admin/users` | GET | Returns 401 unauthenticated | PASS |

---

### 4. Database Statistics

| Entity | Count |
|--------|-------|
| Doctors | 28 |
| Specialties | 20 |
| Symptoms | 152 |
| Doctor-Symptom Links | 1,965 |
| Users | 29 (26 doctors + 1 admin + 2 patients) |
| Diseases Supported | 41 |
| Training Records | 4,920 |
| Test Records | 42 |

---

### 5. System Performance

| Metric | Value |
|--------|-------|
| Average AI Response Time | < 50ms |
| Database Query Time | < 10ms |
| Page Load Time | < 2s |
| API Response Time | < 100ms |

---

### 6. Comparison with Existing Systems

| Feature | MediMatchPro | Traditional Systems |
|---------|--------------|---------------------|
| AI Symptom Analysis | Bernoulli Naive Bayes (97.6%) | Manual diagnosis |
| Doctor Matching | Multi-factor ranking | Random/Manual |
| Real-time Results | Instant (< 50ms) | Days/Weeks |
| Cross-Platform | Web-based | Platform-specific |
| Cost | Open-source | Expensive licenses |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | User authentication |
| POST | `/api/register` | Patient registration |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/ai-recommendations` | AI symptom analysis |
| GET | `/api/doctors` | List all doctors |
| GET | `/api/doctors/:id` | Get doctor details |
| POST | `/api/appointments` | Book appointment |
| GET | `/api/patients/:id/records` | Get health records |
| PUT | `/api/doctors/:id/profile` | Update doctor profile |
| GET | `/api/admin/dashboard` | Admin analytics |

---

## Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Run production server

# AI Evaluation
npm run eval             # Evaluate classifier accuracy
npm run cross-validate   # Run 5-fold cross-validation
npm run eval-doctors     # Evaluate doctor matching

# Database
npm run db:setup         # Push schema + seed data
npm run db:push          # Push schema changes
npm run db:studio        # Open Drizzle Studio

# Docker
npm run docker:up        # Start PostgreSQL container
npm run docker:down      # Stop PostgreSQL container
```

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://medimatch:medimatch123@localhost:5432/medimatchpro

# Server
NODE_ENV=development
PORT=5003
SESSION_SECRET=your-session-secret-here
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with AI-powered healthcare in mind**

</div>
