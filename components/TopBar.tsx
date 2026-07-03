"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/content-bank", label: "Content Bank" },
  { href: "/training", label: "Training" },
  { href: "/calendar", label: "Calendar" },
];

export default function TopBar() {
  const pathname = usePathname();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <Link href="/" className="brand">
          Philip Content <span>HQ</span>
        </Link>
        <nav className="topnav">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`topnav-link${pathname === link.href ? " active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <form method="post" action="/api/auth/logout">
        <button className="btn-ghost" type="submit">
          Sign out
        </button>
      </form>
    </header>
  );
}
