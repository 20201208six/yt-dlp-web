import { Play, X, Loader2, AlertCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface VideoPlayerProps {
  url: string;
  formatId: string;
  onClose: () => void;
  title?: string;
}

export default function VideoPlayer({ url, formatId, onClose, title }: VideoPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleCanPlay = () => setLoading(false);
  const handleError = () => {
    setLoading(false);
    setError("该格式无法在浏览器中直接播放，您仍可下载后观看");
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
  }, [url]);

  return (
    <div
      className="animate-fade-in overflow-hidden rounded-xl border"
      style={{
        borderColor: "var(--border-primary)",
        background: "var(--bg-secondary)",
      }}
    >
      <div
        className="flex items-center justify-between border-b px-4 py-2.5"
        style={{ borderColor: "var(--border-primary)" }}
      >
        <span
          className="flex items-center gap-2 text-xs font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          <Play className="h-3.5 w-3.5" style={{ color: "var(--success)" }} />
          视频预览 {title ? `— ${title}` : ""}
        </span>
        <button
          onClick={onClose}
          className="rounded p-1 transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="relative bg-black">
        {loading && !error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--accent)" }} />
          </div>
        )}
        {error ? (
          <div
            className="flex items-center justify-center gap-2 py-12 text-sm"
            style={{ color: "var(--warning)" }}
          >
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : (
          <video
            ref={videoRef}
            controls
            autoPlay
            className="w-full max-h-[480px]"
            onCanPlay={handleCanPlay}
            onError={handleError}
            preload="metadata"
          >
            <source src={url} />
          </video>
        )}
      </div>
    </div>
  );
}
