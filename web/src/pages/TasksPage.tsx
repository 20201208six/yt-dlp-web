import { useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import TaskCard from "@/components/TaskCard";
import { useDownloadStore } from "@/stores/downloadStore";
import { addToast } from "@/utils/toast";
import type { ApiResponse, TaskInfo } from "@/types";

export default function TasksPage() {
  const { tasks, setTasks } = useDownloadStore();

  useEffect(() => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((json: ApiResponse<{ tasks: TaskInfo[] }>) => {
        if (json.success && json.data?.tasks) {
          setTasks(json.data.tasks);
        }
      });
  }, [setTasks]);

  const handleDelete = useCallback(
    async (taskId: string) => {
      await fetch("/api/tasks/" + taskId, { method: "DELETE" });
      setTasks(tasks.filter((t) => t.id !== taskId));
      addToast("已删除任务记录", "info");
    },
    [tasks, setTasks]
  );

  const active = tasks.filter(
    (t) => t.status === "queued" || t.status === "parsing" || t.status === "downloading"
  );
  const completed = tasks.filter((t) => t.status === "completed");
  const failed = tasks.filter((t) => t.status === "failed");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 font-mono text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        任务管理
      </h1>

      {active.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            进行中 ({active.length})
          </h2>
          <div className="space-y-3">
            {active.map((t) => (
              <TaskCard key={t.id} task={t} onDelete={handleDelete} />
            ))}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            已完成 ({completed.length})
          </h2>
          <div className="space-y-3">
            {completed.map((t) => (
              <TaskCard key={t.id} task={t} onDelete={handleDelete} />
            ))}
          </div>
        </section>
      )}

      {failed.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            失败 ({failed.length})
          </h2>
          <div className="space-y-3">
            {failed.map((t) => (
              <TaskCard key={t.id} task={t} onDelete={handleDelete} />
            ))}
          </div>
        </section>
      )}

      {tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="rounded-full p-6" style={{ background: "var(--bg-secondary)" }}>
            <Loader2 className="h-8 w-8" style={{ color: "var(--text-muted)" }} />
          </div>
          <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
            暂无下载任务
          </p>
        </div>
      )}
    </div>
  );
}
