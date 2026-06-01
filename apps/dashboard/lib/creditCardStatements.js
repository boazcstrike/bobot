import crypto from "crypto";
import fs from "fs";
import path from "path";

const REPO_ROOT = path.resolve(process.cwd(), "..", "..");
const STATEMENTS_DIR = path.join(REPO_ROOT, "data", "credit-card-statements");
const STATEMENTS_RAW_DIR = path.join(STATEMENTS_DIR, "raw");
const MANIFEST_PATH = path.join(STATEMENTS_DIR, "manifest.json");

function normalizePathForJson(filePath) {
  return filePath.replaceAll("\\", "/");
}

function createDefaultManifest() {
  return {
    lastSyncedAt: null,
    items: [],
  };
}

export function getCreditCardStatementsPaths() {
  return {
    repoRoot: REPO_ROOT,
    statementsDir: STATEMENTS_DIR,
    rawDir: STATEMENTS_RAW_DIR,
    manifestPath: MANIFEST_PATH,
  };
}

export function ensureCreditCardStatementsStorage() {
  fs.mkdirSync(STATEMENTS_RAW_DIR, { recursive: true });
}

export function loadCreditCardStatementsManifest() {
  ensureCreditCardStatementsStorage();
  if (!fs.existsSync(MANIFEST_PATH)) {
    return createDefaultManifest();
  }

  const raw = fs.readFileSync(MANIFEST_PATH, "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed || !Array.isArray(parsed.items)) {
    return createDefaultManifest();
  }

  return {
    lastSyncedAt: parsed.lastSyncedAt || null,
    items: parsed.items,
  };
}

export function saveCreditCardStatementsManifest(manifest) {
  ensureCreditCardStatementsStorage();
  const payload = {
    lastSyncedAt: manifest.lastSyncedAt || null,
    items: Array.isArray(manifest.items) ? manifest.items : [],
  };
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(payload, null, 2));
  return payload;
}

export function buildStatementRecordId(messageId, attachmentId) {
  return crypto.createHash("sha256").update(`${messageId}:${attachmentId}`).digest("hex");
}

export const ALLOWED_STATEMENT_EXTENSIONS = [".pdf", ".csv"];

export function isAllowedStatementFilename(filename) {
  const lower = String(filename || "").toLowerCase();
  return ALLOWED_STATEMENT_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function hashStatementBuffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function sanitizeFilename(filename) {
  return String(filename || "statement.pdf")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 180);
}

export function buildStoredFilename({ emailDate, messageId, attachmentId, originalFilename }) {
  const datePrefix = String(emailDate || "").slice(0, 10).replaceAll("-", "");
  const shortMessageId = String(messageId || "msg").slice(0, 12);
  const shortAttachmentId = String(attachmentId || "att").slice(0, 12);
  const safeName = sanitizeFilename(originalFilename);
  return `${datePrefix || "undated"}-${shortMessageId}-${shortAttachmentId}-${safeName}`;
}

export function writeStatementFile({ filename, contentBuffer }) {
  ensureCreditCardStatementsStorage();
  const absolutePath = path.join(STATEMENTS_RAW_DIR, filename);
  fs.writeFileSync(absolutePath, contentBuffer);
  const relativeFromRepoRoot = path.relative(REPO_ROOT, absolutePath);
  return {
    absolutePath,
    relativePath: normalizePathForJson(relativeFromRepoRoot),
  };
}

export function upsertStatementRecord(manifest, record) {
  const currentItems = Array.isArray(manifest.items) ? manifest.items : [];
  const index = currentItems.findIndex((item) => item.id === record.id);
  if (index >= 0) {
    currentItems[index] = { ...currentItems[index], ...record };
  } else {
    currentItems.push(record);
  }
  manifest.items = currentItems;
  return manifest;
}

function toDateSortKey(value) {
  const asNumber = Date.parse(value || "");
  return Number.isFinite(asNumber) ? asNumber : 0;
}

function findEmailDateBounds(items) {
  let oldest = null;
  let latest = null;

  for (const item of items) {
    const timestamp = Date.parse(item?.emailDate || "");
    if (!Number.isFinite(timestamp)) continue;
    if (!oldest || timestamp < oldest.timestamp) {
      oldest = { timestamp, iso: new Date(timestamp).toISOString() };
    }
    if (!latest || timestamp > latest.timestamp) {
      latest = { timestamp, iso: new Date(timestamp).toISOString() };
    }
  }

  return {
    oldestEmailDate: oldest?.iso || null,
    latestEmailDate: latest?.iso || null,
  };
}

export function listCreditCardStatements(manifest) {
  const items = Array.isArray(manifest?.items) ? manifest.items : [];
  return [...items].sort((a, b) => {
    const delta = toDateSortKey(b.emailDate) - toDateSortKey(a.emailDate);
    if (delta !== 0) return delta;
    return String(b.filename || "").localeCompare(String(a.filename || ""));
  });
}

export function computeCreditCardStatementsAnalytics(manifest) {
  const items = Array.isArray(manifest?.items) ? manifest.items : [];
  const totalStatements = items.length;
  const totalProcessed = items.filter((item) => item.status === "processed").length;
  const totalPending = items.filter((item) => item.status === "pending").length;
  const totalFailed = items.filter((item) => item.status === "failed").length;
  const bounds = findEmailDateBounds(items);

  return {
    totalStatements,
    totalProcessed,
    totalPending,
    totalFailed,
    lastSyncedAt: manifest?.lastSyncedAt || null,
    oldestEmailDate: bounds.oldestEmailDate,
    latestEmailDate: bounds.latestEmailDate,
  };
}
