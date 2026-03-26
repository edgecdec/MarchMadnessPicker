"use client";
import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { createTheme, Theme } from "@mui/material";

type Mode = "dark" | "light";

const ThemeModeContext = createContext<{ mode: Mode; toggle: () => void; theme: Theme }>({
  mode: "dark",
  toggle: () => {},
  theme: createTheme(),
});

const makeTheme = (mode: Mode) =>
  createTheme({
    palette: {
      mode,
      primary: { main: mode === "dark" ? "#ffab40" : "#ff6f00" },
      ...(mode === "dark"
        ? {
            background: { default: "#121212", paper: "#1e1e1e" },
            success: { main: "#49BC4E" },
            error: { main: "#F27573" },
            warning: { main: "#FFB74D" },
            info: { main: "#59A3EC" },
            text: { primary: "#F0F0F0", secondary: "#B0B0B0" },
          }
        : { background: { default: "#f5f5f5", paper: "#ffffff" } }),
    },
    components: {
      MuiButton: {
        styleOverrides: {
          containedPrimary: { fontWeight: 700 },
        },
      },
    },
  });

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("themeMode") as Mode | null;
    if (saved === "light" || saved === "dark") setMode(saved);
  }, []);

  const toggle = () => {
    setMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("themeMode", next);
      return next;
    });
  };

  const theme = useMemo(() => makeTheme(mode), [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, toggle, theme }}>
      {children}
    </ThemeModeContext.Provider>
  );
}

export const useThemeMode = () => useContext(ThemeModeContext);
