"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Palette, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FullLayout from "@/components/layout/full-layout";
import { ThemeProvider } from "@/components/theme-provider";

const THEME_GROUPS = [
  {
    id: "default",
    title: "Template Default",
    description:
      "The ported shadcndashboard identity — neutral surfaces that follow the light/dark toggle in the header.",
    themes: [
      {
        id: "template-default",
        name: "Shadcn Neutral",
        note: "Follows the header light/dark switch.",
        swatches: ["#ffffff", "#f5f5f5", "#e5e5e5", "#525252", "#0a0a0a"],
        // No vars: the stylesheet's :root / .dark tokens drive the palette.
        vars: null,
      },
    ],
  },
  {
    id: "luxury",
    title: "Luxury Grey and Black",
    description: "Three monochrome premium palettes tuned for high contrast and polished depth.",
    themes: [
      {
        id: "luxury-obsidian",
        name: "Obsidian Atelier",
        note: "Charcoal, pewter, and polished steel.",
        swatches: ["#070809", "#111317", "#2d3037", "#8b909a", "#f4f5f7"],
        vars: {
          "--color-primary": "#c8ccd4",
          "--color-secondary": "#8b909a",
          "--color-cta": "#f1f5f9",
          "--color-background": "#070809",
          "--color-surface": "#101317",
          "--color-text": "#f4f5f7",
          "--color-text-muted": "#b6bcc8",
          "--color-border": "#2d3037",
          "--color-border-strong": "#444a55",
          "--color-success": "#22c55e",
          "--color-warn": "#f59e0b",
          "--color-idle": "#9ca3af",
          "--color-danger": "#ef4444",
          "--ambient-1": "rgba(168, 175, 189, 0.2)",
          "--ambient-2": "rgba(104, 112, 125, 0.15)",
          "--ambient-3": "rgba(240, 242, 246, 0.09)",
          "--grid-line-1": "rgba(148, 163, 184, 0.11)",
          "--grid-line-2": "rgba(226, 232, 240, 0.08)",
          "--card-surface": "rgba(24, 28, 34, 0.92)",
          "--card-surface-alt": "rgba(14, 17, 22, 0.96)",
          "--glass-blur": "6px",
        },
      },
      {
        id: "luxury-platinum",
        name: "Platinum Ledger",
        note: "Graphite foundation with soft platinum highlights.",
        swatches: ["#0e1014", "#1c1f25", "#3f4450", "#a8adb8", "#f8fafc"],
        vars: {
          "--color-primary": "#d1d5db",
          "--color-secondary": "#9ca3af",
          "--color-cta": "#f8fafc",
          "--color-background": "#0e1014",
          "--color-surface": "#161a20",
          "--color-text": "#f8fafc",
          "--color-text-muted": "#c2c8d3",
          "--color-border": "#353a45",
          "--color-border-strong": "#555d6d",
          "--color-success": "#4ade80",
          "--color-warn": "#fbbf24",
          "--color-idle": "#9ca3af",
          "--color-danger": "#f87171",
          "--ambient-1": "rgba(186, 193, 206, 0.19)",
          "--ambient-2": "rgba(107, 114, 128, 0.16)",
          "--ambient-3": "rgba(229, 231, 235, 0.11)",
          "--grid-line-1": "rgba(203, 213, 225, 0.12)",
          "--grid-line-2": "rgba(148, 163, 184, 0.1)",
          "--card-surface": "rgba(31, 36, 44, 0.92)",
          "--card-surface-alt": "rgba(21, 24, 31, 0.96)",
          "--glass-blur": "6px",
        },
      },
      {
        id: "luxury-carbon",
        name: "Carbon Executive",
        note: "Deep black with graphite and slate transitions.",
        swatches: ["#050607", "#121419", "#262b33", "#6b7280", "#e5e7eb"],
        vars: {
          "--color-primary": "#e5e7eb",
          "--color-secondary": "#9ca3af",
          "--color-cta": "#f3f4f6",
          "--color-background": "#050607",
          "--color-surface": "#111419",
          "--color-text": "#f5f7fa",
          "--color-text-muted": "#aeb6c2",
          "--color-border": "#2a2f38",
          "--color-border-strong": "#424a57",
          "--color-success": "#34d399",
          "--color-warn": "#f59e0b",
          "--color-idle": "#94a3b8",
          "--color-danger": "#fb7185",
          "--ambient-1": "rgba(148, 163, 184, 0.2)",
          "--ambient-2": "rgba(71, 85, 105, 0.16)",
          "--ambient-3": "rgba(226, 232, 240, 0.08)",
          "--grid-line-1": "rgba(148, 163, 184, 0.11)",
          "--grid-line-2": "rgba(226, 232, 240, 0.08)",
          "--card-surface": "rgba(20, 24, 30, 0.92)",
          "--card-surface-alt": "rgba(10, 12, 16, 0.96)",
          "--glass-blur": "6px",
        },
      },
    ],
  },
  {
    id: "brand",
    title: "Brand-Inspired",
    description: "Palettes inspired by Spotify, Discord, Steam, and GitHub.",
    themes: [
      {
        id: "brand-spotify",
        name: "Spotify Pulse",
        note: "Spotify green energy on true-dark canvas.",
        swatches: ["#121212", "#1DB954", "#1ED760", "#535353", "#ffffff"],
        vars: {
          "--color-primary": "#1db954",
          "--color-secondary": "#1ed760",
          "--color-cta": "#1db954",
          "--color-background": "#121212",
          "--color-surface": "#181818",
          "--color-text": "#f5f5f5",
          "--color-text-muted": "#b3b3b3",
          "--color-border": "#2a2a2a",
          "--color-border-strong": "#3a3a3a",
          "--color-success": "#1ed760",
          "--color-warn": "#f59e0b",
          "--color-idle": "#6b7280",
          "--color-danger": "#ef4444",
          "--ambient-1": "rgba(29, 185, 84, 0.2)",
          "--ambient-2": "rgba(30, 215, 96, 0.12)",
          "--ambient-3": "rgba(255, 255, 255, 0.07)",
          "--grid-line-1": "rgba(29, 185, 84, 0.14)",
          "--grid-line-2": "rgba(255, 255, 255, 0.07)",
          "--card-surface": "rgba(24, 24, 24, 0.92)",
          "--card-surface-alt": "rgba(18, 18, 18, 0.96)",
          "--glass-blur": "6px",
        },
      },
      {
        id: "brand-discord",
        name: "Discord Orbit",
        note: "Blurple-forward with clean dark neutrals.",
        swatches: ["#0f1014", "#1e2129", "#5865F2", "#99AAB5", "#ffffff"],
        vars: {
          "--color-primary": "#5865f2",
          "--color-secondary": "#99aab5",
          "--color-cta": "#5865f2",
          "--color-background": "#0f1014",
          "--color-surface": "#181b22",
          "--color-text": "#f2f3f5",
          "--color-text-muted": "#c7d0d9",
          "--color-border": "#2e3442",
          "--color-border-strong": "#4a5567",
          "--color-success": "#57f287",
          "--color-warn": "#fbbf24",
          "--color-idle": "#99aab5",
          "--color-danger": "#ed4245",
          "--ambient-1": "rgba(88, 101, 242, 0.2)",
          "--ambient-2": "rgba(153, 170, 181, 0.14)",
          "--ambient-3": "rgba(242, 243, 245, 0.08)",
          "--grid-line-1": "rgba(88, 101, 242, 0.14)",
          "--grid-line-2": "rgba(153, 170, 181, 0.09)",
          "--card-surface": "rgba(26, 30, 39, 0.92)",
          "--card-surface-alt": "rgba(16, 19, 26, 0.96)",
          "--glass-blur": "6px",
        },
      },
      {
        id: "brand-steam",
        name: "Steam Forge",
        note: "Steam blues with deep naval layers.",
        swatches: ["#0b1017", "#1b2838", "#2A475E", "#66C0F4", "#c7d5e0"],
        vars: {
          "--color-primary": "#66c0f4",
          "--color-secondary": "#2a475e",
          "--color-cta": "#66c0f4",
          "--color-background": "#0b1017",
          "--color-surface": "#111a24",
          "--color-text": "#e5edf5",
          "--color-text-muted": "#b3c2d3",
          "--color-border": "#2d3e51",
          "--color-border-strong": "#45617f",
          "--color-success": "#4ade80",
          "--color-warn": "#f59e0b",
          "--color-idle": "#94a3b8",
          "--color-danger": "#fb7185",
          "--ambient-1": "rgba(102, 192, 244, 0.2)",
          "--ambient-2": "rgba(42, 71, 94, 0.18)",
          "--ambient-3": "rgba(229, 237, 245, 0.07)",
          "--grid-line-1": "rgba(102, 192, 244, 0.14)",
          "--grid-line-2": "rgba(42, 71, 94, 0.14)",
          "--card-surface": "rgba(24, 36, 49, 0.9)",
          "--card-surface-alt": "rgba(14, 22, 31, 0.95)",
          "--glass-blur": "6px",
        },
      },
      {
        id: "brand-github",
        name: "GitHub Monolith",
        note: "GitHub dark syntax feel with emerald action cues.",
        swatches: ["#0d1117", "#161B22", "#58A6FF", "#2EA043", "#E6EDF3"],
        vars: {
          "--color-primary": "#58a6ff",
          "--color-secondary": "#7d8590",
          "--color-cta": "#2ea043",
          "--color-background": "#0d1117",
          "--color-surface": "#161b22",
          "--color-text": "#e6edf3",
          "--color-text-muted": "#9ea7b3",
          "--color-border": "#30363d",
          "--color-border-strong": "#484f58",
          "--color-success": "#2ea043",
          "--color-warn": "#d29922",
          "--color-idle": "#8b949e",
          "--color-danger": "#f85149",
          "--ambient-1": "rgba(88, 166, 255, 0.2)",
          "--ambient-2": "rgba(46, 160, 67, 0.14)",
          "--ambient-3": "rgba(230, 237, 243, 0.07)",
          "--grid-line-1": "rgba(88, 166, 255, 0.14)",
          "--grid-line-2": "rgba(125, 133, 144, 0.1)",
          "--card-surface": "rgba(22, 27, 34, 0.9)",
          "--card-surface-alt": "rgba(13, 17, 23, 0.96)",
          "--glass-blur": "6px",
        },
      },
    ],
  },
  {
    id: "future",
    title: "Futuristic Glass",
    description: "Three transparent and glassy schemes with luminous accents.",
    themes: [
      {
        id: "future-aurora",
        name: "Aurora Glassfield",
        note: "Cyan highlights with misted midnight panes.",
        swatches: ["#05070f", "#101a34", "#34d399", "#38bdf8", "rgba(203,233,255,0.85)"],
        vars: {
          "--color-primary": "#38bdf8",
          "--color-secondary": "#34d399",
          "--color-cta": "#60a5fa",
          "--color-background": "#05070f",
          "--color-surface": "rgba(12, 18, 34, 0.68)",
          "--color-text": "#edf6ff",
          "--color-text-muted": "#b9cee6",
          "--color-border": "rgba(125, 211, 252, 0.28)",
          "--color-border-strong": "rgba(52, 211, 153, 0.45)",
          "--color-success": "#34d399",
          "--color-warn": "#fbbf24",
          "--color-idle": "#93c5fd",
          "--color-danger": "#fb7185",
          "--ambient-1": "rgba(56, 189, 248, 0.26)",
          "--ambient-2": "rgba(52, 211, 153, 0.18)",
          "--ambient-3": "rgba(191, 219, 254, 0.18)",
          "--grid-line-1": "rgba(56, 189, 248, 0.16)",
          "--grid-line-2": "rgba(52, 211, 153, 0.14)",
          "--card-surface": "rgba(16, 25, 46, 0.48)",
          "--card-surface-alt": "rgba(10, 16, 33, 0.62)",
          "--glass-blur": "20px",
        },
      },
      {
        id: "future-nebula",
        name: "Nebula Lattice",
        note: "Electric ice blues on transparent slate.",
        swatches: ["#070c18", "#1d2d50", "#7dd3fc", "#67e8f9", "rgba(232,245,255,0.8)"],
        vars: {
          "--color-primary": "#7dd3fc",
          "--color-secondary": "#67e8f9",
          "--color-cta": "#93c5fd",
          "--color-background": "#070c18",
          "--color-surface": "rgba(17, 27, 45, 0.66)",
          "--color-text": "#eff6ff",
          "--color-text-muted": "#bfd3eb",
          "--color-border": "rgba(125, 211, 252, 0.26)",
          "--color-border-strong": "rgba(103, 232, 249, 0.42)",
          "--color-success": "#22d3ee",
          "--color-warn": "#fbbf24",
          "--color-idle": "#93c5fd",
          "--color-danger": "#fb7185",
          "--ambient-1": "rgba(125, 211, 252, 0.26)",
          "--ambient-2": "rgba(103, 232, 249, 0.16)",
          "--ambient-3": "rgba(239, 246, 255, 0.14)",
          "--grid-line-1": "rgba(125, 211, 252, 0.16)",
          "--grid-line-2": "rgba(103, 232, 249, 0.14)",
          "--card-surface": "rgba(18, 31, 51, 0.46)",
          "--card-surface-alt": "rgba(10, 18, 33, 0.62)",
          "--glass-blur": "21px",
        },
      },
      {
        id: "future-cryo",
        name: "Cryo Prism",
        note: "Frosted teal panes with silver-blue glow.",
        swatches: ["#040912", "#113245", "#2dd4bf", "#93c5fd", "rgba(240,249,255,0.82)"],
        vars: {
          "--color-primary": "#2dd4bf",
          "--color-secondary": "#93c5fd",
          "--color-cta": "#60a5fa",
          "--color-background": "#040912",
          "--color-surface": "rgba(10, 28, 38, 0.68)",
          "--color-text": "#ecfeff",
          "--color-text-muted": "#bdd7de",
          "--color-border": "rgba(45, 212, 191, 0.28)",
          "--color-border-strong": "rgba(147, 197, 253, 0.44)",
          "--color-success": "#34d399",
          "--color-warn": "#fbbf24",
          "--color-idle": "#93c5fd",
          "--color-danger": "#fb7185",
          "--ambient-1": "rgba(45, 212, 191, 0.23)",
          "--ambient-2": "rgba(147, 197, 253, 0.2)",
          "--ambient-3": "rgba(236, 254, 255, 0.13)",
          "--grid-line-1": "rgba(45, 212, 191, 0.17)",
          "--grid-line-2": "rgba(147, 197, 253, 0.14)",
          "--card-surface": "rgba(13, 36, 49, 0.46)",
          "--card-surface-alt": "rgba(8, 21, 32, 0.62)",
          "--glass-blur": "20px",
        },
      },
    ],
  },
];

