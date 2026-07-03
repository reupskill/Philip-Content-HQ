"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const GENERATORS = [
  { href: "/video", label: "Video" },
  { href: "/linkedin", label: "LinkedIn" },
  { href: "/x", label: "X / Twitter" },
  { href: "/substack", label: "Newsletter" },
  { href: "/content-river", label: "Content River" },
  { href: "/daily-brief", label: "Daily Brief" },
];

export default function PlatformSwitcher({ idea }: { idea?: string }) {
  const pathname = usePathname();
  const ideaParam = idea ? `?idea=${encodeURIComponent(idea)}` : "";

  return (
    <div className="platform-switcher">
      {GENERATORS.map((g) => {
        const isActive = pathname === g.href;
        return (
          <Link
            key={g.href}
            href={`${g.href}${ideaParam}`}
            className={`platform-btn${isActive ? " active" : ""}`}
          >
            {g.label}
          </Link>
        );
      })}
    </div>
  );
}
