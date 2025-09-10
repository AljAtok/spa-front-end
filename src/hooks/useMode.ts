// src/hooks/useMode.ts
import { useState, useMemo, createContext } from "react";
import { createTheme, PaletteMode } from "@mui/material";
import { themeSettings } from "../styles/theme";

export const ColorModeContext = createContext({
  toggleColorMode: () => {},
});

export const useMode = () => {
  const [mode, setMode] = useState<PaletteMode>("light");
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () =>
        setMode((prev) => (prev === "light" ? "dark" : "light")),
    }),
    []
  );

  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  return [theme, colorMode] as const; // 'as const' ensures tuple type inference
};
