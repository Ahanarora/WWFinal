// ----------------------------------------
// styles/theme.ts
// ----------------------------------------

// Shared shape for BOTH light and dark themes
export type ThemeColors = {
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  accent: string;
  muted: string;
};

// ----------------------------------------
// Color palettes
// ----------------------------------------

export const lightColors: ThemeColors = {
  background: "#F7F7F8",
  surface: "#FFFFFF",
  textPrimary: "#0F172A",
  textSecondary: "#475467",
  border: "#E2E8F0",
  accent: "#DC2626",
  muted: "#94A3B8",
};

export const darkColors: ThemeColors = {
  background: "#000000",
  surface: "#111111",
  textPrimary: "#F8FAFC",
  textSecondary: "#D1D5DB",
  border: "#1F1F1F",
  accent: "#F87171",
  muted: "#9CA3AF",
};

// Default export used in a few places
export const colors: ThemeColors = lightColors;

// Theme selector
export const getThemeColors = (isDark: boolean): ThemeColors =>
  isDark ? darkColors : lightColors;

// ----------------------------------------
// Typography
// ----------------------------------------

export const fonts = {
  heading: "SourceSerif",
  headingMedium: "SourceSerif",
  body: "System",
  small: "System",
  regular: "System",
  medium: "System",
  navigation: "System",
  button: "System",
  light: "System",
  thin: "System",
} as const;

export const text = {
  fontFamily: fonts.body,
};

// ----------------------------------------
// Spacing
// ----------------------------------------

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;