const ALL_THEMES = THEME_GROUPS.flatMap((group) => group.themes);
const DEFAULT_THEME_ID = ALL_THEMES[0].id;
const SETTINGS_STORAGE_KEY = "bobot-dashboard-settings";
const LEGACY_THEME_STORAGE_KEY = "bobot-dashboard-theme";
const THEME_VARS_STORAGE_KEY = "bobot-dashboard-theme-vars";
const SETTINGS_COOKIE_KEY = "bobot_dashboard_settings";
const SETTINGS_TABS = [
  { id: "personalization", label: "Personalization", icon: Palette },
  { id: "workspace", label: "Workspace", icon: SlidersHorizontal },
];

// Per-route wrapper class names. Preserves the styling each page relied on
// before the shell was hoisted into the root layout. The home route now uses
// the ported dashboard grid and needs no legacy wrapper.
const PAGE_CLASS_MAP = {
  "/expenses": "legacy-page expenses-dashboard-page",
  "/personal-github-repos": "legacy-page personal-github-page",
};

// Every custom property any palette can write. Applying a palette clears this
// whole set first so switching schemes (or back to the token default) never
// leaves stale declarations behind on <html>.
const OVERRIDABLE_VAR_NAMES = [
  ...new Set(
    ALL_THEMES.flatMap((theme) => {
      if (!theme.vars) return [];
      return [...Object.keys(theme.vars), ...Object.keys(buildShadcnTokenVars(theme.vars))];
    }),
  ),
];

