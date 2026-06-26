import { existsSync } from "fs";
import { resolve } from "path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit does not load .env by default; support .env next to package.json or one level up
for (const envPath of [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "..", ".env"),
]) {
  if (existsSync(envPath)) {
    loadEnv({ path: envPath });
    break;
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
