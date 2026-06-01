import {
  listCreditCardStatements,
  loadCreditCardStatementsManifest,
} from "lib/creditCardStatements";

export const runtime = "nodejs";

export async function GET() {
  try {
    const manifest = loadCreditCardStatementsManifest();
    return Response.json({
      items: listCreditCardStatements(manifest),
      lastSyncedAt: manifest.lastSyncedAt || null,
    });
  } catch (error) {
    return new Response(`failed to load statements list: ${error.message}`, { status: 500 });
  }
}
