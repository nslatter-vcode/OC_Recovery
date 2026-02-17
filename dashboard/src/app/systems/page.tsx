export default async function SystemsPage() {
  const agents = [
    { name: "Orchestrator", role: "COO (Maya)", status: "online" },
    { name: "Automation", role: "Cron + Briefing", status: "online" },
    { name: "Freedom", role: "Idea pipeline", status: "online" },
    { name: "Forge", role: "Builder", status: "online" },
  ];

  return (
    <main>
      <section className="systems-panel">
        <h1 className="h1">Systems</h1>
        <p className="subtle">Operational view · agents + model stack</p>
        <div className="systems-grid">
          <div>
            <h3>Agent roster</h3>
            <ul className="agent-list">
              {agents.map((agent) => (
                <li key={agent.name}>
                  <span className={`agent-dot ${agent.status}`}></span>
                  <div>
                    <strong>{agent.name}</strong>
                    <p className="subtle">{agent.role}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Model routing</h3>
            <p>
              Default text work: <strong>openai-codex/gpt-5.1-codex-mini</strong>
            </p>
            <p>
              Heavy + image work: <strong>openai-codex/gpt-5.2</strong>
            </p>
            <p>Local baseline: Ollama llama3.1:8b (heartbeat preflight running every 30m).</p>
          </div>
        </div>
      </section>
    </main>
  );
}
