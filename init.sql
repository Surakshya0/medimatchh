-- Initialize the database for MediMatchPro
-- This file runs when the PostgreSQL container starts for the first time

-- Create the database (this is already created by the POSTGRES_DB env var)
-- But we can add any additional setup here

-- Enable common PostgreSQL extensions that might be useful
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Create the schema (tables will be created by Drizzle migrations)
-- This is just for any additional setup if needed 