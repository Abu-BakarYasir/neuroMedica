"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  size?: number;
}

export function ThemeToggle({ className, size = 14 }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "inline-flex items-center justify-center rounded-md transition-colors",
        "text-[#525252] hover:bg-black/5 hover:text-[#212121]",
        "dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white",
        className
      )}
    >
      {mounted ? (
        isDark ? <Sun size={size} /> : <Moon size={size} />
      ) : (
        <Moon size={size} className="opacity-0" />
      )}
    </button>
  );
}
