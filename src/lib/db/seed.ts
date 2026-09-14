/* ------------------------------------------------------------------
 * Seed loader — builds a complete, coherent Cristalu Maroc dataset.
 * Idempotent: wipes all business tables then re-inserts.
 * ------------------------------------------------------------------ */
import { db, run, setSetting } from "./index";
import {
  BOM_TEMPLATES, CATEGORIES, CITIES, CUSTOMERS, NEWS, PRODUCTS, PROJECTS,
  PROSPECTS, QC_CRITERIA, SUPPLIERS, USERS, WAREHOUSES,
} from "./seed-data";
import { hashPassword } from "./seed-auth";

/* deterministic PRNG so the demo dataset is stable */
let _s = 20260913;
const rnd = () => {
  _s = (_s * 1103515245 + 12345) & 0x7fffffff;
  return _s / 0x7fffffff;
};
const ri = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];
const chance = (p: number) => rnd() < p;

const NOW = new Date();
const YEAR = NOW.getFullYear();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const isoTime = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ");
const daysAgo = (n: number) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return d;
};
const daysAhead = (n: number) => daysAgo(-n);
const yearCounter: Record<string, number> = {};
/** Monotonic, per-year reference generator: DEV-2026-0001 */
const ref = (prefix: string, d: Date) => {
  const y = d.getFullYear();
  const k = `${prefix}-${y}`;
  yearCounter[k] = (yearCounter[k] ?? 0) + 1;
  return `${prefix}-${y}-${String(yearCounter[k]).padStart(4, "0")}`;
};

