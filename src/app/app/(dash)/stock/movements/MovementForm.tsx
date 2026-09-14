"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { saveStockMovement } from "@/lib/actions";
import { useI18n } from "@/i18n";

const TYPES = ["IN", "OUT", "TRANSFER", "ADJUSTMENT", "RETURN", "PRODUCTION_CONSUMPTION"];

export type ProductOpt = { id: number; sku: string; name: string; unit: string; onHand: number };
export type WarehouseOpt = { id: number; code: string; name: string };

export function MovementForm({
  products, warehouses,
}: { products: ProductOpt[]; warehouses: WarehouseOpt[] }) {
  const { t, num } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState("IN");
  const [productId, setProductId] = useState(products[0] ? String(products[0].id) : "");
  const [warehouseId, setWarehouseId] = useState(warehouses[0] ? String(warehouses[0].id) : "");
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [note, setNote] = useState("");

  const isTransfer = type === "TRANSFER";
  const product = products.find((p) => String(p.id) === productId);
  // OUT / consumption cannot exceed what is on hand
  const reducing = type === "OUT" || type === "PRODUCTION_CONSUMPTION";
  const tooMuch = reducing && product ? quantity > product.onHand : false;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!productId || !warehouseId || !quantity) { setError(t("actions.noData")); return; }
    if (isTransfer && !fromWarehouseId) { setError(t("stock.fromWarehouse")); return; }
    if (tooMuch) { setError(`${t("table.available")}: ${num(product?.onHand ?? 0)}`); return; }

    const fd = new FormData();
    fd.set("type", type);
    fd.set("product_id", productId);
    fd.set("warehouse_id", warehouseId);
    if (isTransfer) fd.set("from_warehouse_id", fromWarehouseId);
    fd.set("quantity", String(quantity));
    fd.set("unit_cost", String(unitCost));
    fd.set("note", note);

    startTransition(async () => {
      const res = await saveStockMovement(fd);
      if (res.ok) router.push("/app/stock/movements");
      else setError(res.error ?? t("actions.noAccess"));
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <section className="card card-pad">
        <h2 className="section-title">{t("stock.newMovement")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="label">{t("stock.movementType")}</label>
            <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((ty) => <option key={ty} value={ty}>{t(`statuses.${ty}`)}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">{t("table.product")}</label>
            <select className="select" value={productId} onChange={(e) => setProductId(e.target.value)}>
              {products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
            </select>
          </div>

          {isTransfer && (
            <div>
              <label className="label">{t("stock.fromWarehouse")}</label>
              <select className="select" value={fromWarehouseId} onChange={(e) => setFromWarehouseId(e.target.value)}>
                <option value="">—</option>
                {warehouses.filter((w) => String(w.id) !== warehouseId).map((w) => (
                  <option key={w.id} value={w.id}>{w.code} — {w.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label">{isTransfer ? t("stock.toWarehouse") : t("table.warehouse")}</label>
            <select className="select" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
              {warehouses.filter((w) => !isTransfer || String(w.id) !== fromWarehouseId).map((w) => (
                <option key={w.id} value={w.id}>{w.code} — {w.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">{t("stock.quantity")} {product ? `(${product.unit})` : ""}</label>
            <input className="input tnum" type="number" min="0.01" step="0.01"
              value={quantity || ""} onChange={(e) => setQuantity(Number(e.target.value))} required />
          </div>

          <div>
            <label className="label">{t("table.cost")}</label>
            <input className="input tnum" type="number" min="0" step="0.01"
              value={unitCost || ""} onChange={(e) => setUnitCost(Number(e.target.value))} />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="label">{t("stock.reason")}</label>
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>

        {product && (
          <p className={"mt-4 text-[12.5px] font-semibold " + (tooMuch ? "text-brand-600" : "text-ink-500")}>
            {t("table.onHand")}: {num(Math.round(product.onHand))} {product.unit}
            {tooMuch && ` — ${t("table.available")}: ${num(Math.round(product.onHand))}`}
          </p>
        )}
      </section>

      {error && (
        <p className="rounded-lg border border-brand-600/25 bg-brand-600/8 px-4 py-2.5 text-[13px] font-semibold text-brand-700">{error}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" className="btn btn-primary" disabled={pending || tooMuch}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}{t("actions.save")}
        </button>
        <Link href="/app/stock/movements" className="btn-outline btn-sm">{t("actions.cancel")}</Link>
      </div>
    </form>
  );
}
