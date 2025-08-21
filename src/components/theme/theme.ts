// src/components/theme/themes.ts
export type ThemeVariant = "light" | "dark";

export type ThemeName = "cosmic-night" | "notebook" | "vintage-paper";

export interface ThemeConfig {
  light: string; // class name for light mode
  dark: string;  // class name for dark mode
}

export const themes: Record<ThemeName, ThemeConfig> = {
  "cosmic-night": {
    light: "theme-cosmic-night-light",
    dark: "theme-cosmic-night-dark",
  },
  "notebook": {
    light: "theme-notebook-light",
    dark: "theme-notebook-dark",
  },
  "vintage-paper": {
    light: "theme-vintage-paper-light",
    dark: "theme-vintage-paper-dark",
  },
};
