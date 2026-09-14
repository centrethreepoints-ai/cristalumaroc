/**
 * Pure role/permission matrix. Deliberately free of any Next.js runtime
 * import so client components (sidebar, topbar) can use it safely.
 */

export const ROLES = [
  "admin",
  "direction",
  "commercial",
  "stock",
  "production",
  "accountant",
  "installer",
] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, { fr: string; ar: string; en: string }> = {
  admin: { fr: "Administrateur", ar: "المدير العام للنظام", en: "Administrator" },
  direction: { fr: "Direction", ar: "الإدارة العامة", en: "Management" },
  commercial: { fr: "Commercial", ar: "المبيعات", en: "Sales" },
  stock: { fr: "Magasinier", ar: "مسؤول المخزون", en: "Stock Manager" },
  production: { fr: "Responsable production", ar: "مسؤول الإنتاج", en: "Production Manager" },
  accountant: { fr: "Comptable", ar: "المحاسب", en: "Accountant" },
  installer: { fr: "Installateur", ar: "المُركِّب", en: "Installer" },
};

export type ModuleKey =
  | "dashboard" | "customers" | "prospects" | "requests" | "quotes" | "orders"
  | "planning" | "manufacturing" | "kanban" | "quality"
  | "products" | "inventory" | "movements" | "warehouses" | "alerts"
  | "suppliers" | "purchase_orders" | "receipts"
  | "invoices" | "payments" | "expenses"
  | "deliveries" | "installations"
  | "reports" | "notifications" | "users" | "audit" | "settings";

export type Perm = "view" | "create" | "edit" | "delete";

const ALL: Perm[] = ["view", "create", "edit", "delete"];

/** Role -> module -> permissions */
export const PERMISSIONS: Record<Role, Partial<Record<ModuleKey, Perm[]>>> = {
  admin: {
    dashboard: ALL, customers: ALL, prospects: ALL, requests: ALL, quotes: ALL, orders: ALL,
    planning: ALL, manufacturing: ALL, kanban: ALL, quality: ALL,
    products: ALL, inventory: ALL, movements: ALL, warehouses: ALL, alerts: ALL,
    suppliers: ALL, purchase_orders: ALL, receipts: ALL,
    invoices: ALL, payments: ALL, expenses: ALL,
    deliveries: ALL, installations: ALL,
    reports: ALL, notifications: ALL, users: ALL, audit: ALL, settings: ALL,
  },
  direction: {
    dashboard: ALL, customers: ["view"], prospects: ["view"], requests: ["view"], quotes: ["view"], orders: ["view"],
    planning: ["view"], manufacturing: ["view"], kanban: ["view"], quality: ["view"],
    products: ["view"], inventory: ["view"], movements: ["view"], warehouses: ["view"], alerts: ["view"],
    suppliers: ["view"], purchase_orders: ["view"], receipts: ["view"],
    invoices: ["view"], payments: ["view"], expenses: ["view"],
    deliveries: ["view"], installations: ["view"],
    reports: ["view"], notifications: ALL, audit: ["view"], settings: ["view"],
  },
  commercial: {
    dashboard: ["view"], customers: ALL, prospects: ALL, requests: ALL, quotes: ALL, orders: ALL,
    products: ["view"], inventory: ["view"], alerts: ["view"],
    invoices: ["view"], notifications: ["view"],
    deliveries: ["view"], installations: ["view", "create"],
    reports: ["view"],
  },
  stock: {
    dashboard: ["view"],
    products: ALL, inventory: ALL, movements: ALL, warehouses: ALL, alerts: ALL,
    suppliers: ["view"], purchase_orders: ["view"], receipts: ALL,
    manufacturing: ["view"], notifications: ["view"], reports: ["view"],
    deliveries: ["view", "edit"],
  },
  production: {
    dashboard: ["view"],
    planning: ALL, manufacturing: ALL, kanban: ALL, quality: ALL,
    products: ["view"], inventory: ["view"], movements: ALL, alerts: ["view"],
    orders: ["view"], notifications: ["view"], reports: ["view"],
  },
  accountant: {
    dashboard: ["view"],
    invoices: ALL, payments: ALL, expenses: ALL,
    customers: ["view"], quotes: ["view"], orders: ["view"],
    suppliers: ["view"], purchase_orders: ["view"],
    reports: ["view"], notifications: ["view"],
  },
  installer: {
    dashboard: ["view"],
    installations: ALL, deliveries: ["view", "edit"],
    customers: ["view"], orders: ["view"], notifications: ["view"],
    inventory: ["view"], movements: ["view", "create"],
  },
};

export function can(role: Role | undefined | null, module: ModuleKey, perm: Perm = "view"): boolean {
  if (!role) return false;
  const perms = PERMISSIONS[role]?.[module];
  if (!perms) return false;
  return perms.includes(perm);
}
