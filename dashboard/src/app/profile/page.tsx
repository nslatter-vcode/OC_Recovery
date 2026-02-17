import fs from "node:fs/promises";
import path from "node:path";

export default async function ProfilePage() {
  let md = "";
  try {
    // Workspace is one level up from dashboard
    const p = path.join(process.cwd(), "..", "CEO_PROFILE.md");
    md = await fs.readFile(p, "utf-8");
  } catch {
    md = "# CEO Profile\n\nNo CEO_PROFILE.md found.";
  }

  return (
    <main>
      <h1 className="h1">CEO Profile</h1>
      <p className="subtle">Source: workspace/CEO_PROFILE.md</p>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          border: "1px solid var(--border)",
          background: "linear-gradient(180deg, var(--panel), var(--panel2))",
          borderRadius: 12,
          padding: 14,
          lineHeight: 1.4,
          marginTop: 12,
        }}
      >
        {md}
      </pre>
    </main>
  );
}
