import { seedDatabase } from "../src/lib/db/seed";
import { all } from "../src/lib/db";

(async () => {
  const t0 = Date.now();
  await seedDatabase();
  const count = (t: string) => (all<any>(`SELECT COUNT(*) AS c FROM ${t}`)[0]?.c ?? 0);
  console.log("Seeded in", Date.now() - t0, "ms");
  for (const t of ["users", "categories", "products", "warehouses", "stock_levels", "boms", "bom_items",
                   "suppliers", "customers", "quote_requests", "quotes", "quote_lines", "orders", "order_lines",
                   "manufacturing_orders", "mo_materials", "quality_controls", "purchase_orders", "receipts",
                   "invoices", "payments", "expenses", "deliveries", "installations", "notifications",
                   "audit_logs", "projects", "gallery_images", "news_posts"]) {
    console.log(`  ${t.padEnd(24)} ${count(t)}`);
  }
})();
