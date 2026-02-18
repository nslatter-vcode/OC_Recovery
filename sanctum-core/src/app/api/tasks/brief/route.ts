import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Task } from "@prisma/client";
import { DateTime } from "luxon";
import { CHICAGO_ZONE, startOfTodayCst } from "@/lib/time";

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

function marketingIsOverdue(task: Task, now: DateTime) {
  if (!task.tags) return true;
  if (!marketingMatcher.test(task.tags)) return true;
  if (!task.dueAt) return false;
  return DateTime.fromJSDate(task.dueAt).setZone(CHICAGO_ZONE) < now;
}

function toResponse(task: Task) {
  return {
    ...task,
    dueAt: task.dueAt?.toISOString(),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    closedAt: task.closedAt?.toISOString(),
  };
}

export async function GET() {
  const tasks = await prisma.task.findMany({ orderBy: [{ priority: "asc" }, { dueAt: "asc" }, { createdAt: "asc" }] });
  const now = startOfTodayCst();

  const openQueue = tasks.filter((task) => task.status !== "DONE");
  const eligibleForTop = openQueue.filter((task) => {
    if (task.blocked && task.blockedBy === "EXTERNAL") return false;
    if (task.blocked && task.blockedBy === "SELF") return true;
    return marketingIsOverdue(task, now);
  });

  let sorted = [...eligibleForTop].sort(sortTasks);
  const blockedSelf = openQueue.filter((task) => task.blocked && task.blockedBy === "SELF");
  const forced = blockedSelf.length ? [...blockedSelf].sort(sortTasks)[0] : null;

  if (forced) {
    sorted = sorted.filter((task) => task.id !== forced.id);
    sorted.unshift(forced);
  }

  const topThree = sorted.slice(0, 3);
  const topSet = new Set(topThree.map((task) => task.id));
  const nextThree = sorted.filter((task) => !topSet.has(task.id)).slice(0, 3);

  const doneToday = tasks.filter((task) => {
    if (task.status !== "DONE" || !task.closedAt) return false;
    const closed = DateTime.fromJSDate(task.closedAt).setZone(CHICAGO_ZONE);
    return closed >= now && closed < now.plus({ days: 1 });
  });

  const bench = {
    open: tasks.filter((task) => task.status === "OPEN").length,
    doing: tasks.filter((task) => task.status === "DOING").length,
    blocked: tasks.filter((task) => task.blocked).length,
    total: tasks.length,
  };

  return NextResponse.json({
    topThree: topThree.map(toResponse),
    nextThree: nextThree.map(toResponse),
    doneToday: doneToday.map(toResponse),
    bench,
  });
}
