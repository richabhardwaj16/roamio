import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { readJson, writeJson } from "../utils/storage";
import { buildThemePalette, ThemeMode } from "../theme/stateTheme";

const THEME_STORAGE_KEY = "roamio.mobile.theme";

type StoredTheme = {
  mode: ThemeMode;
  selectedState: string;
};

type ThemeContextValue = {
  mode: ThemeMode;
  selectedState: string;
  theme: ReturnType<typeof buildThemePalette>;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  setSelectedState: (state: string) => void;
  resetStateTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setModeState] = useState<ThemeMode>("dark");
  const [selectedState, setSelectedStateValue] = useState("");

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const stored = await readJson<StoredTheme | null>(THEME_STORAGE_KEY, null);
      if (!mounted || !stored) return;
      setModeState(stored.mode || "dark");
      setSelectedStateValue(stored.selectedState || "");
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    void writeJson(THEME_STORAGE_KEY, { mode, selectedState });
  }, [mode, selectedState]);

  const value = useMemo<ThemeContextValue>(() => ({
    mode,
    selectedState,
    theme: buildThemePalette(mode, selectedState),
    setMode(nextMode) {
      setModeState(nextMode);
    },
    toggleMode() {
      setModeState((current) => (current === "light" ? "dark" : "light"));
    },
    setSelectedState(state) {
      setSelectedStateValue(state);
    },
    resetStateTheme() {
      setSelectedStateValue("");
    },
  }), [mode, selectedState]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
