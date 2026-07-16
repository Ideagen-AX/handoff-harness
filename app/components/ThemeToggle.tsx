"use client";

import { useEffect, useState } from "react";

// Light/dark toggle for the Nexus theme. The theme is applied to <body> via a
// data-theme attribute; an inline script in layout.tsx sets the initial value
// from localStorage before paint (no flash). This component keeps them in sync.
export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const current = document.body.dataset.theme === "dark" ? "dark" : "light";
    setTheme(current);
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.body.dataset.theme = next;
    try {
      localStorage.setItem("handoff-theme", next);
    } catch {
      /* private mode / storage disabled — theme still applies for this session */
    }
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
    >
      {theme === "light" ? "◐ Dark" : "◑ Light"}
    </button>
  );
}
