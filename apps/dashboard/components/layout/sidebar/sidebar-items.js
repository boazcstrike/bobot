import {
  CandlestickChart,
  ChartColumn,
  CreditCard,
  GitFork,
  House,
  WalletCards,
} from "lucide-react";

// Navigation model for the sidebar. Sections render as headings; an item with
// a populated `items` array renders as a collapsible group.
const sidebarItems = [
  {
    heading: "Dashboard",
    items: [
      {
        id: "home",
        name: "Control Center",
        icon: House,
        url: "/",
      },
    ],
  },
  {
    heading: "Finance",
    items: [
      {
        id: "expenses",
        name: "Expenses",
        icon: WalletCards,
        url: "/expenses",
        items: [
          {
            id: "expense-dashboard",
            name: "Expense Dashboard",
            icon: ChartColumn,
            url: "/expense-dashboard",
          },
          {
            id: "credit-card-statements",
            name: "Credit Card Statements",
            icon: CreditCard,
            url: "/credit-card-statements",
          },
        ],
      },
    ],
  },
  {
    heading: "Trading",
    items: [
      {
        id: "trading",
        name: "Binance Bot",
        icon: CandlestickChart,
        url: "/trading",
      },
    ],
  },
  {
    heading: "Code",
    items: [
      {
        id: "personal-github-repos",
        name: "Personal GitHub Repos",
        icon: GitFork,
        url: "/personal-github-repos",
      },
    ],
  },
];

export default sidebarItems;
