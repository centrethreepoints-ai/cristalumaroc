import { all, get } from "./db";

const one = <T = any>(sql: string, params: any[] = []): T => get<T>(sql, params) as T;

export type Kpis = {
  monthlyRevenue: number;
  monthlyRevenuePrev: number;
  annualRevenue: number;
  annualRevenuePrev: number;
  pendingQuotes: number;
  pendingQuotesAmount: number;
  acceptedQuotes: number;
  acceptedQuotesAmount: number;
  activeOrders: number;
  ordersInProduction: number;
  unpaidInvoices: number;
  unpaidAmount: number;
  inventoryValue: number;
  lowStock: number;
  conversionRate: number;
  rejectedQuotes: number;
  quoteRequests: number;
};

export function getKpis(): Kpis {
  const monthly = one<any>(
    `SELECT COALESCE(SUM(total_ht),0) AS v FROM invoices
     WHERE issue_date >= date('now','start of month') AND status != 'cancelled'`,
  )?.v ?? 0;
  const monthlyPrev = one<any>(
    `SELECT COALESCE(SUM(total_ht),0) AS v FROM invoices
     WHERE issue_date >= date('now','start of month','-1 month') AND issue_date < date('now','start of month')
       AND status != 'cancelled'`,
  )?.v ?? 0;

  const annual = one<any>(
    `SELECT COALESCE(SUM(total_ht),0) AS v FROM invoices
     WHERE issue_date >= date('now','start of year') AND status != 'cancelled'`,
  )?.v ?? 0;
  const annualPrev = one<any>(
    `SELECT COALESCE(SUM(total_ht),0) AS v FROM invoices
     WHERE issue_date >= date('now','start of year','-1 year') AND issue_date < date('now','start of year')
       AND status != 'cancelled'`,
  )?.v ?? 0;

  const pendingQuotes = one<any>(`SELECT COUNT(*) c, COALESCE(SUM(total_ht),0) v FROM quotes WHERE status IN ('draft','sent','negotiation')`);
  const acceptedQuotes = one<any>(`SELECT COUNT(*) c, COALESCE(SUM(total_ht),0) v FROM quotes WHERE status = 'accepted'`);
  const activeOrders = one<any>(
    `SELECT COUNT(*) c FROM orders WHERE status IN ('new','confirmed','to_produce','in_production','quality_control','ready')`,
  )?.c ?? 0;
  const ordersInProduction = one<any>(`SELECT COUNT(*) c FROM orders WHERE status IN ('to_produce','in_production','quality_control')`)?.c ?? 0;
  const unpaid = one<any>(
    `SELECT COUNT(*) c, COALESCE(SUM(total_ttc - paid_amount),0) v FROM invoices
     WHERE status IN ('sent','partial','overdue') AND (total_ttc - paid_amount) > 0.01`,
  );
  const inventoryValue = one<any>(
    `SELECT COALESCE(SUM(s.quantity * p.purchase_cost),0) v FROM stock_levels s JOIN products p ON p.id = s.product_id`,
  )?.v ?? 0;
  const lowStock = one<any>(
    `SELECT COUNT(*) c FROM (
       SELECT p.id FROM products p LEFT JOIN stock_levels s ON s.product_id = p.id
       WHERE p.min_stock > 0 AND p.status != 'archived'
       GROUP BY p.id HAVING COALESCE(SUM(s.quantity),0) <= p.min_stock
     )`,
  )?.c ?? 0;

  const rejected = one<any>(`SELECT COUNT(*) c FROM quotes WHERE status = 'rejected'`)?.c ?? 0;
  const quotesTotal = acceptedQuotes.c + rejected;
  const conversionRate = quotesTotal ? (acceptedQuotes.c / quotesTotal) * 100 : 0;
  const quoteRequests = one<any>(`SELECT COUNT(*) c FROM quote_requests WHERE status = 'new'`)?.c ?? 0;

  return {
    monthlyRevenue: monthly,
    monthlyRevenuePrev: monthlyPrev,
    annualRevenue: annual,
    annualRevenuePrev: annualPrev,
    pendingQuotes: pendingQuotes?.c ?? 0,
    pendingQuotesAmount: pendingQuotes?.v ?? 0,
    acceptedQuotes: acceptedQuotes?.c ?? 0,
    acceptedQuotesAmount: acceptedQuotes?.v ?? 0,
    rejectedQuotes: rejected,
    activeOrders,
    ordersInProduction,
    unpaidInvoices: unpaid?.c ?? 0,
    unpaidAmount: unpaid?.v ?? 0,
    inventoryValue,
    lowStock,
    conversionRate,
    quoteRequests,
  };
}

