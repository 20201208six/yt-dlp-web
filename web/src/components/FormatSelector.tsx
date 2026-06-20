import { Check, HardDrive, Volume2, VolumeX } from "lucide-react";
import type { FormatInfo } from "@/types";

interface FormatSelectorProps {
  formats: FormatInfo[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "-";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}

export default function FormatSelector({
  formats,
  selectedId,
  onSelect,
}: FormatSelectorProps) {
  if (formats.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        选择下载格式
      </h3>
      <div className="space-y-1.5">
        {formats.map((f) => {
          const isSelected = selectedId === f.id;
          return (
            <button
              key={f.id}
              onClick={() => onSelect(f.id)}
              className="group flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left transition-all duration-200 border"
              style={{
                borderColor: isSelected ? "var(--accent)" : "var(--border-primary)",
                background: isSelected
                  ? `color-mix(in srgb, var(--accent) 10%, var(--bg-primary))`
                  : "var(--bg-input)",
              }}
            >
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                style={{
                  borderColor: isSelected ? "var(--accent)" : "var(--border-secondary)",
                  background: isSelected ? "var(--accent)" : "transparent",
                }}
              >
                {isSelected && <Check className="h-3 w-3 text-white" />}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {f.resolution}
                  </span>
                  {f.hasAudio ? (
                    <span
                      className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
                      style={{
                        color: "var(--success)",
                        background: `color-mix(in srgb, var(--success) 10%, transparent)`,
                      }}
                    >
                      <Volume2 className="h-2.5 w-2.5" />
                      含音频
                    </span>
                  ) : (
                    f.resolution !== "audio only" && (
                      <span
                        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
                        style={{
                          color: "var(--warning)",
                          background: `color-mix(in srgb, var(--warning) 10%, transparent)`,
                        }}
                      >
                        <VolumeX className="h-2.5 w-2.5" />
                      </span>
                    )
                  )}
                </div>
                <span className="mt-0.5 block text-xs" style={{ color: "var(--text-secondary)" }}>
                  {f.note || f.ext.toUpperCase()}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                <HardDrive className="h-3 w-3" />
                {formatSize(f.filesize)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
