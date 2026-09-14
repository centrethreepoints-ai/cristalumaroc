"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  all, audit, checkLowStock, get, nextSeq, notify, recomputeInvoiceTotals, recomputeOrderTotals,
  recomputeQuoteTotals, run, r2, setSetting, stockMove, tx, type MovementType,
} from "@/lib/db";
import { computeNeed } from "@/lib/db/seed";
import { hashPassword, requirePerm, requireUser } from "@/lib/auth";
import type { ModuleKey } from "@/lib/permissions";
import { seedDatabase } from "@/lib/db/seed";

export type ActionResult = { ok: boolean; error?: string; id?: number; ref?: string };

function today() {
  return new Date().toISOString().slice(0, 10);
}
function addDays(d: string, n: number) {
  return new Date(new Date(d).getTime() + n * 86400000).toISOString().slice(0, 10);
}

async function guard(module: ModuleKey, perm: "view" | "create" | "edit" | "delete" = "edit") {
  const user = await requirePerm(module, perm);
  return user;
}

function revalidate(...paths: string[]) {
  for (const p of paths) revalidatePath(p);
}

/* ============================= CUSTOMERS ============================= */

export async function saveCustomer(fd: FormData): Promise<ActionResult> {
  const user = await guard("customers", fd.get("id") ? "edit" : "create");
  const id = fd.get("id") ? Number(fd.get("id")) : null;
  const str = (k: string) => String(fd.get(k) ?? "").trim() || null;
  const status = str("status") ?? "customer";

  const values = [
    status, str("type") ?? "entreprise", str("company"), str("contact_name"), str("email"),
    str("phone"), str("phone2"), str("ice"), str("if_code"), str("rc"), str("cnss"), str("patente"),
    str("address"), str("city"), str("zip"), str("website"), str("activity"), str("source"),
    Number(fd.get("owner_id")) || null, str("tags"), str("notes"),
    Number(fd.get("credit_limit")) || 0, str("payment_terms") ?? "30 jours",
  ];

  let customerId = id;
  if (id) {
    const before = get(`SELECT * FROM customers WHERE id = ?`, [id]);
    run(
      `UPDATE customers SET status=?, type=?, company=?, contact_name=?, email=?, phone=?, phone2=?, ice=?, if_code=?,
        rc=?, cnss=?, patente=?, address=?, city=?, zip=?, website=?, activity=?, source=?, owner_id=?, tags=?, notes=?,
        credit_limit=?, payment_terms=?, updated_at=datetime('now') WHERE id=?`,
      [...values, id],
    );
    audit({ userId: user.id, userName: user.fullName, action: "UPDATE", objectType: "customer", objectId: id, objectLabel: str("company") ?? str("contact_name") ?? "", oldValue: before, newValue: values });
  } else {
    const code = nextSeq("CLI");
    const r = run(
      `INSERT INTO customers (code, status, type, company, contact_name, email, phone, phone2, ice, if_code, rc, cnss,
        patente, address, city, zip, website, activity, source, owner_id, tags, notes, credit_limit, payment_terms)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [code, ...values],
    );
    customerId = Number(r.lastInsertRowid);
    audit({ userId: user.id, userName: user.fullName, action: "CREATE", objectType: "customer", objectId: customerId, objectLabel: `${code} — ${str("company") ?? str("contact_name")}`, newValue: values });
    notify({ type: "new_order", level: "info", title: "Nouveau client", body: str("company") ?? str("contact_name") ?? "", link: `/app/commercial/customers/${customerId}`, audience: "commercial" });
  }
  revalidate("/app/commercial/customers", "/app/commercial/prospects", "/app/commercial/customers/" + customerId);
  return { ok: true, id: customerId! };
}

export async function deleteCustomer(id: number): Promise<ActionResult> {
  const user = await guard("customers", "delete");
  const row = get<any>(`SELECT company, contact_name FROM customers WHERE id = ?`, [id]);
  run(`DELETE FROM customers WHERE id = ?`, [id]);
  audit({ userId: user.id, userName: user.fullName, action: "DELETE", objectType: "customer", objectId: id, objectLabel: row?.company ?? row?.contact_name, oldValue: row });
  revalidate("/app/commercial/customers", "/app/commercial/prospects");
  return { ok: true };
}

/* =============================== QUOTES ============================== */

export type QuoteLine = {
  product_id?: number | null;
  description: string;
  width: number;
  height: number;
  quantity: number;
  unit_price: number;
  discount_pct: number;
  vat_rate: number;
};

export async function saveQuote(fd: FormData): Promise<ActionResult> {
  const user = await guard("quotes", fd.get("id") ? "edit" : "create");
  const id = fd.get("id") ? Number(fd.get("id")) : null;
  const customerId = Number(fd.get("customer_id"));
  const linesRaw = String(fd.get("lines") ?? "[]");
  const lines: QuoteLine[] = JSON.parse(linesRaw);
  const discountPct = Number(fd.get("discount_pct")) || 0;

  if (!customerId) return { ok: false, error: "customer_required" };
  if (!lines.length) return { ok: false, error: "lines_required" };

  const values = [
    customerId, String(fd.get("project") ?? "") || null, Number(fd.get("salesperson_id")) || user.id,
    String(fd.get("issue_date")) || today(), String(fd.get("validity_date")) || addDays(today(), 30),
    discountPct, String(fd.get("payment_terms") ?? "30% à la commande"), String(fd.get("notes") ?? "") || null,
  ];

  let quoteId = id;
  if (id) {
    const before = get(`SELECT * FROM quotes WHERE id = ?`, [id]);
    run(`UPDATE quotes SET customer_id=?, project=?, salesperson_id=?, issue_date=?, validity_date=?, discount_pct=?,
         payment_terms=?, notes=?, updated_at=datetime('now') WHERE id=?`, [...values, id]);
    run(`DELETE FROM quote_lines WHERE quote_id = ?`, [id]);
    audit({ userId: user.id, userName: user.fullName, action: "UPDATE", objectType: "quote", objectId: id, objectLabel: (before as any)?.number, oldValue: before, newValue: values });
  } else {
    const number = nextSeq("DEV");
    const r = run(
      `INSERT INTO quotes (number, customer_id, project, salesperson_id, issue_date, validity_date, discount_pct,
        status, payment_terms, notes, source, request_id)
       VALUES (?,?,?,?,?,?,?,'draft',?,?, 'manual', ?)`,
      [number, ...values.slice(0, 6), ...values.slice(6), Number(fd.get("request_id")) || null],
    );
    quoteId = Number(r.lastInsertRowid);
    audit({ userId: user.id, userName: user.fullName, action: "CREATE", objectType: "quote", objectId: quoteId, objectLabel: number });
  }

  lines.forEach((l, i) => {
    run(
      `INSERT INTO quote_lines (quote_id, product_id, description, width, height, quantity, unit_price, discount_pct, vat_rate, position)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [quoteId, l.product_id || null, l.description, l.width || 0, l.height || 0, l.quantity || 1,
       l.unit_price || 0, l.discount_pct || 0, l.vat_rate ?? 20, i + 1],
    );
  });
  recomputeQuoteTotals(quoteId!);

  revalidate("/app/commercial/quotes", "/app/commercial/quotes/" + quoteId, "/app/dashboard");
  return { ok: true, id: quoteId! };
}

