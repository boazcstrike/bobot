import { promises as fs } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// Caps so a pathological repo (huge commit, slow disk) can't hang a request or
// blow up process memory.
const RECENT_COMMITS = 15;
const STATUS_FILE_LIMIT = 200;
const DIFF_CHAR_LIMIT = 40000;
const GIT_MAX_BUFFER = 16 * 1024 * 1024;
const GIT_TIMEOUT_MS = 15000;

// Field/record separators for machine-readable `git log` output.
const FIELD = "";
const RECORD = "";

export async function isGitRepo(repoPath) {
  if (!repoPath) return false;
  try {
    const stat = await fs.stat(repoPath);
    if (!stat.isDirectory()) return false;
    await execFileAsync("git", ["rev-parse", "--is-inside-work-tree"], {
      cwd: repoPath,
      windowsHide: true,
      timeout: GIT_TIMEOUT_MS,
    });
    return true;
  } catch {
    return false;
  }
}

async function git(cwd, args) {
  const { stdout } = await execFileAsync("git", args, {
    cwd,
    windowsHide: true,
    maxBuffer: GIT_MAX_BUFFER,
    timeout: GIT_TIMEOUT_MS,
  });
  return stdout;
}

async function getBranchState(cwd) {
  const branch = (await git(cwd, ["rev-parse", "--abbrev-ref", "HEAD"]).catch(() => "")).trim();

  let upstream = "";
  let ahead = 0;
  let behind = 0;
  try {
    upstream = (await git(cwd, ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"])).trim();
    const counts = (await git(cwd, ["rev-list", "--left-right", "--count", "@{upstream}...HEAD"])).trim();
    const [behindRaw, aheadRaw] = counts.split(/\s+/);
    behind = Number(behindRaw) || 0;
    ahead = Number(aheadRaw) || 0;
  } catch {
    // No upstream configured — leave ahead/behind at 0 and upstream empty.
  }

  return { branch, upstream, ahead, behind };
}

function parseStatus(porcelain) {
  const staged = [];
  const unstaged = [];
  const untracked = [];

  for (const line of porcelain.split("\n")) {
    if (!line) continue;
    const x = line[0];
    const y = line[1];
    const file = line.slice(3);
    if (x === "?" && y === "?") {
      untracked.push(file);
      continue;
    }
    if (x !== " " && x !== "?") staged.push({ status: x, file });
    if (y !== " " && y !== "?") unstaged.push({ status: y, file });
  }

  const truncate = (list) => ({
    items: list.slice(0, STATUS_FILE_LIMIT),
    truncated: Math.max(0, list.length - STATUS_FILE_LIMIT),
    total: list.length,
  });

  return {
    staged: truncate(staged),
    unstaged: truncate(unstaged),
    untracked: truncate(untracked),
    clean: !staged.length && !unstaged.length && !untracked.length,
  };
}

async function getRecentCommits(cwd) {
  const format = ["%H", "%h", "%an", "%aI", "%s"].join(FIELD) + RECORD;
  const out = await git(cwd, ["log", `-n${RECENT_COMMITS}`, `--pretty=format:${format}`]).catch(() => "");
  return out
    .split(RECORD)
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [hash, shortHash, author, date, subject] = record.split(FIELD);
      return { hash, shortHash, author, date, subject };
    });
}

async function getLatestDiff(cwd) {
  // `--no-renames` avoids O(n^2) rename detection that can stall huge commits.
  const stat = await git(cwd, [
    "show", "HEAD", "--stat", "--oneline", "--no-color", "--no-renames",
  ]).catch(() => "");
  const patch = await git(cwd, [
    "show", "HEAD", "--no-color", "--no-renames", "--no-ext-diff",
  ]).catch(() => "");
  const truncated = patch.length > DIFF_CHAR_LIMIT;
  return {
    stat: stat.trim(),
    patch: truncated ? `${patch.slice(0, DIFF_CHAR_LIMIT)}\n\n... diff truncated ...` : patch,
    truncated,
  };
}

// Loads branch/sync state, working changes, recent commits, and the latest
// commit diff for a local git checkout. Returns null when the path is not a
// readable git repository so callers can fall back gracefully.
export async function getGitActivity(repoPath) {
  if (!(await isGitRepo(repoPath))) {
    return null;
  }

  const [branchState, statusRaw, commits, latestDiff] = await Promise.all([
    getBranchState(repoPath),
    git(repoPath, ["status", "--porcelain=v1"]).catch(() => ""),
    getRecentCommits(repoPath),
    getLatestDiff(repoPath),
  ]);

  return {
    ...branchState,
    status: parseStatus(statusRaw),
    commits,
    latestDiff,
  };
}
