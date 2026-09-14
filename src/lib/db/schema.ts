export const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sequences (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);

/* ---------------- Users & access ---------------- */
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  job_title TEXT,
  phone TEXT,
  color TEXT DEFAULT '#E30613',
  active INTEGER NOT NULL DEFAULT 1,
  last_login TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

/* ---------------- CRM ---------------- */
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'prospect',          -- prospect | customer
  type TEXT NOT NULL DEFAULT 'entreprise',          -- particulier | entreprise
  company TEXT,
  contact_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  phone2 TEXT,
  ice TEXT,
  if_code TEXT,
  rc TEXT,
  cnss TEXT,
  patente TEXT,
  address TEXT,
  city TEXT,
  zip TEXT,
  website TEXT,
  activity TEXT,
  source TEXT,
  owner_id INTEGER,
  tags TEXT,
  notes TEXT,
  credit_limit REAL DEFAULT 0,
  payment_terms TEXT DEFAULT '30 jours',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customer_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL, role TEXT, email TEXT, phone TEXT, is_primary INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  category TEXT,
  contact_name TEXT, email TEXT, phone TEXT,
  address TEXT, city TEXT, ice TEXT, if_code TEXT, rc TEXT,
  payment_terms TEXT DEFAULT '30 jours',
  rating INTEGER DEFAULT 3,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

/* ---------------- Catalogue ---------------- */
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_ar TEXT,
  name_en TEXT,
  kind TEXT DEFAULT 'product',      -- product | material
  description TEXT,
  icon TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_ar TEXT,
  name_en TEXT,
  category_id INTEGER REFERENCES categories(id),
  kind TEXT NOT NULL DEFAULT 'finished',   -- finished | material
  unit TEXT NOT NULL DEFAULT 'U',          -- U | M | M2 | KG | LOT
  description TEXT,
  purchase_cost REAL NOT NULL DEFAULT 0,
  selling_price REAL NOT NULL DEFAULT 0,
  vat_rate REAL NOT NULL DEFAULT 20,
  min_stock REAL NOT NULL DEFAULT 0,
  weight REAL DEFAULT 0,
  image TEXT,
  color TEXT,
  status TEXT NOT NULL DEFAULT 'active',   -- active | inactive | archived
  trackable INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS warehouses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_ar TEXT,
  name_en TEXT,
  address TEXT,
  manager_id INTEGER,
  is_default INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stock_levels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  quantity REAL NOT NULL DEFAULT 0,
  reserved REAL NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(product_id, warehouse_id)
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref TEXT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  from_warehouse_id INTEGER REFERENCES warehouses(id),
  type TEXT NOT NULL,            -- IN | OUT | TRANSFER | ADJUSTMENT | RETURN | PRODUCTION_CONSUMPTION
  quantity REAL NOT NULL,
  unit_cost REAL DEFAULT 0,
  user_id INTEGER,
  related_type TEXT,
  related_id INTEGER,
  note TEXT,
  date TEXT NOT NULL DEFAULT (datetime('now'))
);

/* ---------------- BOM / Nomenclature ---------------- */
CREATE TABLE IF NOT EXISTS boms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  version TEXT DEFAULT 'V1',
  name TEXT,
  active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS bom_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bom_id INTEGER NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
  component_id INTEGER NOT NULL REFERENCES products(id),
  basis TEXT NOT NULL DEFAULT 'unit',   -- unit | area | perimeter | width | height
  qty_per REAL NOT NULL DEFAULT 1,      -- qty per unit of basis
  wastage REAL NOT NULL DEFAULT 0,      -- % waste
  note TEXT
);

/* ---------------- Demandes de devis (site public) ---------------- */
CREATE TABLE IF NOT EXISTS quote_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref TEXT UNIQUE,
  customer_name TEXT NOT NULL,
  company TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT,
  product TEXT NOT NULL,
  width REAL, height REAL, quantity REAL DEFAULT 1,
  color TEXT, glass_type TEXT, opening_system TEXT,
  accessories TEXT,
  installation INTEGER DEFAULT 0,
  comments TEXT,
  file_path TEXT,
  file_name TEXT,
  status TEXT NOT NULL DEFAULT 'new',   -- new | processing | quoted | converted | closed
  priority TEXT DEFAULT 'normal',
  assignee_id INTEGER,
  customer_id INTEGER,
  quote_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

