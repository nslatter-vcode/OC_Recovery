import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yggdrasil Core Dashboard",
  description: "Local Yggdrasil Core spend + ops dashboard",
};

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
              <Link className="tab" href="/">
                Spend
              </Link>
              <Link className="tab" href="/sessions">
                Sessions
              </Link>
              <Link className="tab" href="/automation">
                Automation
              </Link>
              <Link className="tab" href="/budgets">
                Budgets
              </Link>
              <Link className="tab" href="/models">
                Models
              </Link>
              <Link className="tab" href="/journal">
                Journal
              </Link>
              <Link className="tab" href="/profile">
                Profile
              </Link>
              <Link className="tab" href="/about">
                About
              </Link>
            </nav>
          </div>
        </header>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
