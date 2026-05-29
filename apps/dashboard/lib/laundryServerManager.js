import { spawn } from "child_process";
import { setTimeout as delay } from "timers/promises";
import { getLaundryConfig } from "./laundryConfig";

const READY_PATTERNS = [/ready/i, /localhost:/i, /compiled/i, /started/i];
const MAX_LOG_LINES = 250;
const STARTUP_TIMEOUT_MS = 60000;

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const args = ["run", "dev"];

function makeState() {
  return {
    status: "stopped",
    repoPath: getLaundryConfig().repoPath,
    process: null,
    pid: null,
    startedAt: null,
    stoppedAt: null,
    readyAt: null,
    lastExitCode: null,
    lastExitSignal: null,
    lastError: null,
    logs: [],
  };
}

function ensureManager() {
  if (!globalThis.__laundryServerManager) {
    globalThis.__laundryServerManager = makeState();
  }
  return globalThis.__laundryServerManager;
}

function pushLog(state, source, message) {
  const text = String(message ?? "").trimEnd();
  if (!text) return;
  const lines = text.split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    state.logs.push({
      at: new Date().toISOString(),
      source,
      text: line,
    });
  }
  if (state.logs.length > MAX_LOG_LINES) {
    state.logs = state.logs.slice(-MAX_LOG_LINES);
  }
}

function hasReadySignal(line) {
  return READY_PATTERNS.some((pattern) => pattern.test(line));
}

function snapshot(state) {
  return {
    status: state.status,
    repoPath: state.repoPath,
    pid: state.pid,
    startedAt: state.startedAt,
    readyAt: state.readyAt,
    stoppedAt: state.stoppedAt,
    lastExitCode: state.lastExitCode,
    lastExitSignal: state.lastExitSignal,
    lastError: state.lastError,
    logs: state.logs.slice(-50),
  };
}

async function forceKillTree(pid) {
  if (!pid) return;
  if (process.platform === "win32") {
    const killer = spawn("taskkill", ["/PID", String(pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true,
    });
    await new Promise((resolve) => killer.on("close", resolve));
    return;
  }
  process.kill(pid, "SIGKILL");
}

export function getLaundryServerStatus() {
  return snapshot(ensureManager());
}

export async function startLaundryServer() {
  const state = ensureManager();
  if (state.status === "running" || state.status === "starting") {
    return snapshot(state);
  }

  state.status = "starting";
  state.startedAt = new Date().toISOString();
  state.stoppedAt = null;
  state.readyAt = null;
  state.lastExitCode = null;
  state.lastExitSignal = null;
  state.lastError = null;
  state.logs = [];
  state.repoPath = getLaundryConfig().repoPath;

  const child = spawn(command, args, {
    cwd: state.repoPath,
    shell: false,
    windowsHide: true,
    env: process.env,
  });

  state.process = child;
  state.pid = child.pid ?? null;

  child.stdout?.on("data", (chunk) => {
    const text = chunk.toString();
    pushLog(state, "stdout", text);
    if (!state.readyAt && hasReadySignal(text)) {
      state.readyAt = new Date().toISOString();
      state.status = "running";
    }
  });

  child.stderr?.on("data", (chunk) => {
    const text = chunk.toString();
    pushLog(state, "stderr", text);
    if (/error|failed|exception/i.test(text)) {
      state.lastError = text.trim().slice(0, 1000);
      if (state.status === "starting") {
        state.status = "error";
      }
    }
  });

  child.on("error", (error) => {
    state.lastError = error.message;
    state.status = "error";
    state.stoppedAt = new Date().toISOString();
    state.process = null;
    state.pid = null;
  });

  child.on("exit", (code, signal) => {
    state.lastExitCode = code;
    state.lastExitSignal = signal;
    state.stoppedAt = new Date().toISOString();
    state.process = null;
    state.pid = null;
    state.status = code === 0 ? "stopped" : "error";
  });

  void delay(1500).then(() => {
    if (state.status === "starting") {
      state.status = "running";
    }
  });

  void delay(STARTUP_TIMEOUT_MS).then(() => {
    if (state.status === "starting") {
      state.status = "error";
      state.lastError = "Startup timeout: server did not report ready state in time.";
    }
  });

  return snapshot(state);
}

export async function stopLaundryServer() {
  const state = ensureManager();
  const child = state.process;
  if (!child || !state.pid) {
    state.status = "stopped";
    return snapshot(state);
  }

  state.status = "stopping";
  const pid = state.pid;
  child.kill("SIGINT");
  await delay(2500);

  if (state.process) {
    await forceKillTree(pid);
  }

  await delay(300);
  state.process = null;
  state.pid = null;
  state.stoppedAt = new Date().toISOString();
  state.status = "stopped";
  return snapshot(state);
}
