"use client";

import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-4 sm:px-6">
      <div>
        <h1 className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-xl font-bold tracking-tight text-transparent sm:text-2xl">
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
