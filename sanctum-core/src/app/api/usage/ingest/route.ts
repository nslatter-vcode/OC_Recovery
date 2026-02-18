import { NextRequest, NextResponse } from "next/server";
import { ingestOpenClawSpend } from "@/lib/spend-ingest";

const LOCAL_ONLY_HOSTS = ["localhost", "127.0.0.1", "::1"]; // best effort

function isLocalRequest(host?: string | null) {
  if (!host) return false;
  return LOCAL_ONLY_HOSTS.some((allowed) => host.includes(allowed));
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "disabled" }, { status: 403 });
  }

  if (!isLocalRequest(req.headers.get("host"))) {
    return NextResponse.json({ error: "local requests only" }, { status: 403 });
  }

  const hours = Number(req.nextUrl.searchParams.get("hours") ?? "24");
  try {
    const count = await ingestOpenClawSpend({ hours });
    return NextResponse.json({ ingested: count });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "ingest_failed" }, { status: 500 });
  }
}
