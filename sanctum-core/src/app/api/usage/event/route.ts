import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const payload = await req.json();
  if (!payload?.tsCst || !payload?.model) {
    return NextResponse.json({ error: "tsCst and model required" }, { status: 400 });
  }

  const created = await prisma.usageEvent.create({
    data: {
      tsCst: new Date(payload.tsCst),
      model: payload.model,
      inputTokens: Number(payload.inputTokens ?? 0),
      outputTokens: Number(payload.outputTokens ?? 0),
      totalTokens: Number(payload.totalTokens ?? 0),
      estimatedCost: Number(payload.estimatedCost ?? 0),
    },
  });

  return NextResponse.json(created);
}