/* ---------------- Devis ---------------- */
CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  project TEXT,
  salesperson_id INTEGER,
  issue_date TEXT NOT NULL,
  validity_date TEXT,
  currency TEXT DEFAULT 'MAD',
  discount_pct REAL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',   -- draft | sent | negotiation | accepted | rejected
  payment_terms TEXT DEFAULT '30% à la commande',
  notes TEXT,
  total_ht REAL DEFAULT 0,
  total_vat REAL DEFAULT 0,
  total_ttc REAL DEFAULT 0,
  source TEXT DEFAULT 'manual',
  request_id INTEGER,
  order_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS quote_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  description TEXT NOT NULL,
  width REAL DEFAULT 0, height REAL DEFAULT 0,
  quantity REAL NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  discount_pct REAL DEFAULT 0,
  vat_rate REAL DEFAULT 20,
  position INTEGER DEFAULT 1
);

/* ---------------- Commandes ---------------- */
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  quote_id INTEGER,
  order_date TEXT NOT NULL,
  expected_date TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  salesperson_id INTEGER,
  priority TEXT DEFAULT 'normal',
  delivery_address TEXT,
  city TEXT,
  notes TEXT,
  total_ht REAL DEFAULT 0, total_vat REAL DEFAULT 0, total_ttc REAL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  description TEXT NOT NULL,
  width REAL DEFAULT 0, height REAL DEFAULT 0,
  quantity REAL NOT NULL DEFAULT 1,
  delivered_qty REAL NOT NULL DEFAULT 0,
  unit_price REAL NOT NULL DEFAULT 0,
  discount_pct REAL DEFAULT 0,
  vat_rate REAL DEFAULT 20,
  position INTEGER DEFAULT 1
);

/* ---------------- Production ---------------- */
CREATE TABLE IF NOT EXISTS manufacturing_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT NOT NULL UNIQUE,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  order_line_id INTEGER,
  customer_id INTEGER,
  product_id INTEGER REFERENCES products(id),
  description TEXT,
  width REAL DEFAULT 0, height REAL DEFAULT 0,
  quantity REAL NOT NULL DEFAULT 1,
  produced_qty REAL NOT NULL DEFAULT 0,
  priority TEXT DEFAULT 'normal',      -- low | normal | high | urgent
  assignee_id INTEGER,
  workstation TEXT,
  start_date TEXT, end_date TEXT,
  status TEXT NOT NULL DEFAULT 'to_prepare',
  materials_reserved INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mo_materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mo_id INTEGER NOT NULL REFERENCES manufacturing_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  required_qty REAL NOT NULL DEFAULT 0,
  reserved_qty REAL NOT NULL DEFAULT 0,
  consumed_qty REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quality_controls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref TEXT UNIQUE,
  mo_id INTEGER REFERENCES manufacturing_orders(id) ON DELETE SET NULL,
  order_id INTEGER,
  product_id INTEGER,
  quantity REAL DEFAULT 1,
  inspector_id INTEGER,
  date TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'passed',   -- passed | failed | correction
  score INTEGER DEFAULT 100,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS qc_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  qc_id INTEGER NOT NULL REFERENCES quality_controls(id) ON DELETE CASCADE,
  criterion TEXT NOT NULL,
  result TEXT NOT NULL DEFAULT 'ok',   -- ok | ko | na
  note TEXT,
  photo TEXT
);

/* ---------------- Achats ---------------- */
CREATE TABLE IF NOT EXISTS purchase_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT NOT NULL UNIQUE,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  warehouse_id INTEGER,
  order_date TEXT NOT NULL,
  expected_date TEXT,
  status TEXT NOT NULL DEFAULT 'draft',  -- draft | sent | confirmed | partial | received | cancelled
  currency TEXT DEFAULT 'MAD',
  notes TEXT,
  total_ht REAL DEFAULT 0, total_vat REAL DEFAULT 0, total_ttc REAL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS po_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  po_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity REAL NOT NULL DEFAULT 0,
  received_qty REAL NOT NULL DEFAULT 0,
  unit_price REAL NOT NULL DEFAULT 0,
  vat_rate REAL DEFAULT 20,
  position INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT UNIQUE,
  po_id INTEGER REFERENCES purchase_orders(id),
  supplier_id INTEGER,
  warehouse_id INTEGER,
  date TEXT NOT NULL DEFAULT (datetime('now')),
  user_id INTEGER,
  status TEXT DEFAULT 'received',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS receipt_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_id INTEGER NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  po_line_id INTEGER,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity REAL NOT NULL DEFAULT 0,
  unit_price REAL DEFAULT 0
);

