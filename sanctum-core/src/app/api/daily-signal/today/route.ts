import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DateTime } from "luxon";

// Tone anchors stored at data/daily-signal-anchors.txt for style calibration but not used directly in generation.
const OPENING_SUBJECTS = [
  "The engine",
  "Systems",
  "Momentum",
  "Precision",
  "The ritual",
  "Discipline",
  "Calm",
  "The forge",
];

const OPENING_VERBS = [
  "is warm",
  "prefers you",
  "waits for execution",
  "is steady",
  "leans into repetition",
  "is ready for work",
];

const OPENING_CLOSURES = [
  "Stop scheming and move.",
  "Keep the boring part clean.",
  "Momentum is the only proof.",
  "Focus beats new systems.",
  "Calibrate, then ship.",
];

const REFLECTION_PREFIXES = [
  "Strategy",
  "Finance",
  "Philosophy",
  "Leadership",
  "Config",
  "Habits",
];

const REFLECTION_TEMPLATES = [
  "%s is simply asking if this moves revenue or capability.",
  "%s demands you pick a focus and defend it with execution.",
  "%s reminds you to protect inputs so the outputs stay calm.",
  "%s observes that cash flow is oxygen; avoid perfume metrics.",
  "%s sees that discipline beats inspiration every day.",
];

function randomItem(list: string[]) {
  return list[Math.floor(Math.random() * list.length)];
}

function uniqueLine(banned: Set<string>, generator: () => string) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const line = generator();
    if (!banned.has(line)) {
      return line;
    }
  }
  return generator();
}

function buildOpeningLine() {
  const subject = randomItem(OPENING_SUBJECTS);
  const verb = randomItem(OPENING_VERBS);
  const closure = randomItem(OPENING_CLOSURES);
  return `${subject} ${verb}. ${closure}`;
}

function buildReflectionLine() {
  const prefix = randomItem(REFLECTION_PREFIXES);
  const template = randomItem(REFLECTION_TEMPLATES);
  return template.replace("%s", prefix);
}

export async function GET() {
  const today = DateTime.utc().toISODate();
  const existing = await prisma.dailySignal.findUnique({ where: { utcDate: today } });
  if (existing) return NextResponse.json(existing);

  const history = await prisma.dailySignal.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
  const banned = new Set(history.flatMap((row) => [row.openingLine, row.reflectionLine]));

  const openingLine = uniqueLine(banned, buildOpeningLine);
  banned.add(openingLine);
  const reflectionLine = uniqueLine(banned, buildReflectionLine);

  const created = await prisma.dailySignal.create({
    data: {
      utcDate: today,
      openingLine,
      reflectionLine,
    },
  });

  return NextResponse.json(created);
}
