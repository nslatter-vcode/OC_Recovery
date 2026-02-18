import type { Metadata } from "next";
import Link from "next/link";
import AddTaskButton from "@/components/AddTaskButton";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Sanctum Dashboard",
  description: "Local Sanctum spend + ops dashboard",
};

const navGroups = [
  {
    label: "Financial",
    items: [
      { label: "Spend", href: "/spend" },
      { label: "Budgets", href: "/budgets" },
    ],
  },
  {
    label: "Productivity",
    items: [
      { label: "Projects", href: "/productivity" },
      { label: "Journal", href: "/journal" },
    ],
  },
  {
    label: "Systems",
    items: [
      { label: "Automation", href: "/automation" },
      { label: "Models", href: "/models" },
      { label: "Sessions", href: "/sessions" },
      { label: "Agents", href: "/systems" },
    ],
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="nav">
          <div className="nav-inner">
            <Link className="brand" href="/">
              THE SANCTUM
            </Link>
            <nav className="tabs">
              {navGroups.map((group) => (
                <div
                  className={`nav-group${group.label === "Systems" ? " systems-group" : ""}`}
                  key={group.label}
                >
                  <button className="nav-link" type="button" aria-label={group.label}>
                    {group.label}
                  </button>
                  <div className="nav-menu">
                    {group.items.map((item) => (
                      <Link key={item.label} href={item.href} className="nav-menu-link">
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              <div className="nav-actions">
                <AddTaskButton />
              </div>
            </nav>
          </div>
        </header>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
