//styles/theme.js//

export const lightColors = {
  background: "#F7F7F8",
  surface: "#FFFFFF",
  textPrimary: "#0F172A",
  textSecondary: "#475467",
  border: "#E2E8F0",
  accent: "#DC2626",
  muted: "#94A3B8",
};

export const darkColors = {
  background: "#000000",
  surface: "#111111",
  textPrimary: "#F8FAFC",
  textSecondary: "#D1D5DB",
  border: "#1F1F1F",
  accent: "#F87171",
  muted: "#9CA3AF",
};

export const colors = lightColors;

export const getThemeColors = (isDark) => (isDark ? darkColors : lightColors);

export const fonts = {
  regular: "System",
  medium: "System",
  light: "System",
  thin: "System",
};

export const text = {
  fontFamily: "System",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
