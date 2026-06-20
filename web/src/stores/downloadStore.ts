import { create } from "zustand";
import type { VideoInfo, TaskInfo } from "@/types";

interface DownloadStore {
  // Parse state
  isParsing: boolean;
  parseError: string | null;
  parsedVideo: VideoInfo | null;
  selectedFormatId: string | null;

  // Task list
  tasks: TaskInfo[];

  // Actions
  setParsing: (v: boolean) => void;
  setParseError: (e: string | null) => void;
  setParsedVideo: (v: VideoInfo | null) => void;
  setSelectedFormatId: (id: string | null) => void;
  setTasks: (tasks: TaskInfo[]) => void;
  updateTask: (taskId: string, updates: Partial<TaskInfo>) => void;
  addTask: (task: TaskInfo) => void;

  // Derived
  activeTasks: () => TaskInfo[];
  completedTasks: () => TaskInfo[];
  failedTasks: () => TaskInfo[];
}

export const useDownloadStore = create<DownloadStore>((set, get) => ({
  isParsing: false,
  parseError: null,
  parsedVideo: null,
  selectedFormatId: null,
  tasks: [],

  setParsing: (v) => set({ isParsing: v }),
  setParseError: (e) => set({ parseError: e }),
  setParsedVideo: (v) => set({ parsedVideo: v }),
  setSelectedFormatId: (id) => set({ selectedFormatId: id }),
  setTasks: (tasks) => set({ tasks }),
  updateTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    })),
  addTask: (task) =>
    set((state) => ({ tasks: [task, ...state.tasks] })),

  activeTasks: () =>
    get().tasks.filter(
      (t) => t.status === "queued" || t.status === "downloading" || t.status === "parsing"
    ),
  completedTasks: () => get().tasks.filter((t) => t.status === "completed"),
  failedTasks: () => get().tasks.filter((t) => t.status === "failed"),
}));
