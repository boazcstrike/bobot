import { prisma } from "../../../lib/prisma";

export async function GET() {
  const reminders = await prisma.reminder.findMany({
    orderBy: { remindAt: "asc" },
    take: 20,
  });
  return Response.json(reminders);
}

export async function POST(request) {
  const body = await request.json();
  if (!body?.title || !body?.remindAt) {
    return new Response("title and remindAt are required", { status: 400 });
  }

  const reminder = await prisma.reminder.create({
    data: {
      title: String(body.title),
      remindAt: new Date(body.remindAt),
    },
  });

  return Response.json(reminder, { status: 201 });
}
