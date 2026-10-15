export const THEME = {
  colors: {
    canvas: "#011C40",     // Abyssal Night
    surface: "#023859",    // Midnight Navy
    border: "#26658C",     // Twilight Slate
    primary: "#54ACBF",    // Ocean Cerulean
    cyan: "#A7EBF2",       // Celestial Cyan
    text: "#FFFFFF",
    textMuted: "#8EA5B8",
    danger: "#EF4444",
    success: "#10B981",
  },
  fonts: {
    serif: "Lora_400Regular",
    serifSemiBold: "Lora_600SemiBold",
    sans: "PlusJakartaSans_400Regular",
    sansMedium: "PlusJakartaSans_500Medium",
    sansSemiBold: "PlusJakartaSans_600SemiBold",
    sansBold: "PlusJakartaSans_700Bold",
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
} as const;

export type ThemeColors = typeof THEME.colors;
export type ThemeFonts = typeof THEME.fonts;
