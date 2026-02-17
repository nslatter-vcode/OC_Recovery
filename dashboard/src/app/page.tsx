import fs from "node:fs/promises";
import path from "node:path";

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

type JournalEntry = {
  generatedAt: string;
  logDate: string;
  keyAccomplishments: string[];
};

const HOME_JSON = "yggdrasil-home.json";
const JOURNAL_HISTORY = "coach-journal-history.jsonl";

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

async function readHomePayload(): Promise<HomePayload | null> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "public", HOME_JSON), "utf-8");
    return JSON.parse(raw) as HomePayload;
  } catch {
    return null;
  }
}

async function readJournalHistory(): Promise<JournalEntry[]> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "public", JOURNAL_HISTORY), "utf-8");
    return raw
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as JournalEntry)
      .slice(-6)
      .reverse();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const data = await readHomePayload();
  const history = await readJournalHistory();

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
      </section>

      <section className="command-board">
        <div className="command-columns">
          <SectionCard title="TODAY (Max 3)" items={data?.today ?? ["Loading tasks..."]} />
          <SectionCard
            title="YESTERDAY (Movement Only)"
            items={data?.yesterday.movement.length ? data.yesterday.movement : ["No movement captured yet."]}
          />
          <SectionCard title="TOMORROW (Pre-Commit)" items={data?.tomorrow ?? ["No pre-commits listed."]} />
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
