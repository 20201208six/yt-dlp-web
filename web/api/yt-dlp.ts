﻿﻿﻿import { spawn, type ChildProcess } from "child_process";
import path from "path";
import os from "os";
import type { VideoInfo, FormatInfo } from "./types.js";

const YT_DLP_CMD = process.env.YT_DLP_PATH || "python3";
const YT_DLP_ARGS_PREFIX: string[] = (() => {
  if (process.env.YT_DLP_PATH) {
    return [];
  }
  return ["-m", "yt_dlp"];
})();
const YT_DLP_CWD = process.env.YT_DLP_CWD || "/workspace";
const DEFAULT_DOWNLOAD_DIR = path.join(os.homedir(), "Downloads");

const SSL_FIX_ARGS = [
  "--no-check-certificates",
  "--prefer-insecure",
];

const SSL_ENV = {
  ...process.env,
  PYTHONHTTPSVERIFY: "0",
  SSL_CERT_FILE: "/etc/ssl/certs/ca-certificates.crt",
  REQUESTS_CA_BUNDLE: "/etc/ssl/certs/ca-certificates.crt",
  CURL_CA_BUNDLE: "/etc/ssl/certs/ca-certificates.crt",
};

// Track active processes for cleanup
const activeProcesses = new Map<string, ChildProcess>();

/**
 * Execute yt-dlp with given arguments, resolve with stdout
 */
function execYtDlp(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(YT_DLP_CMD, [...YT_DLP_ARGS_PREFIX, ...SSL_FIX_ARGS, ...args], {
      stdio: ["ignore", "pipe", "pipe"],
      cwd: YT_DLP_CWD,
      env: SSL_ENV,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(stderr || `yt-dlp exited with code ${code}`));
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to start yt-dlp: ${err.message}`));
    });
  });
}

/**
 * Parse video information from URL
 */
export async function parseVideo(url: string): Promise<VideoInfo> {
  const output = await execYtDlp(["--dump-json", "--no-playlist", url]);

  const data = JSON.parse(output);

  const formats: FormatInfo[] = (data.formats || []).map((f: any) => ({
    id: f.format_id || "",
    ext: f.ext || "unknown",
    resolution:
      f.resolution || (f.acodec !== "none" ? "audio only" : "unknown"),
    filesize: f.filesize || null,
    note: f.format_note || f.format || "",
    hasAudio: f.acodec !== "none",
  }));

  const filteredFormats = filterBestFormats(formats);

  return {
    id: data.id || url,
    title: data.title || "Unknown",
    thumbnail: data.thumbnail || "",
    duration: data.duration || 0,
    uploader: data.uploader || data.channel || "Unknown",
    formats: filteredFormats,
  };
}

/**
 * Filter and deduplicate formats to show the most useful ones
 */
function filterBestFormats(formats: FormatInfo[]): FormatInfo[] {
  const audioOnly = formats.filter((f) => f.resolution === "audio only");
  const videoWithAudio = formats.filter(
    (f) => f.resolution !== "audio only" && f.hasAudio
  );
  const videoOnly = formats.filter(
    (f) => f.resolution !== "audio only" && !f.hasAudio
  );

  const seenRes = new Set<string>();
  const bestVideo: FormatInfo[] = [];

  for (const f of [...videoWithAudio, ...videoOnly]) {
    const key = f.resolution + "_" + f.hasAudio;
    if (!seenRes.has(key)) {
      seenRes.add(key);
      bestVideo.push(f);
    }
  }

  bestVideo.sort((a, b) => {
    if (a.hasAudio !== b.hasAudio) return a.hasAudio ? -1 : 1;
    const aH = parseInt(a.resolution) || 0;
    const bH = parseInt(b.resolution) || 0;
    return bH - aH;
  });

  const bestAudio =
    audioOnly.filter((f) => f.ext === "m4a")[0] || audioOnly[0];

  const result: FormatInfo[] = [...bestVideo];
  if (bestAudio) {
    result.push(bestAudio);
  }

  return result;
}

/**
 * Get direct media URL for preview
 */
export async function getDirectUrl(url: string, formatId: string): Promise<string> {
  const output = await execYtDlp(["-f", formatId, "--get-url", "--no-playlist", url]);
  return output.trim().split("\n")[0];
}

/**
 * Download video with progress tracking
 * @param url - video URL
 * @param formatId - format to download
 * @param downloadDir - output directory
 * @param taskId - task identifier
 * @param onProgress - progress callback
 */
export function downloadVideo(
  url: string,
  formatId: string,
  downloadDir: string,
  taskId: string,
  onProgress: (data: {
    progress: number;
    speed: string;
    eta: string;
  }) => void
): ChildProcess {
  const outputTemplate = path.join(
    downloadDir || DEFAULT_DOWNLOAD_DIR,
    "%(title).200s [%(id)s].%(ext)s"
  );

  const args = [
    "--newline",
    "--progress",
    "-f",
    formatId + "+bestaudio",
    "-o",
    outputTemplate,
    "--no-playlist",
    url,
  ];

  const proc = spawn(YT_DLP_CMD, [...YT_DLP_ARGS_PREFIX, ...SSL_FIX_ARGS, ...args], {
    stdio: ["ignore", "pipe", "pipe"],
    cwd: YT_DLP_CWD,
    env: SSL_ENV,
  });

  activeProcesses.set(taskId, proc);

  let lastProgress = 0;

  proc.stdout?.on("data", (data: Buffer) => {
    const lines = data.toString().split("\n").filter(Boolean);
    for (const line of lines) {
      // Parse progress: [download]  XX.X% of ~XXX.XXMiB at XX.XXMiB/s ETA XX:XX
      const progressMatch = line.match(/(\d+\.?\d*)%/);
      const speedMatch = line.match(/at\s+([\d.]+\w+\/s)/);
      const etaMatch = line.match(/ETA\s+(\d{1,2}:\d{2})/);

      if (progressMatch) {
        lastProgress = parseFloat(progressMatch[1]);
        onProgress({
          progress: lastProgress,
          speed: speedMatch?.[1] || "",
          eta: etaMatch?.[1] || "",
        });
      }
    }
  });

  proc.stderr?.on("data", (data: Buffer) => {
    const text = data.toString();
    if (text.includes("ERROR") || text.includes("Error")) {
      // Don't treat all stderr as fatal errors
    }
  });

  proc.on("close", () => {
    activeProcesses.delete(taskId);
  });

  return proc;
}

export function cancelDownload(taskId: string): boolean {
  const proc = activeProcesses.get(taskId);
  if (proc) {
    proc.kill();
    activeProcesses.delete(taskId);
    return true;
  }
  return false;
}
