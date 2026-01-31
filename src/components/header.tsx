"use client";

import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="relative flex items-center justify-end px-4 py-4 sm:px-6">
      <ThemeToggle />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-primary/20 to-transparent" />
    </header>
  );
}
