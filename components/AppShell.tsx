"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/login")) return <>{children}</>;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">{children}</div>
    </div>
  );
}
