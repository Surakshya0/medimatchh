import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Server error:', err);

    // Handle database connection errors specially
    if (err.code === '57P01') { // Postgres connection termination
      console.error('Database connection terminated, attempting reconnect...');
      // Let the connection pool handle reconnection
      res.status(503).json({ message: "Service temporarily unavailable" });
      return;
    }

    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Don't expose internal errors to client
    const clientMessage = status === 500 ? "Internal Server Error" : message;
    res.status(status).json({ message: clientMessage });

    if (status === 500) {
      console.error('Critical server error:', err);
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT) || 5001;

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `\nPort ${port} is already in use (another dev server or app).\n` +
          `  Windows: netstat -ano | findstr :${port}   then  taskkill /PID <pid> /F\n` +
          `  Or set a different PORT in .env (e.g. PORT=5002).\n`,
      );
      process.exit(1);
    }
    throw err;
  });

  server.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();