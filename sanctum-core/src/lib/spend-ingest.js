import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { DateTime } from "luxon";

const CHICAGO_ZONE = "America/Chicago";
const SESSIONS_DIR = path.join(process.env.HOME ?? ".", ".openclaw", "agents", "main", "sessions");

const prisma = new PrismaClient();

function parseTimestamp(entry) {
  if (!entry) return null;
  try {
    const parsed = DateTime.fromISO(entry.endsWith("Z") ? entry : entry, { zone: "UTC" });
    return parsed.isValid ? parsed : null;
  } catch (error) {
    return null;
  }
}

function hourKey(dt) {
  return dt.set({ minute: 0, second: 0, millisecond: 0 });
}

async function readSessionPaths() {
  try {
    const files = await fs.promises.readdir(SESSIONS_DIR);
    return files.filter((name) => name.endsWith(".jsonl")).map((name) => path.join(SESSIONS_DIR, name));
  } catch (error) {
    return [];
  }
}

export async function ingestOpenClawSpend({ hours = 24 } = {}) {
  const windowStart = DateTime.now().setZone(CHICAGO_ZONE).minus({ hours });
  const files = await readSessionPaths();
  const hourly = new Map();
  const sessionModel = new Map();
  let scanned = 0;

  for (const file of files) {
    scanned += 1;
    const sessionId = path.basename(file).replace(".jsonl", "");
    const stream = fs.createReadStream(file, { encoding: "utf8" });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    for await (const raw of rl) {
      if (!raw.trim()) continue;
      let entry;
      try {
        entry = JSON.parse(raw);
      } catch (error) {
        continue;
      }

      if (entry.type === "model_change" && entry.modelId) {
        sessionModel.set(sessionId, `${entry.provider}/${entry.modelId}`);
        continue;
      }

      if (entry.type !== "message") continue;
      const msg = entry.message || {};
      if (msg.role !== "assistant") continue;

      const ts = parseTimestamp(entry.timestamp);
      if (!ts || ts < windowStart) continue;

      const tok = Number((msg.usage?.totalTokens ?? 0) || 0);
      const cost = Number((msg.usage?.cost?.total ?? 0) || 0);
      if (!tok && !cost) continue;

      const modelFromMsg = msg.model ?? sessionModel.get(sessionId) ?? "openai-codex/gpt-5.1-codex-mini";
      const hour = hourKey(ts.setZone(CHICAGO_ZONE));
      const key = hour.toISO();
      const entryHour = hourly.get(key) ?? { tokens: 0, cost: 0, modelVotes: new Map() };
      entryHour.tokens += tok;
      entryHour.cost += cost;
      entryHour.modelVotes.set(modelFromMsg, (entryHour.modelVotes.get(modelFromMsg) ?? 0) + 1);
      hourly.set(key, entryHour);
    }
  }

  const results = [];
  for (const [key, bucket] of hourly) {
    const date = DateTime.fromISO(key, { zone: CHICAGO_ZONE });
    const model = [...bucket.modelVotes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "openai-codex/gpt-5.1-codex-mini";
    results.push({ hour: date, tokens: bucket.tokens, cost: bucket.cost, model });
  }

  results.sort((a, b) => a.hour.toMillis() - b.hour.toMillis());

  let newestHour = null;
  for (const row of results) {
    await prisma.usageEvent.upsert({
      where: { tsCst: row.hour.toJSDate() },
      create: {
        tsCst: row.hour.toJSDate(),
        model: row.model,
        inputTokens: row.tokens,
        outputTokens: 0,
        totalTokens: row.tokens,
        estimatedCost: row.cost,
      },
      update: {
        model: row.model,
        inputTokens: row.tokens,
        outputTokens: 0,
        totalTokens: row.tokens,
        estimatedCost: row.cost,
      },
    });
    newestHour = row.hour;
  }

  return {
    scannedFiles: scanned,
    hoursUpserted: results.length,
    newestHour: newestHour?.toISO() ?? null,
  };
}
