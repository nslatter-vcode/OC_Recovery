import { NextRequest, NextResponse } from "next/server";
import { Prisma, Task } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CHICAGO_ZONE } from "@/lib/time";
import { DateTime } from "luxon";

const priorityMap: Record<string, number> = {
  P1: 1,
  P2: 2,
  P3: 3,
};

const marketingMatcher = /marketing/i;

function sortTasks(a: Task, b: Task) {
  const domainScore = (task: Task) => (task.domain === "REAL_ESTATE" ? 0 : 1);
  const priorityScore = (task: Task) => priorityMap[task.priority ?? "P3"] ?? 3;
  const dueScore = (task: Task) => (task.dueAt ? task.dueAt.getTime() : Number.MAX_SAFE_INTEGER);

  const domainDiff = domainScore(a) - domainScore(b);
  if (domainDiff !== 0) return domainDiff;

  const priorityDiff = priorityScore(a) - priorityScore(b);
  if (priorityDiff !== 0) return priorityDiff;

  return dueScore(a) - dueScore(b);
}

function marketingIsOverdue(task: Task) {
  if (!task.tags) return true;
  if (!marketingMatcher.test(task.tags)) return true;
  if (!task.dueAt) return false;
  const due = DateTime.fromJSDate(task.dueAt).setZone(CHICAGO_ZONE);
  return due < DateTime.now().setZone(CHICAGO_ZONE);
}

function toTaskResponse(task: Task) {
  return {
    ...task,
    dueAt: task.dueAt ? task.dueAt.toISOString() : undefined,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    closedAt: task.closedAt?.toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const filters: Prisma.TaskWhereInput = {};
  if (searchParams.has("status")) {
    filters.status = searchParams.get("status")?.toUpperCase();
  }
  if (searchParams.has("domain")) {
    filters.domain = searchParams.get("domain")?.toUpperCase();
  }
  if (searchParams.has("priority")) {
    filters.priority = searchParams.get("priority")?.toUpperCase();
  }

  const tasks = await prisma.task.findMany({ where: filters, orderBy: [{ priority: "asc" }, { dueAt: "asc" }, { createdAt: "asc" }] });
  return NextResponse.json(tasks.map(toTaskResponse));
}

export async function POST(req: NextRequest) {
  const payload = await req.json();
  if (!payload?.title) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title: payload.title,
      domain: (payload.domain ?? "OTHER").toUpperCase(),
      status: (payload.status ?? "OPEN").toUpperCase(),
      priority: (payload.priority ?? "P3").toUpperCase(),
      revenueImpact: (payload.revenueImpact ?? "LOW").toUpperCase(),
      blocked: Boolean(payload.blocked),
      blockedBy: payload.blockedBy,
      blockReason: payload.blockReason,
      type: (payload.type ?? "ONE_OFF").toUpperCase(),
      repeatIntervalDays: payload.repeatIntervalDays,
      dueAt: payload.dueAt ? new Date(payload.dueAt) : undefined,
      tags: payload.tags,
    },
  });

  return NextResponse.json(toTaskResponse(task));
}
