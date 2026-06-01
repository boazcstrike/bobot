import { ExpenseDashboard } from "@/components/expense-dashboard/ExpenseDashboard";
import { loadExpenseDashboardData } from "@/lib/expense-dashboard";

export const runtime = "nodejs";

// The root layout already wraps every route in the shared ControlRailShell
// (sidebar + topbar). Render only the page content here to avoid a nested,
// duplicated shell. Page-level wrapper classes are registered in
// dashboard-shell.jsx PAGE_CLASS_MAP.
export default function ExpenseDashboardPage() {
  const data = loadExpenseDashboardData();

  return <ExpenseDashboard data={data} />;
}
