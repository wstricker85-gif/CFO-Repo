"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // On mount: read the theme that the inline script already applied
  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") as "dark" | "light";
    setTheme(current ?? "dark");
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  return (
    <button
      onClick={toggle}
      className="label hover:text-ink transition-colors px-2 py-1"
      title={theme === "dark" ? "Zum hellen Design wechseln" : "Zum dunklen Design wechseln"}
    >
      {theme === "dark" ? "☀" : "●"}
    </button>
  );
}
