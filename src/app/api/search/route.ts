import { NextResponse } from "next/server";
import { can, getSessionUser, type ModuleKey } from "@/lib/auth";
import { all } from "@/lib/db";

/** Global search: customers, products, quotes, orders, invoices, suppliers, manufacturing orders. */
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const like = `%${q}%`;
  const out: any[] = [];
  const limit = 6;

  const push = (
    module: ModuleKey,
    kind: string,
    rows: any[],
    map: (r: any) => { label: string; sub?: string; href: string },
  ) => {
    if (!can(user.role, module, "view")) return;
    for (const r of rows.slice(0, limit)) out.push({ kind, id: r.id, ...map(r) });
  };

  push(
    "customers",
    "customer",
    all(
      `SELECT id, company, contact_name, city, code, status FROM customers
       WHERE company LIKE ? OR contact_name LIKE ? OR code LIKE ? OR email LIKE ? OR phone LIKE ?
       ORDER BY status DESC, company LIMIT ?`,
      [like, like, like, like, like, limit * 2],
    ),
    (r) => ({
      label: r.company || r.contact_name,
      sub: `${r.code} · ${r.city ?? ""} · ${r.status === "prospect" ? "Prospect" : "Client"}`,
      href: `/app/commercial/customers/${r.id}`,
    }),
  );

  push(
    "products",
    "product",
    all(
      `SELECT p.id, p.sku, p.name, c.name AS cat FROM products p LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.sku LIKE ? OR p.name LIKE ? ORDER BY p.sku LIMIT ?`,
      [like, like, limit * 2],
    ),
    (r) => ({ label: `${r.sku} — ${r.name}`, sub: r.cat, href: `/app/stock/products/${r.id}` }),
  );

  push(
    "quotes",
    "quote",
    all(
      `SELECT q.id, q.number, q.status, q.total_ttc, c.company FROM quotes q
       LEFT JOIN customers c ON c.id = q.customer_id
       WHERE q.number LIKE ? OR c.company LIKE ? OR q.project LIKE ? ORDER BY q.id DESC LIMIT ?`,
      [like, like, like, limit * 2],
    ),
    (r) => ({ label: r.number, sub: `${r.company ?? ""} · ${r.status}`, href: `/app/commercial/quotes/${r.id}` }),
  );

  push(
    "orders",
    "order",
    all(
      `SELECT o.id, o.number, o.status, c.company FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id
       WHERE o.number LIKE ? OR c.company LIKE ? ORDER BY o.id DESC LIMIT ?`,
      [like, like, limit * 2],
    ),
    (r) => ({ label: r.number, sub: `${r.company ?? ""} · ${r.status}`, href: `/app/commercial/orders/${r.id}` }),
  );

  push(
    "invoices",
    "invoice",
    all(
      `SELECT i.id, i.number, i.status, i.total_ttc, c.company FROM invoices i
       LEFT JOIN customers c ON c.id = i.customer_id
       WHERE i.number LIKE ? OR c.company LIKE ? ORDER BY i.id DESC LIMIT ?`,
      [like, like, limit * 2],
    ),
    (r) => ({ label: r.number, sub: `${r.company ?? ""} · ${r.status}`, href: `/app/finance/invoices/${r.id}` }),
  );

  push(
    "suppliers",
    "supplier",
    all(`SELECT id, name, category, city FROM suppliers WHERE name LIKE ? OR code LIKE ? ORDER BY name LIMIT ?`, [like, like, limit * 2]),
    (r) => ({ label: r.name, sub: `${r.category ?? ""} · ${r.city ?? ""}`, href: `/app/purchasing/suppliers?focus=${r.id}` }),
  );

  push(
    "manufacturing",
    "mo",
    all(
      `SELECT m.id, m.number, m.status, m.description FROM manufacturing_orders m
       WHERE m.number LIKE ? OR m.description LIKE ? ORDER BY m.id DESC LIMIT ?`,
      [like, like, limit * 2],
    ),
    (r) => ({ label: r.number, sub: `${r.description ?? ""} · ${r.status}`, href: `/app/production/manufacturing/${r.id}` }),
  );

  return NextResponse.json(out.slice(0, 30));
}
