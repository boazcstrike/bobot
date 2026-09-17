import { prisma } from "../../../../lib/prisma";
import { CONFIG_ID, DEFAULT_CONFIG, normalizeConfig } from "../../../../lib/binance/config.mjs";
import { describeModeReadiness } from "../../../../lib/binance/modes.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Start and stop flip one boolean the worker polls. The dashboard never spawns
// or signals a process, so pressing start twice, or pressing it while the
// worker is down, changes nothing beyond that flag.
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const action = body?.action;
  if (action !== "start" && action !== "stop") {
    return new Response('action must be "start" or "stop"', { status: 400 });
  }

  const current = normalizeConfig(
    (await prisma.botConfig.findUnique({ where: { id: CONFIG_ID } })) ?? DEFAULT_CONFIG,
  );

  if (action === "start") {
    const readiness = describeModeReadiness(current.mode);
    if (!readiness.ready) {
      return new Response(`cannot start in ${current.mode} mode: ${readiness.reason}`, { status: 400 });
    }
  }

  const next = { ...current, enabled: action === "start" };
  await prisma.botConfig.upsert({ where: { id: CONFIG_ID }, create: next, update: next });
  return Response.json({ enabled: next.enabled, mode: next.mode, symbol: next.symbol });
}
