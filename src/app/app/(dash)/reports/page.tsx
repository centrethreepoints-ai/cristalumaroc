import Link from "next/link";
import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { ExportButtons } from "@/components/dash/ExportButtons";
import { StatCard } from "@/components/dash/StatCard";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { BarChart3, TrendingUp, Target, Wallet } from "lucide-react";

const REPORTS = [
  { key: "sales", labelKey: "reports.sales" },
  { key: "revenue", labelKey: "reports.revenue" },
  { key: "quotes", labelKey: "reports.quotes" },
  { key: "customers", labelKey: "reports.customers" },
  { key: "products", labelKey: "reports.products" },
  { key: "inventory", labelKey: "reports.inventory" },
  { key: "production", labelKey: "reports.production" },
  { key: "purchases", labelKey: "reports.purchases" },
  { key: "invoices", labelKey: "reports.invoices" },
  { key: "payments", labelKey: "reports.payments" },
  { key: "expenses", labelKey: "reports.expenses" },
  { key: "balances", labelKey: "reports.balances" },
];

function defaultRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
  return { from, to: now.toISOString().slice(0, 10) };
}

export default async function ReportsPage({ searchParams }: { searchParams: any }) {
  await requirePerm("reports");
  const { t, money, num } = await getI18n();
  const sp = await searchParams;
  const dflt = defaultRange();
  const from = String(sp.from ?? dflt.from);
  const to = String(sp.to ?? dflt.to);
  const kind = String(sp.kind ?? "sales");

  const rowsByKind: Record<string, { rows: Row[]; cols: Col[]; title: string }> = {};

  /* --- Sales by salesperson --- */
  {
    const raw = all<any>(
      `SELECT u.id, u.full_name,
              COALESCE((SELECT COUNT(*) FROM quotes q WHERE q.salesperson_id = u.id
                        AND q.issue_date BETWEEN ? AND ?), 0) AS quotes,
              COALESCE((SELECT SUM(total_ttc) FROM quotes q WHERE q.salesperson_id = u.id
                        AND q.status = 'accepted' AND q.issue_date BETWEEN ? AND ?), 0) AS accepted,
              COALESCE((SELECT COUNT(*) FROM orders o WHERE o.salesperson_id = u.id
                        AND o.order_date BETWEEN ? AND ?), 0) AS orders,
              COALESCE((SELECT SUM(total_ht) FROM orders o WHERE o.salesperson_id = u.id
                        AND o.order_date BETWEEN ? AND ?), 0) AS revenue
       FROM users u WHERE u.role IN ('commercial','admin','direction') ORDER BY revenue DESC`,
      [from, to, from, to, from, to, from, to],
    );
    rowsByKind.sales = {
      title: t("reports.sales"),
      rows: raw.map((r) => ({
        id: r.id, name: r.full_name, quotes: r.quotes, accepted: Math.round(r.accepted ?? 0),
        orders: r.orders, revenue: Math.round(r.revenue ?? 0),
        rate: r.quotes ? Math.round((r.orders / Math.max(1, r.quotes)) * 100) : 0,
      })),
      cols: [
        { key: "name", header: t("table.salesperson") },
        { key: "quotes", header: t("reports.quotes"), type: "num", align: "end" },
        { key: "accepted", header: t("statuses.accepted"), type: "money", align: "end" },
        { key: "orders", header: t("menu.orders"), type: "num", align: "end" },
        { key: "revenue", header: t("reports.revenue"), type: "money", align: "end" },
        { key: "rate", header: t("reports.conversion"), type: "num", align: "end" },
      ],
    };
  }

  /* --- Revenue by month --- */
  {
    const raw = all<any>(
      `SELECT strftime('%Y-%m', order_date) AS m,
              COUNT(*) AS orders, COALESCE(SUM(total_ht),0) AS ht, COALESCE(SUM(total_vat),0) AS vat,
              COALESCE(SUM(total_ttc),0) AS ttc
       FROM orders WHERE order_date BETWEEN ? AND ? GROUP BY m ORDER BY m`,
      [from, to],
    );
    rowsByKind.revenue = {
      title: t("reports.revenue"),
      rows: raw.map((r, i) => ({
        id: i + 1, month: r.m, orders: r.orders, ht: Math.round(r.ht), vat: Math.round(r.vat), ttc: Math.round(r.ttc),
      })),
      cols: [
        { key: "month", header: t("table.date") },
        { key: "orders", header: t("menu.orders"), type: "num", align: "end" },
        { key: "ht", header: t("table.amountHT"), type: "money", align: "end" },
        { key: "vat", header: t("table.vat"), type: "money", align: "end" },
        { key: "ttc", header: t("table.amountTTC"), type: "money", align: "end" },
      ],
    };
  }

  /* --- Quotes --- */
  {
    const raw = all<any>(
      `SELECT status, COUNT(*) AS c, COALESCE(SUM(total_ttc),0) AS v
       FROM quotes WHERE issue_date BETWEEN ? AND ? GROUP BY status ORDER BY c DESC`,
      [from, to],
    );
    rowsByKind.quotes = {
      title: t("reports.quotes"),
      rows: raw.map((r, i) => ({ id: i + 1, status: r.status, count: r.c, value: Math.round(r.v) })),
      cols: [
        { key: "status", header: t("table.status"), type: "badge" },
        { key: "count", header: t("reports.count"), type: "num", align: "end" },
        { key: "value", header: t("table.amountTTC"), type: "money", align: "end" },
      ],
    };
  }

  /* --- Customers --- */
  {
    const raw = all<any>(
      `SELECT * FROM (
         SELECT c.id, c.code, COALESCE(c.company, c.contact_name) AS name, c.city,
                (SELECT COUNT(*) FROM quotes q WHERE q.customer_id = c.id AND q.issue_date BETWEEN ? AND ?) AS quotes,
                (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id AND o.order_date BETWEEN ? AND ?) AS orders,
                COALESCE((SELECT SUM(total_ht) FROM orders o WHERE o.customer_id = c.id
                          AND o.order_date BETWEEN ? AND ?), 0) AS revenue
         FROM customers c
       ) WHERE orders > 0 OR quotes > 0 ORDER BY revenue DESC`,
      [from, to, from, to, from, to],
    );
    rowsByKind.customers = {
      title: t("reports.customers"),
      rows: raw.map((r) => ({
        id: r.id, code: r.code, name: r.name, city: r.city ?? "—", quotes: r.quotes, orders: r.orders,
        revenue: Math.round(r.revenue ?? 0),
      })),
      cols: [
        { key: "code", header: t("table.reference"), className: "font-mono text-[11.5px]" },
        { key: "name", header: t("table.company") },
        { key: "city", header: t("table.city") },
        { key: "quotes", header: t("reports.quotes"), type: "num", align: "end" },
        { key: "orders", header: t("menu.orders"), type: "num", align: "end" },
        { key: "revenue", header: t("reports.revenue"), type: "money", align: "end" },
      ],
    };
  }

  /* --- Products --- */
  {
    const raw = all<any>(
      `SELECT p.id, p.sku, p.name, ct.name AS category,
              COALESCE(SUM(ol.quantity), 0) AS qty, COALESCE(SUM(ol.quantity * ol.unit_price), 0) AS revenue
       FROM order_lines ol
       JOIN orders o ON o.id = ol.order_id
       JOIN products p ON p.id = ol.product_id
       LEFT JOIN categories ct ON ct.id = p.category_id
       WHERE o.order_date BETWEEN ? AND ?
       GROUP BY p.id ORDER BY revenue DESC LIMIT 60`,
      [from, to],
    );
    rowsByKind.products = {
      title: t("reports.products"),
      rows: raw.map((r) => ({
        id: r.id, sku: r.sku, name: r.name, category: r.category ?? "—",
        qty: Math.round(r.qty), revenue: Math.round(r.revenue),
      })),
      cols: [
        { key: "sku", header: t("table.sku"), className: "font-mono text-[11.5px]" },
        { key: "name", header: t("table.name") },
        { key: "category", header: t("table.category") },
        { key: "qty", header: t("table.quantity"), type: "num", align: "end" },
        { key: "revenue", header: t("reports.revenue"), type: "money", align: "end" },
      ],
    };
  }

  /* --- Inventory --- */
  {
    const raw = all<any>(
      `SELECT p.id, p.sku, p.name, w.code AS warehouse, sl.quantity, sl.reserved, p.min_stock,
              sl.quantity * p.purchase_cost AS value
       FROM stock_levels sl JOIN products p ON p.id = sl.product_id JOIN warehouses w ON w.id = sl.warehouse_id
       WHERE sl.quantity != 0 ORDER BY value DESC LIMIT 80`,
    );
    rowsByKind.inventory = {
      title: t("reports.inventory"),
      rows: raw.map((r) => ({
        id: r.id, sku: r.sku, name: r.name, warehouse: r.warehouse,
        qty: Math.round(r.quantity), reserved: Math.round(r.reserved),
        available: Math.round(r.quantity - r.reserved), min: Math.round(r.min_stock),
        value: Math.round(r.value),
      })),
      cols: [
        { key: "sku", header: t("table.sku"), className: "font-mono text-[11.5px]" },
        { key: "name", header: t("table.name") },
        { key: "warehouse", header: t("table.warehouse") },
        { key: "qty", header: t("table.onHand"), type: "num", align: "end" },
        { key: "reserved", header: t("table.reserved"), type: "num", align: "end" },
        { key: "available", header: t("table.available"), type: "num", align: "end" },
        { key: "min", header: t("table.minStock"), type: "num", align: "end" },
        { key: "value", header: t("table.value"), type: "money", align: "end" },
      ],
    };
  }

  /* --- Production --- */
  {
    const raw = all<any>(
      `SELECT m.status, COUNT(*) AS c, COALESCE(SUM(m.quantity),0) AS qty,
              COALESCE(AVG(m.progress),0) AS avg_progress
       FROM manufacturing_orders m
       WHERE COALESCE(m.start_date, m.created_at) BETWEEN ? AND ?
       GROUP BY m.status ORDER BY c DESC`,
      [from, to],
    );
    rowsByKind.production = {
      title: t("reports.production"),
      rows: raw.map((r, i) => ({
        id: i + 1, status: r.status, count: r.c, qty: Math.round(r.qty), progress: Math.round(r.avg_progress),
      })),
      cols: [
        { key: "status", header: t("table.status"), type: "badge" },
        { key: "count", header: t("reports.count"), type: "num", align: "end" },
        { key: "qty", header: t("table.quantity"), type: "num", align: "end" },
        { key: "progress", header: t("table.progress"), type: "num", align: "end" },
      ],
    };
  }

  /* --- Purchases --- */
  {
    const raw = all<any>(
      `SELECT s.id, s.name, COUNT(po.id) AS pos, COALESCE(SUM(po.total_ht),0) AS ht, COALESCE(SUM(po.total_ttc),0) AS ttc
       FROM suppliers s LEFT JOIN purchase_orders po ON po.supplier_id = s.id AND po.order_date BETWEEN ? AND ?
       GROUP BY s.id HAVING pos > 0 ORDER BY ttc DESC`,
      [from, to],
    );
    rowsByKind.purchases = {
      title: t("reports.purchases"),
      rows: raw.map((r) => ({
        id: r.id, supplier: r.name, pos: r.pos, ht: Math.round(r.ht ?? 0), ttc: Math.round(r.ttc ?? 0),
      })),
      cols: [
        { key: "supplier", header: t("table.supplier") },
        { key: "pos", header: t("menu.purchaseOrders"), type: "num", align: "end" },
        { key: "ht", header: t("table.amountHT"), type: "money", align: "end" },
        { key: "ttc", header: t("table.amountTTC"), type: "money", align: "end" },
      ],
    };
  }

  /* --- Invoices --- */
  {
    const raw = all<any>(
      `SELECT i.status, COUNT(*) AS c, COALESCE(SUM(i.total_ttc),0) AS ttc,
              COALESCE(SUM(i.paid_amount),0) AS paid, COALESCE(SUM(i.total_ttc - i.paid_amount),0) AS balance
       FROM invoices i WHERE i.issue_date BETWEEN ? AND ? GROUP BY i.status ORDER BY ttc DESC`,
      [from, to],
    );
    rowsByKind.invoices = {
      title: t("reports.invoices"),
      rows: raw.map((r, i) => ({
        id: i + 1, status: r.status, count: r.c, ttc: Math.round(r.ttc),
        paid: Math.round(r.paid), balance: Math.round(r.balance),
      })),
      cols: [
        { key: "status", header: t("table.status"), type: "badge" },
        { key: "count", header: t("reports.count"), type: "num", align: "end" },
        { key: "ttc", header: t("table.amountTTC"), type: "money", align: "end" },
        { key: "paid", header: t("table.paid"), type: "money", align: "end" },
        { key: "balance", header: t("table.balance"), type: "money", align: "end" },
      ],
    };
  }

  /* --- Payments --- */
  {
    const raw = all<any>(
      `SELECT p.method, COUNT(*) AS c, COALESCE(SUM(p.amount),0) AS v
       FROM payments p WHERE p.date BETWEEN ? AND ? GROUP BY p.method ORDER BY v DESC`,
      [from, to],
    );
    rowsByKind.payments = {
      title: t("reports.payments"),
      rows: raw.map((r, i) => ({
        id: i + 1, method: t(`finance.${r.method}`), count: r.c, value: Math.round(r.v),
      })),
      cols: [
        { key: "method", header: t("table.method") },
        { key: "count", header: t("reports.count"), type: "num", align: "end" },
        { key: "value", header: t("table.amountTTC"), type: "money", align: "end" },
      ],
    };
  }

  /* --- Expenses --- */
  {
    const raw = all<any>(
      `SELECT e.category, COUNT(*) AS c, COALESCE(SUM(e.amount),0) AS ht, COALESCE(SUM(e.ttc),0) AS ttc
       FROM expenses e WHERE e.date BETWEEN ? AND ? GROUP BY e.category ORDER BY ttc DESC`,
      [from, to],
    );
    rowsByKind.expenses = {
      title: t("reports.expenses"),
      rows: raw.map((r, i) => ({
        id: i + 1, category: r.category ?? "—", count: r.c, ht: Math.round(r.ht), ttc: Math.round(r.ttc),
      })),
      cols: [
        { key: "category", header: t("table.category") },
        { key: "count", header: t("reports.count"), type: "num", align: "end" },
        { key: "ht", header: t("table.amountHT"), type: "money", align: "end" },
        { key: "ttc", header: t("table.amountTTC"), type: "money", align: "end" },
      ],
    };
  }

  /* --- Outstanding balances --- */
  {
    const raw = all<any>(
      `SELECT c.id, c.code, COALESCE(c.company, c.contact_name) AS name, c.city,
              COALESCE(SUM(i.total_ttc - i.paid_amount),0) AS balance, COUNT(i.id) AS invoices
       FROM customers c JOIN invoices i ON i.customer_id = c.id
       WHERE i.status IN ('draft','sent','partial','overdue')
       GROUP BY c.id HAVING balance > 0 ORDER BY balance DESC`,
    );
    rowsByKind.balances = {
      title: t("reports.balances"),
      rows: raw.map((r) => ({
        id: r.id, code: r.code, name: r.name, city: r.city ?? "—", invoices: r.invoices,
        balance: Math.round(r.balance),
      })),
      cols: [
        { key: "code", header: t("table.reference"), className: "font-mono text-[11.5px]" },
        { key: "name", header: t("table.company") },
        { key: "city", header: t("table.city") },
        { key: "invoices", header: t("menu.invoices"), type: "num", align: "end" },
        { key: "balance", header: t("table.balance"), type: "money", align: "end" },
      ],
    };
  }

  const active = rowsByKind[kind] ?? rowsByKind.sales;
  const totalRevenue = get<any>(
    `SELECT COALESCE(SUM(total_ht),0) v FROM orders WHERE order_date BETWEEN ? AND ?`, [from, to],
  )?.v ?? 0;
  const quoteCount = get<any>(`SELECT COUNT(*) c FROM quotes WHERE issue_date BETWEEN ? AND ?`, [from, to])?.c ?? 0;
  const accepted = get<any>(
    `SELECT COUNT(*) c FROM quotes WHERE status = 'accepted' AND issue_date BETWEEN ? AND ?`, [from, to],
  )?.c ?? 0;
  const outstanding = get<any>(
    `SELECT COALESCE(SUM(total_ttc - paid_amount),0) v FROM invoices WHERE status IN ('draft','sent','partial','overdue')`,
  )?.v ?? 0;

  const kpis = [
    { label: t("reports.revenue"), value: money(Math.round(totalRevenue)), icon: TrendingUp },
    { label: t("reports.quotes"), value: num(quoteCount), icon: BarChart3 },
    { label: t("reports.conversion"), value: `${num(quoteCount ? Math.round((accepted / quoteCount) * 100) : 0)} %`, icon: Target },
    { label: t("finance.outstanding"), value: money(Math.round(outstanding)), icon: Wallet },
  ];

  return (
    <>
      <PageHeader
        title={t("reports.title")}
        subtitle={t("reports.subtitle")}
        breadcrumb={[{ label: t("menu.reports") }]}
        tabs={REPORTS.map((r) => ({
          label: t(r.labelKey),
          href: `/app/reports?kind=${r.key}&from=${from}&to=${to}`,
          active: kind === r.key,
        }))}
        actions={
          <ExportButtons filename={`cristalu-report-${kind}`} rows={active.rows} columns={active.cols.map((c) => ({ key: c.key, label: c.header }))} />
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => <StatCard key={k.label} label={k.label} value={k.value} icon={k.icon} />)}
      </div>

      <form className="card card-pad mt-4 flex flex-wrap items-end gap-3" method="get">
        <input type="hidden" name="kind" value={kind} />
        <div>
          <label className="label">{t("reports.from")}</label>
          <input className="input" type="date" name="from" defaultValue={from} />
        </div>
        <div>
          <label className="label">{t("reports.to")}</label>
          <input className="input" type="date" name="to" defaultValue={to} />
        </div>
        <button className="btn btn-secondary">{t("reports.generate")}</button>
        <Link href="/app/reports" className="btn-ghost btn-sm">{t("actions.clearFilters")}</Link>
      </form>

      <div className="card mt-4">
        <div className="flex items-center justify-between border-b border-ink-900/8 px-4 py-3">
          <h2 className="font-display text-[15px] font-bold text-ink-900">{active.title}</h2>
          <span className="text-[12px] text-ink-400 tnum">{from} → {to}</span>
        </div>
        <DataTable rows={active.rows} columns={active.cols} perPage={20} emptyLabel={t("actions.noData")} />
      </div>
    </>
  );
}