function buildShadcnTokenVars(vars) {
  const background = vars["--color-background"];
  const foreground = vars["--color-text"];
  const card = vars["--color-surface"];
  const muted = vars["--card-surface-alt"];
  const primary = vars["--color-primary"];
  const secondary = vars["--color-secondary"];
  const accent = vars["--color-cta"];
  const border = vars["--color-border"];

  return {
    "--background": background,
    "--foreground": foreground,
    "--card": card,
    "--card-foreground": foreground,
    "--popover": card,
    "--popover-foreground": foreground,
    "--primary": primary,
    "--primary-foreground": background,
    "--secondary": secondary,
    "--secondary-foreground": background,
    "--muted": muted,
    "--muted-foreground": vars["--color-text-muted"],
    "--accent": accent,
    "--accent-foreground": background,
    "--destructive": vars["--color-danger"],
    "--border": border,
    "--input": vars["--color-border-strong"],
    "--ring": secondary,
    "--chart-1": primary,
    "--chart-2": secondary,
    "--chart-3": accent,
    "--chart-4": vars["--color-success"],
    "--chart-5": vars["--color-warn"],
    "--sidebar": card,
    "--sidebar-foreground": foreground,
    "--sidebar-primary": primary,
    "--sidebar-primary-foreground": background,
    "--sidebar-accent": muted,
    "--sidebar-accent-foreground": foreground,
    "--sidebar-border": border,
    "--sidebar-ring": secondary,
  };
}

