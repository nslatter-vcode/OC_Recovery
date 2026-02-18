import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DateTime } from "luxon";
import { CHICAGO_ZONE } from "@/lib/time";

const RECURRING_TYPE = "RECURRING";

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86_400_000);
}

export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  const params = await context.params;
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  const data = await req.json();
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    return NextResponse.json({ error: "task not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data || {})) {
    if (key === "dueAt" && value) {
      updates[key] = new Date(value as string);
      continue;
    }
    if (["domain", "status", "priority", "revenueImpact", "blockedBy", "type"].includes(key)) {
      updates[key] = typeof value === "string" ? value.toUpperCase() : value;
      continue;
    }
    updates[key] = value;
  }

  if (data?.status === "DONE" && task.status !== "DONE") {
    updates.closedAt = new Date();
  }

  const updated = await prisma.task.update({ where: { id }, data: updates });

  if (data?.status === "DONE" && task.type === RECURRING_TYPE && task.repeatIntervalDays) {
    const base = task.dueAt ? DateTime.fromJSDate(task.dueAt).setZone(CHICAGO_ZONE) : DateTime.now().setZone(CHICAGO_ZONE);
    const nextDue = base.plus({ days: task.repeatIntervalDays }).toJSDate();
    await prisma.task.create({
      data: {
        title: task.title,
        domain: task.domain,
        status: "OPEN",
        priority: task.priority,
        revenueImpact: task.revenueImpact,
        blocked: false,
        type: task.type,
        repeatIntervalDays: task.repeatIntervalDays,
        dueAt: nextDue,
        tags: task.tags,
      },
    });
  }

  return NextResponse.json(updated);
}
