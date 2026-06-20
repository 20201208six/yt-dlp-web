export interface FormatInfo {
  id: string;
  ext: string;
  resolution: string;
  filesize: number | null;
  note: string;
  hasAudio: boolean;
}

export interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  uploader: string;
  formats: FormatInfo[];
}

export type TaskStatus =
  | "queued"
  | "parsing"
  | "downloading"
  | "completed"
  | "failed";

export interface TaskInfo {
  id: string;
  url: string;
  title: string;
  formatId: string;
  status: TaskStatus;
  progress: number;
  speed: string;
  eta: string;
  filePath: string | null;
  error: string | null;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
