import "./globals.css";
import DashboardShell from "./dashboard-shell";

export const metadata = {
  title: "Bobot Dashboard",
  description: "Personal assistant dashboard",
};

const THEME_VARS_STORAGE_KEY = "bobot-dashboard-theme-vars";

// Runs synchronously during HTML parse, before first paint, on every route and
// hard reload — re-applies the persisted theme so the saved color scheme loads
// instead of resetting to the default.
const themeBootScript = `(function(){try{var v=localStorage.getItem("${THEME_VARS_STORAGE_KEY}");if(!v)return;var vars=JSON.parse(v);var root=document.documentElement;for(var k in vars){if(k.charAt(0)==="-"){root.style.setProperty(k,vars[k]);}}}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}
