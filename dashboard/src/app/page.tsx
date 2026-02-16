import Link from "next/link";
import fs from "node:fs/promises";
import path from "node:path";

type SpendSnapshot = {
  generatedAt: string;
  window: { hours: number; start: string; end: string };
  totals: {
    assistantTurns: number;
    totalTokens: number;
    totalCost: number;
    avgTokensPerTurn: number;
    maxTokensPerTurn: number;
  };
  toolCalls: Record<string, number>;
  largestTurns: Array<{
    ts: string;
    tokens: number;
    cost: number;
    tools: string[];
    session: string;
  }>;
  perSession: Array<{
    session: string;
    assistantTurns: number;
    toolTurns: number;
    tokens: number;
    cost: number;
  }>;
};

function money(x: number) {
  return `$${x.toFixed(4)}`;
}

function num(x: number) {
  return x.toLocaleString();
}

export default async function Home() {
  let data: SpendSnapshot | null = null;

  try {
    const jsonPath = path.join(process.cwd(), "public", "spend-report-latest.json");
    const raw = await fs.readFile(jsonPath, "utf-8");
    data = JSON.parse(raw) as SpendSnapshot;
  } catch {
    // ignore
  }

  if (!data) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>OpenClaw Spend Dashboard</h1>
        <p>
          No snapshot found yet. Run:{" "}
          <code>scripts/spend_report_to_dashboard.sh</code>
        </p>
        <p>
          Expected file: <code>dashboard/public/spend-report-latest.json</code>
        </p>
      </main>
    );
  }

  const toolTop = Object.entries(data.toolCalls)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 980 }}>
      <h1>OpenClaw Spend Dashboard</h1>
      <p style={{ color: "#555" }}>
        Snapshot: <b>{data.generatedAt}</b> · Window: last <b>{data.window.hours}h</b>
      </p>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
        <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <div style={{ color: "#666" }}>Total cost</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{money(data.totals.totalCost)}</div>
        </div>
        <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <div style={{ color: "#666" }}>Total tokens</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{num(data.totals.totalTokens)}</div>
        </div>
        <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <div style={{ color: "#666" }}>Assistant turns</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{num(data.totals.assistantTurns)}</div>
        </div>
        <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <div style={{ color: "#666" }}>Avg / Max tokens per turn</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {num(Math.round(data.totals.avgTokensPerTurn))} / {num(data.totals.maxTokensPerTurn)}
          </div>
        </div>
      </section>

      <h2 style={{ marginTop: 24 }}>Top tool calls</h2>
      <ul>
        {toolTop.map(([name, n]) => (
          <li key={name}>
            <code>{name}</code>: {n}
          </li>
        ))}
      </ul>

      <h2 style={{ marginTop: 24 }}>Largest turns</h2>
      <ol>
        {data.largestTurns.map((t) => (
          <li key={t.ts + t.session} style={{ marginBottom: 8 }}>
            <b>{num(t.tokens)}</b> tokens · {money(t.cost)} · tools={t.tools.join(",") || "none"} · session={t.session}
            <div style={{ color: "#666" }}>{t.ts}</div>
          </li>
        ))}
      </ol>

      <h2 style={{ marginTop: 24 }}>Per-session</h2>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            {[
              "Session",
              "Assistant turns",
              "Tool turns",
              "Tokens",
              "Cost",
            ].map((h) => (
              <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px 6px" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.perSession.map((s) => (
            <tr key={s.session}>
              <td style={{ padding: "8px 6px", borderBottom: "1px solid #eee" }}>
                <code>{s.session}</code>
              </td>
              <td style={{ padding: "8px 6px", borderBottom: "1px solid #eee" }}>{s.assistantTurns}</td>
              <td style={{ padding: "8px 6px", borderBottom: "1px solid #eee" }}>{s.toolTurns}</td>
              <td style={{ padding: "8px 6px", borderBottom: "1px solid #eee" }}>{num(s.tokens)}</td>
              <td style={{ padding: "8px 6px", borderBottom: "1px solid #eee" }}>{money(s.cost)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ marginTop: 24, color: "#666" }}>
        Data source: <code>/spend-report-latest.json</code> (generated nightly at 3am).
      </p>

      <p>
        <Link href="/spend-report-latest.json">Download latest JSON</Link>
      </p>
    </main>
  );
}