/* ---------------- Finance ---------------- */
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  order_id INTEGER,
  issue_date TEXT NOT NULL,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'draft',   -- draft | sent | partial | paid | overdue | cancelled
  total_ht REAL DEFAULT 0, total_vat REAL DEFAULT 0, total_ttc REAL DEFAULT 0,
  paid_amount REAL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoice_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id INTEGER,
  description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  discount_pct REAL DEFAULT 0,
  vat_rate REAL DEFAULT 20,
  position INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref TEXT UNIQUE,
  invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
  customer_id INTEGER,
  date TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'transfer',  -- cash | transfer | cheque | card | other
  amount REAL NOT NULL DEFAULT 0,
  reference TEXT,
  notes TEXT,
  user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref TEXT UNIQUE,
  date TEXT NOT NULL,
  category TEXT,
  supplier_id INTEGER,
  description TEXT,
  amount REAL NOT NULL DEFAULT 0,
  vat REAL DEFAULT 0,
  ttc REAL DEFAULT 0,
  status TEXT DEFAULT 'paid',
  payment_method TEXT DEFAULT 'transfer',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

/* ---------------- Logistique ---------------- */
CREATE TABLE IF NOT EXISTS deliveries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT UNIQUE,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  customer_id INTEGER,
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'preparing',  -- preparing | ready | shipped | delivered
  driver_id INTEGER,
  vehicle TEXT,
  address TEXT,
  city TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS delivery_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  delivery_id INTEGER NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  order_line_id INTEGER,
  product_id INTEGER,
  description TEXT,
  quantity REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  leader_id INTEGER,
  members TEXT,
  capacity INTEGER DEFAULT 1,
  zone TEXT
);

CREATE TABLE IF NOT EXISTS installations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref TEXT UNIQUE,
  order_id INTEGER,
  delivery_id INTEGER,
  customer_id INTEGER,
  team_id INTEGER,
  appointment_date TEXT,
  address TEXT,
  city TEXT,
  status TEXT NOT NULL DEFAULT 'planned',  -- planned | in_progress | done | cancelled
  products TEXT,
  notes TEXT,
  before_photo TEXT,
  after_photo TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

/* ---------------- Transverse ---------------- */
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  level TEXT DEFAULT 'info',   -- info | success | warning | critical
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  audience TEXT DEFAULT 'all',
  read INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  user_name TEXT,
  action TEXT NOT NULL,
  object_type TEXT,
  object_id INTEGER,
  object_label TEXT,
  old_value TEXT,
  new_value TEXT,
  ip TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

/* ---------------- Contenu site public ---------------- */
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE,
  title TEXT NOT NULL,
  title_ar TEXT,
  title_en TEXT,
  category TEXT,
  client TEXT,
  city TEXT,
  year INTEGER,
  surface REAL,
  description TEXT,
  description_ar TEXT,
  description_en TEXT,
  image TEXT,
  featured INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  published INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS gallery_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  src TEXT NOT NULL,
  alt TEXT,
  category TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS news_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE,
  title TEXT NOT NULL,
  title_ar TEXT,
  excerpt TEXT,
  excerpt_ar TEXT,
  content TEXT,
  category TEXT,
  image TEXT,
  published_at TEXT,
  published INTEGER DEFAULT 1
);

/* ---------------- Indexes ---------------- */
CREATE INDEX IF NOT EXISTS idx_products_cat ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_mo_status ON manufacturing_orders(status);
CREATE INDEX IF NOT EXISTS idx_inv_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_inv_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_pay_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_stock_product ON stock_levels(product_id);
CREATE INDEX IF NOT EXISTS idx_mov_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_logs(created_at);
`;

export const WORKFLOWS = {
  quote: ["draft", "sent", "negotiation", "accepted", "rejected"] as const,
  order: [
    "new", "confirmed", "to_produce", "in_production", "quality_control",
    "ready", "delivered", "installed", "completed", "cancelled",
  ] as const,
  mo: ["to_prepare", "cutting", "machining", "assembly", "glazing", "quality_control", "completed"] as const,
  po: ["draft", "sent", "confirmed", "partial", "received", "cancelled"] as const,
  invoice: ["draft", "sent", "partial", "paid", "overdue", "cancelled"] as const,
  delivery: ["preparing", "ready", "shipped", "delivered"] as const,
  installation: ["planned", "in_progress", "done", "cancelled"] as const,
  qc: ["passed", "failed", "correction"] as const,
  movement: ["IN", "OUT", "TRANSFER", "ADJUSTMENT", "RETURN", "PRODUCTION_CONSUMPTION"] as const,
};
