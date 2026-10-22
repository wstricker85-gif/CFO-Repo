"use client";

// Sidebar is a client component because usePathname() reads the current route.
// usePathname() is a React hook — hooks only work in client components.

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  icon: string; // simple text icon for now
};

const navItems: NavItem[] = [
  { label: "Übersicht",      href: "/",                icon: "◈" },
  { label: "KPI Monitor",    href: "/kpi",             icon: "◎" },
  { label: "Finanzanalyse",  href: "/analyse",         icon: "△" },
  { label: "Working Capital",href: "/working-capital", icon: "⟳" },
  { label: "Bewertung",      href: "/bewertung",       icon: "◇" },
  { label: "Budget",         href: "/budget",          icon: "▦" },
  { label: "Marktdaten",     href: "/markt",           icon: "↗" },
  { label: "Board Report",   href: "/board",           icon: "▤" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col border-r border-line bg-panel"
      style={{ width: 220, minHeight: "100%", flexShrink: 0 }}
    >
      <nav className="flex flex-col py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-3 px-5 py-2.5 transition-colors",
                "font-mono text-xs uppercase tracking-widest",
                isActive
                  ? "text-accent border-r-2 border-accent bg-wash"
                  : "text-muted hover:text-ink hover:bg-wash",
              ].join(" ")}
            >
              <span style={{ fontSize: 11 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
