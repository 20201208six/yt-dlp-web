import { useState, useRef } from "react";
import { Clock, User, Film, Play, X, Loader2 } from "lucide-react";
import type { VideoInfo } from "@/types";

interface VideoPreviewProps {
  video: VideoInfo;
  previewUrl: string | null;
  previewLoading: boolean;
  onPreviewClick: () => void;
  onPreviewClose: () => void;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  return m + ":" + String(s).padStart(2, "0");
}

export default function VideoPreview({
  video,
  previewUrl,
  previewLoading,
  onPreviewClick,
  onPreviewClose,
}: VideoPreviewProps) {
  const [videoError, setVideoError] = useState(false);

  if (!video) return null;

  const isPlaying = !!previewUrl && !videoError;

  return (
    <div
      className="group animate-slide-up overflow-hidden rounded-xl border"
      style={{
        borderColor: "var(--border-primary)",
        background: "var(--bg-secondary)",
      }}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Thumbnail / Video area */}
        <div className="relative w-full shrink-0 sm:w-72 bg-black">
          {isPlaying ? (
            <>
              <video
                controls
                autoPlay
                className="h-48 w-full object-contain sm:h-full"
                onError={() => setVideoError(true)}
              >
                <source src={previewUrl} />
              </video>
              <button
                onClick={(e) => { e.stopPropagation(); onPreviewClose(); setVideoError(false); }}
                className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div
              className="relative cursor-pointer"
              onClick={previewLoading ? undefined : onPreviewClick}
            >
              {video.thumbnail && (
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="h-48 w-full object-cover sm:h-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              {/* Play overlay on hover */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 opacity-0 transition-all group-hover:opacity-100 group-hover:scale-100 scale-75 shadow-xl">
                  {previewLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--accent)" }} />
                  ) : (
                    <Play className="ml-1 h-6 w-6" style={{ color: "var(--accent)" }} />
                  )}
                </div>
              </div>
              {/* gradient overlay for desktop */}
              <div
                className="absolute inset-0 hidden sm:block pointer-events-none"
                style={{
                  background: "linear-gradient(to right, transparent, var(--bg-secondary))",
                }}
              />
            </div>
          )}
        </div>

        {/* Info area */}
        <div className="flex flex-1 flex-col justify-between gap-3 p-5">
          <div>
            <h3
              className="line-clamp-2 text-base font-semibold leading-snug"
              style={{ color: "var(--text-primary)" }}
            >
              {video.title}
            </h3>
          </div>

          <div
            className="flex flex-wrap items-center gap-4 text-xs"
            style={{ color: "var(--text-secondary)" }}
          >
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {video.uploader}
            </span>
            {video.duration > 0 && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(video.duration)}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Film className="h-3.5 w-3.5" />
              {video.formats.length} 种格式
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
