import fs from "node:fs/promises";
import path from "node:path";

type JournalEntry = {
  generatedAt: string;
  windowHours: number;
  logDate: string;
  whatWeDid: string[];
  problemsAndSolutions: string[];
  struggles: string[];
  keyAccomplishments: string[];
  nextUp: string[];
  notes: string[];
};

async function readLatestEntry(): Promise<JournalEntry | null> {
  const latestPath = path.join(process.cwd(), "public", "coach-journal-latest.json");
  try {
    const raw = await fs.readFile(latestPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readHistory(): Promise<JournalEntry[]> {
  const historyPath = path.join(process.cwd(), "public", "coach-journal-history.jsonl");
  try {
    const raw = await fs.readFile(historyPath, "utf-8");
    const entries = raw
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as JournalEntry);
    return entries.slice(-5).reverse();
  } catch {
    return [];
  }
}

function SectionCard({title, items}: {title: string; items: string[]}) {
  return (
    <section className="journal-section">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default async function JournalPage() {
  const latest = await readLatestEntry();
  const history = await readHistory();

  return (
    <main>
      <div className="page-heading">
        <div>
          <p className="subtle">Mission Control Journal</p>
          <h1>Daily COO journal</h1>
        </div>
        {latest && (
          <p className="subtle">{new Date(latest.generatedAt).toLocaleString()}</p>
        )}
      </div>

      {latest ? (
        <div className="journal-grid">
          <SectionCard title="What We Did" items={latest.whatWeDid} />
          <SectionCard title="Problems & Solutions" items={latest.problemsAndSolutions} />
          <SectionCard title="Struggles" items={latest.struggles} />
          <SectionCard title="Key Accomplishments" items={latest.keyAccomplishments} />
          {latest.nextUp.length > 0 && (
            <SectionCard title="Next Up" items={latest.nextUp} />
          )}
          <SectionCard title="Notes" items={latest.notes} />
        </div>
      ) : (
        <p className="subtle">Journal entry not yet generated. Waiting for the nightly cron.</p>
      )}

      {history.length > 0 && (
        <section className="history">
          <h2>Earlier this week</h2>
          <ul>
            {history.map((entry) => (
              <li key={entry.generatedAt}>
                <strong>{entry.logDate || new Date(entry.generatedAt).toDateString()}</strong>
                <p>{entry.notes[0] ?? ""}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
