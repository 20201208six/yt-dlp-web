import {
  Download,
  ListVideo,
  Sun,
  Moon,
  X,
  Github,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved !== "light";
  });

  useEffect(() => {
    localStorage.setItem("theme", isDark ? "dark" : "light");
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const sidebarStyle = {
    background: "var(--bg-primary)",
    borderColor: "var(--border-primary)",
  };

  const logoStyle = { color: "var(--text-primary)" };
  const navActiveStyle = {
    background: "var(--bg-active)",
    color: "var(--accent)",
  };
  const navStyle = {
    color: "var(--text-secondary)",
    background: "transparent",
  };
  const navHoverStyle = {
    background: "var(--bg-hover)",
    color: "var(--text-primary)",
  };
  const footerStyle = { borderColor: "var(--border-primary)" };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-56 flex-shrink-0 border-r transition-transform duration-300 lg:static lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={sidebarStyle}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div
            className="flex h-16 items-center gap-3 border-b px-5"
            style={{ borderColor: "var(--border-primary)" }}
          >
            <Download className="h-6 w-6" style={{ color: "var(--accent)" }} />
            <span className="font-mono text-lg font-bold tracking-tight" style={logoStyle}>
              yt-dlp
            </span>
            <button
              className="ml-auto lg:hidden"
              style={{ color: "var(--text-secondary)" }}
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            <NavLink
              to="/"
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
              style={({ isActive }) => (isActive ? navActiveStyle : navStyle)}
            >
              {({ isActive }) => (
                <>
                  <Download className="h-4 w-4" />
                  新建下载
                </>
              )}
            </NavLink>
            <NavLink
              to="/tasks"
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
              style={({ isActive }) => (isActive ? navActiveStyle : navStyle)}
            >
              {({ isActive }) => (
                <>
                  <ListVideo className="h-4 w-4" />
                  任务管理
                </>
              )}
            </NavLink>
          </nav>

          {/* Theme Toggle */}
          <div className="border-t px-5 py-3" style={footerStyle}>
            <button
              onClick={toggleTheme}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              style={navStyle}
            >
              {isDark ? (
                <>
                  <Sun className="h-4 w-4" style={{ color: "var(--warning)" }} />
                  切换白天模式
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" style={{ color: "var(--accent)" }} />
                  切换黑夜模式
                </>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="border-t px-5 py-4" style={footerStyle}>
            <a
              href="https://github.com/yt-dlp/yt-dlp"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs transition-colors hover:underline"
              style={{ color: "var(--text-muted)" }}
            >
              <Github className="h-3.5 w-3.5" />
              yt-dlp on GitHub
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
