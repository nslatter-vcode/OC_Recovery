import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yggdrasil Core Dashboard",
  description: "Local Yggdrasil Core spend + ops dashboard",
};

const navGroups = [
  {
    icon: "$",
    label: "Financial",
    items: [
      { label: "Spend", href: "/spend" },
      { label: "Budgets", href: "/budgets" },
    ],
  },
  {
    icon: "📊",
    label: "Productivity",
    items: [
      { label: "Projects", href: "/productivity" },
      { label: "Journal", href: "/journal" },
    ],
  },
  {
    icon: "⚙️",
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
              Yggdrasil (IG-drah-sill) Core
            </Link>
            <nav className="tabs">
              {navGroups.map((group) => (
                <div
                  className={`nav-group${group.label === "Systems" ? " systems-group" : ""}`}
                  key={group.label}
                >
                  <button className="nav-link" type="button">
                    <span aria-hidden="true">{group.icon}</span>
                    <span className="nav-label">{group.label}</span>
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
              <div className="nav-item">
                <Link className="nav-link" href="/profile">
                  <span aria-hidden="true">👤</span>
                  <span className="nav-label">Profile</span>
                </Link>
              </div>
              <div className="nav-item">
                <Link className="nav-link" href="/about">
                  <span aria-hidden="true">🛈</span>
                  <span className="nav-label">About</span>
                </Link>
              </div>
            </nav>
          </div>
        </header>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
