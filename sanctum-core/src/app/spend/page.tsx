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

export default async function SpendPage() {
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
      <main>
        <h1 className="h1">Spend</h1>
        <p className="subtle">
          No snapshot found yet. Generate one with: <code>scripts/spend_report_to_dashboard.sh</code>
        </p>
        <p className="subtle">
          Expected file: <code>sanctum-core/public/spend-report-latest.json</code>
        </p>
      </main>
    );
  }

  const toolTop = Object.entries(data.toolCalls)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <main>
      <h1 className="h1">Spend</h1>
      <p className="subtle">
        Snapshot: <b>{data.generatedAt}</b> · Window: last <b>{data.window.hours}h</b>
      </p>

      <section className="grid section">
        <div className="card">
          <div className="card-label">Total cost</div>
          <div className="card-value">{money(data.totals.totalCost)}</div>
        </div>
        <div className="card">
          <div className="card-label">Total tokens</div>
          <div className="card-value">{num(data.totals.totalTokens)}</div>
        </div>
        <div className="card">
          <div className="card-label">Assistant turns</div>
          <div className="card-value">{num(data.totals.assistantTurns)}</div>
        </div>
        <div className="card">
          <div className="card-label">Avg / Max tokens per turn</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 6 }}>
            {num(Math.round(data.totals.avgTokensPerTurn))} / {num(data.totals.maxTokensPerTurn)}
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Top tool calls</h2>
        <ul>
          {toolTop.map(([name, n]) => (
            <li key={name}>
              <code>{name}</code>: {n}
            </li>
          ))}
        </ul>
      </section>

      <section className="section">
        <h2>Largest turns</h2>
        <ol>
          {data.largestTurns.map((t) => (
            <li key={t.ts + t.session} style={{ marginBottom: 10 }}>
              <b>{num(t.tokens)}</b> tokens · {money(t.cost)} · tools={t.tools.join(",") || "none"} · session={t.session}
              <div className="subtle">{t.ts}</div>
            </li>
          ))}
        </ol>
      </section>

      <section className="section">
        <h2>Per-session</h2>
        <table className="table">
          <thead>
            <tr>
              {['Session', 'Assistant turns', 'Tool turns', 'Tokens', 'Cost'].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.perSession.map((s) => (
              <tr key={s.session}>
                <td>
                  <code>{s.session}</code>
                </td>
                <td>{s.assistantTurns}</td>
                <td>{s.toolTurns}</td>
                <td>{num(s.tokens)}</td>
                <td>{money(s.cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="subtle" style={{ marginTop: 12 }}>
          Data source: <code>/spend-report-latest.json</code> (generated nightly at 3am).
        </p>
        <p>
          <Link href="/spend-report-latest.json">Download latest JSON</Link>
        </p>
      </section>
    </main>
  );
}