const MONTH_KEYS = (() => {
  const out: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
})();

/** Last 12 months of revenue (HT), zero-filled. */
export function getRevenueSeries() {
  const rows = all<{ m: string; v: number }>(
    `SELECT substr(issue_date,1,7) AS m, SUM(total_ht) AS v FROM invoices
     WHERE status != 'cancelled' AND issue_date >= date('now','start of month','-11 month')
     GROUP BY m`,
  );
  const map = new Map(rows.map((r) => [r.m, r.v]));
  return MONTH_KEYS.map((k) => ({ key: k, value: Math.round(map.get(k) ?? 0) }));
}

/** Quotes issued vs accepted per month. */
export function getQuoteSeries() {
  const issued = all<{ m: string; c: number }>(
    `SELECT substr(issue_date,1,7) AS m, COUNT(*) c FROM quotes WHERE issue_date >= date('now','start of month','-11 month') GROUP BY m`,
  );
  const accepted = all<{ m: string; c: number }>(
    `SELECT substr(issue_date,1,7) AS m, COUNT(*) c FROM quotes
     WHERE status = 'accepted' AND issue_date >= date('now','start of month','-11 month') GROUP BY m`,
  );
  const mi = new Map(issued.map((r) => [r.m, r.c]));
  const ma = new Map(accepted.map((r) => [r.m, r.c]));
  return MONTH_KEYS.map((k) => ({ key: k, issued: mi.get(k) ?? 0, accepted: ma.get(k) ?? 0 }));
}

export function getOrdersByStatus() {
  return all<{ status: string; c: number }>(`SELECT status, COUNT(*) c FROM orders GROUP BY status ORDER BY c DESC`);
}

export function getProductionByStation() {
  return all<{ status: string; c: number }>(
    `SELECT status, COUNT(*) c FROM manufacturing_orders GROUP BY status`,
  );
}

export function getInventoryByWarehouse() {
  return all<{ name: string; name_ar: string; name_en: string; value: number }>(
    `SELECT w.name, w.name_ar, w.name_en, COALESCE(SUM(s.quantity * p.purchase_cost),0) AS value
     FROM warehouses w
     LEFT JOIN stock_levels s ON s.warehouse_id = w.id
     LEFT JOIN products p ON p.id = s.product_id
     GROUP BY w.id ORDER BY value DESC`,
  );
}

/** Collected vs outstanding per month. */
export function getPaymentSeries() {
  const paid = all<{ m: string; v: number }>(
    `SELECT substr(date,1,7) AS m, SUM(amount) v FROM payments WHERE date >= date('now','start of month','-11 month') GROUP BY m`,
  );
  const billed = all<{ m: string; v: number }>(
    `SELECT substr(issue_date,1,7) AS m, SUM(total_ttc) v FROM invoices
     WHERE status != 'cancelled' AND issue_date >= date('now','start of month','-11 month') GROUP BY m`,
  );
  const mp = new Map(paid.map((r) => [r.m, r.v]));
  const mb = new Map(billed.map((r) => [r.m, r.v]));
  return MONTH_KEYS.map((k) => ({
    key: k,
    paid: Math.round(mp.get(k) ?? 0),
    outstanding: Math.max(0, Math.round((mb.get(k) ?? 0) - (mp.get(k) ?? 0))),
  }));
}

