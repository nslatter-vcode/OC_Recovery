import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CHICAGO_ZONE } from "@/lib/time";
import { DateTime } from "luxon";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getWeekStartSunday = (date: DateTime) => {
  const offset = date.weekday % 7;
  return date.minus({ days: offset }).startOf("day");
};

export async function GET() {
  const now = DateTime.now().setZone(CHICAGO_ZONE);
  const todayStart = now.startOf("day");
  const yesterdayStart = todayStart.minus({ days: 1 });
  const lastCompletedHour = Math.max(-1, now.hour - 1);
  const windowStart = now.minus({ weeks: 4 }).startOf("day");

  const events = await prisma.usageEvent.findMany({
    where: { tsCst: { gte: windowStart.toJSDate() } },
    orderBy: { tsCst: "asc" },
  });

  const dayBuckets = new Map<string, { totalCost: number; totalTokens: number }>();
  const weekBuckets = new Map<string, { totalCost: number; totalTokens: number }>();
  const byHour = Array.from({ length: 24 }, (_, hour) => ({ hour, totalCost: 0, totalTokens: 0 }));

  let yesterdayCost = 0;
  let yesterdayTokens = 0;
  let todayCost = 0;
  let todayTokens = 0;

  for (const event of events) {
    const moment = DateTime.fromJSDate(event.tsCst).setZone(CHICAGO_ZONE);
    const dayKey = moment.toISODate();
    if (!dayKey) continue;
    const weekStart = getWeekStartSunday(moment);
    const weekKey = weekStart.toISODate();
    if (!weekKey) continue;

    const cost = event.estimatedCost;
    const tokens = event.totalTokens;

    const dayCurrent = dayBuckets.get(dayKey) ?? { totalCost: 0, totalTokens: 0 };
    dayBuckets.set(dayKey, { totalCost: dayCurrent.totalCost + cost, totalTokens: dayCurrent.totalTokens + tokens });

    const weekCurrent = weekBuckets.get(weekKey) ?? { totalCost: 0, totalTokens: 0 };
    weekBuckets.set(weekKey, { totalCost: weekCurrent.totalCost + cost, totalTokens: weekCurrent.totalTokens + tokens });

    if (moment >= todayStart) {
      todayCost += cost;
      todayTokens += tokens;
      if (moment.hour <= lastCompletedHour) {
        byHour[moment.hour].totalCost += cost;
        byHour[moment.hour].totalTokens += tokens;
      }
    }

    if (moment >= yesterdayStart && moment < todayStart) {
      yesterdayCost += cost;
      yesterdayTokens += tokens;
    }
  }

  const completedHours = Math.max(0, lastCompletedHour + 1);
  const snapshotHours = byHour.slice(0, completedHours);

  const thisWeekStart = getWeekStartSunday(todayStart);
  const weeklyTrend = Array.from({ length: 4 }, (_, index) => {
    const weekStart = thisWeekStart.minus({ weeks: 3 - index });
    const isCurrentWeek = index === 3;
    const days = WEEKDAYS.map((dayLabel, dayIndex) => {
      const day = weekStart.plus({ days: dayIndex });
      const key = day.toISODate() ?? day.toFormat("yyyy-MM-dd");
      const bucket = dayBuckets.get(key) ?? { totalCost: 0, totalTokens: 0 };
      const isCompletedDay = day < todayStart || day.equals(todayStart.minus({ days: 1 }));
      const value = isCurrentWeek && day >= todayStart ? null : bucket;
      return {
        day: dayLabel,
        totalCost: value ? value.totalCost : null,
        totalTokens: value ? value.totalTokens : null,
        isCurrentWeek,
        isCompleted: day < todayStart,
      };
    });

    const label = weekStart.toISODate() ?? weekStart.toFormat("yyyy-MM-dd");

    return { label, isCurrentWeek, days };
  });

  return NextResponse.json({
    yesterdayCost,
    yesterdayTokens,
    todayCost,
    todayTokens,
    todayByHour: snapshotHours,
    lastCompletedHour,
    weeklyTrend,
  });
}
