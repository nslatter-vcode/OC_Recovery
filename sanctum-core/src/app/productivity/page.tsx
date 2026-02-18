import fs from "node:fs/promises";
import path from "node:path";

const TODO_FILE = "../TODO.md";

type TodoItem = { text: string; done: boolean };

async function readTodoList(): Promise<TodoItem[]> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), TODO_FILE), "utf-8");
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

export default async function ProductivityPage() {
  const todos = await readTodoList();

  return (
    <main>
      <section className="projects">
        <div className="projects-header">
          <h1 className="h1">Productivity</h1>
          <p className="subtle">All current todos · checkboxes show completion.</p>
        </div>
        <ul className="project-list">
          {todos.length
            ? todos.map((todo) => (
                <li key={todo.text} className={todo.done ? "done" : "pending"}>
                  <span className="project-checkbox">{todo.done ? "✔" : "☐"}</span>
                  <span className="project-text">{todo.text}</span>
                </li>
              ))
            : (
              <li className="subtle">Nothing on the todo list.</li>
            )}
        </ul>
      </section>
    </main>
  );
}
