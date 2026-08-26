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
