"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const IconDashboard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5"/>
    <rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5"/>
    <rect x="14" y="14" width="7" height="7" rx="1.5"/>
  </svg>
);
const IconVideo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);
const IconLinkedIn = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);
const IconX = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
const IconSubstack = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="3" rx="1"/>
    <path d="M3 10h18M3 16h10"/>
    <circle cx="18" cy="16" r="3" fill="currentColor" stroke="none"/>
  </svg>
);
const IconRiver = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12c1.5-2 3-3 5-3s3.5 2 5 2 3.5-2 5-2 3.5 1 5 3"/>
    <path d="M2 18c1.5-2 3-3 5-3s3.5 2 5 2 3.5-2 5-2 3.5 1 5 3"/>
    <path d="M2 6c1.5-2 3-3 5-3s3.5 2 5 2 3.5-2 5-2 3.5 1 5 3"/>
  </svg>
);
const IconBolt = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IconBank = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);
const IconStar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconAnalyze = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);
const IconCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconSettings = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const IconLogout = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const GENERATORS = [
  { href: "/video", label: "Video Scripts", icon: IconVideo },
  { href: "/linkedin", label: "LinkedIn", icon: IconLinkedIn },
  { href: "/x", label: "X / Twitter", icon: IconX },
  { href: "/substack", label: "Substack", icon: IconSubstack },
  { href: "/content-river", label: "Content River", icon: IconRiver },
  { href: "/daily-brief", label: "AI Brief", icon: IconBolt },
];

const LIBRARY = [
  { href: "/script-analyzer", label: "Script Analyzer", icon: IconAnalyze },
  { href: "/content-bank", label: "Content Bank", icon: IconBank },
  { href: "/training", label: "Training Examples", icon: IconStar },
  { href: "/calendar", label: "Content Calendar", icon: IconCalendar },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Link href="/">
          <span className="sidebar-brand-icon">P</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", lineHeight: 1.2 }}>Philip Content HQ</div>
            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>Founder-led Content Engine</div>
          </div>
        </Link>
      </div>

      <nav className="sidebar-nav">
        <Link href="/" className={`sidebar-link${pathname === "/" ? " active" : ""}`}>
          <span className="sidebar-icon"><IconDashboard /></span>
          Dashboard
        </Link>

        <div className="sidebar-section-label">Generators</div>
        {GENERATORS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`sidebar-link${pathname === href ? " active" : ""}`}
          >
            <span className="sidebar-icon"><Icon /></span>
            {label}
          </Link>
        ))}

        <div className="sidebar-section-label">Library</div>
        {LIBRARY.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`sidebar-link${pathname === href ? " active" : ""}`}
          >
            <span className="sidebar-icon"><Icon /></span>
            {label}
          </Link>
        ))}

        <div className="sidebar-section-label">Account</div>
        <Link href="/settings" className={`sidebar-link${pathname === "/settings" ? " active" : ""} sidebar-link-disabled`}>
          <span className="sidebar-icon"><IconSettings /></span>
          Settings
        </Link>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-avatar">P</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">Philip</div>
          <div className="sidebar-user-role">Founder / CEO</div>
        </div>
        <form method="post" action="/api/auth/logout">
          <button type="submit" className="sidebar-signout" title="Sign out">
            <span style={{ width: 16, height: 16, display: "block" }}><IconLogout /></span>
          </button>
        </form>
      </div>
    </aside>
  );
}
