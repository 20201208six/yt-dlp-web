import { useState, useCallback, useEffect } from "react";
import { ArrowRight, Loader2, AlertCircle, FolderOpen } from "lucide-react";
import VideoPreview from "@/components/VideoPreview";
import FormatSelector from "@/components/FormatSelector";
import { useDownloadStore } from "@/stores/downloadStore";
import { addToast } from "@/utils/toast";
import type { VideoInfo, ApiResponse } from "@/types";

export default function DownloadPage() {
  const [url, setUrl] = useState("");
  const [downloadDir, setDownloadDir] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const {
    isParsing,
    parseError,
    parsedVideo,
    selectedFormatId,
    setParsing,
    setParseError,
    setParsedVideo,
    setSelectedFormatId,
    addTask,
  } = useDownloadStore();

  useEffect(() => {
    if (parsedVideo && parsedVideo.formats.length > 0 && !selectedFormatId) {
      const preferred = parsedVideo.formats.find((f) => f.hasAudio && f.resolution !== "audio only")
        || parsedVideo.formats[0];
      setSelectedFormatId(preferred.id);
    }
  }, [parsedVideo, selectedFormatId, setSelectedFormatId]);

  const handleParse = useCallback(async () => {
    if (!url.trim()) return;
    setParsing(true);
    setParseError(null);
    setParsedVideo(null);
    setSelectedFormatId(null);
    setPreviewUrl(null);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const json: ApiResponse<VideoInfo> = await res.json();
      if (!json.success || !json.data) {
        setParseError(json.error || "解析失败");
      } else {
        setParsedVideo(json.data);
      }
    } catch {
      setParseError("网络请求失败，请确保后端服务已启动");
    } finally {
      setParsing(false);
    }
  }, [url]);

  const doPreview = useCallback(async (formatId: string) => {
    setPreviewLoading(true);
    setPreviewUrl(null);
    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), formatId }),
      });
      const json = await res.json();
      if (json.success && json.data?.url) {
        setPreviewUrl(json.data.url);
      } else {
        addToast(json.error || "获取预览地址失败", "error");
      }
    } catch {
      addToast("获取预览失败", "error");
    }
    setPreviewLoading(false);
  }, [url]);

  // Click on video card: always pick a format that has audio for preview
  const handleCardPreview = useCallback(() => {
    if (!parsedVideo || previewLoading) return;
    // Prefer selected format if it has audio, otherwise find best video+audio format
    const selected = parsedVideo.formats.find((f) => f.id === selectedFormatId);
    const fmtId = (selected?.hasAudio && selected.resolution !== "audio only"
      ? selected.id
      : null) || parsedVideo.formats.find((f) => f.hasAudio && f.resolution !== "audio only")?.id || parsedVideo.formats[0]?.id;
    if (fmtId) doPreview(fmtId);
  }, [parsedVideo, selectedFormatId, previewLoading, doPreview]);

  const handleDownload = useCallback(async () => {
    if (!url.trim() || !selectedFormatId) return;
    setIsDownloading(true);
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          formatId: selectedFormatId,
          downloadDir: downloadDir || undefined,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        addTask({
          id: json.data.taskId, url: url.trim(),
          title: parsedVideo?.title || url.trim(),
          formatId: selectedFormatId, status: "queued",
          progress: 0, speed: "", eta: "",
          filePath: null, error: null,
          createdAt: new Date().toISOString(),
        });
        addToast("下载任务已创建，前往任务管理查看进度", "success");
        setUrl(""); setParsedVideo(null); setSelectedFormatId(null);
        setParseError(null); setPreviewUrl(null);
      }
    } catch {
      addToast("启动下载失败", "error");
    } finally {
      setIsDownloading(false);
    }
  }, [url, selectedFormatId, downloadDir, parsedVideo, addTask]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 font-mono text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        yt-dlp <span style={{ color: "var(--accent)" }}>Web</span>
      </h1>

      {/* URL Input */}
      <div className="relative mb-6">
        <div
          className="group rounded-xl border transition-colors"
          style={{ borderColor: "var(--border-primary)", background: "var(--bg-input)" }}
        >
          <input
            type="text" value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleParse()}
            placeholder="粘贴视频 URL，按回车解析..."
            className="w-full bg-transparent px-5 py-4 font-mono text-sm outline-none placeholder:opacity-50"
            style={{ color: "var(--text-primary)" }}
            disabled={isParsing}
          />
          <button
            onClick={handleParse}
            disabled={isParsing || !url.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all disabled:opacity-40"
            style={{ background: "var(--accent)" }}
          >
            {isParsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
          支持 YouTube、B站 等数千个网站
        </p>
      </div>

      {/* Error */}
      {parseError && (
        <div
          className="mb-6 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm"
          style={{
            borderColor: "var(--danger)",
            background: `color-mix(in srgb, var(--danger) 8%, transparent)`,
            color: "var(--danger)",
          }}
        >
          <AlertCircle className="h-4 w-4 shrink-0" />{parseError}
        </div>
      )}

      {/* Loading */}
      {isParsing && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--accent)" }} />
          <span className="ml-3 text-sm" style={{ color: "var(--text-secondary)" }}>
            解析视频信息中...
          </span>
        </div>
      )}

      {/* Content */}
      {parsedVideo && !isParsing && (
        <div className="space-y-6 animate-fade-in">
          <VideoPreview
            video={parsedVideo}
            previewUrl={previewUrl}
            previewLoading={previewLoading}
            onPreviewClick={handleCardPreview}
            onPreviewClose={() => setPreviewUrl(null)}
          />

          <FormatSelector
            formats={parsedVideo.formats}
            selectedId={selectedFormatId}
            onSelect={setSelectedFormatId}
          />

          {/* Download directory */}
          <div
            className="flex items-center gap-3 rounded-lg border px-4 py-3"
            style={{ borderColor: "var(--border-primary)", background: "var(--bg-input)" }}
          >
            <FolderOpen className="h-4 w-4 shrink-0" style={{ color: "var(--text-secondary)" }} />
            <input
              type="text" value={downloadDir}
              onChange={(e) => setDownloadDir(e.target.value)}
              placeholder="下载目录（留空使用系统默认 ~/Downloads）"
              className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-50"
              style={{ color: "var(--text-primary)" }}
            />
          </div>

          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={!selectedFormatId || isDownloading}
            className="w-full rounded-xl py-3.5 font-mono text-sm font-bold text-white transition-all disabled:opacity-30"
            style={{ background: "var(--orange)" }}
          >
            {isDownloading ? "启动中..." : "开始下载"}
          </button>
        </div>
      )}

      {/* Empty state */}
      {!parsedVideo && !isParsing && !parseError && (
        <div className="flex flex-col items-center justify-center py-20">
          <div
            className="rounded-full p-6"
            style={{ background: "var(--bg-secondary)" }}
          >
            <ArrowRight className="h-8 w-8" style={{ color: "var(--text-muted)" }} />
          </div>
          <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
            输入视频链接以开始
          </p>
        </div>
      )}
    </div>
  );
}
