import fs from "fs";
import { getExpenseTrackerPath } from "../../../../lib/expensesCsv";

export const runtime = "nodejs";

export async function GET() {
  try {
    const sourcePath = getExpenseTrackerPath();
    const contents = fs.readFileSync(sourcePath, "utf8");

    return new Response(contents, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "inline; filename=assets-and-expenses-2012-2024-out.csv",
      },
    });
  } catch (error) {
    return new Response(`failed to load source csv: ${error.message}`, { status: 500 });
  }
}
