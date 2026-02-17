import fs from "node:fs/promises";
import path from "node:path";

const HOME_JSON = "yggdrasil-home.json";

type Signal = {
  generatedAt: string;
  humor: string;
  reflection: string;
  context: string;
};

type HomePayload = {
  date: string;
  signal: Signal;
  today: string[];
  yesterday: { date: string; movement: string[] };
  tomorrow: string[];
  blockers: string[];
  summary: {
    totalTokens: number;
    totalCost: number;
  };
};

const SectionCard = ({ title, items }: { title: string; items: string[] }) => (
  <div className="directive-card">
    <h3>{title}</h3>
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  </div>
);

export default async function HomePage() {
  let data: HomePayload | null = null;
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "public", HOME_JSON), "utf-8");
    data = JSON.parse(raw) as HomePayload;
  } catch {
    // fall through
  }

  return (
    <main>
      <section className="signal-panel">
        <div>
          <p className="signal-label">DAILY SIGNAL · {data?.date ?? "--"}</p>
          {data ? (
            <>
              <p className="signal-humor">{data.signal.humor}</p>
              <p className="signal-reflection">{data.signal.reflection}</p>
            </>
          ) : (
            <p className="signal-humor subtle">Signal awaiting the 3 AM ritual.</p>
          )}
        </div>
        <div className="signal-meta">
          <p>Yggdrasil Core</p>
          <p className="subtle">Posture setting · No scope creep</p>
        </div>
      </section>

      <section className="directive-board">
        <div className="directive-column">
          <SectionCard title="TODAY (Max 3)" items={data?.today ?? ["Loading tasks..."]} />
        </div>
        <div className="directive-column">
          <SectionCard title="YESTERDAY (Movement Only)" items={data?.yesterday.movement.length ? data.yesterday.movement : ["No movement captured yet."]} />
        </div>
        <div className="directive-column">
          <SectionCard title="TOMORROW (Pre-Commit)" items={data?.tomorrow ?? ["No pre-commits listed."]} />
        </div>
        <div className="directive-column">
          <SectionCard title="BLOCKERS" items={data?.blockers ?? ["No blockers. Execution available."]} />
        </div>
      </section>

      <section className="summary">
        <div>
          <p className="section-label">SUMMARY</p>
          {data ? (
            <p>
              Tokens today:
              <strong> {data.summary.totalTokens.toLocaleString()}</strong> · Cost:
              <strong> ${data.summary.totalCost.toFixed(2)}</strong>
            </p>
          ) : (
            <p className="subtle">Summary pending the nightly report.</p>
          )}
        </div>
        <div className="plan-note">
          <p>Ritual Command Surface</p>
          <p className="subtle">
            Operate like a living Kanban—today’s top work, yesterday’s movement, tomorrow’s pre-commitments, and any blockers.
          </p>
        </div>
      </section>
    </main>
  );
}
