"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="monokai"
      themes={["monokai", "dracula", "solarized-dark", "one-dark", "claude", "github-dark", "claude-light", "github-light", "solarized-light"]}
      enableSystem={false}
    >
      {children}
    </NextThemesProvider>
  );
}
