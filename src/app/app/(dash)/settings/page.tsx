import { PageHeader } from "@/components/dash/PageHeader";
import { saveSettingsForm } from "@/lib/actions";
import { ReseedButton } from "./ReseedButton";
import { all, get, getSetting } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { QC_CRITERIA } from "@/lib/qc";

const NUMBERING = [
  { key: "prefix_quote", label: "quotes.number", sample: "DEV-2026-0001" },
  { key: "prefix_order", label: "menu.orders", sample: "CMD-2026-0001" },
  { key: "prefix_mo", label: "production.number", sample: "OF-2026-0001" },
  { key: "prefix_invoice", label: "menu.invoices", sample: "FAC-2026-0001" },
  { key: "prefix_po", label: "menu.purchaseOrders", sample: "CA-2026-0001" },
  { key: "prefix_delivery", label: "menu.deliveries", sample: "BL-2026-0001" },
];

export default async function SettingsPage() {
  await requirePerm("settings");
  const { t, num } = await getI18n();

  const val = (k: string, fallback = "") => getSetting(k) ?? fallback;
  const checklist = (val("qc_checklist", QC_CRITERIA.map((c) => c.label).join(", ")))
    .split(",").map((s) => s.trim()).filter(Boolean);

  const counts: { label: string; n: number }[] = [
    { label: t("menu.customers"), n: get<any>(`SELECT COUNT(*) c FROM customers`)?.c ?? 0 },
    { label: t("menu.quotes"), n: get<any>(`SELECT COUNT(*) c FROM quotes`)?.c ?? 0 },
    { label: t("menu.orders"), n: get<any>(`SELECT COUNT(*) c FROM orders`)?.c ?? 0 },
    { label: t("menu.manufacturing"), n: get<any>(`SELECT COUNT(*) c FROM manufacturing_orders`)?.c ?? 0 },
    { label: t("menu.invoices"), n: get<any>(`SELECT COUNT(*) c FROM invoices`)?.c ?? 0 },
    { label: t("menu.products"), n: get<any>(`SELECT COUNT(*) c FROM products`)?.c ?? 0 },
    { label: t("menu.movements"), n: get<any>(`SELECT COUNT(*) c FROM stock_movements`)?.c ?? 0 },
    { label: t("menu.notifications"), n: get<any>(`SELECT COUNT(*) c FROM notifications`)?.c ?? 0 },
    { label: t("menu.audit"), n: get<any>(`SELECT COUNT(*) c FROM audit_logs`)?.c ?? 0 },
  ];

  return (
    <>
      <PageHeader
          title={t("settings.title")}
          subtitle={t("settings.subtitle")}
          breadcrumb={[{ label: t("menu.settings") }]}
          actions={
            <button type="submit" className="btn btn-primary" form="settings-form">
              {t("actions.save")}
            </button>
          }
        />

      <form id="settings-form" action={saveSettingsForm} className="space-y-4">
        <section className="card card-pad">
          <h2 className="section-title">{t("settings.company")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="label">{t("table.name")}</label>
              <input className="input" name="company_name" defaultValue={val("company_name", "CRISTALU MAROC")} />
            </div>
            <div>
              <label className="label">{t("settings.legal")}</label>
              <input className="input" name="company_legal" defaultValue={val("company_legal", "CRISTALU MAROC SARL")} />
            </div>
            <div>
              <label className="label">ICE</label>
              <input className="input" name="company_ice" defaultValue={val("company_ice", "002345678000045")} />
            </div>
            <div>
              <label className="label">IF</label>
              <input className="input" name="company_if" defaultValue={val("company_if", "40215678")} />
            </div>
            <div>
              <label className="label">RC</label>
              <input className="input" name="company_rc" defaultValue={val("company_rc", "385421")} />
            </div>
            <div>
              <label className="label">CNSS</label>
              <input className="input" name="company_cnss" defaultValue={val("company_cnss", "7845120")} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">{t("logistics.address")}</label>
              <input className="input" name="company_address" defaultValue={val("company_address", "Zone Industrielle Sidi Ghanem, Marrakech")} />
            </div>
            <div>
              <label className="label">{t("table.phone")}</label>
              <input className="input" name="company_phone" defaultValue={val("company_phone", "+212 524 00 00 00")} />
            </div>
            <div>
              <label className="label">{t("table.email")}</label>
              <input className="input" name="company_email" defaultValue={val("company_email", "contact@cristalu.ma")} />
            </div>
            <div>
              <label className="label">{t("common.learnMore")}</label>
              <input className="input" name="company_website" defaultValue={val("company_website", "cristalu.ma")} />
            </div>
          </div>
        </section>

        <section className="card card-pad">
          <h2 className="section-title">{t("settings.legal")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label">{t("settings.vat")} (%)</label>
              <input className="input" type="number" name="default_vat" defaultValue={val("default_vat", "20")} />
            </div>
            <div>
              <label className="label">{t("settings.currency")}</label>
              <input className="input" name="currency" defaultValue={val("currency", "MAD")} />
            </div>
            <div>
              <label className="label">{t("settings.quoteValidity")} ({t("common.days")})</label>
              <input className="input" type="number" name="quote_validity_days" defaultValue={val("quote_validity_days", "30")} />
            </div>
            <div>
              <label className="label">{t("settings.lowStockDefault")}</label>
              <input className="input" type="number" name="low_stock_default" defaultValue={val("low_stock_default", "10")} />
            </div>
          </div>
        </section>

        <section className="card card-pad">
          <h2 className="section-title">{t("settings.numbering")}</h2>
          <p className="mt-1 text-[12.5px] text-ink-500">{t("settings.numberingSub")}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {NUMBERING.map((n) => (
              <div key={n.key}>
                <label className="label">{t(n.label)}</label>
                <div className="flex items-center gap-2">
                  <input className="input font-mono" name={n.key} defaultValue={val(n.key, n.sample.split("-")[0])} />
                  <span className="shrink-0 font-mono text-[11.5px] text-ink-400">{n.sample}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card card-pad">
          <h2 className="section-title">{t("settings.qcChecklist")}</h2>
          <p className="mt-1 text-[12.5px] text-ink-500">{t("settings.qcChecklistSub")}</p>
          <textarea
            className="input mt-3 min-h-[92px] font-mono text-[12.5px]"
            name="qc_checklist"
            defaultValue={checklist.join(", ")}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {checklist.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-2 rounded-lg border border-ink-900/10 bg-ink-50/60 px-2.5 py-1 text-[12px] font-semibold text-ink-700">
                <span className="rounded bg-ink-900/8 px-1.5 text-[10px] font-bold tnum text-ink-500">{i + 1}</span>
                {c}
              </span>
            ))}
          </div>
        </section>

        <section className="card card-pad">
          <h2 className="section-title">{t("settings.dangerZone")}</h2>
          <p className="mt-1 text-[12.5px] text-ink-500">{t("settings.reseedHint")}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {counts.map((c) => (
              <div key={c.label} className="rounded-lg border border-ink-900/8 bg-ink-50/50 px-3 py-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{c.label}</p>
                <p className="mt-0.5 font-display text-[17px] font-bold text-ink-900 tnum">{num(c.n)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <ReseedButton />
          </div>
        </section>
      </form>
    </>
  );
}
