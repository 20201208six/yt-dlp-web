﻿﻿﻿import { WebSocketServer, WebSocket } from "ws";
import type { TaskInfo } from "./types.js";
import type { Server } from "http";

// Task store
const taskStore = new Map<string, TaskInfo>();

// WebSocket clients
const clients = new Set<WebSocket>();

export function getTaskStore(): Map<string, TaskInfo> {
  return taskStore;
}

export function broadcastMessage(message: object): void {
  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

export function cleanupTask(taskId: string): void {
  taskStore.delete(taskId);
}

export function setupWebSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    clients.add(ws);
    console.log(`WebSocket client connected (${clients.size} total)`);

    ws.on("close", () => {
      clients.delete(ws);
      console.log(`WebSocket client disconnected (${clients.size} total)`);
    });

    ws.on("error", (err) => {
      console.error("WebSocket error:", err);
      clients.delete(ws);
    });
  });

  return wss;
}
