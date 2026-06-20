import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import dotenv from "dotenv";
import ytdlpRoutes from "./routes/ytdlp.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: express.Application = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// API Routes
app.use("/api", ytdlpRoutes);

// Health check
app.use("/api/health", (_req: Request, res: Response): void => {
  res.status(200).json({ success: true, message: "ok" });
});

// Serve built frontend in production
const distPath = path.join(__dirname, "..", "dist");
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback: serve index.html for any non-API route
  app.get("*", (_req: Request, res: Response): void => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: "API not found" });
});

export default app;
