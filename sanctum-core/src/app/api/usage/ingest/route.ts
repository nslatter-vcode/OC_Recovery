import { NextRequest, NextResponse } from "next/server";
import { ingestOpenClawSpend } from "@/lib/spend-ingest";

const LOCAL_ONLY_HOSTS = ["localhost", "127.0.0.1", "::1"]; // best effort
const INGEST_TOKEN = process.env.SANCTUM_INGEST_TOKEN;

function isLocalRequest(host?: string | null) {
  if (!host) return false;
  return LOCAL_ONLY_HOSTS.some((allowed) => host.includes(allowed));
}

export async function POST(req: NextRequest) {
  if (!isLocalRequest(req.headers.get("host"))) {
    return NextResponse.json({ error: "local requests only" }, { status: 403 });
  }

  if (INGEST_TOKEN) {
    const provided = req.headers.get("x-sanctum-ingest-token");
    if (provided !== INGEST_TOKEN) {
      return NextResponse.json({ error: "invalid token" }, { status: 403 });
    }
  }

  const hours = Number(req.nextUrl.searchParams.get("hours") ?? "24");
  try {
    const result = await ingestOpenClawSpend({ hours });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "ingest_failed" }, { status: 500 });
  }
}
