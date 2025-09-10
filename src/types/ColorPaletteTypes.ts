// src/types/ColorPaletteTypes.ts

export type ColorRange = {
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
};

export type ThemeColors = {
  grey: ColorRange;
  primary: ColorRange;
  greenAccent: ColorRange;
  redAccent: ColorRange;
  blueAccent: ColorRange;
};

export type ThemeMode = "light" | "dark";
