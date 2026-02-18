import { ingestOpenClawSpend } from "../sanctum-core/src/lib/spend-ingest.js";

const hours = Number(process.argv[2] ?? process.env.INGEST_HOURS ?? "24");

try {
  const count = await ingestOpenClawSpend({ hours });
  console.log(`ingested ${count} hourly buckets`);
  process.exit(0);
} catch (error) {
  console.error("failed to ingest spend", error);
  process.exit(1);
}
