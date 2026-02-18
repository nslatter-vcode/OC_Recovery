import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DateTime } from "luxon";

export async function POST(req: NextRequest) {
  const payload = await req.json();
  if (!payload?.feedback) {
    return NextResponse.json({ error: "feedback required" }, { status: 400 });
  }

  const today = DateTime.utc().toISODate();
  const existing = await prisma.dailySignal.findUnique({ where: { utcDate: today } });
  if (!existing) {
    return NextResponse.json({ error: "no signal for today" }, { status: 404 });
  }

  const allowed = ["UP", "DOWN", "FIRE"];
  const normalized = payload.feedback.toUpperCase();
  if (!allowed.includes(normalized)) {
    return NextResponse.json({ error: "invalid feedback" }, { status: 400 });
  }

  const updated = await prisma.dailySignal.update({ where: { id: existing.id }, data: { feedback: normalized } });
  return NextResponse.json(updated);
}
