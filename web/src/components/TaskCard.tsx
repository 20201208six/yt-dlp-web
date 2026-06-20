import { X, AlertCircle, CheckCircle, Loader2, Clock } from "lucide-react";
import type { TaskInfo } from "@/types";

interface TaskCardProps {
  task: TaskInfo;
  onDelete: (id: string) => void;
}

export default function TaskCard({ task, onDelete }: TaskCardProps) {
  const statusConfig = {
    queued: {
      icon: <Clock className="h-4 w-4" />,
      label: "排队中",
      colorVar: "var(--warning)",
    },
    parsing: {
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      label: "解析中",
      colorVar: "var(--accent)",
    },
    downloading: {
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      label: "下载中",
      colorVar: "var(--accent)",
    },
    completed: {
      icon: <CheckCircle className="h-4 w-4" />,
      label: "已完成",
      colorVar: "var(--success)",
    },
    failed: {
      icon: <AlertCircle className="h-4 w-4" />,
      label: "失败",
      colorVar: "var(--danger)",
    },
  };

  const config = statusConfig[task.status];

  return (
    <div
      className="rounded-lg border p-4"
      style={{
        borderColor: config.colorVar,
        background: `color-mix(in srgb, ${config.colorVar} 8%, var(--bg-secondary))`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span style={{ color: config.colorVar }}>{config.icon}</span>
            <span className="text-xs font-medium" style={{ color: config.colorVar }}>
              {config.label}
            </span>
          </div>
          <p
            className="mt-1.5 truncate text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            {task.title || task.url}
          </p>
          <p
            className="mt-0.5 truncate text-xs"
            style={{ color: "var(--text-secondary)" }}
          >
            {task.url}
          </p>

          {task.status === "downloading" && (
            <div className="mt-3 space-y-1.5">
              <div
                className="h-1.5 overflow-hidden rounded-full"
                style={{ background: "var(--bg-tertiary)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: task.progress + "%",
                    background: "var(--accent)",
                  }}
                />
              </div>
              <div
                className="flex justify-between text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                <span>{task.progress.toFixed(1)}%</span>
                <span>{task.speed}</span>
                <span>ETA {task.eta}</span>
              </div>
            </div>
          )}

          {task.error && (
            <p className="mt-2 text-xs" style={{ color: "var(--danger)" }}>
              {task.error}
            </p>
          )}
        </div>

        {(task.status === "completed" ||
          task.status === "failed" ||
          task.status === "queued") && (
            <button
              onClick={() => onDelete(task.id)}
              className="rounded p-1 transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="h-4 w-4" />
            </button>
          )}
      </div>
    </div>
  );
}
