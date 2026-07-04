import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["server/**/*.test.ts"],
    exclude: ["node_modules", "dist"],
    env: {
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    },
    pool: "forks",
  },
});
