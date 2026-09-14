"use server";

import fs from "node:fs";
import path from "node:path";
import { audit, nextSeq, notify, run } from "@/lib/db";
import { slugify } from "@/lib/utils";

export type QuoteRequestResult =
  | { ok: true; ref: string }
  | { ok: false; error: string; field?: string };

const MAX_FILE = 10 * 1024 * 1024; // 10 MB
const ALLOWED = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/dwg",
  "application/acad",
  "application/x-dwg",
  "application/octet-stream",
];

export async function submitQuoteRequest(formData: FormData): Promise<QuoteRequestResult> {
  const get = (k: string) => String(formData.get(k) ?? "").trim();

  const customerName = get("customer_name");
  const phone = get("phone");
  const email = get("email");
  const product = get("product");

  // --- validation -------------------------------------------------------
  if (!customerName) return { ok: false, error: "errRequired", field: "customer_name" };
  if (!phone || phone.replace(/\D/g, "").length < 8) return { ok: false, error: "errPhone", field: "phone" };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: "errEmail", field: "email" };
  if (!product) return { ok: false, error: "errRequired", field: "product" };

  // --- optional file ----------------------------------------------------
  let filePath: string | null = null;
  let fileName: string | null = null;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_FILE) return { ok: false, error: "errFile", field: "file" };
    if (file.type && !ALLOWED.includes(file.type) && !file.name.match(/\.(pdf|jpe?g|png|webp|dwg|dxf)$/i)) {
      return { ok: false, error: "errFile", field: "file" };
    }
    const dir = path.join(process.cwd(), "data", "uploads", "quote-requests");
    fs.mkdirSync(dir, { recursive: true });
    const ext = path.extname(file.name).toLowerCase().slice(0, 8) || ".bin";
    const safe = `${Date.now()}-${slugify(path.basename(file.name, ext)).slice(0, 40) || "file"}${ext}`;
    fs.writeFileSync(path.join(dir, safe), Buffer.from(await file.arrayBuffer()));
    filePath = path.posix.join("/data/uploads/quote-requests", safe);
    fileName = file.name;
  }

  const ref = nextSeq("DEM");

  run(
    `INSERT INTO quote_requests
      (ref, customer_name, company, phone, email, city, product, width, height, quantity,
       color, glass_type, opening_system, accessories, installation, comments, file_path, file_name, status)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'new')`,
    [
      ref,
      customerName,
      get("company") || null,
      phone,
      email,
      get("city") || null,
      product,
      numOrNull(get("width")),
      numOrNull(get("height")),
      numOrNull(get("quantity")) ?? 1,
      get("color") || null,
      get("glass_type") || null,
      get("opening_system") || null,
      get("accessories") || null,
      formData.get("installation") === "1" ? 1 : 0,
      get("comments") || null,
      filePath,
      fileName,
    ],
  );

  // The request must be visible to the sales team immediately.
  notify({
    type: "quote_request",
    level: "info",
    title: "Nouvelle demande de devis",
    body: `${customerName} — ${product}${get("city") ? ` · ${get("city")}` : ""}`,
    link: "/app/commercial/quotes?requests=1",
    audience: "commercial",
  });

  audit({
    action: "CREATE",
    objectType: "quote_request",
    objectLabel: `${ref} — ${customerName}`,
    newValue: { customerName, product, email, phone, city: get("city") },
    ip: "public-website",
    userName: "Site public",
  });

  return { ok: true, ref };
}

function numOrNull(v: string) {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
