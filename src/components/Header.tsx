"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ENABLED_MODULES } from "@/lib/modules";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="header">
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="Daily Brief — trang chủ">
          <span className="brand-mark" aria-hidden="true">
            ◆
          </span>
          <span className="brand-text">Daily Brief</span>
        </Link>

        <nav className="nav" aria-label="Điều hướng chính">
          {ENABLED_MODULES.map((m) => {
            const active =
              m.href === "/" ? pathname === "/" : pathname.startsWith(m.href);
            return (
              <Link
                key={m.id}
                href={m.href}
                className="nav-link"
                data-active={active}
                aria-current={active ? "page" : undefined}
              >
                <span className="nav-emoji" aria-hidden="true">
                  {m.emoji}
                </span>
                {m.label}
              </Link>
            );
          })}
        </nav>

        <ThemeToggle />
      </div>
    </header>
  );
}
