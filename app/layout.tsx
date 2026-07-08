import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Handoff Harness",
  description:
    "Turn a completed design change into audience-tailored handoff communications, reviewed by a human before they go out.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
