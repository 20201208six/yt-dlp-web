﻿﻿﻿import { Router, type Request, type Response } from "express";
import { parseVideo, downloadVideo, cancelDownload, getDirectUrl } from "../yt-dlp.js";
import type {
  ParseRequest,
  DownloadRequest,
  TaskInfo,
  PreviewRequest,
} from "../types.js";
import {
  getTaskStore,
  broadcastMessage,
  cleanupTask,
} from "../ws.js";

const router = Router();

/**
 * POST /api/parse - Parse video info from URL
 */
router.post("/parse", async (req: Request, res: Response): Promise<void> => {
  const { url } = req.body as ParseRequest;

  if (!url) {
    res.status(400).json({ success: false, error: "URL is required" });
    return;
  }

  try {
    const videoInfo = await parseVideo(url);
    res.json({ success: true, data: videoInfo });
  } catch (err: any) {
    res
      .status(400)
      .json({ success: false, error: err.message || "Failed to parse video" });
  }
});

/**
 * POST /api/preview - Get direct media URL for preview
 */
router.post("/preview", async (req: Request, res: Response): Promise<void> => {
  const { url, formatId } = req.body as PreviewRequest;
  if (!url || !formatId) {
    res.status(400).json({ success: false, error: "URL and formatId are required" });
    return;
  }
  try {
    const directUrl = await getDirectUrl(url, formatId);
    res.json({ success: true, data: { url: directUrl } });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || "Failed to get preview URL" });
  }
});

/**
 * POST /api/download - Start downloading
 */
router.post(
  "/download",
  async (req: Request, res: Response): Promise<void> => {
    const { url, formatId, downloadDir } = req.body as DownloadRequest;

    if (!url) {
      res.status(400).json({ success: false, error: "URL is required" });
      return;
    }
    if (!formatId) {
      res
        .status(400)
        .json({ success: false, error: "Format ID is required" });
      return;
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const task: TaskInfo = {
      id: taskId,
      url,
      title: "",
      formatId,
      status: "queued",
      progress: 0,
      speed: "",
      eta: "",
      filePath: null,
      error: null,
      createdAt: new Date().toISOString(),
    };

    const store = getTaskStore();
    store.set(taskId, task);

    // Start download in background
    try {
      const proc = downloadVideo(
        url,
        formatId,
        downloadDir || "",
        taskId,
        (progressData) => {
          const t = store.get(taskId);
          if (t) {
            t.status = "downloading";
            t.progress = progressData.progress;
            t.speed = progressData.speed;
            t.eta = progressData.eta;
            broadcastMessage({
              type: "progress",
              taskId,
              progress: progressData.progress,
              speed: progressData.speed,
              eta: progressData.eta,
            });
          }
        }
      );

      proc.on("close", (code) => {
        const t = store.get(taskId);
        if (t) {
          if (code === 0) {
            t.status = "completed";
            t.progress = 100;
            t.filePath = "Download complete";
            broadcastMessage({
              type: "complete",
              taskId,
              filePath: t.filePath,
            });
          } else {
            t.status = "failed";
            t.error = `Process exited with code ${code}`;
            broadcastMessage({
              type: "error",
              taskId,
              error: t.error,
            });
          }
        }
      });

      proc.on("error", (err) => {
        const t = store.get(taskId);
        if (t) {
          t.status = "failed";
          t.error = err.message;
          broadcastMessage({ type: "error", taskId, error: err.message });
        }
      });
    } catch (err: any) {
      const t = store.get(taskId);
      if (t) {
        t.status = "failed";
        t.error = err.message;
      }
    }

    res.json({ success: true, data: { taskId, status: "queued" } });
  }
);

/**
 * GET /api/tasks - Get all tasks
 */
router.get("/tasks", (_req: Request, res: Response): void => {
  const tasks = Array.from(getTaskStore().values());
  res.json({ success: true, data: { tasks } });
});

/**
 * DELETE /api/tasks/:id - Delete a task
 */
router.delete("/tasks/:id", (req: Request, res: Response): void => {
  const { id } = req.params;
  cancelDownload(id);
  cleanupTask(id);

  const store = getTaskStore();
  store.delete(id);

  res.json({ success: true });
});

export default router;
