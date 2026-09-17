import { prisma } from "../../../../lib/prisma";
import { CONFIG_ID, DEFAULT_CONFIG, HEARTBEAT_ID, configCatalog, normalizeConfig, parseParams } from "../../../../lib/binance/config.mjs";
import { describeModeReadiness, MODE_IDS } from "../../../../lib/binance/modes.mjs";
import { deriveLiveness, summarizeOrders } from "../../../../lib/binance/portfolio.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Everything the dashboard polls, read straight from sqlite. No Binance call
// happens here, so polling this route costs no API weight and cannot get the
// dashboard rate limited while the worker is trading.
export async function GET() {
  try {
    const configRow =
      (await prisma.botConfig.findUnique({ where: { id: CONFIG_ID } })) ??
      (await prisma.botConfig.create({ data: DEFAULT_CONFIG }));
    const config = normalizeConfig(configRow);

    const [heartbeat, orders, events] = await Promise.all([
      prisma.botHeartbeat.findUnique({ where: { id: HEARTBEAT_ID } }),
      prisma.botOrder.findMany({ orderBy: { id: "desc" }, take: 50 }),
      prisma.botEvent.findMany({ orderBy: { id: "desc" }, take: 60 }),
    ]);

    const modeOrders = orders.filter(
      (order) => order.mode === config.mode && order.symbol === config.symbol,
    );
    const portfolio = summarizeOrders(modeOrders, heartbeat?.lastPrice ?? 0);
    const liveness = deriveLiveness(heartbeat, { intervalMs: config.intervalMs });

    return Response.json({
      config: { ...config, params: parseParams(config.params, config.strategy) },
      catalog: configCatalog(),
      heartbeat: heartbeat ?? null,
      liveness,
      portfolio,
      orders,
      events,
      readiness: Object.fromEntries(
        MODE_IDS.map((id) => [id, describeModeReadiness(id)]),
      ),
    });
  } catch (error) {
    return new Response(`failed to load trading status: ${error.message}`, { status: 500 });
  }
}
