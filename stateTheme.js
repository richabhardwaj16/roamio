export const defaultStateTheme = {
  colorSunset: "#FF8A3D",
  colorSunsetDark: "#CC5A1F",
  colorTerracotta: "#2e1b12",
  colorOcean: "#ffd2b5",
  sidebarBg: "linear-gradient(180deg, #CC5A1F 0%, #FF8A3D 100%)",
  pageBg:
    "radial-gradient(circle at top left, rgba(255, 138, 61, 0.32), transparent 22%), radial-gradient(circle at top right, rgba(204, 90, 31, 0.28), transparent 20%), linear-gradient(180deg, #fff4eb 0%, #fdf1ea 54%, #f9efe6 100%)",
  gradientPrimary: "linear-gradient(135deg, #CC5A1F, #FF8A3D)",
  gradientAccent: "linear-gradient(135deg, #FF8A3D, #ffc199)",
  darkSidebarBg: "linear-gradient(180deg, #21130c 0%, #331a11 100%)",
  darkPageBg:
    "radial-gradient(circle at top left, rgba(204, 90, 31, 0.22), transparent 22%), linear-gradient(180deg, #0f0c0a 0%, #1a1411 100%)",
  darkGradientPrimary: "linear-gradient(135deg, #CC5A1F, #8a360f)",
  darkGradientAccent: "linear-gradient(135deg, #CC5A1F, #d37642)",
};

function buildTheme(light, dark) {
  return {
    colorSunset: light,
    colorSunsetDark: dark,
    colorTerracotta: dark,
    colorOcean: light,
    sidebarBg: `linear-gradient(180deg, ${dark} 0%, ${light} 100%)`,
    pageBgLight: `radial-gradient(circle at 12% 18%, ${light}22, transparent 32%), linear-gradient(180deg, #f9fafc 0%, #eef2f7 100%)`,
    pageBgDark: `radial-gradient(circle at 12% 18%, ${dark}33, transparent 32%), linear-gradient(180deg, #0f141a 0%, #131820 100%)`,
    gradientPrimary: `linear-gradient(135deg, ${dark}, ${light})`,
    gradientAccent: `linear-gradient(135deg, ${light}, ${dark})`,
    darkSidebarBg: `linear-gradient(180deg, ${dark} 0%, ${dark} 100%)`,
    darkGradientPrimary: `linear-gradient(135deg, ${dark}, ${dark})`,
    darkGradientAccent: `linear-gradient(135deg, ${dark}, ${dark})`,
  };
}

const stateColors = {
  "andhra pradesh": { light: "#FF8A3D", dark: "#CC5A1F" },
  "arunachal pradesh": { light: "#FFD54F", dark: "#B8941F" },
  "assam": { light: "#4CAF50", dark: "#2E7D32" },
  "bihar": { light: "#B55239", dark: "#7A3424" },
  "chhattisgarh": { light: "#26A69A", dark: "#1B6F66" },
  "goa": { light: "#40E0D0", dark: "#09746b" },
  "gujarat": { light: "#FF6F00", dark: "#B24A00" },
  "haryana": { light: "#2ECC71", dark: "#1E8F4D" },
  "himachal pradesh": { light: "#2E8B57", dark: "#1B5E3A" },
  "jharkhand": { light: "#228B22", dark: "#145A14" },
  "karnataka": { light: "#6A1B9A", dark: "#3E0F5C" },
  "kerala": { light: "#43A047", dark: "#2E7031" },
  "madhya pradesh": { light: "#FF7043", dark: "#B3472B" },
  "maharashtra": { light: "#2962FF", dark: "#1A3FB3" },
  "manipur": { light: "#EC407A", dark: "#A81F50" },
  "meghalaya": { light: "#394e58", dark: "#2c3b43" },
  "mizoram": { light: "#66BB6A", dark: "#3F7D42" },
  "nagaland": { light: "#C62828", dark: "#7F1717" },
  "odisha": { light: "#D4A373", dark: "#8C6A48" },
  "punjab": { light: "#FFC107", dark: "#B28704" },
  "rajasthan": { light: "#E1A95F", dark: "#9C6E33" },
  "sikkim": { light: "#F5F5F5", dark: "#BDBDBD" },
  "tamil nadu": { light: "#8D6E63", dark: "#34231c" },
  "telangana": { light: "#D81B60", dark: "#8E1240" },
  "tripura": { light: "#C2185B", dark: "#7F103B" },
  "uttar pradesh": { light: "#800000", dark: "#4A0000" },
  "uttarakhand": { light: "#4FC3F7", dark: "#0e5a7b" },
  "west bengal": { light: "#B71C1C", dark: "#6F0F0F" },
};

const stateThemes = Object.fromEntries(
  Object.entries(stateColors).map(([key, value]) => [key, buildTheme(value.light, value.dark)])
);

export default stateThemes;

export function getStateColor(state, mode = "light") {
  const palette = stateColors[state?.toLowerCase?.()] || stateColors["andhra pradesh"];
  return mode === "dark" ? palette.dark : palette.light;
}

export function applyStateTheme(state, mode = "light") {
  if (typeof document === "undefined") return;
  const theme = stateThemes[state?.toLowerCase?.()] || defaultStateTheme;
  const root = document.documentElement;
  const isDark = mode === "dark";
  const activeSunset = isDark ? theme.colorSunsetDark || theme.colorSunset : theme.colorSunset;
  const activeSidebar = isDark
    ? theme.darkSidebarBg || defaultStateTheme.darkSidebarBg
    : theme.sidebarBg;
  const activePage = isDark
    ? theme.pageBgDark || defaultStateTheme.darkPageBg
    : theme.pageBgLight || defaultStateTheme.pageBg;
  const activeGradientPrimary = isDark
    ? theme.darkGradientPrimary || theme.gradientPrimary
    : theme.gradientPrimary;
  const activeGradientAccent = isDark
    ? theme.darkGradientAccent || theme.gradientAccent
    : theme.gradientAccent;

  root.style.setProperty("--sidebar-bg-current", activeSidebar);
  root.style.setProperty("--page-bg-current", activePage);
  root.style.setProperty("--gradient-primary-current", activeGradientPrimary);
  root.style.setProperty("--gradient-accent-current", activeGradientAccent);
  root.style.setProperty("--color-sunset", activeSunset);
  root.style.setProperty("--color-sunset-dark", theme.colorSunsetDark || theme.colorSunset);
  root.style.setProperty("--color-terracotta", theme.colorTerracotta);
  root.style.setProperty("--color-ocean", theme.colorOcean);
  root.style.setProperty("--sidebar-bg", activeSidebar);
  root.style.setProperty("--page-bg", activePage);
  root.style.setProperty("--gradient-primary", activeGradientPrimary);
  root.style.setProperty("--gradient-accent", activeGradientAccent);
  root.style.setProperty("--sidebar-bg-dark", theme.darkSidebarBg || defaultStateTheme.darkSidebarBg);
  root.style.setProperty("--page-bg-dark", theme.darkPageBg || defaultStateTheme.darkPageBg);
  root.style.setProperty("--gradient-primary-dark", theme.darkGradientPrimary || theme.gradientPrimary);
  root.style.setProperty("--gradient-accent-dark", theme.darkGradientAccent || theme.gradientAccent);
}
