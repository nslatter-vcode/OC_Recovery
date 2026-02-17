import fs from "node:fs/promises";
import path from "node:path";

type Signal = {
  generatedAt: string;
  humor: string;
  reflection: string;
  context: string;
};

type TaskCard = {
  id: string;
  title: string;
  detail: string;
};

type TodoItem = {
  text: string;
  done: boolean;
};

type HomePayload = {
  date: string;
  signal: Signal;
  today: TaskCard[];
  yesterday: { date: string; movement: TaskCard[] };
  tomorrow: TaskCard[];
  blockers: TaskCard[];
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
const TODO_FILE = "TODO.md";

const SectionCard = ({ title, items }: { title: string; items: TaskCard[] }) => {
  const display = items && items.length ? items : [{ id: `${title}-empty`, title: "—", detail: "Nothing to report." }];
  return (
    <div className="directive-card">
      <h3>{title}</h3>
      <div className="directive-list">
        {display.map((card) => (
          <details key={card.id} className="directive-detail">
            <summary>{card.title}</summary>
            <p>{card.detail}</p>
          </details>
        ))}
      </div>
    </div>
  );
};

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

async function readTodoList(): Promise<TodoItem[]> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "..", TODO_FILE), "utf-8");
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("- ["))
      .map((line) => ({
        text: line.slice(line.indexOf("]") + 1).trim(),
        done: line.startsWith("- [x]") || line.startsWith("- [X]"),
      }));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const data = await readHomePayload();
  const history = await readJournalHistory();
  const todos = await readTodoList();

  return (
    <main>
      <section className="signal-panel">
        {data ? (
          <>
            <p className="signal-humor">{data.signal.humor}</p>
            <p className="signal-reflection">{data.signal.reflection}</p>
          </>
        ) : (
          <p className="signal-humor subtle">Signal awaiting the 3 AM ritual.</p>
        )}
      </section>

      <section className="command-board">
        <div className="command-columns">
          <SectionCard title="TODAY (Max 3)" items={data?.today ?? []} />
          <SectionCard title="YESTERDAY (Movement Only)" items={data?.yesterday?.movement ?? []} />
          <SectionCard title="TOMORROW (Pre-Commit)" items={data?.tomorrow ?? []} />
          <SectionCard title="BLOCKERS" items={data?.blockers ?? []} />
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

      <section className="projects">
        <div className="projects-header">
          <h2>Project board</h2>
          <p>Checked items are closed; open items stay actionable.</p>
        </div>
        <ul className="project-list">
          {todos.length ? (
            todos.map((todo) => (
              <li key={todo.text} className={todo.done ? "done" : "pending"}>
                <span className="project-checkbox">{todo.done ? "✔" : "☐"}</span>
                <span className="project-text">{todo.text}</span>
              </li>
            ))
          ) : (
            <li className="subtle">Todo list empty. All systems clear.</li>
          )}
        </ul>
      </section>
    </main>
  );
}
