import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Menu } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import DownloadPage from "@/pages/DownloadPage";
import TasksPage from "@/pages/TasksPage";
import ToastContainer from "@/components/ToastContainer";
import { useDownloadStore } from "@/stores/downloadStore";
import { addToast } from "@/utils/toast";

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { updateTask } = useDownloadStore();

  // Apply theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("theme") || "dark";
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  // Global WebSocket for task updates
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = protocol + "//" + window.location.host + "/ws";
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "progress") {
          updateTask(msg.taskId, {
            status: "downloading",
            progress: msg.progress,
            speed: msg.speed,
            eta: msg.eta,
          });
        } else if (msg.type === "complete") {
          updateTask(msg.taskId, {
            status: "completed",
            progress: 100,
            filePath: msg.filePath,
          });
          addToast("下载完成！", "success");
        } else if (msg.type === "error") {
          updateTask(msg.taskId, {
            status: "failed",
            error: msg.error,
          });
          addToast("下载失败: " + msg.error, "error");
        }
      } catch { }
    };

    return () => ws.close();
  }, [updateTask]);

  return (
    <Router>
      <div className="flex min-h-screen" style={{ background: "var(--bg-primary)" }}>
        <Sidebar
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />

        <main className="flex-1 overflow-auto">
          <div
            className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 backdrop-blur-sm lg:hidden"
            style={{
              borderColor: "var(--border-primary)",
              background: "var(--bg-primary)",
            }}
          >
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-1.5 transition-colors hover:scale-105"
              style={{ color: "var(--text-secondary)" }}
            >
              <Menu className="h-5 w-5" />
            </button>
            <span
              className="font-mono text-sm font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              yt-dlp Web
            </span>
          </div>

          <div className="p-6 lg:p-10">
            <Routes>
              <Route path="/" element={<DownloadPage />} />
              <Route path="/tasks" element={<TasksPage />} />
            </Routes>
          </div>
        </main>
      </div>
      <ToastContainer />
    </Router>
  );
}
