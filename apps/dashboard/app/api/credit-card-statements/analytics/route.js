import {
  computeCreditCardStatementsAnalytics,
  loadCreditCardStatementsManifest,
} from "lib/creditCardStatements";

export const runtime = "nodejs";

export async function GET() {
  try {
    const manifest = loadCreditCardStatementsManifest();
    const analytics = computeCreditCardStatementsAnalytics(manifest);
    return Response.json(analytics);
  } catch (error) {
    return new Response(`failed to load statements analytics: ${error.message}`, { status: 500 });
  }
}
