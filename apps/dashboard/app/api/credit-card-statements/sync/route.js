import {
  buildStatementRecordId,
  buildStoredFilename,
  computeCreditCardStatementsAnalytics,
  loadCreditCardStatementsManifest,
  saveCreditCardStatementsManifest,
  upsertStatementRecord,
  writeStatementFile,
} from "lib/creditCardStatements";
import { fetchRcbcStatementAttachments } from "lib/gmailStatements";
import { fetchRcbcStatementAttachmentsViaPlaywright } from "lib/playwrightGmailStatements";

export const runtime = "nodejs";
const SOURCE_GMAIL_API = "gmail_api";
const SOURCE_PLAYWRIGHT_CHROME = "playwright_chrome";

function toOptionalString(value) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

function isValidDateInput(value) {
  if (!value) return true;
  return Number.isFinite(Date.parse(value));
}

function startOfCurrentYearIsoUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0)).toISOString();
}

async function readRequestBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function POST(request) {
  const requestBody = await readRequestBody(request);
  const requestedSource = toOptionalString(requestBody?.source);
  const source =
    requestedSource ||
    toOptionalString(process.env.STATEMENTS_SYNC_SOURCE) ||
    SOURCE_GMAIL_API;

  if (![SOURCE_GMAIL_API, SOURCE_PLAYWRIGHT_CHROME].includes(source)) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: `Invalid source. Allowed values: ${SOURCE_GMAIL_API}, ${SOURCE_PLAYWRIGHT_CHROME}.`,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const manifest = loadCreditCardStatementsManifest();
  const existingIds = new Set((manifest.items || []).map((item) => item.id));
  const analyticsBeforeSync = computeCreditCardStatementsAnalytics(manifest);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;
  let messagesScanned = 0;
  let queryUsed = "";
  let sourceUsed = source;
  let gmailUserId = String(process.env.RCBC_GMAIL_USER_ID || "").trim() || "me";
  let targetEmail = String(process.env.RCBC_GMAIL_TARGET_EMAIL || "").trim() || null;
  let authenticatedEmail = null;
  const fullScan = requestBody?.fullScan === true;
  const requestedPeriodStart = toOptionalString(requestBody?.periodStart);
  const requestedPeriodEnd = toOptionalString(requestBody?.periodEnd);
  let periodStartUsed = requestedPeriodStart;
  let periodEndUsed = requestedPeriodEnd;

  if (!isValidDateInput(requestedPeriodStart) || !isValidDateInput(requestedPeriodEnd)) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Invalid periodStart or periodEnd date value.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  if (requestedPeriodStart && requestedPeriodEnd) {
    const startTimestamp = Date.parse(requestedPeriodStart);
    const endTimestamp = Date.parse(requestedPeriodEnd);
    if (startTimestamp > endTimestamp) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "periodStart must be earlier than or equal to periodEnd.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  if (!fullScan && !periodStartUsed && !periodEndUsed) {
    periodStartUsed = startOfCurrentYearIsoUtc();
  }

  try {
    const syncPayload =
      source === SOURCE_PLAYWRIGHT_CHROME
        ? await fetchRcbcStatementAttachmentsViaPlaywright({
            periodStart: fullScan ? null : periodStartUsed,
            periodEnd: fullScan ? null : periodEndUsed,
          })
        : await fetchRcbcStatementAttachments({
            periodStart: fullScan ? null : periodStartUsed,
            periodEnd: fullScan ? null : periodEndUsed,
          });
    const attachments = syncPayload.attachments || [];
    messagesScanned = syncPayload.messagesScanned || 0;
    queryUsed = syncPayload.query || "";
    gmailUserId = syncPayload.gmailUserId || "me";
    targetEmail = syncPayload.targetEmail || null;
    authenticatedEmail = syncPayload.authenticatedEmail || null;
    periodStartUsed = syncPayload.queryPeriod?.periodStart || (fullScan ? null : periodStartUsed);
    periodEndUsed = syncPayload.queryPeriod?.periodEnd || (fullScan ? null : periodEndUsed);

    for (const attachment of attachments) {
      const recordId = buildStatementRecordId(attachment.messageId, attachment.attachmentId);
      if (existingIds.has(recordId)) {
        skipped += 1;
        continue;
      }

      const status = "processed";
      const storedFilename = buildStoredFilename({
        emailDate: attachment.emailDate,
        messageId: attachment.messageId,
        attachmentId: attachment.attachmentId,
        originalFilename: attachment.filename,
      });

      try {
        const saved = writeStatementFile({
          filename: storedFilename,
          contentBuffer: attachment.contentBuffer,
        });

        upsertStatementRecord(manifest, {
          id: recordId,
          messageId: attachment.messageId,
          attachmentId: attachment.attachmentId,
          emailDate: attachment.emailDate,
          subject: attachment.subject || "",
          from: attachment.from || "",
          filename: attachment.filename,
          savedPath: saved.relativePath,
          sizeBytes: attachment.sizeBytes,
          status,
          processedAt: new Date().toISOString(),
          error: null,
        });

        existingIds.add(recordId);
        downloaded += 1;
      } catch (error) {
        failed += 1;
        upsertStatementRecord(manifest, {
          id: recordId,
          messageId: attachment.messageId,
          attachmentId: attachment.attachmentId,
          emailDate: attachment.emailDate,
          subject: attachment.subject || "",
          from: attachment.from || "",
          filename: attachment.filename,
          savedPath: null,
          sizeBytes: attachment.sizeBytes,
          status: "failed",
          processedAt: null,
          error: error.message,
        });
      }
    }

    manifest.lastSyncedAt = new Date().toISOString();
    saveCreditCardStatementsManifest(manifest);

    return Response.json({
      ok: true,
      downloaded,
      skipped,
      failed,
      messagesScanned,
      queryUsed,
      sourceUsed,
      gmailUserId,
      targetEmail,
      authenticatedEmail,
      periodStartUsed,
      periodEndUsed,
      fullScan,
      analytics: computeCreditCardStatementsAnalytics(manifest),
    });
  } catch (error) {
    manifest.lastSyncedAt = new Date().toISOString();
    saveCreditCardStatementsManifest(manifest);
    return new Response(
      JSON.stringify({
        ok: false,
        downloaded,
        skipped,
        failed,
        messagesScanned,
        queryUsed,
        sourceUsed,
        gmailUserId,
        targetEmail,
        authenticatedEmail,
        periodStartUsed,
        periodEndUsed,
        fullScan,
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