export async function setQuoteStatus(id: number, status: string): Promise<ActionResult> {
  const user = await guard("quotes");
  const before = get<any>(`SELECT number, status FROM quotes WHERE id = ?`, [id]);
  run(`UPDATE quotes SET status = ?, updated_at = datetime('now') WHERE id = ?`, [status, id]);
  audit({ userId: user.id, userName: user.fullName, action: "STATUS", objectType: "quote", objectId: id, objectLabel: before?.number, oldValue: before?.status, newValue: status });

  // Accepting a quote automatically creates the order.
  // NB: get() returns a row object, so test the column — the row itself is
  // always truthy even when order_id is NULL.
  if (status === "accepted" && !get<any>(`SELECT order_id FROM quotes WHERE id = ?`, [id])?.order_id) {
    const orderId = createOrderFromQuote(id, user.id, user.fullName);
    revalidate("/app/commercial/orders", "/app/commercial/orders/" + orderId);
  }
  revalidate("/app/commercial/quotes", "/app/commercial/quotes/" + id, "/app/dashboard");
  return { ok: true };
}

/** Quote → Order. Shared by "accept" and the explicit "convert" action. */
function createOrderFromQuote(quoteId: number, userId: number, userName: string): number {
  const q = get<any>(`SELECT * FROM quotes WHERE id = ?`, [quoteId]);
  if (!q) throw new Error("quote not found");

  return tx(() => {
    const orderDate = today();
    const number = nextSeq("CMD");
    const r = run(
      `INSERT INTO orders (number, customer_id, quote_id, order_date, expected_date, status, salesperson_id,
        priority, notes)
       VALUES (?,?,?,?,?, 'new', ?, 'normal', ?)`,
      [number, q.customer_id, quoteId, orderDate, addDays(orderDate, 45), q.salesperson_id,
       `Commande issue du devis ${q.number}.`],
    );
    const orderId = Number(r.lastInsertRowid);

    const lines = all<any>(`SELECT * FROM quote_lines WHERE quote_id = ? ORDER BY position`, [quoteId]) ?? [];
    for (const l of lines) {
      run(`INSERT INTO order_lines (order_id, product_id, description, width, height, quantity, unit_price, discount_pct, vat_rate, position)
           VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [orderId, l.product_id, l.description, l.width, l.height, l.quantity, l.unit_price, l.discount_pct, l.vat_rate, l.position]);
    }
    recomputeOrderTotals(orderId);
    run(`UPDATE quotes SET order_id = ?, status = 'accepted', updated_at = datetime('now') WHERE id = ?`, [orderId, quoteId]);

    const cust = get<any>(`SELECT company, contact_name FROM customers WHERE id = ?`, [q.customer_id]);
    audit({ userId, userName, action: "CONVERT", objectType: "order", objectId: orderId, objectLabel: `${q.number} → ${number}`, oldValue: "quote", newValue: "order" });
    notify({ type: "new_order", level: "success", title: `Nouvelle commande — ${number}`, body: cust?.company ?? cust?.contact_name ?? "", link: `/app/commercial/orders/${orderId}`, audience: "all" });
    // A first order turns a prospect into a customer.
    run(`UPDATE customers SET status = 'customer' WHERE id = ? AND status = 'prospect'`, [q.customer_id]);
    return orderId;
  });
}

export async function convertQuoteToOrder(id: number): Promise<ActionResult> {
  const user = await guard("quotes");
  const existing = get<any>(`SELECT order_id FROM quotes WHERE id = ?`, [id]);
  if (existing?.order_id) return { ok: false, error: "already_converted", id: existing.order_id };
  const orderId = createOrderFromQuote(id, user.id, user.fullName);
  revalidate("/app/commercial/orders", "/app/commercial/quotes", "/app/commercial/quotes/" + id, "/app/dashboard");
  return { ok: true, id: orderId };
}

export async function duplicateQuote(id: number): Promise<ActionResult> {
  const user = await guard("quotes", "create");
  const q = get<any>(`SELECT * FROM quotes WHERE id = ?`, [id]);
  if (!q) return { ok: false, error: "not_found" };
  const number = nextSeq("DEV");
  const r = run(
    `INSERT INTO quotes (number, customer_id, project, salesperson_id, issue_date, validity_date, discount_pct,
      status, payment_terms, notes, source)
     VALUES (?,?,?,?,?,?,?, 'draft', ?,?, 'manual')`,
    [number, q.customer_id, q.project, q.salesperson_id, today(), addDays(today(), 30),
     q.discount_pct, q.payment_terms, q.notes],
  );
  const newId = Number(r.lastInsertRowid);
  const lines = all<any>(`SELECT * FROM quote_lines WHERE quote_id = ? ORDER BY position`, [id]) ?? [];
  for (const l of lines) {
    run(`INSERT INTO quote_lines (quote_id, product_id, description, width, height, quantity, unit_price, discount_pct, vat_rate, position)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [newId, l.product_id, l.description, l.width, l.height, l.quantity, l.unit_price, l.discount_pct, l.vat_rate, l.position]);
  }
  recomputeQuoteTotals(newId);
  audit({ userId: user.id, userName: user.fullName, action: "DUPLICATE", objectType: "quote", objectId: newId, objectLabel: `${q.number} → ${number}` });
  revalidate("/app/commercial/quotes");
  return { ok: true, id: newId, ref: number };
}

export async function deleteQuote(id: number): Promise<ActionResult> {
  const user = await guard("quotes", "delete");
  const before = get<any>(`SELECT number FROM quotes WHERE id = ?`, [id]);
  run(`DELETE FROM quotes WHERE id = ?`, [id]);
  audit({ userId: user.id, userName: user.fullName, action: "DELETE", objectType: "quote", objectId: id, objectLabel: before?.number, oldValue: before });
  revalidate("/app/commercial/quotes");
  return { ok: true };
}

/* =============================== ORDERS ============================== */

export async function setOrderStatus(id: number, status: string): Promise<ActionResult> {
  const user = await guard("orders");
  const before = get<any>(`SELECT number, status FROM orders WHERE id = ?`, [id]);
  run(`UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?`, [status, id]);
  audit({ userId: user.id, userName: user.fullName, action: "STATUS", objectType: "order", objectId: id, objectLabel: before?.number, oldValue: before?.status, newValue: status });

  if (status === "ready") {
    notify({ type: "order_ready", level: "success", title: `Commande prête — ${before?.number}`, body: "Prête pour expédition.", link: `/app/logistics/deliveries?order=${id}`, audience: "all" });
  }
  revalidate("/app/commercial/orders", "/app/commercial/orders/" + id, "/app/dashboard");
  return { ok: true };
}

/** Creates one manufacturing order per order line that does not have one yet. */
export async function createMosForOrder(orderId: number): Promise<ActionResult> {
  const user = await guard("manufacturing", "create");
  const order = get<any>(`SELECT * FROM orders WHERE id = ?`, [orderId]);
  if (!order) return { ok: false, error: "not_found" };

  const lines = all<any>(
    `SELECT ol.* FROM order_lines ol
     WHERE ol.order_id = ? AND NOT EXISTS (SELECT 1 FROM manufacturing_orders m WHERE m.order_line_id = ol.id)`,
    [orderId],
  ) ?? [];
  if (!lines.length) return { ok: false, error: "no_lines" };

  const start = today();
  const end = addDays(start, 30);
  const created: string[] = [];

  tx(() => {
    for (const l of lines) {
      const number = nextSeq("OF");
      run(
        `INSERT INTO manufacturing_orders (number, order_id, order_line_id, customer_id, product_id, description,
          width, height, quantity, priority, assignee_id, start_date, end_date, status, progress)
         VALUES (?,?,?,?,?,?,?, ?,?, 'normal', ?,?,?, 'to_prepare', 0)`,
        [number, orderId, l.id, order.customer_id, l.product_id, l.description, l.width, l.height,
         l.quantity, user.id, start, end],
      );
      const moId = get<any>(`SELECT id FROM manufacturing_orders WHERE number = ?`, [number])?.id;
      // Expand the BOM into required materials.
      const bom = get<any>(`SELECT id FROM boms WHERE product_id = ? AND active = 1`, [l.product_id]);
      if (bom && moId) {
        const items = all<any>(`SELECT component_id, basis, qty_per, wastage FROM bom_items WHERE bom_id = ?`, [bom.id]) ?? [];
        for (const it of items) {
          const need = computeNeed(it, l.width, l.height, l.quantity);
          run(`INSERT INTO mo_materials (mo_id, product_id, required_qty) VALUES (?,?,?)`, [moId, it.component_id, r2(need)]);
        }
      }
      created.push(number);
    }
    run(`UPDATE orders SET status = 'to_produce', updated_at = datetime('now') WHERE id = ? AND status IN ('new','confirmed')`, [orderId]);
  });

  audit({ userId: user.id, userName: user.fullName, action: "CREATE", objectType: "mo", objectId: orderId, objectLabel: `${order.number} → ${created.join(", ")}` });
  revalidate("/app/production/manufacturing", "/app/production/kanban", "/app/production/planning", "/app/commercial/orders/" + orderId, "/app/dashboard");
  return { ok: true, ref: created.join(", ") };
}

export async function saveMo(fd: FormData): Promise<ActionResult> {
  const user = await guard("manufacturing", fd.get("id") ? "edit" : "create");
  const id = fd.get("id") ? Number(fd.get("id")) : null;
  const values = [
    Number(fd.get("order_id")) || null, Number(fd.get("customer_id")) || null,
    Number(fd.get("product_id")) || null, String(fd.get("description") ?? "") || null,
    Number(fd.get("width")) || 0, Number(fd.get("height")) || 0, Number(fd.get("quantity")) || 1,
    String(fd.get("priority") ?? "normal"), Number(fd.get("assignee_id")) || null,
    String(fd.get("workstation") ?? "") || null, String(fd.get("start_date")) || null,
    String(fd.get("end_date")) || null, String(fd.get("notes") ?? "") || null,
  ];

  let moId = id;
  if (id) {
    run(`UPDATE manufacturing_orders SET order_id=?, customer_id=?, product_id=?, description=?, width=?, height=?,
         quantity=?, priority=?, assignee_id=?, workstation=?, start_date=?, end_date=?, notes=?,
         updated_at=datetime('now') WHERE id=?`, [...values, id]);
    audit({ userId: user.id, userName: user.fullName, action: "UPDATE", objectType: "mo", objectId: id });
  } else {
    const number = nextSeq("OF");
    const r = run(
      `INSERT INTO manufacturing_orders (number, order_id, customer_id, product_id, description, width, height,
        quantity, priority, assignee_id, workstation, start_date, end_date, notes, status, progress)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,'to_prepare',0)`,
      [number, ...values],
    );
    moId = Number(r.lastInsertRowid);
    // expand BOM
    const productId = values[2];
    const bom = productId ? get<any>(`SELECT id FROM boms WHERE product_id = ? AND active = 1`, [productId]) : null;
    if (bom) {
      const items = all<any>(`SELECT component_id, basis, qty_per, wastage FROM bom_items WHERE bom_id = ?`, [bom.id]) ?? [];
      for (const it of items) {
        const need = computeNeed(it, values[4] as number, values[5] as number, values[6] as number);
        run(`INSERT INTO mo_materials (mo_id, product_id, required_qty) VALUES (?,?,?)`, [moId, it.component_id, r2(need)]);
      }
    }
    audit({ userId: user.id, userName: user.fullName, action: "CREATE", objectType: "mo", objectId: moId, objectLabel: number });
  }
  revalidate("/app/production/manufacturing", "/app/production/kanban", "/app/production/planning");
  return { ok: true, id: moId! };
}

const MO_COLUMNS = ["to_prepare", "cutting", "machining", "assembly", "glazing", "quality_control", "completed"];

export async function moveMo(id: number, status: string): Promise<ActionResult> {
  const user = await guard("kanban");
  if (!MO_COLUMNS.includes(status)) return { ok: false, error: "invalid_status" };
  const before = get<any>(`SELECT number, status FROM manufacturing_orders WHERE id = ?`, [id]);
  const idx = MO_COLUMNS.indexOf(status);
  const progress = Math.round(((idx + (status === "completed" ? 1 : 0.5)) / MO_COLUMNS.length) * 100);

  run(`UPDATE manufacturing_orders SET status = ?, progress = ?, updated_at = datetime('now') WHERE id = ?`,
    [status, progress, id]);
  if (status === "completed") {
    run(`UPDATE manufacturing_orders SET produced_qty = quantity WHERE id = ?`, [id]);
  }
  audit({ userId: user.id, userName: user.fullName, action: "KANBAN", objectType: "mo", objectId: id, objectLabel: before?.number, oldValue: before?.status, newValue: status });

  if (status === "completed") {
    notify({ type: "production_completed", level: "success", title: `Production terminée — ${before?.number}`, link: `/app/production/manufacturing/${id}`, audience: "production" });
  }
  revalidate("/app/production/kanban", "/app/production/manufacturing", "/app/production/manufacturing/" + id, "/app/dashboard");
  return { ok: true };
}

/** Reserves the BOM components of a manufacturing order in the stock ledger. */
export async function reserveMoMaterials(id: number): Promise<ActionResult> {
  const user = await guard("manufacturing");
  const mats = all<any>(`SELECT * FROM mo_materials WHERE mo_id = ?`, [id]) ?? [];
  tx(() => {
    for (const m of mats) {
      const wh = warehouseForProduct(m.product_id);
      run(`UPDATE mo_materials SET reserved_qty = required_qty WHERE id = ?`, [m.id]);
      run(`UPDATE stock_levels SET reserved = reserved + ? WHERE product_id = ? AND warehouse_id = ?`,
        [m.required_qty - m.reserved_qty, m.product_id, wh]);
    }
    run(`UPDATE manufacturing_orders SET materials_reserved = 1, updated_at = datetime('now') WHERE id = ?`, [id]);
  });
  const mo = get<any>(`SELECT number FROM manufacturing_orders WHERE id = ?`, [id]);
  audit({ userId: user.id, userName: user.fullName, action: "RESERVE", objectType: "mo", objectId: id, objectLabel: mo?.number, newValue: `${mats.length} composants` });
  revalidate("/app/production/manufacturing/" + id, "/app/stock/inventory");
  return { ok: true };
}

/** Confirms consumption: releases the reservation and deducts real stock. */
export async function consumeMoMaterials(id: number): Promise<ActionResult> {
  const user = await guard("manufacturing");
  const mats = all<any>(`SELECT * FROM mo_materials WHERE mo_id = ?`, [id]) ?? [];
  const mo = get<any>(`SELECT number FROM manufacturing_orders WHERE id = ?`, [id]);

  tx(() => {
    for (const m of mats) {
      const wh = warehouseForProduct(m.product_id);
      const qty = m.required_qty;
      if (m.consumed_qty >= qty) continue;
      run(`UPDATE mo_materials SET consumed_qty = ? WHERE id = ?`, [qty, m.id]);
      run(`UPDATE stock_levels SET reserved = MAX(0, reserved - ?) WHERE product_id = ? AND warehouse_id = ?`,
        [m.reserved_qty, m.product_id, wh]);
      stockMove({
        productId: m.product_id, warehouseId: wh, type: "PRODUCTION_CONSUMPTION", quantity: qty,
        userId: user.id, ref: mo?.number, relatedType: "mo", relatedId: id,
        note: `Consommation ${mo?.number}`,
      });
    }
  });
  audit({ userId: user.id, userName: user.fullName, action: "CONSUME", objectType: "mo", objectId: id, objectLabel: mo?.number, newValue: `${mats.length} composants` });
  revalidate("/app/production/manufacturing/" + id, "/app/stock/inventory", "/app/stock/movements", "/app/stock/alerts", "/app/dashboard");
  return { ok: true };
}

function warehouseForProduct(productId: number): number {
  const code = get<any>(`SELECT code FROM categories WHERE id = (SELECT category_id FROM products WHERE id = ?)`, [productId])?.code;
  const map: Record<string, string> = { PRO: "WH-ALU", PVP: "WH-PVC", VER: "WH-VER", JOI: "WH-ACC", QUI: "WH-ACC" };
  const whCode = map[code] ?? (code ? "WH-PF" : "WH-PRINC");
  return get<any>(`SELECT id FROM warehouses WHERE code = ?`, [whCode])?.id ??
    get<any>(`SELECT id FROM warehouses WHERE is_default = 1 LIMIT 1`)?.id ?? 1;
}

/* ========================== QUALITY CONTROL ========================== */

export async function saveQualityControl(fd: FormData): Promise<ActionResult> {
  const user = await guard("quality", "create");
  const moId = Number(fd.get("mo_id")) || null;
  const itemsRaw = String(fd.get("items") ?? "[]");
  const items: { criterion: string; result: string; note?: string }[] = JSON.parse(itemsRaw);

  const ko = items.filter((i) => i.result === "ko").length;
  const scored = items.filter((i) => i.result !== "na");
  const okCount = items.filter((i) => i.result === "ok").length;
  const score = scored.length ? Math.round((okCount / scored.length) * 100) : 100;
  const status = fd.get("status") || (ko === 0 ? "passed" : ko <= 1 ? "correction" : "failed");

  const mo = moId ? get<any>(`SELECT number, product_id, quantity FROM manufacturing_orders WHERE id = ?`, [moId]) : null;
  const r = run(
    `INSERT INTO quality_controls (ref, mo_id, product_id, quantity, inspector_id, status, score, notes)
     VALUES (?,?,?,?,?,?,?,?)`,
    [nextSeq("QC"), moId, (mo?.product_id ?? Number(fd.get("product_id"))) || null,
     (mo?.quantity ?? Number(fd.get("quantity"))) || 1, user.id, status, score, String(fd.get("notes") ?? "") || null],
  );
  const qcId = Number(r.lastInsertRowid);
  for (const it of items) {
    run(`INSERT INTO qc_items (qc_id, criterion, result, note) VALUES (?,?,?,?)`, [qcId, it.criterion, it.result, it.note ?? null]);
  }
  audit({ userId: user.id, userName: user.fullName, action: "CREATE", objectType: "qc", objectId: qcId, objectLabel: mo?.number, newValue: status });
  if (status !== "passed") {
    notify({ type: "qc_failed", level: "warning", title: `Contrôle qualité — ${status === "failed" ? "non conforme" : "correction requise"}`, body: mo?.number ?? "", link: `/app/production/quality/${qcId}`, audience: "production" });
  }
  revalidate("/app/production/quality", "/app/dashboard");
  return { ok: true, id: qcId };
}

/* ================================ STOCK ============================== */

export async function saveStockMovement(fd: FormData): Promise<ActionResult> {
  const user = await guard("movements", "create");
  const type = String(fd.get("type")) as MovementType;
  const productId = Number(fd.get("product_id"));
  const warehouseId = Number(fd.get("warehouse_id"));
  const fromWarehouseId = Number(fd.get("from_warehouse_id")) || null;
  const quantity = Number(fd.get("quantity")) || 0;
  const product = get<any>(`SELECT sku, name FROM products WHERE id = ?`, [productId]);
  if (!productId || !warehouseId || !type) return { ok: false, error: "invalid" };

  const ref = nextSeq("MV");
  stockMove({
    productId, warehouseId, fromWarehouseId, type, quantity,
    unitCost: Number(fd.get("unit_cost")) || product?.purchase_cost || 0,
    userId: user.id, ref, note: String(fd.get("note") ?? "") || null,
  });
  audit({ userId: user.id, userName: user.fullName, action: "STOCK", objectType: "movement", objectLabel: `${ref} ${type} ${product?.sku}`, newValue: { type, quantity, warehouseId } });
  revalidate("/app/stock/movements", "/app/stock/inventory", "/app/stock/alerts", "/app/dashboard");
  return { ok: true, ref };
}

export async function saveProduct(fd: FormData): Promise<ActionResult> {
  const user = await guard("products", fd.get("id") ? "edit" : "create");
  const id = fd.get("id") ? Number(fd.get("id")) : null;
  const values = [
    String(fd.get("sku") ?? "").trim(), String(fd.get("name") ?? "").trim(),
    String(fd.get("name_ar") ?? "").trim() || null, String(fd.get("name_en") ?? "").trim() || null,
    Number(fd.get("category_id")) || null, String(fd.get("kind") ?? "finished"),
    String(fd.get("unit") ?? "U"), String(fd.get("description") ?? "") || null,
    Number(fd.get("purchase_cost")) || 0, Number(fd.get("selling_price")) || 0,
    Number(fd.get("vat_rate")) || 20, Number(fd.get("min_stock")) || 0,
    Number(fd.get("weight")) || 0, String(fd.get("image") ?? "") || null,
    String(fd.get("status") ?? "active"),
  ];

  let productId = id;
  if (id) {
    const before = get(`SELECT * FROM products WHERE id = ?`, [id]);
    run(`UPDATE products SET sku=?, name=?, name_ar=?, name_en=?, category_id=?, kind=?, unit=?, description=?,
         purchase_cost=?, selling_price=?, vat_rate=?, min_stock=?, weight=?, image=?, status=? WHERE id=?`,
      [...values, id]);
    audit({ userId: user.id, userName: user.fullName, action: "UPDATE", objectType: "product", objectId: id, objectLabel: String(values[0]), oldValue: before, newValue: values });
  } else {
    const r = run(
      `INSERT INTO products (sku, name, name_ar, name_en, category_id, kind, unit, description, purchase_cost,
        selling_price, vat_rate, min_stock, weight, image, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      values,
    );
    productId = Number(r.lastInsertRowid);
    audit({ userId: user.id, userName: user.fullName, action: "CREATE", objectType: "product", objectId: productId, objectLabel: String(values[0]) });
  }
  checkLowStock(productId!);
  revalidate("/app/stock/products", "/app/stock/inventory", "/app/stock/alerts");
  return { ok: true, id: productId! };
}

export async function deleteProduct(id: number): Promise<ActionResult> {
  const user = await guard("products", "delete");
  const before = get<any>(`SELECT sku FROM products WHERE id = ?`, [id]);
  run(`DELETE FROM products WHERE id = ?`, [id]);
  audit({ userId: user.id, userName: user.fullName, action: "DELETE", objectType: "product", objectId: id, objectLabel: before?.sku, oldValue: before });
  revalidate("/app/stock/products", "/app/stock/inventory");
  return { ok: true };
}

/* ============================== PURCHASING =========================== */

export async function savePurchaseOrder(fd: FormData): Promise<ActionResult> {
  const user = await guard("purchase_orders", fd.get("id") ? "edit" : "create");
  const id = fd.get("id") ? Number(fd.get("id")) : null;
  const supplierId = Number(fd.get("supplier_id"));
  const lines: { product_id: number; quantity: number; unit_price: number; vat_rate: number }[] =
    JSON.parse(String(fd.get("lines") ?? "[]"));
  if (!supplierId || !lines.length) return { ok: false, error: "invalid" };

  let poId = id;
  if (id) {
    run(`UPDATE purchase_orders SET supplier_id=?, warehouse_id=?, order_date=?, expected_date=?, status=?, notes=? WHERE id=?`,
      [supplierId, Number(fd.get("warehouse_id")) || null, String(fd.get("order_date")) || today(),
       String(fd.get("expected_date")) || null, String(fd.get("status") ?? "draft"), String(fd.get("notes") ?? "") || null, id]);
    run(`DELETE FROM po_lines WHERE po_id = ?`, [id]);
    audit({ userId: user.id, userName: user.fullName, action: "UPDATE", objectType: "po", objectId: id });
  } else {
    const number = nextSeq("CA");
    const r = run(
      `INSERT INTO purchase_orders (number, supplier_id, warehouse_id, order_date, expected_date, status, notes)
       VALUES (?,?,?,?,?, 'draft', ?)`,
      [number, supplierId, Number(fd.get("warehouse_id")) || null, String(fd.get("order_date")) || today(),
       String(fd.get("expected_date")) || null, String(fd.get("notes") ?? "") || null],
    );
    poId = Number(r.lastInsertRowid);
    audit({ userId: user.id, userName: user.fullName, action: "CREATE", objectType: "po", objectId: poId, objectLabel: number });
  }
  lines.forEach((l, i) => {
    run(`INSERT INTO po_lines (po_id, product_id, quantity, unit_price, vat_rate, position) VALUES (?,?,?,?,?,?)`,
      [poId, l.product_id, l.quantity, l.unit_price, l.vat_rate ?? 20, i + 1]);
  });
  recomputePO(poId!);
  revalidate("/app/purchasing/orders", "/app/purchasing/orders/" + poId);
  return { ok: true, id: poId! };
}

function recomputePO(poId: number) {
  const lines = all<any>(`SELECT quantity, unit_price, vat_rate FROM po_lines WHERE po_id = ?`, [poId]) ?? [];
  let ht = 0, vat = 0;
  for (const l of lines) {
    ht += l.quantity * l.unit_price;
    vat += l.quantity * l.unit_price * ((l.vat_rate || 0) / 100);
  }
  run(`UPDATE purchase_orders SET total_ht=?, total_vat=?, total_ttc=? WHERE id=?`, [r2(ht), r2(vat), r2(ht + vat), poId]);
}

/** Receiving goods increases stock and advances the PO status. */
export async function receivePurchaseOrder(fd: FormData): Promise<ActionResult> {
  const user = await guard("receipts", "create");
  const poId = Number(fd.get("po_id"));
  const warehouseId = Number(fd.get("warehouse_id"));
  const received: Record<string, number> = JSON.parse(String(fd.get("received") ?? "{}"));

  const po = get<any>(`SELECT * FROM purchase_orders WHERE id = ?`, [poId]);
  if (!po) return { ok: false, error: "not_found" };

  // Refuse an empty receipt: it would otherwise consume a REC number, write a
  // childless receipt row and notify the stock manager about nothing.
  const poLines = all<any>(`SELECT * FROM po_lines WHERE po_id = ?`, [poId]) ?? [];
  const receivedQty = poLines.reduce((sum, l) => sum + (Number(received[String(l.id)]) || 0), 0);
  if (receivedQty <= 0) return { ok: false, error: "nothing_received" };

  const wh = warehouseId || po.warehouse_id || get<any>(`SELECT id FROM warehouses WHERE is_default = 1`)?.id;
  const number = nextSeq("REC");

  tx(() => {
    const r = run(`INSERT INTO receipts (number, po_id, supplier_id, warehouse_id, user_id, status) VALUES (?,?,?,?,?,'received')`,
      [number, poId, po.supplier_id, wh, user.id]);
    const receiptId = Number(r.lastInsertRowid);

    for (const l of poLines) {
      const qty = Number(received[String(l.id)]) || 0;
      if (qty <= 0) continue;
      run(`INSERT INTO receipt_lines (receipt_id, po_line_id, product_id, quantity, unit_price) VALUES (?,?,?,?,?)`,
        [receiptId, l.id, l.product_id, qty, l.unit_price]);
      run(`UPDATE po_lines SET received_qty = received_qty + ? WHERE id = ?`, [qty, l.id]);
      const prodWh = warehouseId || warehouseForProduct(l.product_id);
      stockMove({
        productId: l.product_id, warehouseId: prodWh, type: "IN", quantity: qty, unitCost: l.unit_price,
        userId: user.id, ref: number, relatedType: "receipt", relatedId: receiptId,
        note: `Réception ${number}`,
      });
    }

    const remaining = get<any>(`SELECT COALESCE(SUM(quantity - received_qty),0) AS left FROM po_lines WHERE po_id = ?`, [poId])?.left ?? 0;
    const anyReceived = get<any>(`SELECT COALESCE(SUM(received_qty),0) AS r FROM po_lines WHERE po_id = ?`, [poId])?.r ?? 0;
    const status = remaining <= 0 && anyReceived > 0 ? "received" : anyReceived > 0 ? "partial" : po.status;
    run(`UPDATE purchase_orders SET status = ? WHERE id = ?`, [status, poId]);
  });

  audit({ userId: user.id, userName: user.fullName, action: "RECEIVE", objectType: "receipt", objectLabel: number, newValue: received });
  notify({ type: "po_received", level: "info", title: `Réception ${number}`, body: po.number, link: "/app/purchasing/receipts", audience: "stock" });
  revalidate("/app/purchasing/receipts", "/app/purchasing/orders", "/app/purchasing/orders/" + poId, "/app/stock/inventory", "/app/stock/movements", "/app/stock/alerts");
  return { ok: true, ref: number };
}

export async function saveSupplier(fd: FormData): Promise<ActionResult> {
  const user = await guard("suppliers", fd.get("id") ? "edit" : "create");
  const id = fd.get("id") ? Number(fd.get("id")) : null;
  const values = [
    String(fd.get("name") ?? "").trim(), String(fd.get("category") ?? "") || null,
    String(fd.get("contact_name") ?? "") || null, String(fd.get("email") ?? "") || null,
    String(fd.get("phone") ?? "") || null, String(fd.get("address") ?? "") || null,
    String(fd.get("city") ?? "") || null, String(fd.get("ice") ?? "") || null,
    String(fd.get("if_code") ?? "") || null, String(fd.get("rc") ?? "") || null,
    String(fd.get("payment_terms") ?? "30 jours"), Number(fd.get("rating")) || 3,
    String(fd.get("notes") ?? "") || null,
  ];
  let supplierId = id;
  if (id) {
    run(`UPDATE suppliers SET name=?, category=?, contact_name=?, email=?, phone=?, address=?, city=?, ice=?, if_code=?,
         rc=?, payment_terms=?, rating=?, notes=? WHERE id=?`, [...values, id]);
    audit({ userId: user.id, userName: user.fullName, action: "UPDATE", objectType: "supplier", objectId: id, objectLabel: String(values[0]) });
  } else {
    const r = run(`INSERT INTO suppliers (code, name, category, contact_name, email, phone, address, city, ice, if_code, rc, payment_terms, rating, notes)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [nextSeq("FOU"), ...values]);
    supplierId = Number(r.lastInsertRowid);
    audit({ userId: user.id, userName: user.fullName, action: "CREATE", objectType: "supplier", objectId: supplierId, objectLabel: String(values[0]) });
  }
  revalidate("/app/purchasing/suppliers");
  return { ok: true, id: supplierId! };
}

/* =============================== FINANCE ============================= */

export async function createInvoiceFromOrder(orderId: number): Promise<ActionResult> {
  const user = await guard("invoices", "create");
  const order = get<any>(`SELECT * FROM orders WHERE id = ?`, [orderId]);
  if (!order) return { ok: false, error: "not_found" };
  const existing = get<any>(`SELECT id FROM invoices WHERE order_id = ?`, [orderId]);
  if (existing) return { ok: false, error: "already_invoiced", id: existing.id };

  const issueDate = today();
  const number = nextSeq("FAC");
  const r = run(
    `INSERT INTO invoices (number, customer_id, order_id, issue_date, due_date, status, notes)
     VALUES (?,?,?,?,?, 'draft', ?)`,
    [number, order.customer_id, orderId, issueDate, addDays(issueDate, 30), `Facture de la commande ${order.number}.`],
  );
  const invoiceId = Number(r.lastInsertRowid);
  const lines = all<any>(`SELECT * FROM order_lines WHERE order_id = ? ORDER BY position`, [orderId]) ?? [];
  for (const l of lines) {
    run(`INSERT INTO invoice_lines (invoice_id, product_id, description, quantity, unit_price, discount_pct, vat_rate, position)
         VALUES (?,?,?,?,?,?,?,?)`,
      [invoiceId, l.product_id, l.description, l.quantity, l.unit_price, l.discount_pct, l.vat_rate, l.position]);
  }
  recomputeInvoiceTotals(invoiceId);
  audit({ userId: user.id, userName: user.fullName, action: "CREATE", objectType: "invoice", objectId: invoiceId, objectLabel: `${order.number} → ${number}` });
  revalidate("/app/finance/invoices", "/app/finance/invoices/" + invoiceId, "/app/commercial/orders/" + orderId, "/app/dashboard");
  return { ok: true, id: invoiceId, ref: number };
}

export async function setInvoiceStatus(id: number, status: string): Promise<ActionResult> {
  const user = await guard("invoices");
  const before = get<any>(`SELECT number, status FROM invoices WHERE id = ?`, [id]);
  run(`UPDATE invoices SET status = ? WHERE id = ?`, [status, id]);
  audit({ userId: user.id, userName: user.fullName, action: "STATUS", objectType: "invoice", objectId: id, objectLabel: before?.number, oldValue: before?.status, newValue: status });
  revalidate("/app/finance/invoices", "/app/finance/invoices/" + id, "/app/dashboard");
  return { ok: true };
}

export async function recordPayment(fd: FormData): Promise<ActionResult> {
  const user = await guard("payments", "create");
  const invoiceId = Number(fd.get("invoice_id")) || null;
  const amount = Number(fd.get("amount")) || 0;
  if (!amount) return { ok: false, error: "invalid_amount" };

  const invoice = invoiceId ? get<any>(`SELECT * FROM invoices WHERE id = ?`, [invoiceId]) : null;
  const ref = nextSeq("PAY");
  run(
    `INSERT INTO payments (ref, invoice_id, customer_id, date, method, amount, reference, notes, user_id)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [ref, invoiceId, (invoice?.customer_id ?? Number(fd.get("customer_id"))) || null,
     String(fd.get("date")) || today(), String(fd.get("method") ?? "transfer"), amount,
     String(fd.get("reference") ?? "") || null, String(fd.get("notes") ?? "") || null, user.id],
  );

  if (invoice) {
    const paid = get<any>(`SELECT COALESCE(SUM(amount),0) AS s FROM payments WHERE invoice_id = ?`, [invoiceId])?.s ?? 0;
    const status = paid >= invoice.total_ttc * 0.995 ? "paid" : "partial";
    run(`UPDATE invoices SET paid_amount = ?, status = ? WHERE id = ?`, [r2(paid), status, invoiceId]);
  }
  audit({ userId: user.id, userName: user.fullName, action: "CREATE", objectType: "payment", objectLabel: ref, newValue: { amount, invoice: invoice?.number } });
  notify({ type: "payment_received", level: "success", title: `Paiement reçu — ${ref}`, body: invoice?.number ?? "", link: "/app/finance/payments", audience: "accountant" });
  revalidate("/app/finance/payments", "/app/finance/invoices", "/app/dashboard");
  return { ok: true, ref };
}

export async function saveExpense(fd: FormData): Promise<ActionResult> {
  const user = await guard("expenses", "create");
  const amount = Number(fd.get("amount")) || 0;
  const vat = Number(fd.get("vat")) || 0;
  const r = run(
    `INSERT INTO expenses (ref, date, category, supplier_id, description, amount, vat, ttc, status, payment_method, notes)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [nextSeq("DEP"), String(fd.get("date")) || today(), String(fd.get("category") ?? "") || null,
     Number(fd.get("supplier_id")) || null, String(fd.get("description") ?? "") || null, amount, vat,
     r2(amount + vat), String(fd.get("status") ?? "paid"), String(fd.get("payment_method") ?? "transfer"),
     String(fd.get("notes") ?? "") || null],
  );
  audit({ userId: user.id, userName: user.fullName, action: "CREATE", objectType: "expense", objectId: Number(r.lastInsertRowid), newValue: { amount } });
  revalidate("/app/finance/expenses", "/app/dashboard");
  return { ok: true, id: Number(r.lastInsertRowid) };
}

/* ============================== LOGISTICS ============================ */

export async function saveDelivery(fd: FormData): Promise<ActionResult> {
  const user = await guard("deliveries", "create");
  const orderId = Number(fd.get("order_id")) || null;
  const order = orderId ? get<any>(`SELECT * FROM orders WHERE id = ?`, [orderId]) : null;
  const number = nextSeq("BL");
  const r = run(
    `INSERT INTO deliveries (number, order_id, customer_id, date, status, driver_id, vehicle, address, city, notes)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [number, orderId, order?.customer_id ?? null, String(fd.get("date")) || today(),
     String(fd.get("status") ?? "preparing"), Number(fd.get("driver_id")) || null,
     String(fd.get("vehicle") ?? "") || null, String(fd.get("address") ?? "") || order?.delivery_address || null,
     String(fd.get("city") ?? "") || order?.city || null, String(fd.get("notes") ?? "") || null],
  );
  const deliveryId = Number(r.lastInsertRowid);
  if (orderId) {
    const lines = all<any>(`SELECT id, product_id, description, quantity FROM order_lines WHERE order_id = ?`, [orderId]) ?? [];
    for (const l of lines) {
      run(`INSERT INTO delivery_lines (delivery_id, order_line_id, product_id, description, quantity) VALUES (?,?,?,?,?)`,
        [deliveryId, l.id, l.product_id, l.description, l.quantity]);
    }
  }
  audit({ userId: user.id, userName: user.fullName, action: "CREATE", objectType: "delivery", objectId: deliveryId, objectLabel: number });
  revalidate("/app/logistics/deliveries");
  return { ok: true, id: deliveryId, ref: number };
}

export async function setDeliveryStatus(id: number, status: string): Promise<ActionResult> {
  const user = await guard("deliveries");
  const before = get<any>(`SELECT number, status, order_id FROM deliveries WHERE id = ?`, [id]);
  run(`UPDATE deliveries SET status = ? WHERE id = ?`, [status, id]);
  if (status === "delivered" && before?.order_id) {
    run(`UPDATE orders SET status = 'delivered', updated_at = datetime('now') WHERE id = ? AND status IN ('ready','in_production','quality_control')`, [before.order_id]);
    run(`UPDATE order_lines SET delivered_qty = quantity WHERE order_id = ?`, [before.order_id]);
  }
  audit({ userId: user.id, userName: user.fullName, action: "STATUS", objectType: "delivery", objectId: id, objectLabel: before?.number, oldValue: before?.status, newValue: status });
  revalidate("/app/logistics/deliveries", "/app/commercial/orders");
  return { ok: true };
}

export async function saveInstallation(fd: FormData): Promise<ActionResult> {
  const user = await guard("installations", fd.get("id") ? "edit" : "create");
  const id = fd.get("id") ? Number(fd.get("id")) : null;
  const values = [
    Number(fd.get("order_id")) || null, Number(fd.get("customer_id")) || null,
    Number(fd.get("team_id")) || null, String(fd.get("appointment_date")) || null,
    String(fd.get("address") ?? "") || null, String(fd.get("city") ?? "") || null,
    String(fd.get("status") ?? "planned"), String(fd.get("products") ?? "") || null,
    String(fd.get("notes") ?? "") || null,
  ];
  let instId = id;
  if (id) {
    run(`UPDATE installations SET order_id=?, customer_id=?, team_id=?, appointment_date=?, address=?, city=?, status=?,
         products=?, notes=? WHERE id=?`, [...values, id]);
    audit({ userId: user.id, userName: user.fullName, action: "UPDATE", objectType: "installation", objectId: id });
  } else {
    const r = run(`INSERT INTO installations (ref, order_id, customer_id, team_id, appointment_date, address, city, status, products, notes)
                   VALUES (?,?,?,?,?,?,?,?,?,?)`, [nextSeq("INS"), ...values]);
    instId = Number(r.lastInsertRowid);
    audit({ userId: user.id, userName: user.fullName, action: "CREATE", objectType: "installation", objectId: instId });
  }
  revalidate("/app/logistics/installations");
  return { ok: true, id: instId! };
}

export async function setInstallationStatus(id: number, status: string): Promise<ActionResult> {
  const user = await guard("installations");
  const before = get<any>(`SELECT ref, status, order_id FROM installations WHERE id = ?`, [id]);
  run(`UPDATE installations SET status = ?, completed_at = CASE WHEN ? = 'done' THEN datetime('now') ELSE completed_at END WHERE id = ?`,
    [status, status, id]);
  if (status === "done" && before?.order_id) {
    run(`UPDATE orders SET status = 'installed', updated_at = datetime('now') WHERE id = ? AND status = 'delivered'`, [before.order_id]);
  }
  audit({ userId: user.id, userName: user.fullName, action: "STATUS", objectType: "installation", objectId: id, objectLabel: before?.ref, oldValue: before?.status, newValue: status });
  revalidate("/app/logistics/installations", "/app/commercial/orders");
  return { ok: true };
}

/* ================================ USERS ============================== */

export async function saveUser(fd: FormData): Promise<ActionResult> {
  const user = await guard("users", fd.get("id") ? "edit" : "create");
  const id = fd.get("id") ? Number(fd.get("id")) : null;
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const fullName = String(fd.get("full_name") ?? "").trim();
  const role = String(fd.get("role") ?? "commercial");
  const active = fd.get("active") === "1" ? 1 : 0;

  if (id) {
    const before = get(`SELECT * FROM users WHERE id = ?`, [id]);
    const password = String(fd.get("password") ?? "");
    if (password) {
      run(`UPDATE users SET email=?, full_name=?, role=?, job_title=?, phone=?, active=?, password_hash=? WHERE id=?`,
        [email, fullName, role, String(fd.get("job_title") ?? "") || null, String(fd.get("phone") ?? "") || null,
         active, await hashPassword(password), id]);
    } else {
      run(`UPDATE users SET email=?, full_name=?, role=?, job_title=?, phone=?, active=? WHERE id=?`,
        [email, fullName, role, String(fd.get("job_title") ?? "") || null, String(fd.get("phone") ?? "") || null, active, id]);
    }
    audit({ userId: user.id, userName: user.fullName, action: "UPDATE", objectType: "user", objectId: id, objectLabel: email, oldValue: before });
  } else {
    const r = run(`INSERT INTO users (email, password_hash, full_name, role, job_title, phone, active) VALUES (?,?,?,?,?,?,?)`,
      [email, await hashPassword(String(fd.get("password") ?? "cristalu2026")), fullName, role,
       String(fd.get("job_title") ?? "") || null, String(fd.get("phone") ?? "") || null, active]);
    audit({ userId: user.id, userName: user.fullName, action: "CREATE", objectType: "user", objectId: Number(r.lastInsertRowid), objectLabel: email });
  }
  revalidate("/app/users");
  return { ok: true };
}

/* =============================== SETTINGS ============================ */

export async function saveSettings(fd: FormData): Promise<ActionResult> {
  const user = await guard("settings", "edit");
  const keys = [
    "company_name", "company_legal", "company_ice", "company_if", "company_rc", "company_cnss",
    "company_address", "company_phone", "company_email", "company_website",
    "default_vat", "currency", "quote_validity_days", "low_stock_default", "qc_checklist",
    "prefix_quote", "prefix_order", "prefix_mo", "prefix_invoice", "prefix_po", "prefix_delivery",
  ];
  for (const k of keys) {
    const v = fd.get(k);
    if (v !== null) setSetting(k, String(v));
  }
  audit({ userId: user.id, userName: user.fullName, action: "UPDATE", objectType: "settings", objectLabel: "Paramètres généraux" });
  revalidate("/app/settings");
  return { ok: true };
}

/** Form-action wrapper: <form action> must resolve to void, not ActionResult. */
export async function saveSettingsForm(fd: FormData): Promise<void> {
  await saveSettings(fd);
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  await requireUser();
  run(`UPDATE notifications SET read = 1`);
  revalidate("/app/notifications", "/app/dashboard");
  return { ok: true };
}

export async function markNotificationRead(id: number): Promise<ActionResult> {
  await requireUser();
  run(`UPDATE notifications SET read = 1 WHERE id = ?`, [id]);
  revalidate("/app/notifications");
  return { ok: true };
}

export async function reseedDemoData(): Promise<ActionResult> {
  const user = await requirePerm("settings", "delete");
  await seedDatabase();
  audit({ userId: user.id, userName: user.fullName, action: "RESEED", objectType: "system", objectLabel: "Réinitialisation des données de démonstration" });
  revalidate("/app/dashboard");
  return { ok: true };
}

/* ========================= PUBLIC QUOTE REQUESTS ===================== */
/* Submissions from the public /devis form land in `quote_requests`; the
   commercial team triages them here and can turn one into a real quote.   */

const REQUEST_STATUSES = ["new", "processing", "quoted", "converted", "closed"];

export async function setRequestStatus(id: number, status: string): Promise<ActionResult> {
  const user = await guard("requests");
  if (!REQUEST_STATUSES.includes(status)) return { ok: false, error: "bad_status" };
  const before = get<any>(`SELECT ref, status FROM quote_requests WHERE id = ?`, [id]);
  if (!before) return { ok: false, error: "not_found" };

  run(`UPDATE quote_requests SET status = ?, updated_at = datetime('now') WHERE id = ?`, [status, id]);
  audit({ userId: user.id, userName: user.fullName, action: "STATUS", objectType: "quote_request", objectId: id, objectLabel: before.ref, oldValue: before.status, newValue: status });
  revalidate("/app/commercial/requests", "/app/commercial/requests/" + id, "/app/dashboard");
  return { ok: true };
}

export async function assignRequest(fd: FormData): Promise<ActionResult> {
  const user = await guard("requests");
  const id = Number(fd.get("id"));
  const assigneeId = Number(fd.get("assignee_id")) || null;
  const priority = String(fd.get("priority") ?? "normal");
  const before = get<any>(`SELECT ref, assignee_id, priority FROM quote_requests WHERE id = ?`, [id]);
  if (!before) return { ok: false, error: "not_found" };

  run(
    `UPDATE quote_requests SET assignee_id = ?, priority = ?,
       status = CASE WHEN status = 'new' THEN 'processing' ELSE status END,
       updated_at = datetime('now') WHERE id = ?`,
    [assigneeId, priority, id],
  );
  audit({ userId: user.id, userName: user.fullName, action: "UPDATE", objectType: "quote_request", objectId: id, objectLabel: before.ref, oldValue: before, newValue: { assignee_id: assigneeId, priority } });

  const assignee = assigneeId ? get<any>(`SELECT full_name FROM users WHERE id = ?`, [assigneeId]) : null;
  if (assignee) {
    notify({
      type: "quote_request", level: "info",
      title: `Demande ${before.ref} assignée`,
      body: `Assignée à ${assignee.full_name} (priorité ${priority}).`,
      link: `/app/commercial/requests/${id}`,
    });
  }
  revalidate("/app/commercial/requests", "/app/commercial/requests/" + id, "/app/dashboard");
  return { ok: true };
}

/**
 * Request → draft quote. Finds or creates the customer from the submitted
 * contact details, matches the requested product by name, and links the quote
 * back via `quotes.request_id` so the two stay connected.
 */
export async function createQuoteFromRequest(id: number): Promise<ActionResult> {
  const user = await guard("requests", "create");
  const req = get<any>(`SELECT * FROM quote_requests WHERE id = ?`, [id]);
  if (!req) return { ok: false, error: "not_found" };

  const existingQuote = get<any>(`SELECT id FROM quotes WHERE request_id = ?`, [id]);
  if (existingQuote) return { ok: true, id: existingQuote.id };

  return tx(() => {
    // 1. Reuse a customer with the same e-mail, else create one from the form.
    let customerId = req.customer_id as number | null;
    if (!customerId) {
      customerId = get<any>(`SELECT id FROM customers WHERE email = ?`, [req.email])?.id ?? null;
    }
    if (!customerId) {
      const code = nextSeq("CLI");
      const r = run(
        `INSERT INTO customers (code, status, type, company, contact_name, email, phone, city, source, owner_id)
         VALUES (?,?, 'entreprise', ?, ?, ?, ?, ?, 'Site web', ?)`,
        [code, req.company ?? null, req.customer_name, req.email, req.phone, req.city ?? null, user.id],
      );
      customerId = Number(r.lastInsertRowid);
      audit({ userId: user.id, userName: user.fullName, action: "CREATE", objectType: "customer", objectId: customerId, objectLabel: req.customer_name });
    }

    // 2. Match the requested product loosely on its label.
    const product = get<any>(
      `SELECT id, name, selling_price, vat_rate FROM products
       WHERE name = ? OR ? LIKE '%' || name || '%' OR name LIKE '%' || ? || '%'
       ORDER BY (name = ?) DESC, LENGTH(name) DESC LIMIT 1`,
      [req.product, req.product, req.product, req.product],
    );

    // 3. Draft quote carrying the submitted spec, linked to the request.
    const number = nextSeq("DEV");
    const dims = req.width && req.height ? `${req.width} × ${req.height} mm` : "";
    const spec = [
      req.product, dims, req.color && `Coloris ${req.color}`, req.glass_type && `Vitrage ${req.glass_type}`,
      req.opening_system && `Ouverture ${req.opening_system}`, req.accessories,
      req.installation ? "Pose incluse" : null,
    ].filter(Boolean).join(" · ");

    const qr = run(
      `INSERT INTO quotes (number, customer_id, project, salesperson_id, issue_date, validity_date, discount_pct,
        status, payment_terms, notes, source, request_id)
       VALUES (?,?, ?, ?, ?, ?, 0, 'draft', '30% à la commande', ?, 'website', ?)`,
      [number, customerId, req.company ?? req.city ?? "Demande site web", user.id, today(), addDays(today(), 30),
       req.comments ? `Demande ${req.ref} — ${req.comments}` : `Demande ${req.ref}`, id],
    );
    const quoteId = Number(qr.lastInsertRowid);

    run(
      `INSERT INTO quote_lines (quote_id, product_id, description, width, height, quantity, unit_price, discount_pct, vat_rate, position)
       VALUES (?,?,?,?,?,?,?,?,?,1)`,
      [quoteId, product?.id ?? null, spec || req.product, req.width || 0, req.height || 0,
       req.quantity || 1, product?.selling_price ?? 0, 0, product?.vat_rate ?? 20],
    );
    recomputeQuoteTotals(quoteId);

    run(`UPDATE quote_requests SET status = 'quoted', quote_id = ?, customer_id = ?, updated_at = datetime('now') WHERE id = ?`,
      [quoteId, customerId, id]);

    audit({ userId: user.id, userName: user.fullName, action: "CREATE", objectType: "quote", objectId: quoteId, objectLabel: number, oldValue: `request ${req.ref}` });
    notify({
      type: "quote_request", level: "success",
      title: `Devis ${number} créé`,
      body: `Généré depuis la demande ${req.ref} (${req.customer_name}).`,
      link: `/app/commercial/quotes/${quoteId}`,
    });

    revalidate("/app/commercial/requests", "/app/commercial/requests/" + id, "/app/commercial/quotes", "/app/dashboard");
    return { ok: true, id: quoteId };
  });
}
