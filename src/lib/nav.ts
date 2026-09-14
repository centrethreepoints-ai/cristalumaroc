import type { ModuleKey } from "./permissions";

export type NavItem = {
  key: ModuleKey;
  labelKey: string;
  href: string;
  icon: string;
};

export type NavGroup = {
  key: string;
  labelKey: string;
  items: NavItem[];
};

/** Sidebar structure — every entry is gated by the role permission matrix. */
export const NAV: NavGroup[] = [
  {
    key: "main",
    labelKey: "menu.dashboard",
    items: [{ key: "dashboard", labelKey: "menu.dashboard", href: "/app/dashboard", icon: "LayoutDashboard" }],
  },
  {
    key: "commercial",
    labelKey: "menu.commercial",
    items: [
      { key: "requests", labelKey: "menu.requests", href: "/app/commercial/requests", icon: "FileInput" },
      { key: "customers", labelKey: "menu.customers", href: "/app/commercial/customers", icon: "Users" },
      { key: "prospects", labelKey: "menu.prospects", href: "/app/commercial/prospects", icon: "UserPlus" },
      { key: "quotes", labelKey: "menu.quotes", href: "/app/commercial/quotes", icon: "FileText" },
      { key: "orders", labelKey: "menu.orders", href: "/app/commercial/orders", icon: "ShoppingCart" },
    ],
  },
  {
    key: "production",
    labelKey: "menu.production",
    items: [
      { key: "planning", labelKey: "menu.planning", href: "/app/production/planning", icon: "CalendarRange" },
      { key: "manufacturing", labelKey: "menu.manufacturing", href: "/app/production/manufacturing", icon: "Factory" },
      { key: "kanban", labelKey: "menu.kanban", href: "/app/production/kanban", icon: "KanbanSquare" },
      { key: "quality", labelKey: "menu.quality", href: "/app/production/quality", icon: "ClipboardCheck" },
    ],
  },
  {
    key: "stock",
    labelKey: "menu.stock",
    items: [
      { key: "products", labelKey: "menu.products", href: "/app/stock/products", icon: "Package" },
      { key: "inventory", labelKey: "menu.inventory", href: "/app/stock/inventory", icon: "Boxes" },
      { key: "movements", labelKey: "menu.movements", href: "/app/stock/movements", icon: "ArrowLeftRight" },
      { key: "warehouses", labelKey: "menu.warehouses", href: "/app/stock/warehouses", icon: "Warehouse" },
      { key: "alerts", labelKey: "menu.alerts", href: "/app/stock/alerts", icon: "TriangleAlert" },
    ],
  },
  {
    key: "purchasing",
    labelKey: "menu.purchasing",
    items: [
      { key: "suppliers", labelKey: "menu.suppliers", href: "/app/purchasing/suppliers", icon: "Truck" },
      { key: "purchase_orders", labelKey: "menu.purchaseOrders", href: "/app/purchasing/orders", icon: "FileInput" },
      { key: "receipts", labelKey: "menu.receipts", href: "/app/purchasing/receipts", icon: "PackageCheck" },
    ],
  },
  {
    key: "finance",
    labelKey: "menu.finance",
    items: [
      { key: "invoices", labelKey: "menu.invoices", href: "/app/finance/invoices", icon: "Receipt" },
      { key: "payments", labelKey: "menu.payments", href: "/app/finance/payments", icon: "CreditCard" },
      { key: "expenses", labelKey: "menu.expenses", href: "/app/finance/expenses", icon: "Wallet" },
    ],
  },
  {
    key: "logistics",
    labelKey: "menu.logistics",
    items: [
      { key: "deliveries", labelKey: "menu.deliveries", href: "/app/logistics/deliveries", icon: "PackageOpen" },
      { key: "installations", labelKey: "menu.installations", href: "/app/logistics/installations", icon: "Wrench" },
    ],
  },
  {
    key: "system",
    labelKey: "menu.reports",
    items: [
      { key: "reports", labelKey: "menu.reports", href: "/app/reports", icon: "BarChart3" },
      { key: "notifications", labelKey: "menu.notifications", href: "/app/notifications", icon: "Bell" },
      { key: "users", labelKey: "menu.users", href: "/app/users", icon: "UserCog" },
      { key: "audit", labelKey: "menu.audit", href: "/app/audit", icon: "ScrollText" },
      { key: "settings", labelKey: "menu.settings", href: "/app/settings", icon: "Settings" },
    ],
  },
];

/** Flat lookup used by the global search and breadcrumbs. */
export const NAV_FLAT: { key: ModuleKey; href: string; labelKey: string }[] = NAV.flatMap((g) => g.items);
