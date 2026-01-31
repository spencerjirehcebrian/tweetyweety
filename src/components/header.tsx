"use client";

import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-4 sm:px-6 border-b border-border-default">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
          TweetyWeety
        </h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Convert tweets and articles into clean text
        </p>
      </div>
      <ThemeToggle />
    </header>
  );
}
