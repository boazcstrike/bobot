"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export default function LightDark() {
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleTheme = async () => {
    const nextTheme = theme === "light" ? "dark" : "light";

    if (!document.startViewTransition) {
      setTheme(nextTheme);
      return;
    }

    const transition = document.startViewTransition(() => setTheme(nextTheme));
    await transition.ready;

    document.documentElement.animate(
      { clipPath: ["inset(0 0 100% 0)", "inset(0)"] },
      {
        duration: 800,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  };

  // Render nothing until mounted so server and client markup agree.
  if (!isMounted) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-10 w-10 cursor-pointer rounded-full hover:bg-primary/5"
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {theme === "light" ? <Moon className="size-5" /> : <Sun className="size-5" />}
    </Button>
  );
}
