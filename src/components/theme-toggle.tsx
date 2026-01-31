"use client";

import { useTheme } from "./theme-provider";
import { SunIcon, MonitorIcon, MoonIcon } from "./icons";

const options = [
  { value: "light" as const, Icon: SunIcon, label: "Light" },
  { value: "system" as const, Icon: MonitorIcon, label: "System" },
  { value: "dark" as const, Icon: MoonIcon, label: "Dark" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border-default bg-surface-secondary p-1">
      {options.map(({ value, Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          aria-label={`Switch to ${label} theme`}
          className={`rounded-md p-1.5 transition-colors ${
            theme === value
              ? "bg-surface-elevated text-accent-primary shadow-sm"
              : "text-text-tertiary hover:text-text-secondary"
          }`}
        >
          <Icon width={14} height={14} />
        </button>
      ))}
    </div>
  );
}
