import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Philip Content HQ",
  description: "Founder-led content engine for Dr. Philip Adenle, CEO of Uvest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
