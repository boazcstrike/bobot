import {
  buildStatementRecordId,
  buildStoredFilename,
  computeCreditCardStatementsAnalytics,
  hashStatementBuffer,
  isAllowedStatementFilename,
  loadCreditCardStatementsManifest,
  saveCreditCardStatementsManifest,
  upsertStatementRecord,
  writeStatementFile,
} from "lib/creditCardStatements";

export const runtime = "nodejs";

const SOURCE_MANUAL_UPLOAD = "manual_upload";

// Batch + size limits. Keep in sync with the client-side validation in
// app/expenses/page.js (UPLOAD_MAX_* constants).
const MAX_FILES_PER_BATCH = 20;
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB per file
const MAX_BATCH_BYTES = 100 * 1024 * 1024; // 100 MB per request

// Rate limit: fixed window per client. In-memory, so it resets on server
// restart and is per-instance only (acceptable for the single-instance dashboard).
const RATE_LIMIT_MAX_REQUESTS = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const rateLimitBuckets = new Map();

function pruneRateLimitBuckets(now) {
  if (rateLimitBuckets.size < 1000) return;
  for (const [key, entry] of rateLimitBuckets) {
    if (now >= entry.resetAt) rateLimitBuckets.delete(key);
  }
}

function checkRateLimit(clientKey) {
  const now = Date.now();
  pruneRateLimitBuckets(now);
  const entry = rateLimitBuckets.get(clientKey);
  if (!entry || now >= entry.resetAt) {
    rateLimitBuckets.set(clientKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

function getClientKey(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "local";
}

function jsonError(message, status = 400, extraHeaders = {}) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

// Lightweight content sniffing so a renamed binary cannot masquerade as an
// allowed type purely by file extension.
function detectContentIssue(filename, buffer) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) {
    const header = buffer.subarray(0, 5).toString("latin1");
    return header === "%PDF-" ? null : "Not a valid PDF (missing %PDF- header).";
  }
  if (lower.endsWith(".csv")) {
    // Reject files containing NUL bytes in the first chunk (binary, not text/CSV).
    const sample = buffer.subarray(0, 8192);
    return sample.includes(0) ? "Not a valid CSV (binary content detected)." : null;
  }
  return null;
}

export async function POST(request) {
  const rate = checkRateLimit(getClientKey(request));
  if (!rate.allowed) {
    return jsonError(`Rate limit exceeded. Try again in ${rate.retryAfterSeconds}s.`, 429, {
      "Retry-After": String(rate.retryAfterSeconds),
    });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Request must be multipart/form-data with file uploads.");
  }

  const files = formData
    .getAll("files")
    .concat(formData.getAll("file"))
    .filter((entry) => typeof entry === "object" && typeof entry.arrayBuffer === "function");

  if (!files.length) {
    return jsonError("No files provided. Attach one or more files under the 'files' field.");
  }

  if (files.length > MAX_FILES_PER_BATCH) {
    return jsonError(`Too many files in one batch (max ${MAX_FILES_PER_BATCH}).`);
  }

  const declaredTotalBytes = files.reduce((sum, file) => sum + (Number(file.size) || 0), 0);
  if (declaredTotalBytes > MAX_BATCH_BYTES) {
    return jsonError(
      `Batch exceeds total size limit (max ${Math.round(MAX_BATCH_BYTES / (1024 * 1024))} MB).`,
    );
  }

  const manifest = loadCreditCardStatementsManifest();
  const existingIds = new Set((manifest.items || []).map((item) => item.id));
  const batchHashes = new Set();

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;
  const results = [];
  const uploadedAt = new Date().toISOString();

  for (const file of files) {
    const originalFilename = String(file.name || "statement.pdf");
    const pushResult = (status, reason) => {
      results.push({ filename: originalFilename, status, reason: reason || null });
    };

    if (!isAllowedStatementFilename(originalFilename)) {
      failed += 1;
      pushResult("rejected", "Unsupported file type (allowed: .pdf, .csv).");
      continue;
    }

    let contentBuffer;
    try {
      contentBuffer = Buffer.from(await file.arrayBuffer());
    } catch {
      failed += 1;
      pushResult("rejected", "Failed to read file content.");
      continue;
    }

    if (!contentBuffer.length) {
      failed += 1;
      pushResult("rejected", "File is empty.");
      continue;
    }

    if (contentBuffer.length > MAX_FILE_BYTES) {
      failed += 1;
      pushResult("rejected", `File exceeds ${Math.round(MAX_FILE_BYTES / (1024 * 1024))} MB limit.`);
      continue;
    }

    const contentIssue = detectContentIssue(originalFilename, contentBuffer);
    if (contentIssue) {
      failed += 1;
      pushResult("rejected", contentIssue);
      continue;
    }

    const contentHash = hashStatementBuffer(contentBuffer);
    const recordId = buildStatementRecordId(SOURCE_MANUAL_UPLOAD, contentHash);
    if (existingIds.has(recordId) || batchHashes.has(contentHash)) {
      skipped += 1;
      pushResult("skipped", "Duplicate of an existing statement.");
      continue;
    }
    batchHashes.add(contentHash);

    const storedFilename = buildStoredFilename({
      emailDate: uploadedAt,
      messageId: SOURCE_MANUAL_UPLOAD,
      attachmentId: contentHash,
      originalFilename,
    });

    try {
      const saved = writeStatementFile({ filename: storedFilename, contentBuffer });
      upsertStatementRecord(manifest, {
        id: recordId,
        messageId: SOURCE_MANUAL_UPLOAD,
        attachmentId: contentHash,
        emailDate: uploadedAt,
        subject: "Manual upload",
        from: SOURCE_MANUAL_UPLOAD,
        filename: originalFilename,
        savedPath: saved.relativePath,
        sizeBytes: contentBuffer.length,
        status: "processed",
        source: SOURCE_MANUAL_UPLOAD,
        uploadedAt,
        processedAt: uploadedAt,
        error: null,
      });
      existingIds.add(recordId);
      uploaded += 1;
      pushResult("uploaded", null);
    } catch (error) {
      failed += 1;
      pushResult("rejected", error.message);
    }
  }

  manifest.lastSyncedAt = new Date().toISOString();
  saveCreditCardStatementsManifest(manifest);

  return Response.json({
    ok: failed === 0,
    sourceUsed: SOURCE_MANUAL_UPLOAD,
    uploaded,
    skipped,
    failed,
    results,
    // Retained for backward compatibility with existing UI summary rendering.
    rejected: results.filter((entry) => entry.status === "rejected"),
    analytics: computeCreditCardStatementsAnalytics(manifest),
  });
}
