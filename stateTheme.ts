const defaultStateTheme = {
  light: "#FF8A3D",
  dark: "#CC5A1F",
};

const stateColors: Record<string, { light: string; dark: string }> = {
  "andhra pradesh": { light: "#FF8A3D", dark: "#CC5A1F" },
  "arunachal pradesh": { light: "#FFD54F", dark: "#B8941F" },
  assam: { light: "#4CAF50", dark: "#2E7D32" },
  bihar: { light: "#B55239", dark: "#7A3424" },
  chhattisgarh: { light: "#26A69A", dark: "#1B6F66" },
  goa: { light: "#40E0D0", dark: "#09746b" },
  gujarat: { light: "#FF6F00", dark: "#B24A00" },
  haryana: { light: "#2ECC71", dark: "#1E8F4D" },
  "himachal pradesh": { light: "#2E8B57", dark: "#1B5E3A" },
  jharkhand: { light: "#228B22", dark: "#145A14" },
  karnataka: { light: "#6A1B9A", dark: "#3E0F5C" },
  kerala: { light: "#43A047", dark: "#2E7031" },
  "madhya pradesh": { light: "#FF7043", dark: "#B3472B" },
  maharashtra: { light: "#2962FF", dark: "#1A3FB3" },
  manipur: { light: "#EC407A", dark: "#A81F50" },
  meghalaya: { light: "#394e58", dark: "#2c3b43" },
  mizoram: { light: "#66BB6A", dark: "#3F7D42" },
  nagaland: { light: "#C62828", dark: "#7F1717" },
  odisha: { light: "#D4A373", dark: "#8C6A48" },
  punjab: { light: "#FFC107", dark: "#B28704" },
  rajasthan: { light: "#E1A95F", dark: "#9C6E33" },
  sikkim: { light: "#F5F5F5", dark: "#BDBDBD" },
  "tamil nadu": { light: "#8D6E63", dark: "#34231c" },
  telangana: { light: "#D81B60", dark: "#8E1240" },
  tripura: { light: "#C2185B", dark: "#7F103B" },
  "uttar pradesh": { light: "#800000", dark: "#4A0000" },
  uttarakhand: { light: "#4FC3F7", dark: "#0e5a7b" },
  "west bengal": { light: "#B71C1C", dark: "#6F0F0F" },
};

function rgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const normalized = value.length === 3
    ? value.split("").map((char) => `${char}${char}`).join("")
    : value;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export type ThemeMode = "light" | "dark";

export function getStateAccent(state?: string | null, mode: ThemeMode = "dark") {
  const swatch = stateColors[state?.toLowerCase?.() || ""] || defaultStateTheme;
  return mode === "dark" ? swatch.dark : swatch.light;
}

export function buildThemePalette(mode: ThemeMode, state?: string | null) {
  const swatch = stateColors[state?.toLowerCase?.() || ""] || defaultStateTheme;
  const accent = mode === "dark" ? swatch.dark : swatch.light;
  const accentSoft = mode === "dark" ? swatch.light : swatch.dark;

  if (mode === "light") {
    return {
      mode,
      state: state || "",
      colors: {
        bg: "#f7f8fb",
        bgSoft: "#eef2f7",
        panel: "#ffffff",
        panelAlt: "#f5f7fb",
        border: rgba(accent, 0.16),
        text: "#152033",
        textMuted: "#53637b",
        textDim: "#73839a",
        teal: accent,
        cyan: accentSoft,
        coral: "#d95f54",
        amber: "#f2ab2b",
        success: "#2da365",
        shadow: rgba("#1b2434", 0.12),
        chipActiveText: "#ffffff",
      },
      gradients: {
        screen: [rgba(accent, 0.16), "#f7f8fb", "#eef2f7"] as const,
        hero: [accent, accentSoft, "#ffd8bc"] as const,
        accent: [accentSoft, accent] as const,
        danger: ["#ff7b69", "#ff4f64"] as const,
        warm: ["#f3b94f", "#ff8a52"] as const,
      },
      mapStyle: "light" as const,
    };
  }

  return {
    mode,
    state: state || "",
    colors: {
      bg: "#07111f",
      bgSoft: "#0d1828",
      panel: rgba("#112033", 0.94),
      panelAlt: rgba(accent, 0.12),
      border: rgba(accent, 0.24),
      text: "#f7fbff",
      textMuted: "#95a7bf",
      textDim: "#6f839c",
      teal: swatch.light,
      cyan: accent,
      coral: "#ff6d5e",
      amber: "#f3b94f",
      success: "#33d17a",
      shadow: "rgba(2, 10, 24, 0.45)",
      chipActiveText: "#f7fbff",
    },
    gradients: {
      screen: [rgba(accent, 0.45), "#0f141a", "#131820"] as const,
      hero: [accent, "#17283d", swatch.light] as const,
      accent: [accent, swatch.light] as const,
      danger: ["#ff7b69", "#ff4f64"] as const,
      warm: ["#f3b94f", "#ff8a52"] as const,
    },
    mapStyle: "dark" as const,
  };
}