export async function seedDatabase() {
  _s = 20260913;
  const tables = [
    "qc_items", "quality_controls", "mo_materials", "manufacturing_orders",
    "receipt_lines", "receipts", "po_lines", "purchase_orders",
    "payments", "invoice_lines", "invoices", "expenses",
    "delivery_lines", "deliveries", "installations", "teams",
    "order_lines", "orders", "quote_lines", "quotes", "quote_requests",
    "bom_items", "boms", "stock_movements", "stock_levels",
    "products", "categories", "warehouses", "suppliers",
    "customer_contacts", "customers", "users", "sequences", "settings",
    "notifications", "audit_logs", "projects", "gallery_images", "news_posts",
  ];
  db.exec("PRAGMA foreign_keys = OFF");
  for (const t of tables) db.exec(`DELETE FROM ${t}`);
  // Reset AUTOINCREMENT counters so demo ids stay stable across reseeds.
  db.exec(`DELETE FROM sqlite_sequence WHERE name IN (${tables.map((t) => `'${t}'`).join(",")})`);
  db.exec("PRAGMA foreign_keys = ON");

  /* ----------------------------- Users ----------------------------- */
  const pwd = await hashPassword("cristalu2026");
  const userIds: Record<string, number> = {};
  for (const u of USERS) {
    const r = run(
      `INSERT INTO users (email, password_hash, full_name, role, job_title, phone, color, last_login)
       VALUES (?,?,?,?,?,?,?,?)`,
      [u.email, pwd, u.full_name, u.role, u.job_title, u.phone, u.color, isoTime(daysAgo(ri(0, 3)))],
    );
    userIds[u.role] = Number(r.lastInsertRowid);
    if (u.role === "commercial") userIds.commercial1 = Number(r.lastInsertRowid);
    if (u.full_name === "Sara Benjelloun") userIds.commercial2 = Number(r.lastInsertRowid);
  }
  const salespeople = [userIds.commercial1, userIds.commercial2];

  /* --------------------------- Categories -------------------------- */
  const catIds: Record<string, number> = {};
  for (const c of CATEGORIES) {
    catIds[c.code] = Number(
      run(`INSERT INTO categories (code, name, name_ar, name_en, kind, icon) VALUES (?,?,?,?,?,?)`,
        [c.code, c.name, c.name_ar, c.name_en, c.kind, c.icon]).lastInsertRowid,
    );
  }

  /* -------------------------- Warehouses --------------------------- */
  const whIds: Record<string, number> = {};
  for (const w of WAREHOUSES) {
    whIds[w.code] = Number(
      run(`INSERT INTO warehouses (code, name, name_ar, name_en, address, manager_id, is_default)
           VALUES (?,?,?,?,?,?,?)`,
        [w.code, w.name, w.name_ar, w.name_en, w.address, userIds.stock, w.is_default]).lastInsertRowid,
    );
  }
  const catWarehouse: Record<string, string> = {
    PRO: "WH-ALU", PVP: "WH-PVC", VER: "WH-VER", JOI: "WH-ACC", QUI: "WH-ACC",
    ALU: "WH-PF", PVC: "WH-PF", PER: "WH-PF", MOM: "WH-PF", MUR: "WH-PF", CLO: "WH-PF",
  };

  // Products reuse the real range photography rather than one file per SKU —
  // every path below exists in public/images.
  const RANGE_IMAGE: Record<string, string> = {
    ALU: "/images/ranges/aluminium.jpg", PRO: "/images/ranges/aluminium.jpg",
    PVC: "/images/ranges/pvc.jpg", PVP: "/images/ranges/pvc.jpg",
    VER: "/images/ranges/glass.jpg",
    PER: "/images/ranges/pergolas.jpg",
    MOM: "/images/ranges/momo-box.jpg",
    MUR: "/images/ranges/curtain-walls.jpg",
    CLO: "/images/ranges/partitions.jpg",
    QUI: "/images/ranges/aluminium.jpg", JOI: "/images/ranges/aluminium.jpg",
  };

  /* ---------------------------- Products --------------------------- */
  const prodIds: Record<string, number> = {};
  for (const [sku, name, nameAr, cat, unit, cost, price, vat, minStock, kind, desc] of PRODUCTS) {
    const id = Number(
      run(`INSERT INTO products (sku, name, name_ar, name_en, category_id, kind, unit, description,
            purchase_cost, selling_price, vat_rate, min_stock, status, image)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'active',?)`,
        [sku, name, nameAr, name, catIds[cat as string], kind, unit, desc, cost, price, vat, minStock,
         RANGE_IMAGE[cat as string] ?? RANGE_IMAGE.ALU]).lastInsertRowid,
    );
    prodIds[sku] = id;

    // stock levels
    if (kind === "material") {
      const wh = whIds[catWarehouse[cat as string] ?? "WH-PRINC"];
      const base = Math.max(minStock * 1.8, 10);
      const qty = Math.round(base + rnd() * base * 1.6);
      // deliberately push a few items below threshold to demonstrate alerts
      const finalQty = minStock > 0 && chance(0.38) ? Math.max(0, Math.round(minStock * (0.15 + rnd() * 0.75))) : qty;
      run(`INSERT INTO stock_levels (product_id, warehouse_id, quantity, reserved) VALUES (?,?,?,?)`,
        [id, wh, finalQty, Math.round(finalQty * (rnd() * 0.18))]);
    } else {
      const wh = whIds[catWarehouse[cat as string] ?? "WH-PF"];
      const qty = ri(0, 14);
      run(`INSERT INTO stock_levels (product_id, warehouse_id, quantity, reserved) VALUES (?,?,?,?)`,
        [id, wh, qty, Math.min(qty, ri(0, 3))]);
    }
  }

  /* ------------------------------- BOM ----------------------------- */
  for (const [sku, items] of Object.entries(BOM_TEMPLATES)) {
    const pid = prodIds[sku];
    if (!pid) continue;
    const bomId = Number(run(`INSERT INTO boms (product_id, version, name, active) VALUES (?,?,?,1)`,
      [pid, "V1", `Nomenclature ${sku}`]).lastInsertRowid);
    for (const [csku, basis, qtyPer, wastage] of items) {
      const cid = prodIds[csku];
      if (!cid) continue;
      run(`INSERT INTO bom_items (bom_id, component_id, basis, qty_per, wastage) VALUES (?,?,?,?,?)`,
        [bomId, cid, basis, qtyPer, wastage]);
    }
  }

  /* ---------------------------- Suppliers -------------------------- */
  const supIds: number[] = [];
  for (const [name, cat, contact, city, ice, ifc, rc, phone, rating] of SUPPLIERS) {
    supIds.push(Number(
      run(`INSERT INTO suppliers (code, name, category, contact_name, email, phone, city, ice, if_code, rc, payment_terms, rating)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [`FOU-${String(supIds.length + 1).padStart(3, "0")}`, name, cat, contact,
         `contact@${name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 12)}.ma`, phone, city, ice, ifc, rc,
         pick(["30 jours", "45 jours", "60 jours", "Comptant"] as const), rating]).lastInsertRowid,
    ));
  }

  /* --------------------- Customers & prospects --------------------- */
  const customerIds: number[] = [];
  let cIdx = 1;
  for (const [company, contact, city, type, activity, ice, ifc, rc] of CUSTOMERS) {
    const id = Number(
      run(`INSERT INTO customers (code, status, type, company, contact_name, email, phone, ice, if_code, rc,
            address, city, zip, activity, source, owner_id, payment_terms, credit_limit, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [`CLI-${YEAR}-${String(cIdx++).padStart(4, "0")}`, "customer", type, company, contact,
         `${contact.toLowerCase().replace(/\s/g, ".")}@${company.toLowerCase().replace(/[^a-z]/g, "").slice(0, 10)}.ma`,
         `+212 6${ri(10, 79)} ${ri(10, 99)} ${ri(10, 99)} ${ri(10, 99)}`, ice, ifc, rc,
         `${ri(1, 180)}, ${pick(["Bd Mohammed V", "Rue Allal Ben Abdellah", "Avenue Hassan II", "Zone Industrielle", "Bd Zerktouni"] as const)}`,
         city, `2${ri(0, 9)}000`, activity, pick(["Site web", "Recommandation", "Salon", "Prospection", "Appel d'offres"] as const),
         pick(salespeople), pick(["30 jours", "45 jours", "30% à la commande", "Comptant"] as const),
         ri(200, 1500) * 1000, isoTime(daysAgo(ri(60, 900))), isoTime(daysAgo(ri(0, 30)))]).lastInsertRowid,
    );
    customerIds.push(id);
    if (chance(0.4)) {
      run(`INSERT INTO customer_contacts (customer_id, name, role, email, phone, is_primary) VALUES (?,?,?,?,?,0)`,
        [id, pick(["Karim", "Sanae", "Omar", "Leila", "Youssef", "Imane"] as const) + " " + pick(["Bennani", "El Fassi", "Tazi", "Alami"] as const),
         pick(["Acheteur", "Architecte", "Conducteur de travaux", "Gérant"] as const),
         `contact${id}@client.ma`, `+212 6${ri(10, 79)} ${ri(10, 99)} ${ri(10, 99)} ${ri(10, 99)}`]);
    }
  }
  const prospectIds: number[] = [];
  for (const [company, contact, city, type, activity, ice] of PROSPECTS) {
    prospectIds.push(Number(
      run(`INSERT INTO customers (code, status, type, company, contact_name, email, phone, ice, address, city,
            activity, source, owner_id, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [`CLI-${YEAR}-${String(cIdx++).padStart(4, "0")}`, "prospect", type, company, contact,
         `${contact.toLowerCase().replace(/\s/g, ".")}@email.ma`,
         `+212 6${ri(10, 79)} ${ri(10, 99)} ${ri(10, 99)} ${ri(10, 99)}`, ice,
         `${ri(1, 180)}, ${pick(["Bd Mohammed V", "Rue Allal Ben Abdellah", "Avenue Hassan II"] as const)}`,
         city, activity, pick(["Site web", "Salon", "Prospection", "Réseaux sociaux"] as const),
         pick(salespeople), isoTime(daysAgo(ri(5, 120))), isoTime(daysAgo(ri(0, 5)))]).lastInsertRowid,
    ));
  }

  /* ------------------------- Public requests ----------------------- */
  const finishedProducts = PRODUCTS.filter((p) => p[9] === "finished");
  const requestIds: number[] = [];
  for (let i = 0; i < 14; i++) {
    const prod = pick(finishedProducts);
    const d = daysAgo(ri(0, 45));
    const isOld = i > 5;
    const id = Number(
      run(`INSERT INTO quote_requests (ref, customer_name, company, phone, email, city, product, width, height,
            quantity, color, glass_type, opening_system, accessories, installation, comments, status, priority,
            assignee_id, customer_id, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [`DEM-${YEAR}-${String(i + 1).padStart(4, "0")}`,
         pick(["Mehdi Alaoui", "Salma Berrada", "Youssef Kadiri", "Nadia Chraibi", "Anas Belkadi", "Hind Sabri", "Tarik Lahlou", "Imane Rachidi"] as const),
         chance(0.5) ? pick(["Atlas Immobilier", "BTP Sahel", "Résidences Al Manar", "Hôtel Riad Zellige", ""] as const) : "",
         `+212 6${ri(10, 79)} ${ri(10, 99)} ${ri(10, 99)} ${ri(10, 99)}`,
         `demande${i + 1}@client.ma`, pick(CITIES), prod[1],
         ri(600, 3200), ri(600, 2600), ri(1, 24),
         pick(["Blanc RAL 9016", "Gris anthracite RAL 7016", "Noir mat RAL 9005", "Aluminium naturel anodisé"] as const),
         pick(["Double vitrage 4/16/4", "Double vitrage ITR argon", "Verre feuilleté 44.2", "Verre trempé 8 mm"] as const),
         pick(["À la française", "Oscillo-battant", "Coulissant 2 rails", "Coulissant 3 rails", "Fixe"] as const),
         pick(["Volet roulant intégré", "Moustiquaire", "Seuil PMR", "Motorisation Somfy", ""] as const),
         chance(0.7) ? 1 : 0,
         pick(["Chantier au 3ème étage, accès par monte-charge.", "Livraison souhaitée avant fin de mois.",
               "Relevé sur site nécessaire.", "Projet de rénovation, dépose de l'existant à prévoir.", ""] as const),
         isOld ? pick(["quoted", "converted", "closed"] as const) : "new",
         chance(0.25) ? "high" : "normal",
         pick(salespeople),
         chance(0.6) ? pick(customerIds) : null,
         isoTime(d), isoTime(d)]).lastInsertRowid,
    );
    requestIds.push(id);
  }

  /* ------------------------------ Quotes --------------------------- */
  const quotes: { id: number; customerId: number; status: string; date: string; totalHt: number; requestId: number | null }[] = [];
  const quoteAges: number[] = [];
  for (let m = 15; m >= 0; m--) {
    const perMonth = m > 13 ? 2 : m > 8 ? 4 : m > 3 ? 6 : 7;
    for (let k = 0; k < perMonth; k++) quoteAges.push(Math.min(560, m * 30 + ri(0, 27)));
  }
  quoteAges.sort((a, b) => b - a); // oldest first -> chronological numbering

  for (const age of quoteAges) {
    const d = daysAgo(age);
    const status =
      age <= 15 ? pick(["draft", "sent", "negotiation", "accepted", "sent", "negotiation"] as const)
      : age <= 45 ? pick(["sent", "negotiation", "accepted", "accepted", "rejected", "negotiation"] as const)
      : age <= 150 ? pick(["accepted", "accepted", "accepted", "rejected", "sent", "accepted"] as const)
      : pick(["accepted", "accepted", "rejected", "accepted"] as const);
    const customerId = chance(0.85) ? pick(customerIds) : pick(prospectIds);
    const number = ref("DEV", d);
    const reqId = age <= 40 && quotes.length < requestIds.length && status !== "draft" ? requestIds[quotes.length] : null;
    const id = Number(
      run(`INSERT INTO quotes (number, customer_id, project, salesperson_id, issue_date, validity_date, currency,
            discount_pct, status, payment_terms, notes, source, request_id, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [number, customerId,
         pick(["Façade principale", "Menuiseries extérieures", "Cloisons bureaux", "Pergola terrasse",
               "Module chantier", "Rénovation complète", "Extension villa", "Lot vitrerie", ""] as const),
         pick(salespeople), iso(d), iso(daysAgo(age - 30)), "MAD",
         chance(0.35) ? pick([3, 5, 7.5, 10]) : 0, status,
         "30% à la commande, solde à la livraison",
         "Devis valable 30 jours. Délai de fabrication : 4 à 6 semaines après acceptation.",
         reqId ? "website" : "manual", reqId, isoTime(d), isoTime(d)]).lastInsertRowid,
    );
    quotes.push({ id, customerId, status, date: iso(d), totalHt: 0, requestId: reqId ?? null });
  }

  /* --------------------------- Quote lines ------------------------- */
  for (const q of quotes) {
    const nLines = ri(1, 5);
    for (let l = 1; l <= nLines; l++) {
      const p = pick(finishedProducts);
      const pid = prodIds[p[0] as string];
      const w = ri(600, 3600), h = ri(600, 2800), qty = ri(1, 40);
      const unit = p[4] === "M2" || p[4] === "ML" ? Math.round(((w * h) / 1_000_000) * qty * 100) / 100 : qty;
      const price = (p[6] as number) * (0.95 + rnd() * 0.18);
      run(`INSERT INTO quote_lines (quote_id, product_id, description, width, height, quantity, unit_price, discount_pct, vat_rate, position)
           VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [q.id, pid, p[1], w, h, unit, Math.round(price * 100) / 100, chance(0.25) ? pick([2, 5, 10]) : 0, 20, l]);
    }
    recompute(q.id, "quotes", "quote_lines");
    const row = get1(`SELECT total_ht FROM quotes WHERE id = ?`, [q.id]);
    q.totalHt = row?.total_ht ?? 0;
    if (q.requestId) run(`UPDATE quote_requests SET quote_id = ?, status='quoted' WHERE id = ?`, [q.id, q.requestId]);
  }

  /* ------------------------------ Orders --------------------------- */
  const acceptedQuotes = quotes
    .filter((q) => q.status === "accepted")
    .sort((a, b) => b.date.localeCompare(a.date)); // newest first

  /** Explicit pipeline plan so the dashboard always shows a live production flow. */
  const ORDER_PLAN: string[] = [
    ...Array(3).fill("new"),
    ...Array(4).fill("confirmed"),
    ...Array(5).fill("to_produce"),
    ...Array(8).fill("in_production"),
    ...Array(3).fill("quality_control"),
    ...Array(3).fill("ready"),
    ...Array(3).fill("delivered"),
    ...Array(3).fill("installed"),
  ];

  const orders: { id: number; customerId: number; status: string; date: string; number: string; totalHt: number }[] = [];
  acceptedQuotes.forEach((q, i) => {
    const status = ORDER_PLAN[i] ?? "completed";
    const inPipeline = i < ORDER_PLAN.length;
    let d = new Date(q.date);
    d.setDate(d.getDate() + ri(2, 10));
    if (inPipeline) {
      const recent = daysAgo(ri(3, 115));
      if (recent > d) d = recent;
    }
    const number = ref("CMD", d);
    const cust = get1<any>(`SELECT city, address FROM customers WHERE id = ?`, [q.customerId]);
    const id = Number(
      run(`INSERT INTO orders (number, customer_id, quote_id, order_date, expected_date, status, salesperson_id,
            priority, delivery_address, city, notes, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [number, q.customerId, q.id, iso(d), iso(new Date(d.getTime() + ri(28, 60) * 86400000)), status,
         pick(salespeople), chance(0.2) ? "high" : "normal", cust?.address, cust?.city,
         "Commande issue du devis accepté.", isoTime(d), isoTime(new Date())]).lastInsertRowid,
    );
    run(`UPDATE quotes SET order_id = ? WHERE id = ?`, [id, q.id]);
    orders.push({ id, customerId: q.customerId, status, date: iso(d), number, totalHt: 0 });
    if (status === "new") {
      run(`INSERT INTO notifications (type, level, title, body, link, audience, created_at) VALUES (?,?,?,?,?,?,?)`,
        ["new_order", "success", `Nouvelle commande — ${number}`,
         `${cust?.address ?? ""} · ${get1<any>(`SELECT company FROM customers WHERE id=?`, [q.customerId])?.company ?? ""}`,
         `/app/commercial/orders/${id}`, "all", isoTime(d)]);
    }
  });

  /* --------------------------- Order lines ------------------------- */
  for (const o of orders) {
    const qId = get1<any>(`SELECT quote_id FROM orders WHERE id = ?`, [o.id])?.quote_id;
    const lines = getAll<any>(
      `SELECT product_id, description, width, height, quantity, unit_price, discount_pct, vat_rate
       FROM quote_lines WHERE quote_id = ? ORDER BY position`, [qId]);
    let pos = 1;
    for (const l of lines) {
      const delivered = ["delivered", "installed", "completed"].includes(o.status) ? l.quantity : 0;
      run(`INSERT INTO order_lines (order_id, product_id, description, width, height, quantity, delivered_qty,
            unit_price, discount_pct, vat_rate, position)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [o.id, l.product_id, l.description, l.width, l.height, l.quantity, delivered,
         l.unit_price, l.discount_pct, l.vat_rate, pos++]);
    }
    recompute(o.id, "orders", "order_lines");
    o.totalHt = get1<any>(`SELECT total_ht FROM orders WHERE id = ?`, [o.id])?.total_ht ?? 0;
  }

  /* ---------------------- Manufacturing orders --------------------- */
  const WORKSTATIONS = ["Découpe 1", "Découpe 2", "Usinage CN", "Assemblage A", "Assemblage B", "Vitrage", "Contrôle"];
  const MO_COLUMNS = ["to_prepare", "cutting", "machining", "assembly", "glazing", "quality_control", "completed"] as const;
  /** order status -> kanban columns to spread its manufacturing orders over */
  const MO_MAP: Record<string, string[]> = {
    to_produce: ["to_prepare"],
    in_production: ["cutting", "machining", "assembly", "glazing"],
    quality_control: ["quality_control"],
    ready: ["completed"],
    delivered: ["completed"],
    installed: ["completed"],
    completed: ["completed"],
  };
  const moIds: number[] = [];
  let spreadIdx = 0;

  for (const o of orders) {
    const columns = MO_MAP[o.status];
    if (!columns) continue;
    const oLines = getAll<any>(`SELECT id, product_id, description, width, height, quantity FROM order_lines WHERE order_id = ?`, [o.id]);
    for (const ol of oLines) {
      const status = columns.length === 1 ? columns[0] : columns[spreadIdx++ % columns.length];
      const colIdx = MO_COLUMNS.indexOf(status as any);
      const progress = Math.round(((colIdx + (status === "completed" ? 1 : 0.5)) / MO_COLUMNS.length) * 100);
      const start = new Date(o.date);
      start.setDate(start.getDate() + ri(2, 8));
      const end = new Date(start.getTime() + ri(14, 34) * 86400000);
      const number = ref("OF", start);
      const produced = status === "completed" ? ol.quantity : Math.round(ol.quantity * (progress / 100));
      const id = Number(
        run(`INSERT INTO manufacturing_orders (number, order_id, order_line_id, customer_id, product_id, description,
              width, height, quantity, produced_qty, priority, assignee_id, workstation, start_date, end_date,
              status, materials_reserved, progress, created_at, updated_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [number, o.id, ol.id, o.customerId, ol.product_id, ol.description, ol.width, ol.height, ol.quantity,
           produced,
           o.status === "in_production" && chance(0.25) ? "urgent" : chance(0.15) ? "high" : "normal",
           userIds.production, WORKSTATIONS[Math.min(WORKSTATIONS.length - 1, colIdx + 1)],
           iso(start), iso(end), status, status === "to_prepare" ? 0 : 1, progress,
           isoTime(start), isoTime(new Date())]).lastInsertRowid,
      );
      moIds.push(id);

      const bom = get1<any>(`SELECT id FROM boms WHERE product_id = ? AND active = 1`, [ol.product_id]);
      if (bom) {
        const items = getAll<any>(`SELECT component_id, basis, qty_per, wastage FROM bom_items WHERE bom_id = ?`, [bom.id]);
        for (const it of items) {
          const need = computeNeed(it, ol.width, ol.height, ol.quantity);
          const reserved = status !== "to_prepare" ? need : 0;
          run(`INSERT INTO mo_materials (mo_id, product_id, required_qty, reserved_qty, consumed_qty) VALUES (?,?,?,?,?)`,
            [id, it.component_id, r2q(need), r2q(reserved), status === "completed" ? r2q(need) : 0]);
        }
      }
      if (status === "completed") {
        run(`INSERT INTO notifications (type, level, title, body, link, audience, created_at) VALUES (?,?,?,?,?,?,?)`,
          ["production_completed", "success", `Production terminée — ${number}`,
           `${ol.description} — ${ol.quantity} unité(s).`, `/app/production/manufacturing/${id}`, "production",
           isoTime(new Date(end.getTime() > NOW.getTime() ? NOW.getTime() : end.getTime()))]);
      } else if (end < NOW && status !== "to_prepare") {
        run(`INSERT INTO notifications (type, level, title, body, link, audience, created_at) VALUES (?,?,?,?,?,?,?)`,
          ["production_deadline", "warning", `Retard de production — ${number}`,
           `Échéance dépassée du ${iso(end)}.`, `/app/production/manufacturing/${id}`, "production", isoTime(NOW)]);
      }
    }
  }

  /* -------------------------- Quality control ---------------------- */
  const doneMOs = getAll<any>(`SELECT id, number, product_id, quantity FROM manufacturing_orders WHERE status IN ('quality_control','completed')`) ?? [];
  let qcN = 1;
  for (const mo of doneMOs.slice(0, Math.min(28, doneMOs.length))) {
    const res = chance(0.82) ? "passed" : chance(0.6) ? "correction" : "failed";
    const qcId = Number(
      run(`INSERT INTO quality_controls (ref, mo_id, product_id, quantity, inspector_id, date, status, score, notes)
           VALUES (?,?,?,?,?,?,?,?,?)`,
        [`QC-${YEAR}-${String(qcN++).padStart(4, "0")}`, mo.id, mo.product_id, mo.quantity, userIds.production,
         isoTime(daysAgo(ri(0, 90))), res, res === "passed" ? ri(94, 100) : res === "correction" ? ri(75, 92) : ri(45, 74),
         res === "passed" ? "Contrôle conforme — libéré pour expédition."
           : res === "correction" ? "Retouche finition nécessaire sur 1 unité."
           : "Écart dimensionnel > 2 mm — retour en atelier."]).lastInsertRowid,
    );
    for (const crit of QC_CRITERIA) {
      const cRes = res === "passed" ? "ok" : crit === pick(QC_CRITERIA) ? "ko" : chance(0.1) ? "na" : "ok";
      run(`INSERT INTO qc_items (qc_id, criterion, result, note) VALUES (?,?,?,?)`,
        [qcId, crit, cRes, cRes === "ko" ? "Non-conformité relevée lors du contrôle." : null]);
    }
  }


  /* -------------------- Production consumption --------------------- */
  const whForCat: Record<string, number> = {
    PRO: whIds["WH-ALU"], PVP: whIds["WH-PVC"], VER: whIds["WH-VER"],
    JOI: whIds["WH-ACC"], QUI: whIds["WH-ACC"],
  };
  const doneMos = getAll<any>(`SELECT id, number FROM manufacturing_orders WHERE status = 'completed'`);
  let consN = 1;
  for (const mo of doneMos) {
    const mats = getAll<any>(`SELECT product_id, consumed_qty FROM mo_materials WHERE mo_id = ? AND consumed_qty > 0`, [mo.id]);
    for (const mm of mats) {
      const catCode = get1<any>(`SELECT code FROM categories WHERE id = (SELECT category_id FROM products WHERE id = ?)`, [mm.product_id])?.code ?? "QUI";
      const wh = whForCat[catCode] ?? whIds["WH-ACC"];
      const lvl = get1<any>(`SELECT quantity FROM stock_levels WHERE product_id = ? AND warehouse_id = ?`, [mm.product_id, wh]);
      if (!lvl) continue;
      const floor = (get1<any>(`SELECT min_stock FROM products WHERE id = ?`, [mm.product_id])?.min_stock ?? 0) * 0.15;
      const used = Math.max(0, Math.min(mm.consumed_qty, lvl.quantity - floor)); // never empties a shelf
      if (used <= 0) continue;
      run(`UPDATE stock_levels SET quantity = ?, updated_at = datetime('now') WHERE product_id = ? AND warehouse_id = ?`,
        [lvl.quantity - used, mm.product_id, wh]);
      run(`INSERT INTO stock_movements (ref, product_id, warehouse_id, type, quantity, user_id, related_type, related_id, note, date)
           VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [`CONS-${YEAR}-${String(consN++).padStart(4, "0")}`, mm.product_id, wh, "PRODUCTION_CONSUMPTION", used,
         userIds.production, "mo", mo.id, `Consommation ${mo.number}`, isoTime(daysAgo(ri(0, 60)))]);
    }
  }

  /* ------------------------- Purchase orders ----------------------- */
  const materials = PRODUCTS.filter((p) => p[9] === "material");
  let poN = 1;
  let recN = 1;
  for (let i = 0; i < 22; i++) {
    const d = daysAgo(ri(3, 300));
    const status = pick(["received", "received", "partial", "confirmed", "sent", "draft"] as const);
    const supId = pick(supIds);
    const poId = Number(
      run(`INSERT INTO purchase_orders (number, supplier_id, warehouse_id, order_date, expected_date, status, notes, created_at)
           VALUES (?,?,?,?,?,?,?,?)`,
        [`CA-${d.getFullYear()}-${String(poN++).padStart(4, "0")}`, supId, whIds["WH-PRINC"], iso(d),
         iso(new Date(d.getTime() + ri(7, 30) * 86400000)), status,
         "Commande d'approvisionnement matières premières.", isoTime(d)]).lastInsertRowid,
    );
    const nLines = ri(1, 4);
    for (let l = 1; l <= nLines; l++) {
      const m = pick(materials);
      const mid = prodIds[m[0] as string];
      const minS = Number(m[7]) || 0;
      const qty = minS > 0 ? ri(Math.round(minS * 0.8), Math.round(minS * 3)) : ri(20, 200);
      const recv = status === "received" ? qty : status === "partial" ? Math.round(qty * (0.3 + rnd() * 0.4)) : 0;
      const poLineId = Number(
        run(`INSERT INTO po_lines (po_id, product_id, quantity, received_qty, unit_price, vat_rate, position)
             VALUES (?,?,?,?,?,?,?)`,
          [poId, mid, qty, recv, m[5], 20, l]).lastInsertRowid,
      );
      if (recv > 0) {
        const recDate = new Date(d.getTime() + ri(7, 30) * 86400000);
        const catCode = get1<any>(`SELECT code FROM categories WHERE id = (SELECT category_id FROM products WHERE id=?)`, [mid])?.code ?? "PRO";
        const wh = whIds[catWarehouse[catCode] ?? "WH-PRINC"];
        const recNumber = `REC-${recDate.getFullYear()}-${String(recN++).padStart(4, "0")}`;
        const receiptId = Number(
          run(`INSERT INTO receipts (number, po_id, supplier_id, warehouse_id, date, user_id, status)
               VALUES (?,?,?,?,?,?,?)`,
            [recNumber, poId, supId, wh, isoTime(recDate), userIds.stock, "received"]).lastInsertRowid,
        );
        run(`INSERT INTO receipt_lines (receipt_id, po_line_id, product_id, quantity, unit_price) VALUES (?,?,?,?,?)`,
          [receiptId, poLineId, mid, recv, m[5]]);
        const hasLevel = db.prepare(`SELECT 1 AS x FROM stock_levels WHERE product_id=? AND warehouse_id=?`).get(mid, wh);
        if (hasLevel) {
          db.prepare(`UPDATE stock_levels SET quantity = quantity + ?, updated_at = datetime('now') WHERE product_id = ? AND warehouse_id = ?`)
            .run(recv, mid, wh);
        } else {
          db.prepare(`INSERT INTO stock_levels (product_id, warehouse_id, quantity) VALUES (?,?,?)`).run(mid, wh, recv);
        }
        db.prepare(`INSERT INTO stock_movements (ref, product_id, warehouse_id, type, quantity, unit_cost, user_id, related_type, related_id, note, date)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
          .run(recNumber, mid, wh, "IN", recv, m[5], userIds.stock, "receipt", receiptId,
               "Réception commande d'achat", isoTime(recDate));
      }
    }
    recomputePO(poId);
  }

  /* ----------------------------- Invoices -------------------------- */
  const invoices: { id: number; customerId: number; ttc: number; date: string; status: string; number: string }[] = [];
  const billable = orders
    .filter((o) => !["new", "confirmed", "cancelled"].includes(o.status))
    .sort((a, b) => b.date.localeCompare(a.date));
  billable.forEach((o, i) => {
    let d = new Date(o.date);
    d.setDate(d.getDate() + ri(8, 30));
    if (d > NOW) d = daysAgo(ri(1, 12));
    const age = Math.floor((NOW.getTime() - d.getTime()) / 86400000);
    const status =
      i < 3 ? "draft"
      : i < 8 ? "sent"
      : age <= 45 ? (chance(0.4) ? "sent" : chance(0.6) ? "partial" : "paid")
      : pick(["paid", "paid", "paid", "partial", "overdue", "paid", "overdue"] as const);
    const number = ref("FAC", d);
    const id = Number(
      run(`INSERT INTO invoices (number, customer_id, order_id, issue_date, due_date, status, notes, created_at)
           VALUES (?,?,?,?,?,?,?,?)`,
        [number, o.customerId, o.id, iso(d), iso(new Date(d.getTime() + ri(30, 60) * 86400000)),
         status, "TVA 20%. Pénalités de retard : taux légal en vigueur.", isoTime(d)]).lastInsertRowid,
    );
    const oLines = getAll<any>(`SELECT product_id, description, quantity, unit_price, discount_pct, vat_rate FROM order_lines WHERE order_id = ?`, [o.id]);
    let pos = 1;
    for (const l of oLines) {
      run(`INSERT INTO invoice_lines (invoice_id, product_id, description, quantity, unit_price, discount_pct, vat_rate, position)
           VALUES (?,?,?,?,?,?,?,?)`,
        [id, l.product_id, l.description, l.quantity, l.unit_price, l.discount_pct, l.vat_rate, pos++]);
    }
    recompute(id, "invoices", "invoice_lines");
    const ttc = get1<any>(`SELECT total_ttc FROM invoices WHERE id = ?`, [id])?.total_ttc ?? 0;
    invoices.push({ id, customerId: o.customerId, ttc, date: iso(d), status, number });
  });

  /* ----------------------------- Payments -------------------------- */
  let payN = 1;
  for (const inv of invoices) {
    if (inv.status === "sent" || inv.status === "overdue" || inv.status === "draft") continue;
    const ratio = inv.status === "paid" ? 1 : 0.3 + rnd() * 0.45;
    const n = inv.status === "paid" ? (chance(0.6) ? 2 : 1) : 1;
    let remaining = inv.ttc * ratio;
    for (let k = 0; k < n; k++) {
      const amt = k === n - 1 ? remaining : Math.round(remaining * 0.5 * 100) / 100;
      remaining -= amt;
      const d = new Date(inv.date);
      d.setDate(d.getDate() + ri(5, 50));
      if (d > NOW) continue;
      run(`INSERT INTO payments (ref, invoice_id, customer_id, date, method, amount, reference, notes, user_id)
           VALUES (?,?,?,?,?,?,?,?,?)`,
        [`PAY-${YEAR}-${String(payN++).padStart(4, "0")}`, inv.id, inv.customerId, iso(d),
         pick(["transfer", "cheque", "cash", "card", "transfer"] as const),
         Math.round(amt * 100) / 100, `REF${ri(100000, 999999)}`, "Règlement client", userIds.accountant]);
    }
    const paid = get1<any>(`SELECT COALESCE(SUM(amount),0) AS s FROM payments WHERE invoice_id = ?`, [inv.id])?.s ?? 0;
    run(`UPDATE invoices SET paid_amount = ? WHERE id = ?`, [Math.round(paid * 100) / 100, inv.id]);
  }
  // a few overdue invoices on top of the seeded 'sent' ones
  run(`UPDATE invoices SET status = 'overdue'
       WHERE status = 'partial' AND due_date < date('now') AND id % 3 <> 0`);

  /* ----------------------------- Expenses -------------------------- */
  const EXPENSE_CATS = ["Matières premières", "Énergie", "Maintenance machines", "Transport", "Salaires", "Loyer", "Marketing", "Assurances", "Outillage"];
  for (let i = 1; i <= 46; i++) {
    const d = daysAgo(ri(1, 400));
    const amount = ri(1500, 95000);
    run(`INSERT INTO expenses (ref, date, category, supplier_id, description, amount, vat, ttc, status, payment_method)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [`DEP-${d.getFullYear()}-${String(i).padStart(4, "0")}`, iso(d), pick(EXPENSE_CATS), chance(0.6) ? pick(supIds) : null,
       pick(["Facture fournisseur", "Charges mensuelles", "Achat outillage", "Maintenance préventive", "Campagne publicitaire", "Frais de transport"] as const),
       amount, Math.round(amount * 0.2 * 100) / 100, Math.round(amount * 1.2 * 100) / 100, "paid",
       pick(["transfer", "cheque", "cash"] as const)]);
  }

  /* ---------------------------- Logistics -------------------------- */
  run(`INSERT INTO teams (name, leader_id, members, capacity, zone) VALUES (?,?,?,?,?)`,
    ["Équipe Pose Casablanca", userIds.installer, "Mohammed Sabri, Karim Bennani, Youssef Ait", 3, "Casablanca & région"]);
  run(`INSERT INTO teams (name, leader_id, members, capacity, zone) VALUES (?,?,?,?,?)`,
    ["Équipe Pose Marrakech", userIds.installer, "Hassan El Mansouri, Rachid Bouzid", 2, "Marrakech & Sud"]);
  run(`INSERT INTO teams (name, leader_id, members, capacity, zone) VALUES (?,?,?,?,?)`,
    ["Équipe Pose Tanger", userIds.installer, "Anas Filali, Otmane Zerhouni", 2, "Nord du Royaume"]);
  const teamIds = getAll<any>(`SELECT id FROM teams`)!.map((t) => t.id);

  let livN = 1;
  for (const o of orders) {
    if (!["ready", "delivered", "installed", "completed"].includes(o.status)) continue;
    const d = new Date(o.date);
    d.setDate(d.getDate() + ri(30, 70));
    if (d > NOW) continue;
    const status = ["delivered", "installed", "completed"].includes(o.status) ? "delivered" : chance(0.5) ? "shipped" : "ready";
    const livId = Number(
      run(`INSERT INTO deliveries (number, order_id, customer_id, date, status, driver_id, vehicle, address, city, notes)
           VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [`BL-${d.getFullYear()}-${String(livN++).padStart(4, "0")}`, o.id, o.customerId, iso(d), status,
         userIds.installer, pick(["Camion plateau 3,5T — 12345-A-6", "Fourgon 1,9T — 67890-B-1", "Semi-remorque — 11223-C-19"] as const),
         get1<any>(`SELECT delivery_address, city FROM orders WHERE id = ?`, [o.id])?.delivery_address,
         get1<any>(`SELECT city FROM orders WHERE id = ?`, [o.id])?.city, "Livraison avec protection carton et coins mousse."]).lastInsertRowid,
    );
    const oLines = getAll<any>(`SELECT id, product_id, description, quantity FROM order_lines WHERE order_id = ?`, [o.id]) ?? [];
    for (const l of oLines) {
      run(`INSERT INTO delivery_lines (delivery_id, order_line_id, product_id, description, quantity) VALUES (?,?,?,?,?)`,
        [livId, l.id, l.product_id, l.description, l.quantity]);
      run(`UPDATE order_lines SET delivered_qty = quantity WHERE id = ?`, [l.id]);
    }
  }

  // Before/after installation photography — real files in public/images.
  const INSTALL_IMAGE = [
    "/images/projects/riad-zellige.jpg",
    "/images/projects/technopark-kenitra.jpg",
    "/images/projects/atlas-towers.jpg",
  ];
  const INSTALL_DONE_IMAGE = [
    "/images/projects/marina-bay-residences.jpg",
    "/images/projects/villa-anfa-premium.jpg",
    "/images/projects/hotel-atlas-premium.jpg",
  ];

  let insN = 1;
  for (const o of orders) {
    if (!["delivered", "installed", "completed"].includes(o.status)) continue;
    const d = new Date(o.date);
    d.setDate(d.getDate() + ri(35, 80));
    const isDone = o.status !== "delivered";
    run(`INSERT INTO installations (ref, order_id, customer_id, team_id, appointment_date, address, city, status,
          products, notes, before_photo, after_photo, completed_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [`INS-${YEAR}-${String(insN++).padStart(4, "0")}`, o.id, o.customerId, pick(teamIds), iso(d),
       get1<any>(`SELECT delivery_address FROM orders WHERE id = ?`, [o.id])?.delivery_address,
       get1<any>(`SELECT city FROM orders WHERE id = ?`, [o.id])?.city,
       isDone ? "done" : "planned",
       (getAll<any>(`SELECT description FROM order_lines WHERE order_id = ?`, [o.id]) ?? []).map((x) => x.description).join(" · "),
       isDone ? "Pose terminée, réglages effectués, chantier nettoyé." : "Rendez-vous confirmé avec le client.",
       INSTALL_IMAGE[insN % 3],
       isDone ? INSTALL_DONE_IMAGE[insN % 3] : null,
       isDone ? iso(new Date(d.getTime() + ri(1, 4) * 86400000)) : null]);
  }

  /* --------------------------- Notifications ----------------------- */
  const seedNotifs: [string, string, string, string, string, string, number][] = [
    ["quote_request", "info", "Nouvelle demande de devis", "Baie coulissante 3 rails — Casablanca", "/app/commercial/quotes", "commercial", 0],
    ["quote_request", "info", "Nouvelle demande de devis", "Pergola bioclimatique 4x6 — Marrakech", "/app/commercial/quotes", "commercial", 1],
    ["low_stock", "critical", "Stock critique", "Plusieurs références sous le seuil minimum", "/app/stock/alerts", "stock", 2],
    ["new_order", "success", "Nouvelle commande", "Commande confirmée — Atlas Immobilier SA", "/app/commercial/orders", "commercial", 3],
    ["production_deadline", "warning", "Échéance de production", "3 ordres de fabrication arrivent à échéance cette semaine", "/app/production/planning", "production", 4],
    ["invoice_overdue", "critical", "Facture en retard", "Des factures ont dépassé leur échéance", "/app/finance/invoices?status=overdue", "accountant", 5],
    ["order_ready", "success", "Commande prête à livrer", "2 commandes sont prêtes pour expédition", "/app/logistics/deliveries", "commercial", 6],
    ["production_completed", "success", "Production terminée", "Ordre de fabrication terminé et conforme", "/app/production/kanban", "production", 7],
    ["po_received", "info", "Réception marchandise", "Réception profils aluminium — AluProfil Maroc", "/app/purchasing/receipts", "stock", 8],
  ];
  seedNotifs.forEach(([type, level, title, body, link, , daysBack], i) => {
    run(`INSERT INTO notifications (type, level, title, body, link, audience, read, created_at) VALUES (?,?,?,?,?,?,?,?)`,
      [type, level, title, body, link, "all", i < 4 ? 1 : 0, isoTime(daysAgo(daysBack))]);
  });
  // low stock notifications for real alerts
  const lowItems = getAll<any>(
    `SELECT p.id, p.sku, p.name, p.min_stock, COALESCE(SUM(s.quantity),0) AS qty
     FROM products p LEFT JOIN stock_levels s ON s.product_id = p.id
     WHERE p.min_stock > 0 GROUP BY p.id HAVING qty <= p.min_stock LIMIT 8`,
  ) ?? [];
  for (const it of lowItems) {
    run(`INSERT INTO notifications (type, level, title, body, link, audience, read, created_at) VALUES (?,?,?,?,?,?,?,?)`,
      ["low_stock", "critical", `Stock critique — ${it.sku}`, `${it.name} : ${Math.round(it.qty)} disponible(s), seuil minimum ${it.min_stock}.`,
       `/app/stock/inventory?product=${it.id}`, "stock", 0, isoTime(daysAgo(ri(0, 6)))]);
  }

  /* --------------------------- Site content ------------------------ */
  PROJECTS.forEach(([slugName, title, titleAr, titleEn, category, client, city, year, surface, description], i) => {
    run(`INSERT INTO projects (slug, title, title_ar, title_en, category, client, city, year, surface, description, image, featured, sort_order)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [slugName, title, titleAr, titleEn, category, client, city, year, surface, description,
       `/images/projects/${slugName}.jpg`, i < 4 ? 1 : 0, i]);
  });

  const galleryCats = ["Atelier", "Chantier", "Détails", "Produits"];
  // Real photographs on disk, bucketed by gallery category.
  const GALLERY_IMAGE: Record<string, string[]> = {
    Atelier: ["/images/factory.jpg", "/images/hero.jpg"],
    Chantier: ["/images/projects/momo-box-chantier.jpg", "/images/projects/atlas-towers.jpg"],
    "Détails": ["/images/ranges/aluminium.jpg", "/images/ranges/glass.jpg", "/images/ranges/partitions.jpg"],
    Produits: ["/images/ranges/pvc.jpg", "/images/ranges/pergolas.jpg", "/images/ranges/curtain-walls.jpg", "/images/ranges/momo-box.jpg"],
  };
  for (let i = 1; i <= 18; i++) {
    run(`INSERT INTO gallery_images (src, alt, category, sort_order) VALUES (?,?,?,?)`,
      [(() => {
         const gcat = galleryCats[(i - 1) % 4];
         const pool = GALLERY_IMAGE[gcat];
         return pool[(i - 1) % pool.length];
       })(),
       `Cristalu Maroc — ${galleryCats[(i - 1) % 4]}`, galleryCats[(i - 1) % 4], i]);
  }

  NEWS.forEach(([title, titleAr, category, publishedAt, excerpt, excerptAr], i) => {
    run(`INSERT INTO news_posts (slug, title, title_ar, excerpt, excerpt_ar, content, category, image, published_at, published)
         VALUES (?,?,?,?,?,?,?,?,?,1)`,
      [slug(title), title, titleAr, excerpt, excerptAr, `${excerpt}\n\n${excerptAr}`, category,
       `/images/news/n${(i % 4) + 1}.jpg`, publishedAt]);
  });

  /* ---------------------------- Settings --------------------------- */
  setSetting("company_name", "CRISTALU MAROC SARL");
  setSetting("company_legal", "SARL au capital de 2 000 000 MAD");
  setSetting("company_ice", "001847293000045");
  setSetting("company_if", "40287155");
  setSetting("company_rc", "198472 Casablanca");
  setSetting("company_cnss", "8471920");
  setSetting("company_address", "Zone Industrielle Sidi Ghanem, Lot 42, Casablanca 20250, Maroc");
  setSetting("company_phone", "+212 522 98 45 12");
  setSetting("company_email", "contact@cristalu.ma");
  setSetting("company_website", "www.cristalu.ma");
  setSetting("default_vat", "20");
  setSetting("currency", "MAD");
  setSetting("quote_validity_days", "30");
  setSetting("low_stock_default", "10");
  setSetting("qc_checklist", QC_CRITERIA.join("\n"));
  setSetting("prefix_quote", "DEV");
  setSetting("prefix_order", "CMD");
  setSetting("prefix_mo", "OF");
  setSetting("prefix_invoice", "FAC");
  setSetting("prefix_po", "CA");
  setSetting("prefix_delivery", "BL");

  /* --------------------------- Sequences --------------------------- */
  const syncSeq = (prefix: string, table: string, column = "number") => {
    const rows = getAll<any>(`SELECT ${column} FROM ${table}`);
    const perYear: Record<string, number> = {};
    for (const r of rows) {
      const m = /^([A-Z]+)-(\d{4})-(\d+)$/.exec(String(r[column] ?? ""));
      if (!m) continue;
      perYear[`${m[1]}-${m[2]}`] = Math.max(perYear[`${m[1]}-${m[2]}`] ?? 0, parseInt(m[3], 10));
    }
    for (const [k, v] of Object.entries(perYear)) {
      run(`INSERT INTO sequences (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [k, v]);
    }
  };
  syncSeq("DEV", "quotes");
  syncSeq("CMD", "orders");
  syncSeq("OF", "manufacturing_orders");
  syncSeq("FAC", "invoices");
  syncSeq("CA", "purchase_orders");
  syncSeq("BL", "deliveries");
  syncSeq("REC", "receipts");
  syncSeq("DEM", "quote_requests", "ref");
  // These five use a non-`number` key column and were previously left out, so the
  // counter stayed behind the seeded rows and every next insert hit a UNIQUE clash.
  syncSeq("CLI", "customers", "code");
  syncSeq("DEP", "expenses", "ref");
  syncSeq("INS", "installations", "ref");
  syncSeq("PAY", "payments", "ref");
  syncSeq("QC", "quality_controls", "ref");

  /* ---------------------------- Audit log -------------------------- */
  run(`INSERT INTO audit_logs (user_id, user_name, action, object_type, object_label, created_at) VALUES (?,?,?,?,?,?)`,
    [userIds.admin, "Youssef El Amrani", "SEED", "system", "Chargement du jeu de données de démonstration", isoTime(new Date())]);

  return { ok: true } as const;
}

/* ------------------------------ helpers ---------------------------- */

function slug(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function get1<T = any>(sql: string, params: any[] = []): T | undefined {
  return db.prepare(sql).get(...params) as T | undefined;
}

function getAll<T = any>(sql: string, params: any[] = []): T[] {
  return db.prepare(sql).all(...params) as T[];
}

function r2q(n: number) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function recompute(id: number, table: string, lineTable: string) {
  const lines = db.prepare(`SELECT quantity, unit_price, discount_pct, vat_rate FROM ${lineTable} WHERE ${table.slice(0, -1)}_id = ?`).all(id) as any[];
  const g = table === "quotes" ? (get1<any>(`SELECT discount_pct FROM quotes WHERE id = ?`, [id])?.discount_pct ?? 0) : 0;
  let ht = 0, vat = 0;
  for (const l of lines) {
    const base = l.quantity * l.unit_price * (1 - (l.discount_pct || 0) / 100) * (1 - (g || 0) / 100);
    ht += base;
    vat += base * ((l.vat_rate || 0) / 100);
  }
  run(`UPDATE ${table} SET total_ht = ?, total_vat = ?, total_ttc = ? WHERE id = ?`,
    [Math.round(ht * 100) / 100, Math.round(vat * 100) / 100, Math.round((ht + vat) * 100) / 100, id]);
}

function recomputePO(poId: number) {
  const lines = db.prepare(`SELECT quantity, unit_price, vat_rate FROM po_lines WHERE po_id = ?`).all(poId) as any[];
  let ht = 0, vat = 0;
  for (const l of lines) {
    ht += l.quantity * l.unit_price;
    vat += l.quantity * l.unit_price * ((l.vat_rate || 0) / 100);
  }
  run(`UPDATE purchase_orders SET total_ht=?, total_vat=?, total_ttc=? WHERE id=?`,
    [Math.round(ht * 100) / 100, Math.round(vat * 100) / 100, Math.round((ht + vat) * 100) / 100, poId]);
}

/**
 * Material requirement from BOM.
 * basis: unit | area (m²) | perimeter (ml) | width | height (mm)
 */
export function computeNeed(item: { basis: string; qty_per: number; wastage: number }, w: number, h: number, qty: number) {
  const W = Number(w) || 0, H = Number(h) || 0, Q = Number(qty) || 1;
  const area = (W * H) / 1_000_000;
  const perimeter = (2 * (W + H)) / 1000;
  let base = 0;
  switch (item.basis) {
    case "area": base = area * item.qty_per * Q; break;
    case "perimeter": base = perimeter * item.qty_per * Q; break;
    case "width": base = (W / 1000) * item.qty_per * Q; break;
    case "height": base = (H / 1000) * item.qty_per * Q; break;
    default: base = item.qty_per * Q;
  }
  return base * (1 + (Number(item.wastage) || 0) / 100);
}
