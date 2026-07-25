import "./globals.css";
import DashboardShell from "./dashboard-shell";

export const metadata = {
  title: "Bobot Dashboard",
  description: "Personal assistant dashboard",
};

const THEME_VARS_STORAGE_KEY = "bobot-dashboard-theme-vars";
const COLOR_MODE_STORAGE_KEY = "bobot-dashboard-color-mode";

// Runs synchronously during HTML parse, before first paint, on every route and
// hard reload — re-applies the persisted light/dark mode and palette overrides
// so the saved color scheme loads instead of flashing the default.
const themeBootScript = `(function(){try{var root=document.documentElement;var m=localStorage.getItem("${COLOR_MODE_STORAGE_KEY}");if(!m){m=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}if(m==="dark"){root.classList.add("dark");}root.style.colorScheme=m;var v=localStorage.getItem("${THEME_VARS_STORAGE_KEY}");if(!v)return;var vars=JSON.parse(v);for(var k in vars){if(k.charAt(0)==="-"){root.style.setProperty(k,vars[k]);}}}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="style-lyra"
      data-sidebar-type="true"
      data-card-shadow="false"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}
