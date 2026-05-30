import { computeExpenseAnalytics, loadExpenseRows } from "../../../../lib/expensesCsv";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = loadExpenseRows();
    const analytics = computeExpenseAnalytics(rows);
    return Response.json(analytics);
  } catch (error) {
    return new Response(`failed to load expense analytics: ${error.message}`, { status: 500 });
  }
}
