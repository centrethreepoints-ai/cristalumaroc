import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle, ArrowRight, BadgeDollarSign, Bell, CheckCircle2, ClipboardCheck, Clock,
  FileText, PackageSearch, Plus, Receipt, ShoppingCart, TrendingUp, TriangleAlert, Wallet,
} from "lucide-react";
import { getSessionUser, can } from "@/lib/auth";
import { getI18n } from "@/i18n/server";
import {
  getInventoryByWarehouse, getKpis, getLowStockProducts, getNewRequests, getOrdersByStatus,
  getOverdueInvoices, getPaymentSeries, getProductionByStation, getProductionDeadlines,
  getQuoteSeries, getRecentActivity, getRecentOrders, getRecentQuotes, getRevenueSeries,
  getTopCustomers, getTopProducts,
} from "@/lib/dash-data";
import { PageHeader } from "@/components/dash/PageHeader";
import { Card, StatCard } from "@/components/dash/StatCard";
import { StatusBadge } from "@/components/dash/StatusBadge";
import { Charts } from "./Charts";

export default async function DashboardPage() {
  // Do not assert non-null: React can evaluate this child before the guarded
  // layout's redirect unwinds, so an anonymous hit used to throw a TypeError.
  const user = await getSessionUser();
  if (!user) redirect("/app/login");
  const { t, locale, money, compact, date, month } = await getI18n();

  const k = getKpis();
  const revenue = getRevenueSeries();
  const quotes = getQuoteSeries();
  const ordersByStatus = getOrdersByStatus();
  const production = getProductionByStation();
  const inventory = getInventoryByWarehouse();
  const payments = getPaymentSeries();

  const pct = (cur: number, prev: number) => (prev > 0 ? ((cur - prev) / prev) * 100 : 0);
  const st = (s: string) => t(`statuses.${s}`);

  return (
    <>
      <PageHeader
        title={`${t("dash.welcome")}, ${user.fullName.split(" ")[0]}`}
        subtitle={t("dash.subtitle")}
        actions={
          <>
            {can(user.role, "quotes", "create") && (
              <Link href="/app/commercial/quotes?new=1" className="btn-primary btn-sm">
                <Plus className="h-3.5 w-3.5" /> {t("dash.newQuote")}
              </Link>
            )}
            {can(user.role, "products", "create") && (
              <Link href="/app/stock/products?new=1" className="btn-outline btn-sm">
                <Plus className="h-3.5 w-3.5" /> {t("dash.newProduct")}
              </Link>
            )}
          </>
        }
      />

      {/* ------------------------------ KPI ------------------------------ */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <StatCard
          label={t("kpi.monthlyRevenue")}
          value={money(k.monthlyRevenue)}
          icon={BadgeDollarSign}
          tone="brand"
          delta={{ value: pct(k.monthlyRevenue, k.monthlyRevenuePrev), label: t("kpi.vsLastMonth") }}
          sub={t("kpi.vsLastMonth")}
          href={can(user.role, "reports", "view") ? "/app/reports" : undefined}
        />
        <StatCard
          label={t("kpi.annualRevenue")}
          value={money(k.annualRevenue)}
          icon={TrendingUp}
          tone="neutral"
          delta={{ value: pct(k.annualRevenue, k.annualRevenuePrev), label: t("kpi.vsLastYear") }}
          sub={t("kpi.vsLastYear")}
          href={can(user.role, "reports", "view") ? "/app/reports" : undefined}
        />
        <StatCard
          label={t("kpi.pendingQuotes")}
          value={String(k.pendingQuotes)}
          icon={FileText}
          tone="amber"
          sub={compact(k.pendingQuotesAmount) + " MAD"}
          href={can(user.role, "quotes", "view") ? "/app/commercial/quotes" : undefined}
        />
        <StatCard
          label={t("kpi.acceptedQuotes")}
          value={String(k.acceptedQuotes)}
          icon={CheckCircle2}
          tone="green"
          sub={compact(k.acceptedQuotesAmount) + " MAD"}
          href={can(user.role, "quotes", "view") ? "/app/commercial/quotes?status=accepted" : undefined}
        />
        <StatCard
          label={t("kpi.activeOrders")}
          value={String(k.activeOrders)}
          icon={ShoppingCart}
          tone="blue"
          sub={`${k.ordersInProduction} ${t("kpi.ordersInProduction").toLowerCase()}`}
          href={can(user.role, "orders", "view") ? "/app/commercial/orders" : undefined}
        />
        <StatCard
          label={t("kpi.ordersInProduction")}
          value={String(k.ordersInProduction)}
          icon={ClipboardCheck}
          tone="amber"
          sub={t("menu.production")}
          href={can(user.role, "kanban", "view") ? "/app/production/kanban" : undefined}
        />
        <StatCard
          label={t("kpi.unpaidInvoices")}
          value={String(k.unpaidInvoices)}
          icon={Receipt}
          tone="red"
          sub={money(k.unpaidAmount)}
          href={can(user.role, "invoices", "view") ? "/app/finance/invoices?status=overdue" : undefined}
        />
        <StatCard
          label={t("kpi.inventoryValue")}
          value={money(k.inventoryValue)}
          icon={PackageSearch}
          tone="neutral"
          sub={t("menu.stock")}
          href={can(user.role, "inventory", "view") ? "/app/stock/inventory" : undefined}
        />
        <StatCard
          label={t("kpi.lowStock")}
          value={String(k.lowStock)}
          icon={TriangleAlert}
          tone={k.lowStock > 0 ? "red" : "green"}
          sub={k.lowStock > 0 ? t("dash.lowStockAlerts") : t("stock.noAlerts")}
          href={can(user.role, "alerts", "view") ? "/app/stock/alerts" : undefined}
        />
        <StatCard
          label={t("kpi.conversionRate")}
          value={`${k.conversionRate.toFixed(1)}%`}
          icon={TrendingUp}
          tone="green"
          sub={`${k.acceptedQuotes} ${t("statuses.accepted").toLowerCase()} / ${k.acceptedQuotes + k.rejectedQuotes}`}
          href={can(user.role, "reports", "view") ? "/app/reports?tab=conversion" : undefined}
        />
        {can(user.role, "quotes", "view") && (
          <StatCard
            label={t("kpi.quoteRequests")}
            value={String(k.quoteRequests)}
            icon={Bell}
            tone={k.quoteRequests > 0 ? "brand" : "neutral"}
            sub={t("dash.quoteRequestsSub")}
            href="/app/commercial/requests"
          />
        )}
      </div>

      {/* ---------------------------- Charts ---------------------------- */}
      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title={t("charts.revenueTitle")}
          subtitle={t("charts.revenueSub")}
          bodyClassName="p-4"
        >
          <Charts
            revenue={{ data: revenue.map((r) => ({ label: month(r.key), value: r.value })), fmt: "compact" }}
          />
        </Card>

        <Card title={t("charts.quotesTitle")} subtitle={t("charts.quotesSub")} bodyClassName="p-4">
          <Charts
            quotes={{
              data: quotes.map((q) => ({ label: month(q.key), issued: q.issued, accepted: q.accepted })),
              issuedLabel: t("charts.issued"),
              acceptedLabel: t("charts.accepted"),
            }}
          />
        </Card>

        <Card title={t("charts.ordersTitle")} subtitle={t("charts.ordersSub")} bodyClassName="p-4">
          <Charts
            donut={{
              data: ordersByStatus.map((o) => ({ name: st(o.status), value: o.c })),
            }}
          />
        </Card>

        <Card title={t("charts.productionTitle")} subtitle={t("charts.productionSub")} bodyClassName="p-4">
          <Charts
            bars={{
              data: production
                .slice()
                .sort((a, b) =>
                  ["to_prepare", "cutting", "machining", "assembly", "glazing", "quality_control", "completed"]
                    .indexOf(a.status) -
                  ["to_prepare", "cutting", "machining", "assembly", "glazing", "quality_control", "completed"].indexOf(b.status),
                )
                .map((p) => ({ label: st(p.status), value: p.c })),
              fmt: "int",
            }}
          />
        </Card>

        <Card title={t("charts.inventoryTitle")} subtitle={t("charts.inventorySub")} bodyClassName="p-4">
          <Charts
            bars={{
              data: inventory.map((w) => ({
                label: locale === "ar" ? w.name_ar || w.name : locale === "en" ? w.name_en || w.name : w.name,
                value: Math.round(w.value),
              })),
              fmt: "compact",
            }}
          />
        </Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2" title={t("charts.paymentsTitle")} subtitle={t("charts.paymentsSub")} bodyClassName="p-4">
          <Charts
            payments={{
              data: payments.map((p) => ({ label: month(p.key), paid: p.paid, outstanding: p.outstanding })),
              paidLabel: t("finance.paid"),
              outstandingLabel: t("finance.outstanding"),
              fmt: "compact",
            }}
          />
        </Card>

        <Card title={t("dash.topProducts")} bodyClassName="p-0">
          <ul className="divide-y divide-ink-900/5">
            {getTopProducts(6).map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ink-900/6 text-[11px] font-bold text-ink-600">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-ink-900">{p.name}</span>
                  <span className="block font-mono text-[11px] text-ink-400">{p.sku}</span>
                </span>
                <span className="text-end">
                  <span className="block text-[12.5px] font-bold text-ink-900 tnum">{compact(p.revenue)}</span>
                  <span className="block text-[11px] text-ink-400">{p.qty} u.</span>
                </span>
              </li>
            ))}
            {getTopProducts(6).length === 0 && <li className="px-5 py-8 text-center text-[13px] text-ink-400">{t("actions.noData")}</li>}
          </ul>
        </Card>
      </div>

      {/* ------------------------- Action lists ------------------------- */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {can(user.role, "quotes", "view") && (
          <Card
            title={t("dash.newRequests")}
            subtitle={t("dash.quoteRequestsSub")}
            actions={<Link href="/app/commercial/requests" className="text-[12.5px] font-bold text-brand-600 hover:text-brand-700">{t("common.seeAll")}</Link>}
            bodyClassName="p-0"
          >
            <ul className="divide-y divide-ink-900/5">
              {getNewRequests(5).map((r) => (
                <li key={r.id} className="flex items-start gap-3 px-5 py-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600/10 text-brand-700">
                    <Bell className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink-900">{r.customer_name}</p>
                    <p className="truncate text-[12px] text-ink-500">{r.product}</p>
                    <p className="mt-0.5 text-[11px] text-ink-400">
                      {r.ref} · {r.city || "—"} · {date(r.created_at)}
                    </p>
                  </div>
                </li>
              ))}
              {getNewRequests(5).length === 0 && (
                <li className="px-5 py-8 text-center text-[13px] text-ink-400">{t("actions.noData")}</li>
              )}
            </ul>
          </Card>
        )}

        {can(user.role, "alerts", "view") && (
          <Card
            title={t("dash.lowStockAlerts")}
            actions={<Link href="/app/stock/alerts" className="text-[12.5px] font-bold text-brand-600 hover:text-brand-700">{t("common.seeAll")}</Link>}
            bodyClassName="p-0"
          >
            <ul className="divide-y divide-ink-900/5">
              {getLowStockProducts(5).map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <TriangleAlert className="h-4 w-4 shrink-0 text-brand-600" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-ink-900">{p.name}</span>
                    <span className="block font-mono text-[11px] text-ink-400">{p.sku}</span>
                  </span>
                  <span className="text-end">
                    <span className="block text-[12.5px] font-bold text-brand-700 tnum">{Math.round(p.qty)}</span>
                    <span className="block text-[11px] text-ink-400">min {p.min_stock}</span>
                  </span>
                </li>
              ))}
              {getLowStockProducts(5).length === 0 && (
                <li className="px-5 py-8 text-center text-[13px] text-emerald-600">{t("stock.noAlerts")}</li>
              )}
            </ul>
          </Card>
        )}

        {can(user.role, "invoices", "view") && (
          <Card
            title={t("dash.overdueInvoices")}
            actions={<Link href="/app/finance/invoices?status=overdue" className="text-[12.5px] font-bold text-brand-600 hover:text-brand-700">{t("common.seeAll")}</Link>}
            bodyClassName="p-0"
          >
            <ul className="divide-y divide-ink-900/5">
              {getOverdueInvoices(5).map((i) => (
                <li key={i.id} className="flex items-center gap-3 px-5 py-3">
                  <Wallet className="h-4 w-4 shrink-0 text-amber-600" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-ink-900">{i.customer}</span>
                    <span className="block font-mono text-[11px] text-ink-400">{i.number}</span>
                  </span>
                  <span className="text-end">
                    <span className="block text-[12.5px] font-bold text-ink-900 tnum">{compact(i.due)}</span>
                    <span className="block text-[11px] text-ink-400">{date(i.due_date)}</span>
                  </span>
                </li>
              ))}
              {getOverdueInvoices(5).length === 0 && (
                <li className="px-5 py-8 text-center text-[13px] text-emerald-600">0</li>
              )}
            </ul>
          </Card>
        )}

        {can(user.role, "manufacturing", "view") && (
          <Card
            title={t("dash.deadlines")}
            actions={<Link href="/app/production/planning" className="text-[12.5px] font-bold text-brand-600 hover:text-brand-700">{t("common.seeAll")}</Link>}
            bodyClassName="p-0"
          >
            <ul className="divide-y divide-ink-900/5">
              {getProductionDeadlines(5).map((m) => {
                const late = new Date(m.end_date) < new Date();
                return (
                  <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                    <Clock className={`h-4 w-4 shrink-0 ${late ? "text-brand-600" : "text-ink-400"}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-ink-900">{m.number}</span>
                      <span className="block truncate text-[11.5px] text-ink-500">{m.description}</span>
                    </span>
                    <span className="text-end">
                      <StatusBadge status={m.status} label={st(m.status)} />
                      <span className="mt-0.5 block text-[11px] text-ink-400">{date(m.end_date)}</span>
                    </span>
                  </li>
                );
              })}
              {getProductionDeadlines(5).length === 0 && <li className="px-5 py-8 text-center text-[13px] text-ink-400">{t("actions.noData")}</li>}
            </ul>
          </Card>
        )}

        <Card
          title={t("dash.topCustomers")}
          actions={can(user.role, "customers", "view") ? <Link href="/app/commercial/customers" className="text-[12.5px] font-bold text-brand-600 hover:text-brand-700">{t("common.seeAll")}</Link> : undefined}
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-ink-900/5">
            {getTopCustomers(6).map((c, i) => (
              <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ink-900/6 text-[11px] font-bold text-ink-600">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink-900">{c.name}</span>
                <span className="text-end">
                  <span className="block text-[12.5px] font-bold text-ink-900 tnum">{compact(c.revenue)}</span>
                  <span className="block text-[11px] text-ink-400">{c.orders} {t("customers.ordersCount").toLowerCase()}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title={t("dash.recentQuotes")}
          actions={can(user.role, "quotes", "view") ? <Link href="/app/commercial/quotes" className="text-[12.5px] font-bold text-brand-600 hover:text-brand-700">{t("common.seeAll")}</Link> : undefined}
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-ink-900/5">
            {getRecentQuotes(6).map((q) => (
              <li key={q.id} className="flex items-center gap-3 px-5 py-3">
                <span className="min-w-0 flex-1">
                  <Link href={`/app/commercial/quotes/${q.id}`} className="block truncate font-mono text-[12px] font-semibold text-brand-700 hover:underline">
                    {q.number}
                  </Link>
                  <span className="block truncate text-[12px] text-ink-500">{q.customer}</span>
                </span>
                <span className="text-end">
                  <StatusBadge status={q.status} label={st(q.status)} />
                  <span className="mt-0.5 block text-[11.5px] font-bold text-ink-700 tnum">{compact(q.total_ttc)}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title={t("dash.recentOrders")}
          actions={can(user.role, "orders", "view") ? <Link href="/app/commercial/orders" className="text-[12.5px] font-bold text-brand-600 hover:text-brand-700">{t("common.seeAll")}</Link> : undefined}
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-ink-900/5">
            {getRecentOrders(6).map((o) => (
              <li key={o.id} className="flex items-center gap-3 px-5 py-3">
                <span className="min-w-0 flex-1">
                  <Link href={`/app/commercial/orders/${o.id}`} className="block truncate font-mono text-[12px] font-semibold text-brand-700 hover:underline">
                    {o.number}
                  </Link>
                  <span className="block truncate text-[12px] text-ink-500">{o.customer}</span>
                </span>
                <span className="text-end">
                  <StatusBadge status={o.status} label={st(o.status)} />
                  <span className="mt-0.5 block text-[11.5px] font-bold text-ink-700 tnum">{compact(o.total_ttc)}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title={t("dash.activity")} bodyClassName="p-0" className="lg:col-span-2 xl:col-span-3">
          <ul className="divide-y divide-ink-900/5">
            {getRecentActivity(8).map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-2.5 text-[12.5px]">
                <span className="font-semibold text-ink-900">{a.user_name}</span>
                <span className="badge-grey">{a.action}</span>
                {a.object_type && <span className="text-ink-400">{a.object_type}</span>}
                <span className="min-w-0 flex-1 truncate text-ink-600">{a.object_label}</span>
                <span className="shrink-0 text-[11px] text-ink-400">{date(a.created_at, true)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
