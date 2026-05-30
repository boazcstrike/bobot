import { checkMongoConnection } from "../../../../lib/mongodb";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await checkMongoConnection();
    return Response.json({ ok: true, ...result });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "unknown error",
      },
      { status: 500 },
    );
  }
}