export function getTopCustomers(limit = 6) {
  return all(
    `SELECT c.id, COALESCE(c.company, c.contact_name) AS name,
            COUNT(DISTINCT o.id) AS orders, COALESCE(SUM(i.total_ht),0) AS revenue
     FROM customers c
     LEFT JOIN orders o ON o.customer_id = c.id
     LEFT JOIN invoices i ON i.customer_id = c.id AND i.status != 'cancelled'
     WHERE c.status = 'customer'
     GROUP BY c.id HAVING revenue > 0 ORDER BY revenue DESC LIMIT ?`,
    [limit],
  );
}

export function getTopProducts(limit = 6) {
  return all(
    `SELECT p.id, p.sku, p.name, SUM(ol.quantity) AS qty, SUM(ol.quantity * ol.unit_price) AS revenue
     FROM order_lines ol JOIN products p ON p.id = ol.product_id
     GROUP BY p.id ORDER BY revenue DESC LIMIT ?`,
    [limit],
  );
}

export function getRecentQuotes(limit = 6) {
  return all(
    `SELECT q.id, q.number, q.status, q.total_ttc, q.issue_date, COALESCE(c.company, c.contact_name) AS customer
     FROM quotes q LEFT JOIN customers c ON c.id = q.customer_id ORDER BY q.id DESC LIMIT ?`,
    [limit],
  );
}

export function getRecentOrders(limit = 6) {
  return all(
    `SELECT o.id, o.number, o.status, o.total_ttc, o.order_date, COALESCE(c.company, c.contact_name) AS customer
     FROM orders o LEFT JOIN customers c ON c.id = o.customer_id ORDER BY o.id DESC LIMIT ?`,
    [limit],
  );
}

export function getNewRequests(limit = 6) {
  return all(
    `SELECT id, ref, customer_name, company, product, city, phone, email, status, created_at
     FROM quote_requests WHERE status = 'new' ORDER BY created_at DESC LIMIT ?`,
    [limit],
  );
}

export function getLowStockProducts(limit = 8) {
  return all(
    `SELECT p.id, p.sku, p.name, p.min_stock, COALESCE(SUM(s.quantity),0) AS qty
     FROM products p LEFT JOIN stock_levels s ON s.product_id = p.id
     WHERE p.min_stock > 0 AND p.status != 'archived'
     GROUP BY p.id HAVING qty <= p.min_stock ORDER BY (qty - p.min_stock) ASC LIMIT ?`,
    [limit],
  );
}

export function getOverdueInvoices(limit = 6) {
  return all(
    `SELECT i.id, i.number, i.due_date, i.total_ttc - i.paid_amount AS due,
            COALESCE(c.company, c.contact_name) AS customer
     FROM invoices i LEFT JOIN customers c ON c.id = i.customer_id
     WHERE i.status IN ('sent','partial','overdue') AND (i.total_ttc - i.paid_amount) > 0.01
     ORDER BY i.due_date ASC LIMIT ?`,
    [limit],
  );
}

export function getProductionDeadlines(limit = 6) {
  return all(
    `SELECT m.id, m.number, m.description, m.end_date, m.status, m.priority,
            COALESCE(c.company, c.contact_name) AS customer
     FROM manufacturing_orders m LEFT JOIN customers c ON c.id = m.customer_id
     WHERE m.status NOT IN ('completed') ORDER BY m.end_date ASC LIMIT ?`,
    [limit],
  );
}

export function getRecentActivity(limit = 8) {
  return all(
    `SELECT id, user_name, action, object_type, object_label, created_at FROM audit_logs ORDER BY id DESC LIMIT ?`,
    [limit],
  );
}

export function getUsers() {
  return all(`SELECT id, email, full_name, role, job_title, phone, color, active, last_login, created_at FROM users ORDER BY id`);
}

export function getStockAlertCount() {
  return get<{ c: number }>(
    `SELECT COUNT(*) c FROM (
       SELECT p.id FROM products p LEFT JOIN stock_levels s ON s.product_id = p.id
       WHERE p.min_stock > 0 AND p.status != 'archived'
       GROUP BY p.id HAVING COALESCE(SUM(s.quantity),0) <= p.min_stock)`,
  )?.c ?? 0;
}
