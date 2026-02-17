import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yggdrasil Core Dashboard",
  description: "Local Yggdrasil Core spend + ops dashboard",
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
    label: "Systems",
    items: [
      { label: "Automation", href: "/automation" },
      { label: "Models", href: "/models" },
      { label: "Sessions", href: "/sessions" },
      { label: "Agents", href: "/systems" },
    ],
  },
  {
    label: "Productivity",
    items: [
      { label: "Projects", href: "/productivity" },
      { label: "Journal", href: "/journal" },
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
                <div className="nav-group" key={group.label}>
                  <button className="nav-link" type="button">
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
              <div className="nav-item">
                <Link className="nav-link" href="/profile">
                  Profile
                </Link>
              </div>
              <div className="nav-item">
                <Link className="nav-link" href="/about">
                  About
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