function readSettingsCookie() {
  const cookiePrefix = `${SETTINGS_COOKIE_KEY}=`;
  const cookie = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(cookiePrefix));
  if (!cookie) return null;
  try {
    return JSON.parse(decodeURIComponent(cookie.slice(cookiePrefix.length)));
  } catch {
    return null;
  }
}

function saveSettingsCookie(settings) {
  const maxAgeSeconds = 60 * 60 * 24 * 365;
  const payload = encodeURIComponent(JSON.stringify(settings));
  document.cookie = `${SETTINGS_COOKIE_KEY}=${payload}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

// Read persisted settings (localStorage first, cookie fallback) once. Returns
// null during SSR so initializers fall back to defaults.
function readPersistedSettings() {
  if (typeof window === "undefined") return null;
  let parsed = null;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }
  if (!parsed) {
    parsed = readSettingsCookie();
  }
  return parsed;
}

// Resolve the persisted theme synchronously on the first client render so the
// apply effect never runs with the default and clobbers the saved color scheme.
// Falls back to default during SSR.
function getInitialThemeId() {
  if (typeof window === "undefined") return DEFAULT_THEME_ID;
  const parsed = readPersistedSettings();
  const candidateThemeId =
    parsed?.selectedThemeId || window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
  return ALL_THEMES.some((theme) => theme.id === candidateThemeId)
    ? candidateThemeId
    : DEFAULT_THEME_ID;
}

// Resolve the active settings tab synchronously: ?settingsTab wins, then the
// persisted tab, else "personalization".
function getInitialSettingsTab() {
  if (typeof window === "undefined") return "personalization";
  const params = new URLSearchParams(window.location.search);
  const requestedTab = params.get("settingsTab");
  if (SETTINGS_TABS.some((tab) => tab.id === requestedTab)) {
    return requestedTab;
  }
  const parsed = readPersistedSettings();
  if (SETTINGS_TABS.some((tab) => tab.id === parsed?.activeSettingsTab)) {
    return parsed.activeSettingsTab;
  }
  return "personalization";
}

// The settings modal opens on first render only when navigated to with
// ?settings=1, resolved synchronously to avoid a setState-in-effect.
function getInitialSettingsOpen() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("settings") === "1";
}

const ShellContext = createContext({
  openSettings: () => {},
  setPendingStatements: () => {},
});

export function useShell() {
  return useContext(ShellContext);
}

export default function DashboardShell({ children }) {
  const pathname = usePathname();
  // All three states resolve persisted/query values synchronously in their lazy
  // initializers so no setState-in-effect hydration pass is needed.
  const [selectedThemeId, setSelectedThemeId] = useState(getInitialThemeId);
  const [settingsOpen, setSettingsOpen] = useState(getInitialSettingsOpen);
  const [activeSettingsTab, setActiveSettingsTab] = useState(getInitialSettingsTab);
  const [pendingStatements, setPendingStatements] = useState(0);

  const pageClassName = PAGE_CLASS_MAP[pathname] ?? "";

  // Persist theme + active tab whenever they change.
  useEffect(() => {
    const settings = {
      selectedThemeId,
      activeSettingsTab,
    };
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    window.localStorage.setItem(LEGACY_THEME_STORAGE_KEY, selectedThemeId);
    saveSettingsCookie(settings);
  }, [selectedThemeId, activeSettingsTab]);

  const selectedTheme = useMemo(
    () => ALL_THEMES.find((theme) => theme.id === selectedThemeId) || ALL_THEMES[0],
    [selectedThemeId],
  );

  // Apply the active palette as CSS custom properties on <html>. Every
  // overridable property is cleared first, so the "Shadcn Neutral" scheme (which
  // carries no vars) falls back to the stylesheet's :root/.dark tokens and the
  // header light/dark toggle takes over.
  useEffect(() => {
    const root = document.documentElement;
    OVERRIDABLE_VAR_NAMES.forEach((name) => root.style.removeProperty(name));

    const mergedThemeVars = selectedTheme.vars
      ? { ...selectedTheme.vars, ...buildShadcnTokenVars(selectedTheme.vars) }
      : {};

    Object.entries(mergedThemeVars).forEach(([name, value]) => {
      root.style.setProperty(name, value);
    });

    // Persist resolved CSS vars so the root layout's pre-paint script can
    // re-apply the active theme on every reload/route before React mounts.
    try {
      window.localStorage.setItem(THEME_VARS_STORAGE_KEY, JSON.stringify(mergedThemeVars));
    } catch {
      // ignore storage write failures (private mode / quota)
    }
  }, [selectedTheme]);

  useEffect(() => {
    if (!settingsOpen) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setSettingsOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [settingsOpen]);

  useEffect(() => {
    document.body.style.overflow = settingsOpen ? "hidden" : "";
    // Pause expensive infinite background animations (aurora blobs, mesh grid)
    // while the modal is open so the backdrop blur isn't re-rasterizing a moving
    // background every frame — this is the main source of modal lag.
    document.body.classList.toggle("is-modal-open", settingsOpen);
    return () => {
      document.body.style.overflow = "";
      document.body.classList.remove("is-modal-open");
    };
  }, [settingsOpen]);

  const contextValue = useMemo(
    () => ({
      openSettings: (tab = "personalization") => {
        const tabExists = SETTINGS_TABS.some((entry) => entry.id === tab);
        setActiveSettingsTab(tabExists ? tab : "personalization");
        setSettingsOpen(true);
      },
      setPendingStatements,
    }),
    [],
  );

  return (
    <ShellContext.Provider value={contextValue}>
      <ThemeProvider>
        <FullLayout
          pendingStatements={pendingStatements}
          onOpenSettings={() => {
            setActiveSettingsTab("personalization");
            setSettingsOpen(true);
          }}
        >
          <div className={pageClassName}>{children}</div>
        </FullLayout>
      </ThemeProvider>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent
          id="dashboard-settings-modal"
          showCloseButton={false}
          className="settings-modal max-w-[min(1120px,calc(100%-2rem))] gap-3 p-4 sm:max-w-[min(1120px,calc(100%-2rem))]"
          aria-labelledby="settings-modal-title"
        >
          <DialogHeader className="settings-modal-header">
            <div>
              <p className="eyebrow">Settings</p>
              <DialogTitle id="settings-modal-title">Dashboard Settings Hub</DialogTitle>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="settings-close-btn interactive focus-ring"
              onClick={() => setSettingsOpen(false)}
              aria-label="Close settings"
            >
              <X size={18} aria-hidden="true" />
              <span>Close</span>
            </Button>
          </DialogHeader>
          <Tabs
            value={activeSettingsTab}
            onValueChange={setActiveSettingsTab}
            orientation="vertical"
            className="settings-modal-body"
          >
            <TabsList className="settings-modal-tabs h-auto w-full rounded-none bg-transparent p-0" variant="line">
              {SETTINGS_TABS.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    id={`settings-tab-${tab.id}`}
                    value={tab.id}
                    className="settings-tab interactive focus-ring"
                    aria-controls={`settings-panel-${tab.id}`}
                  >
                    <TabIcon size={16} aria-hidden="true" />
                    <span>{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            <ScrollArea className="settings-modal-panel">
              <TabsContent
                id="settings-panel-personalization"
                value="personalization"
                className="theme-settings"
                aria-labelledby="settings-tab-personalization"
              >
                <section aria-label="Theme settings">
                  <div className="section-header">
                    <p className="eyebrow">Personalization</p>
                    <h3>Color Scheme Settings</h3>
                    <p>
                      Pick from luxury monochrome palettes, brand-inspired modes (Spotify, Discord, Steam, GitHub), or
                      futuristic transparent glass themes.
                    </p>
                  </div>
                  <p className="active-theme-note">
                    Active scheme: <strong>{selectedTheme.name}</strong>
                  </p>
                  <div className="theme-groups">
                    {THEME_GROUPS.map((group) => (
                      <article key={group.id} className="theme-group">
                        <header>
                          <h4>{group.title}</h4>
                          <p>{group.description}</p>
                        </header>
                        <div className="theme-options" role="list">
                          {group.themes.map((theme) => {
                            const active = theme.id === selectedThemeId;
                            return (
                              <Button
                                key={theme.id}
                                type="button"
                                variant="outline"
                                className={`theme-option interactive focus-ring${active ? " active" : ""}`}
                                onClick={() => setSelectedThemeId(theme.id)}
                                aria-pressed={active}
                              >
                                <span className="theme-option-head">
                                  <strong>{theme.name}</strong>
                                  <span>{theme.note}</span>
                                </span>
                                <span className="theme-swatches" aria-hidden="true">
                                  {theme.swatches.map((swatch) => (
                                    <span key={`${theme.id}-${swatch}`} className="theme-swatch" style={{ background: swatch }} />
                                  ))}
                                </span>
                                <span className="theme-option-check" aria-hidden="true">✓</span>
                              </Button>
                            );
                          })}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </TabsContent>

              <TabsContent
                id="settings-panel-workspace"
                value="workspace"
                className="settings-summary-grid"
                aria-labelledby="settings-tab-workspace"
              >
                <section className="settings-summary-grid">
                  <article className="settings-mini-card">
                    <span>Active theme</span>
                    <strong>{selectedTheme.name}</strong>
                  </article>
                  <article className="settings-mini-card">
                    <span>Pending statements</span>
                    <strong>{pendingStatements}</strong>
                  </article>
                  <article className="settings-mini-card">
                    <span>Current route</span>
                    <strong>{pathname}</strong>
                  </article>
                </section>
              </TabsContent>

            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>
    </ShellContext.Provider>
  );
}
