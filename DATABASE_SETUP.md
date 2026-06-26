# Local Database Setup Guide

This guide will help you set up a local PostgreSQL database for MediMatchPro development.

## Prerequisites

- Docker and Docker Compose installed on your system
- Node.js and npm installed

## Quick Setup (Recommended)

1. **Run the automated setup command:**
   ```bash
   npm run dev:local
   ```
   
   This command will:
   - Copy the environment example file to `.env`
   - Start the PostgreSQL Docker container
   - Wait for the database to be ready
   - Push the database schema
   - Seed the database with sample data
   - Start the development server

## Manual Setup

If you prefer to set up step by step:

### 1. Environment Configuration

Copy the environment example file:
```bash
cp env.example .env
```

The `.env` file should contain:
```
DATABASE_URL=postgresql://medimatch:medimatch123@localhost:5432/medimatchpro
NODE_ENV=development
SESSION_SECRET=your-session-secret-here-change-in-production
PORT=5001
```

### 2. Start PostgreSQL with Docker

Start the PostgreSQL container:
```bash
npm run docker:up
```

This will:
- Pull the PostgreSQL 15 image
- Create a container named `medimatchpro_db`
- Set up the database with credentials:
  - Database: `medimatchpro`
  - Username: `medimatch`
  - Password: `medimatch123`
  - Port: `5432`

### 3. Set Up Database Schema

Push the database schema to create all tables:
```bash
npm run db:push
```

### 4. Seed Database with Sample Data

Populate the database with sample doctors, symptoms, and other data:
```bash
tsx server/seed.ts
```

### 5. Start Development Server

```bash
npm run dev
```

## Using Local PostgreSQL Configuration

If you want to use the simplified local PostgreSQL configuration, you can modify the import in your server files:

In `server/index.ts` or other files that import the database, change:
```typescript
import { db } from "./db";
```

To:
```typescript
import { db } from "./db-local";
```

## Database Management Commands

- **Start PostgreSQL container:** `npm run docker:up`
- **Stop PostgreSQL container:** `npm run docker:down`
- **Push schema changes:** `npm run db:push`
- **Generate migrations:** `npm run db:generate`
- **Run migrations:** `npm run db:migrate`
- **Open Drizzle Studio:** `npm run db:studio`
- **Complete database setup:** `npm run db:setup`

## Drizzle Studio

You can use Drizzle Studio to view and manage your database:
```bash
npm run db:studio
```

This will open a web interface where you can browse tables, view data, and run queries.

## Troubleshooting

### Port 5432 already in use
If you have PostgreSQL already running locally, either:
1. Stop the local PostgreSQL service
2. Change the port in `docker-compose.yml` (e.g., to `5433:5432`)
3. Update the DATABASE_URL in `.env` accordingly

### Connection refused
1. Make sure Docker is running
2. Wait a few seconds for the database to fully start
3. Check container status: `docker ps`

### Schema changes not reflected
```bash
npm run db:push
```

### Sample data not appearing
```bash
tsx server/seed.ts
```

## Switching Between Local and Cloud Database

To switch between your local database and Neon (cloud):

1. **For local:** Use the DATABASE_URL in `env.example`
2. **For cloud:** Use your Neon database URL

The application will automatically detect which database type you're using based on the URL. 