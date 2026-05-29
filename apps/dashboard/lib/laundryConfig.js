import fs from "fs";
import path from "path";

const DEFAULT_REPO_PATH = "C:\\Users\\boazs\\webdev\\laundry-silayan";
const CONFIG_DIR = path.join(process.cwd(), ".data");
const CONFIG_PATH = path.join(CONFIG_DIR, "laundry-config.json");

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function getLaundryConfig() {
  ensureConfigDir();
  if (!fs.existsSync(CONFIG_PATH)) {
    return { repoPath: DEFAULT_REPO_PATH };
  }
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return { repoPath: parsed?.repoPath || DEFAULT_REPO_PATH };
  } catch {
    return { repoPath: DEFAULT_REPO_PATH };
  }
}

export function saveLaundryConfig(input) {
  const repoPath = String(input?.repoPath || "").trim();
  if (!repoPath) {
    throw new Error("repoPath is required");
  }
  if (!path.isAbsolute(repoPath)) {
    throw new Error("repoPath must be an absolute path");
  }
  if (!fs.existsSync(repoPath)) {
    throw new Error("repoPath does not exist");
  }
  ensureConfigDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify({ repoPath }, null, 2));
  return { repoPath };
}
