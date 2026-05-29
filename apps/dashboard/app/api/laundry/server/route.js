import {
  getLaundryServerStatus,
  startLaundryServer,
  stopLaundryServer,
} from "../../../../lib/laundryServerManager";

export const runtime = "nodejs";

export async function GET() {
  return Response.json(getLaundryServerStatus());
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const action = body?.action;

  if (action === "start") {
    return Response.json(await startLaundryServer());
  }
  if (action === "stop") {
    return Response.json(await stopLaundryServer());
  }

  return new Response("invalid action", { status: 400 });
}
