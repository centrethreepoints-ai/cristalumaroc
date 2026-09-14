import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { SCHEMA } from "./schema";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "cristalu.db");

const g = globalThis as unknown as { __cristaluDb?: Database.Database };

function open(): Database.Database {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  return db;
}

export const db: Database.Database = g.__cristaluDb ?? open();
if (!g.__cristaluDb) g.__cristaluDb = db;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function all<T = any>(sql: string, params: any[] = []): T[] {
  return db.prepare(sql).all(...params) as T[];
}

export function get<T = any>(sql: string, params: any[] = []): T | undefined {
  return db.prepare(sql).get(...params) as T | undefined;
}

export function run(sql: string, params: any[] = []) {
  return db.prepare(sql).run(...params);
}

export function exec(sql: string) {
  db.exec(sql);
}

export function tx<T>(fn: () => T): T {
  const wrapped = db.transaction(fn);
  return wrapped();
}

/** Atomic sequence generator -> "DEV-2026-0001" style references. */
export function nextSeq(prefix: string, year: number = new Date().getFullYear(), pad = 4): string {
  const key = `${prefix}-${year}`;
  const bump = db.transaction(() => {
    const row = get<{ value: number }>(`SELECT value FROM sequences WHERE key = ?`, [key]);
    const next = (row?.value ?? 0) + 1;
    if (row) run(`UPDATE sequences SET value = ? WHERE key = ?`, [next, key]);
    else run(`INSERT INTO sequences (key, value) VALUES (?, ?)`, [key, next]);
    return next;
  });
  const n = bump();
  return `${prefix}-${year}-${String(n).padStart(pad, "0")}`;
}

export function peekSeq(prefix: string, year: number = new Date().getFullYear()): number {
  return get<{ value: number }>(`SELECT value FROM sequences WHERE key = ?`, [`${prefix}-${year}`])?.value ?? 0;
}

/* ------------------------------------------------------------------ */
/* Audit + notifications                                               */
/* ------------------------------------------------------------------ */

