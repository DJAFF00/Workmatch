"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  ["/dashboard", "Vue d’ensemble"],
  ["/dashboard/offres", "Offres"],
  ["/dashboard/candidatures", "Candidatures"],
  ["/dashboard/entretiens", "Entretiens"],
  ["/dashboard/parametres", "Paramètres"],
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Navigation du tableau de bord">
      {items.map(([href, label]) => {
        const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${active ? "bg-orange text-white shadow-[0_8px_18px_-8px_rgba(255,90,15,.7)]" : "text-muted hover:bg-white hover:text-ink"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
