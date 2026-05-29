import { createClient } from "@libsql/client";
import path from "path";
import { getLaundryConfig } from "../../../../lib/laundryConfig";

export const runtime = "nodejs";

export async function GET() {
  try {
    const repoPath = getLaundryConfig().repoPath;
    const dbPath = path.join(repoPath, "data", "analytics.db");
    const client = createClient({ url: `file:${dbPath}` });

    const totalsRows = await client.execute(`
          SELECT
            COUNT(*) as totalSubmissions,
            SUM(CASE WHEN channel_success = 1 THEN 1 ELSE 0 END) as successfulSubmissions,
            SUM(CASE WHEN channel_success = 0 THEN 1 ELSE 0 END) as failedSubmissions,
            ROUND(AVG(items_with_values), 1) as averageItemsPerSubmission
          FROM submissions
        `);
    const totals = totalsRows.rows?.[0] || {};

    const channelsRows = await client.execute(`
          SELECT channel, COUNT(*) as count
          FROM submissions
          GROUP BY channel
          ORDER BY count DESC
        `);

    const itemsRows = await client.execute(`
          SELECT item_name as name, SUM(count) as totalCount
          FROM submission_items
          GROUP BY item_name
          ORDER BY totalCount DESC
          LIMIT 8
        `);

    const dailyRows = await client.execute(`
          SELECT date(timestamp) as day, COUNT(*) as count
          FROM submissions
          GROUP BY date(timestamp)
          ORDER BY day DESC
          LIMIT 7
        `);

    const recentRows = await client.execute(`
          SELECT id, timestamp, channel, customer_reference, scenario, items_with_values, channel_success
          FROM submissions
          ORDER BY timestamp DESC
          LIMIT 10
        `);

    const summary = {
      totalSubmissions: Number(totals.totalSubmissions || 0),
      successfulSubmissions: Number(totals.successfulSubmissions || 0),
      failedSubmissions: Number(totals.failedSubmissions || 0),
      averageItemsPerSubmission: Number(totals.averageItemsPerSubmission || 0),
      channels: channelsRows.rows || [],
      items: itemsRows.rows || [],
      daily: (dailyRows.rows || []).reverse(),
      recent: recentRows.rows || [],
    };

    return Response.json(summary);
  } catch (error) {
    return new Response(`failed to read laundry analytics: ${error.message}`, { status: 500 });
  }
}
