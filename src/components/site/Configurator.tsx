"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { COLORS, GLASS_TYPES, OPENING_SYSTEMS } from "@/app/(site)/devis/options";
import { submitQuoteRequest } from "@/app/(site)/devis/actions";

const TYPES = ["Fenêtre", "Porte", "Baie vitrée", "Pergola", "Momo Box"] as const;
const MATERIALS = ["Aluminium", "PVC"] as const;

const COLOR_HEX: Record<string, string> = {
  "Blanc RAL 9016": "#F2F2F0",
  "Gris anthracite RAL 7016": "#3A4042",
  "Noir mat RAL 9005": "#141414",
  "Aluminium naturel anodisé": "#C9CCCE",
  Bronze: "#6E4A2F",
  "Chêne doré (PVC)": "#B4863C",
  "Sur mesure RAL": "#E30613",
};

export function Configurator({ locale }: { locale: "fr" | "ar" | "en" }) {
  const L = {
    fr: {
      title: "Configurateur", sub: "Composez votre menuiserie et obtenez un devis instantané.",
      type: "Type", material: "Matière", color: "Couleur", glazing: "Vitrage", opening: "Ouverture",
      width: "Largeur (cm)", height: "Hauteur (cm)", qty: "Quantité",
      name: "Nom", email: "Email", phone: "Téléphone", city: "Ville",
      cta: "Obtenir mon devis", preview: "Aperçu", summary: "Récapitulatif",
      ok: "Demande envoyée", okSub: "Votre demande a été transmise à notre équipe commerciale.",
    },
    en: {
      title: "Configurator", sub: "Design your joinery and get an instant quote.",
      type: "Type", material: "Material", color: "Colour", glazing: "Glazing", opening: "Opening",
      width: "Width (cm)", height: "Height (cm)", qty: "Quantity",
      name: "Name", email: "Email", phone: "Phone", city: "City",
      cta: "Get my quote", preview: "Preview", summary: "Summary",
      ok: "Request sent", okSub: "Your request has been sent to our sales team.",
    },
    ar: {
      title: "المُهيّئ", sub: "صمّم نجارتك واحصل على عرض سعر فوري.",
      type: "النوع", material: "المادة", color: "اللون", glazing: "الزجاج", opening: "الفتح",
      width: "العرض (سم)", height: "الارتفاع (سم)", qty: "الكمية",
      name: "الاسم", email: "البريد", phone: "الهاتف", city: "المدينة",
      cta: "احصل على عرض السعر", preview: "معاينة", summary: "الملخص",
      ok: "تم إرسال الطلب", okSub: "تم تحويل طلبك إلى فريقنا التجاري.",
    },
  }[locale];

  const [type, setType] = useState<string>(TYPES[0]);
  const [material, setMaterial] = useState<string>(MATERIALS[0]);
  const [color, setColor] = useState<string>(COLORS[1]);
  const [glazing, setGlazing] = useState<string>(GLASS_TYPES[1]);
  const [opening, setOpening] = useState<string>(OPENING_SYSTEMS[0]);
  const [width, setWidth] = useState(140);
  const [height, setHeight] = useState(160);
  const [qty, setQty] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; ref?: string; error?: string } | null>(null);

  const frame = COLOR_HEX[color] ?? "#3A4042";
  const isPVC = material === "PVC";
  const stroke = isPVC ? 16 : 9; // PVC profiles are chunkier

  // Preview aspect from real dimensions
  const aspect = useMemo(() => Math.max(0.4, Math.min(2.4, width / height)), [width, height]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    const fd = new FormData();
    fd.set("customer_name", name);
    fd.set("email", email);
    fd.set("phone", phone);
    fd.set("city", city);
    fd.set("product", `${type} — ${material}`);
    fd.set("width", String(width));
    fd.set("height", String(height));
    fd.set("quantity", String(qty));
    fd.set("color", color);
    fd.set("glass_type", glazing);
    fd.set("opening_system", opening);
    fd.set("comments", `Configurateur: ${type}, ${material}, ${glazing}, ${opening}`);
    start(async () => {
      const r = await submitQuoteRequest(fd);
      setResult(r.ok ? { ok: true, ref: r.ref } : { ok: false, error: r.error });
    });
  }

  const boxW = 260;
  const boxH = 260;
  const w = aspect >= 1 ? boxW : boxW * aspect;
  const h = aspect >= 1 ? boxW / aspect : boxH;
  const x = (boxW - w) / 2;
  const y = (boxH - h) / 2;

  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="container-x">
        <p className="m-eyebrow">{L.title}</p>
        <h2 className="m-display mt-4 max-w-2xl text-[clamp(1.9rem,4.5vw,3.2rem)] text-ink-950">{L.sub}</h2>

        <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
          {/* Controls */}
          <form onSubmit={submit} className="space-y-7">
            <Choice label={L.type} value={type} options={[...TYPES]} onChange={setType} />
            <Choice label={L.material} value={material} options={[...MATERIALS]} onChange={setMaterial} />

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={L.color}>
                <select className="input" value={color} onChange={(e) => setColor(e.target.value)}>
                  {COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label={L.opening}>
                <select className="input" value={opening} onChange={(e) => setOpening(e.target.value)}>
                  {OPENING_SYSTEMS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label={L.glazing}>
                <select className="input" value={glazing} onChange={(e) => setGlazing(e.target.value)}>
                  {GLASS_TYPES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
              <Field label={L.qty}>
                <input className="input" type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value))} />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={L.width}>
                <input className="input" type="number" min={30} value={width} onChange={(e) => setWidth(Math.max(30, +e.target.value))} />
              </Field>
              <Field label={L.height}>
                <input className="input" type="number" min={30} value={height} onChange={(e) => setHeight(Math.max(30, +e.target.value))} />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={L.name}><input className="input" required value={name} onChange={(e) => setName(e.target.value)} /></Field>
              <Field label={L.city}><input className="input" value={city} onChange={(e) => setCity(e.target.value)} /></Field>
              <Field label={L.email}><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
              <Field label={L.phone}><input className="input" required value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
            </div>

            <button type="submit" disabled={pending} className="group inline-flex w-full items-center justify-center gap-2 bg-ink-950 px-8 py-4 text-[13px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-brand-600 disabled:opacity-50 sm:w-auto">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {L.cta}
              {!pending && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180" />}
            </button>

            {result?.ok && (
              <p className="flex items-center gap-2 text-[13px] font-semibold text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> {L.ok}{result.ref ? ` — ${result.ref}` : ""} · {L.okSub}
              </p>
            )}
            {result && !result.ok && (
              <p className="text-[13px] font-semibold text-brand-600">{result.error}</p>
            )}
          </form>

          {/* Live preview */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-400">{L.preview}</p>
            <div className="mt-4 flex items-center justify-center border border-ink-900/10 bg-ink-50/60 p-6" style={{ aspectRatio: "1/1" }}>
              <svg viewBox={`0 0 ${boxW} ${boxH}`} className="h-full w-full" role="img" aria-label={L.preview}>
                {/* technical grid */}
                <defs>
                  <pattern id="cgrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M20 0H0V20" fill="none" stroke="rgba(10,10,10,.06)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width={boxW} height={boxH} fill="url(#cgrid)" />

                {type === "Pergola" ? (
                  <Pergola frame={frame} w={w} h={h} x={x} y={y} />
                ) : type === "Momo Box" ? (
                  <MomoBox frame={frame} w={w} h={h} x={x} y={y} />
                ) : (
                  <Opening frame={frame} stroke={stroke} w={w} h={h} x={x} y={y} panels={type === "Baie vitrée" ? (w > h ? 3 : 2) : 1} isDoor={type === "Porte"} />
                )}

                {/* dimension line */}
                <line x1={x} y1={y + h + 16} x2={x + w} y2={y + h + 16} stroke="#E30613" strokeWidth="1.5" />
                <text x={x + w / 2} y={y + h + 30} textAnchor="middle" fontSize="11" fill="#0A0A0A" fontFamily="Space Grotesk, sans-serif">
                  {width} × {height} cm
                </text>
              </svg>
            </div>

            <dl className="mt-6 divide-y divide-ink-900/10 border-y border-ink-900/10 text-[13px]">
              {[
                [L.type, type], [L.material, material], [L.color, color],
                [L.glazing, glazing], [L.opening, opening], [L.qty, String(qty)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2.5">
                  <dt className="text-ink-400">{k}</dt>
                  <dd className="font-semibold text-ink-900">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-ink-400">{label}</span>
      {children}
    </label>
  );
}

function Choice({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-ink-400">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o} type="button" onClick={() => onChange(o)}
            className={`border px-4 py-2 text-[12.5px] font-semibold transition-colors ${
              value === o ? "border-ink-950 bg-ink-950 text-white" : "border-ink-900/15 text-ink-600 hover:border-ink-950"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------- schematic previews ------- */
function Opening({ frame, stroke, w, h, x, y, panels, isDoor }: { frame: string; stroke: number; w: number; h: number; x: number; y: number; panels: number; isDoor: boolean }) {
  const inner = stroke;
  const pw = (w - inner * (panels + 1)) / panels;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={frame} />
      {Array.from({ length: panels }).map((_, i) => (
        <rect key={i} x={x + inner + i * (pw + inner)} y={y + inner} width={pw} height={h - inner * 2} fill="#BFD4DC" opacity={0.55} />
      ))}
      {/* handle */}
      <rect x={x + w - inner - 5} y={y + h / 2 - 10} width={4} height={20} fill="#0A0A0A" opacity={0.6} />
      {isDoor && <line x1={x + inner} y1={y + h - inner} x2={x + w - inner} y2={y + h - inner} stroke="#0A0A0A" strokeWidth="1" opacity={0.3} />}
    </g>
  );
}

function Pergola({ frame, w, h, x, y }: { frame: string; w: number; h: number; x: number; y: number }) {
  const slats = 7;
  const top = y + h * 0.18;
  return (
    <g>
      {/* posts */}
      <rect x={x} y={top} width={8} height={h - h * 0.18} fill={frame} />
      <rect x={x + w - 8} y={top} width={8} height={h - h * 0.18} fill={frame} />
      {/* top beam */}
      <rect x={x} y={top - 8} width={w} height={8} fill={frame} />
      {/* louvers */}
      {Array.from({ length: slats }).map((_, i) => (
        <rect key={i} x={x + 8 + i * ((w - 16) / slats)} y={top - 22} width={(w - 16) / slats - 4} height={14} fill={frame} opacity={0.85} />
      ))}
    </g>
  );
}

function MomoBox({ frame, w, h, x, y }: { frame: string; w: number; h: number; x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={frame} />
      <rect x={x + 8} y={y + 8} width={w - 16} height={h * 0.4} fill="#BFD4DC" opacity={0.6} />
      <rect x={x + w * 0.55} y={y + h * 0.45} width={w * 0.35} height={h * 0.47} fill="#0A0A0A" opacity={0.25} />
      <line x1={x} y1={y + h * 0.45} x2={x + w} y2={y + h * 0.45} stroke="#0A0A0A" strokeWidth="1.5" opacity={0.4} />
    </g>
  );
}