export function audit(entry: {
  userId?: number | null;
  userName?: string | null;
  action: string;
  objectType?: string;
  objectId?: number | null;
  objectLabel?: string;
  oldValue?: unknown;
  newValue?: unknown;
  ip?: string;
}) {
  run(
    `INSERT INTO audit_logs (user_id, user_name, action, object_type, object_id, object_label, old_value, new_value, ip)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      entry.userId ?? null,
      entry.userName ?? "Système",
      entry.action,
      entry.objectType ?? null,
      entry.objectId ?? null,
      entry.objectLabel ?? null,
      entry.oldValue != null ? JSON.stringify(entry.oldValue) : null,
      entry.newValue != null ? JSON.stringify(entry.newValue) : null,
      entry.ip ?? null,
    ],
  );
}

export function notify(entry: {
  type: string;
  level?: "info" | "success" | "warning" | "critical";
  title: string;
  body?: string;
  link?: string;
  audience?: string;
}) {
  run(
    `INSERT INTO notifications (type, level, title, body, link, audience) VALUES (?,?,?,?,?,?)`,
    [entry.type, entry.level ?? "info", entry.title, entry.body ?? null, entry.link ?? null, entry.audience ?? "all"],
  );
}

/** Rebuild invoice/quote/order totals from their lines. */
export function recomputeQuoteTotals(quoteId: number) {
  const lines = all<{ quantity: number; unit_price: number; discount_pct: number; vat_rate: number }>(
    `SELECT quantity, unit_price, discount_pct, vat_rate FROM quote_lines WHERE quote_id = ?`,
    [quoteId],
  );
  const q = get<{ discount_pct: number }>(`SELECT discount_pct FROM quotes WHERE id = ?`, [quoteId]);
  const { ht, vat } = totalsFromLines(lines, q?.discount_pct ?? 0);
  run(`UPDATE quotes SET total_ht=?, total_vat=?, total_ttc=? WHERE id=?`, [r2(ht), r2(vat), r2(ht + vat), quoteId]);
  return { ht, vat, ttc: ht + vat };
}

export function recomputeOrderTotals(orderId: number) {
  const lines = all<{ quantity: number; unit_price: number; discount_pct: number; vat_rate: number }>(
    `SELECT quantity, unit_price, discount_pct, vat_rate FROM order_lines WHERE order_id = ?`,
    [orderId],
  );
  const { ht, vat } = totalsFromLines(lines, 0);
  run(`UPDATE orders SET total_ht=?, total_vat=?, total_ttc=? WHERE id=?`, [r2(ht), r2(vat), r2(ht + vat), orderId]);
  return { ht, vat, ttc: ht + vat };
}

export function recomputeInvoiceTotals(invoiceId: number) {
  const lines = all<{ quantity: number; unit_price: number; discount_pct: number; vat_rate: number }>(
    `SELECT quantity, unit_price, discount_pct, vat_rate FROM invoice_lines WHERE invoice_id = ?`,
    [invoiceId],
  );
  const { ht, vat } = totalsFromLines(lines, 0);
  run(`UPDATE invoices SET total_ht=?, total_vat=?, total_ttc=? WHERE id=?`, [r2(ht), r2(vat), r2(ht + vat), invoiceId]);
  return { ht, vat, ttc: ht + vat };
}

export function totalsFromLines(
  lines: { quantity: number; unit_price: number; discount_pct: number; vat_rate: number }[],
  globalDiscount = 0,
) {
  let ht = 0;
  let vat = 0;
  for (const l of lines) {
    const base = l.quantity * l.unit_price * (1 - (l.discount_pct || 0) / 100);
    ht += base * (1 - (globalDiscount || 0) / 100);
    vat += base * (1 - (globalDiscount || 0) / 100) * ((l.vat_rate || 0) / 100);
  }
  return { ht: r2(ht), vat: r2(vat) };
}

export function r2(n: number) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/* ------------------------------------------------------------------ */
/* Stock engine                                                        */
/* ------------------------------------------------------------------ */

export type MovementType = "IN" | "OUT" | "TRANSFER" | "ADJUSTMENT" | "RETURN" | "PRODUCTION_CONSUMPTION";

/**
 * Single entry point for every stock change. Keeps `stock_levels` and
 * `stock_movements` consistent and raises low-stock alerts automatically.
 */
export function stockMove(input: {
  productId: number;
  warehouseId: number;
  type: MovementType;
  quantity: number;
  unitCost?: number;
  fromWarehouseId?: number | null;
  userId?: number | null;
  ref?: string | null;
  relatedType?: string | null;
  relatedId?: number | null;
  note?: string | null;
  date?: string;
}) {
  const qty = Math.abs(Number(input.quantity) || 0);
  if (qty === 0) return;

  const applyDelta = (warehouseId: number, delta: number) => {
    const cur = get<{ quantity: number }>(
      `SELECT quantity FROM stock_levels WHERE product_id = ? AND warehouse_id = ?`,
      [input.productId, warehouseId],
    );
    if (cur) {
      run(`UPDATE stock_levels SET quantity = ?, updated_at = datetime('now') WHERE product_id = ? AND warehouse_id = ?`, [
        cur.quantity + delta, input.productId, warehouseId,
      ]);
    } else {
      run(`INSERT INTO stock_levels (product_id, warehouse_id, quantity) VALUES (?,?,?)`, [
        input.productId, warehouseId, delta,
      ]);
    }
  };

  switch (input.type) {
    case "IN":
    case "RETURN":
      applyDelta(input.warehouseId, qty);
      break;
    case "OUT":
    case "PRODUCTION_CONSUMPTION":
      applyDelta(input.warehouseId, -qty);
      break;
    case "TRANSFER":
      applyDelta(input.fromWarehouseId ?? input.warehouseId, -qty);
      applyDelta(input.warehouseId, qty);
      break;
    case "ADJUSTMENT":
      // quantity is the signed delta
      applyDelta(input.warehouseId, Number(input.quantity) || 0);
      break;
  }

  run(
    `INSERT INTO stock_movements
      (ref, product_id, warehouse_id, from_warehouse_id, type, quantity, unit_cost, user_id, related_type, related_id, note, date)
     VALUES (?,?,?,?,?,?,?,?,?,?,?, COALESCE(?, datetime('now')))`,
    [
      input.ref ?? null, input.productId, input.warehouseId, input.fromWarehouseId ?? null,
      input.type, input.type === "ADJUSTMENT" ? Number(input.quantity) : qty,
      input.unitCost ?? 0, input.userId ?? null, input.relatedType ?? null, input.relatedId ?? null,
      input.note ?? null, input.date ?? null,
    ],
  );

  checkLowStock(input.productId);
}

export function checkLowStock(productId: number) {
  const p = get<{ sku: string; name: string; min_stock: number }>(
    `SELECT sku, name, min_stock FROM products WHERE id = ?`,
    [productId],
  );
  if (!p) return;
  const { qty } = get<{ qty: number }>(
    `SELECT COALESCE(SUM(quantity),0) AS qty FROM stock_levels WHERE product_id = ?`,
    [productId],
  ) ?? { qty: 0 };
  if (p.min_stock > 0 && qty <= p.min_stock) {
    const existing = get<{ id: number }>(
      `SELECT id FROM notifications WHERE type='low_stock' AND link LIKE ? AND read=0`,
      [`%/stock?product=${productId}%`],
    );
    if (!existing) {
      notify({
        type: "low_stock",
        level: "critical",
        title: `Stock critique — ${p.sku}`,
        body: `${p.name} : ${qty} disponible(s), seuil minimum ${p.min_stock}.`,
        link: `/app/stock/inventory?product=${productId}`,
        audience: "stock",
      });
    }
  }
}

export function stockSummary(productId: number) {
  return get(
    `SELECT COALESCE(SUM(quantity),0) AS quantity,
            COALESCE(SUM(reserved),0) AS reserved,
            COALESCE(SUM(quantity - reserved),0) AS available
     FROM stock_levels WHERE product_id = ?`,
    [productId],
  ) as { quantity: number; reserved: number; available: number };
}

export function getSetting(key: string, fallback = "") {
  return get<{ value: string }>(`SELECT value FROM settings WHERE key = ?`, [key])?.value ?? fallback;
}

export function setSetting(key: string, value: string) {
  run(`INSERT INTO settings (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [key, value]);
}
