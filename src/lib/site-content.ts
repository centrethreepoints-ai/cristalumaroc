/* ------------------------------------------------------------------
 * Contenu éditorial du site public — gammes de produits
 * ------------------------------------------------------------------ */
import type { Locale } from "@/i18n/core";

export type RangeKey = "aluminium" | "pvc" | "glass" | "pergolas" | "momo-box" | "curtain-walls" | "partitions";

export type ProductVariant = {
  sku: string;
  name: Record<Locale, string>;
  short: Record<Locale, string>;
  from: number;
  image: string;
};

export type Range = {
  key: RangeKey;
  slug: string;
  navKey: string;
  title: Record<Locale, string>;
  tagline: Record<Locale, string>;
  description: Record<Locale, string>;
  image: string;
  accent: string;
  features: Record<Locale, string[]>;
  specs: Record<Locale, [string, string][]>;
  applications: Record<Locale, string[]>;
  options: Record<Locale, string[]>;
  skus: string[];
};

export const RANGES: Range[] = [
  {
    key: "aluminium",
    slug: "aluminium",
    navKey: "nav.aluminium",
    title: { fr: "Menuiseries Aluminium", ar: "نجاجير الألمنيوم", en: "Aluminium Joinery" },
    tagline: {
      fr: "Fenêtres, portes et coulissants à rupture de pont thermique",
      ar: "نوافذ وأبواب منزلقة بعزل حراري",
      en: "Thermally broken windows, doors and sliding systems",
    },
    description: {
      fr: "Nos menuiseries aluminium série 60 et 70 combinent finesse des profilés, performance thermique et sécurité renforcée. Fabriquées dans notre atelier de Casablanca, elles sont livrées posées et réglées sur tout le Royaume.",
      ar: "تجمع نجاجير الألمنيوم من السلسلتين 60 و70 بين دقة المقاطع والأداء الحراري والأمان المعزز. تُصنَّع في ورشتنا بالدار البيضاء وتُسلَّم مُركَّبة ومضبوطة في كل أنحاء المملكة.",
      en: "Our series 60 and 70 aluminium joinery combines slim profiles, thermal performance and reinforced security. Manufactured in our Casablanca workshop and delivered installed across the Kingdom.",
    },
    image: "/images/ranges/aluminium.jpg",
    accent: "#E30613",
    features: {
      fr: ["Rupture de pont thermique barrettes 24 mm", "Vitrage jusqu'à 44 mm", "Uw jusqu'à 1,4 W/m²K", "Ferrage périmétrique multipoints", "Finition thermolaquée toutes teintes RAL", "Garantie 10 ans"],
      ar: ["عزل حراري بشرائح 24 مم", "تزجيج حتى 44 مم", "معامل Uw حتى 1.4 واط/م²كلفن", "آلية محيطية متعددة النقاط", "تشطيب مطلي بكل ألوان RAL", "ضمان 10 سنوات"],
      en: ["24 mm polyamide thermal break", "Glazing up to 44 mm", "Uw down to 1.4 W/m²K", "Multipoint perimeter hardware", "Powder-coated in any RAL colour", "10-year warranty"],
    },
    specs: {
      fr: [["Profondeur dormant", "60 / 70 mm"], ["Épaisseur vitrage", "4 à 44 mm"], ["Performance Uw", "1,4 – 2,0 W/m²K"], ["Étanchéité AEV", "A*4 E*9A V*C4"], ["Alliage", "6060 T5 / 6063 T5"], ["Finition", "Thermolaquage Qualicoat / anodisé"]],
      ar: [["عمق الإطار", "60 / 70 مم"], ["سماكة الزجاج", "4 إلى 44 مم"], ["الأداء Uw", "1.4 – 2.0 واط/م²كلفن"], ["الإحكام AEV", "A*4 E*9A V*C4"], ["السبيكة", "6060 T5 / 6063 T5"], ["التشطيب", "طلاء Qualicoat / أنودة"]],
      en: [["Frame depth", "60 / 70 mm"], ["Glazing thickness", "4 to 44 mm"], ["Uw performance", "1.4 – 2.0 W/m²K"], ["AEV rating", "A*4 E*9A V*C4"], ["Alloy", "6060 T5 / 6063 T5"], ["Finish", "Qualicoat powder coat / anodised"]],
    },
    applications: {
      fr: ["Habitat collectif et villas", "Bureaux et sièges sociaux", "Hôtellerie et resorts", "Rénovation lourde", "Bâtiments industriels"],
      ar: ["السكن الجماعي والفيلات", "المكاتب والمقار", "الفنادق والمنتجعات", "الترميم الشامل", "المباني الصناعية"],
      en: ["Apartments and villas", "Offices and headquarters", "Hotels and resorts", "Heavy renovation", "Industrial buildings"],
    },
    options: {
      fr: ["Volet roulant intégré", "Moustiquaire enroulable", "Oscillo-battant", "Seuil PMR", "Vitrage de sécurité", "Motorisation Somfy"],
      ar: ["ستارة مدمجة", "ناموسية قابلة للطي", "فتح مزدوج", "عتبة للمعاقين", "زجاج أمان", "محرك Somfy"],
      en: ["Integrated roller shutter", "Retractable fly screen", "Tilt & turn", "Low threshold", "Safety glazing", "Somfy motorisation"],
    },
    skus: ["ALU-FEN-2V", "ALU-FEN-COUL", "ALU-POR-FR", "ALU-POR-COUL", "ALU-OSC-BAT", "ALU-VOLET"],
  },
  {
    key: "pvc",
    slug: "pvc",
    navKey: "nav.pvc",
    title: { fr: "Menuiseries PVC", ar: "نجاجير PVC", en: "PVC Joinery" },
    tagline: {
      fr: "Le meilleur rapport performance / prix du marché",
      ar: "أفضل نسبة أداء / سعر في السوق",
      en: "The best performance-to-price ratio on the market",
    },
    description: {
      fr: "Profilés PVC 5 chambres avec renfort acier galvanisé, nos menuiseries PVC offrent une isolation thermique et acoustique remarquable sans entretien. Idéales pour le logement collectif et les programmes immobiliers.",
      ar: "مقاطع PVC بخمس غرف مع تقوية من الفولاذ المغلفن، توفر نجاجيرنا عزلاً حرارياً وصوتياً ممتازاً دون صيانة. مثالية للسكن الجماعي والبرامج العقارية.",
      en: "5-chamber PVC profiles with galvanised steel reinforcement deliver outstanding thermal and acoustic insulation with zero maintenance. Ideal for housing and development programmes.",
    },
    image: "/images/ranges/pvc.jpg",
    accent: "#0EA5E9",
    features: {
      fr: ["5 chambres d'isolation", "Renfort acier galvanisé 2 mm", "Uw jusqu'à 1,3 W/m²K", "Sans entretien, imputrescible", "Affaiblissement acoustique 35 dB", "Recyclable à 100%"],
      ar: ["5 غرف عزل", "تقوية فولاذ مغلفن 2 مم", "معامل Uw حتى 1.3 واط/م²كلفن", "بدون صيانة وغير قابل للتعفن", "عزل صوتي 35 ديسيبل", "قابل لإعادة التدوير 100٪"],
      en: ["5 insulation chambers", "2 mm galvanised steel reinforcement", "Uw down to 1.3 W/m²K", "Maintenance free, rot proof", "35 dB sound reduction", "100% recyclable"],
    },
    specs: {
      fr: [["Profondeur profilé", "70 mm"], ["Chambres", "5"], ["Renfort", "Acier galvanisé 2 mm"], ["Uw", "1,3 – 1,8 W/m²K"], ["Coloris", "Blanc, beige, plaxé chêne"], ["Durée de vie", "> 40 ans"]],
      ar: [["عمق المقطع", "70 مم"], ["الغرف", "5"], ["التقوية", "فولاذ مغلفن 2 مم"], ["Uw", "1.3 – 1.8 واط/م²كلفن"], ["الألوان", "أبيض، بيج، بلوطي"], ["العمر", "أكثر من 40 سنة"]],
      en: [["Profile depth", "70 mm"], ["Chambers", "5"], ["Reinforcement", "2 mm galvanised steel"], ["Uw", "1.3 – 1.8 W/m²K"], ["Colours", "White, beige, oak laminate"], ["Lifespan", "> 40 years"]],
    },
    applications: {
      fr: ["Logement collectif", "Programmes immobiliers", "Écoles et administrations", "Rénovation énergétique", "Hôtellerie économique"],
      ar: ["السكن الجماعي", "البرامج العقارية", "المدارس والإدارات", "الترميم الطاقي", "الفنادق الاقتصادية"],
      en: ["Multi-family housing", "Development programmes", "Schools and public buildings", "Energy retrofit", "Budget hospitality"],
    },
    options: {
      fr: ["Oscillo-battant", "Petits bois intégrés", "Vitrage acoustique", "Plaxage chêne doré", "Serrure à clé", "Grille de ventilation"],
      ar: ["فتح مزدوج", "قضبان زخرفية مدمجة", "زجاج عازل للصوت", "تغليف بلوطي", "قفل بمفتاح", "شبكة تهوية"],
      en: ["Tilt & turn", "Integrated Georgian bars", "Acoustic glazing", "Golden oak laminate", "Key lock", "Ventilation grille"],
    },
    skus: ["PVC-FEN-2V", "PVC-FEN-COUL", "PVC-POR-ENT", "PVC-OSC-BAT"],
  },
  {
    key: "glass",
    slug: "glass",
    navKey: "nav.glass",
    title: { fr: "Verre & Vitrage", ar: "الزجاج والتزجيج", en: "Glass & Glazing" },
    tagline: {
      fr: "Isolant, sécuritaire, décoratif — découpé sur mesure",
      ar: "عازل، آمن، زخرفي — مقصوص حسب المقاس",
      en: "Insulating, safe, decorative — cut to size",
    },
    description: {
      fr: "Notre ligne de vitrage isolant produit jusqu'à 12 000 m² par mois : double vitrage argon, ITR, feuilleté de sécurité et trempé. Chaque vitrage est tracé unitairement et contrôlé dimensionnellement au laser.",
      ar: "يُنتج خط التزجيج العازل لدينا حتى 12000 م² شهرياً: زجاج مزدوج بالأرغون، عازل حرارياً، مصفح للأمان ومقسّى. كل لوح يُتتَّبَع فردياً ويُراقَب بالليزر.",
      en: "Our insulating glazing line produces up to 12,000 m² per month: argon double glazing, low-E, laminated safety and tempered glass. Every unit is individually traced and laser-measured.",
    },
    image: "/images/ranges/glass.jpg",
    accent: "#22D3EE",
    features: {
      fr: ["Ligne automatisée 12 000 m²/mois", "Contrôle dimensionnel laser", "Traçabilité unitaire", "Intercalaire warm-edge en option", "Gaz argon 90%", "Bords polis ou joints"],
      ar: ["خط آلي 12000 م²/شهر", "مراقبة أبعاد بالليزر", "تتبع فردي", "فاصل warm-edge اختياري", "غاز أرغون 90٪", "حواف مصقولة أو موصولة"],
      en: ["Automated line, 12,000 m²/month", "Laser dimensional control", "Unit traceability", "Optional warm-edge spacer", "90% argon fill", "Polished or seamed edges"],
    },
    specs: {
      fr: [["Double vitrage", "4/16/4 — 6/16/6 — 8/16/8"], ["ITR", "Ug 1,0 W/m²K"], ["Feuilleté", "44.2 — 66.2 — 88.2"], ["Trempé", "6 / 8 / 10 / 12 mm"], ["Dimensions max", "3 210 x 6 000 mm"], ["Normes", "EN 1279 / EN 12150 / EN 14449"]],
      ar: [["زجاج مزدوج", "4/16/4 — 6/16/6 — 8/16/8"], ["ITR", "Ug 1.0 واط/م²كلفن"], ["مصفح", "44.2 — 66.2 — 88.2"], ["مقسّى", "6 / 8 / 10 / 12 مم"], ["الأبعاد القصوى", "3210 × 6000 مم"], ["المعايير", "EN 1279 / EN 12150 / EN 14449"]],
      en: [["Double glazing", "4/16/4 — 6/16/6 — 8/16/8"], ["Low-E", "Ug 1.0 W/m²K"], ["Laminated", "44.2 — 66.2 — 88.2"], ["Tempered", "6 / 8 / 10 / 12 mm"], ["Max size", "3,210 x 6,000 mm"], ["Standards", "EN 1279 / EN 12150 / EN 14449"]],
    },
    applications: {
      fr: ["Menuiseries aluminium et PVC", "Murs rideaux", "Garde-corps", "Cloisons de bureau", "Verrières et puits de lumière"],
      ar: ["نجاجير الألمنيوم وPVC", "الجدران الستائرية", "حواجز الوقاية", "فواصل المكاتب", "الأسقف الزجاجية"],
      en: ["Aluminium and PVC joinery", "Curtain walls", "Balustrades", "Office partitions", "Skylights and atria"],
    },
    options: {
      fr: ["Contrôle solaire", "Impression numérique", "Sablage décoratif", "Warm-edge", "Store intégré", "Vitrage chauffant"],
      ar: ["تحكم شمسي", "طباعة رقمية", "صقل زخرفي", "Warm-edge", "ستارة مدمجة", "زجاج مدفأ"],
      en: ["Solar control", "Digital printing", "Decorative frosting", "Warm edge", "Integrated blind", "Heated glazing"],
    },
    skus: ["VER-DV-4164", "VER-DV-4164A", "VER-LAM-44-2", "VER-TEMP-8", "VER-TEMP-10", "VER-SAB"],
  },
  {
    key: "pergolas",
    slug: "pergolas",
    navKey: "nav.pergolas",
    title: { fr: "Pergolas", ar: "البرغولات", en: "Pergolas" },
    tagline: {
      fr: "Bioclimatiques à lames orientables et toiles rétractables",
      ar: "بيومناخية بشفرات قابلة للتوجيه وأقمشة قابلة للطي",
      en: "Bioclimatic louvred roofs and retractable canopies",
    },
    description: {
      fr: "Nos pergolas bioclimatiques transforment terrasses et patios en espaces de vie utilisables toute l'année. Lames orientables de 0 à 135°, évacuation d'eau intégrée aux poteaux, éclairage LED et pilotage par application.",
      ar: "تحول برغولاتنا البيومناخية الشرفات والأفنية إلى فضاءات معيشة طوال السنة. شفرات قابلة للتوجيه من 0 إلى 135 درجة، وتصريف مياه مدمج في الأعمدة، وإضاءة LED وتحكم عبر التطبيق.",
      en: "Our bioclimatic pergolas turn terraces and patios into year-round living spaces. Louvres rotate from 0 to 135°, rainwater drains through the posts, with LED lighting and app control.",
    },
    image: "/images/ranges/pergolas.jpg",
    accent: "#F59E0B",
    features: {
      fr: ["Lames orientables 0 à 135°", "Motorisation Somfy IO", "Évacuation d'eau dans les poteaux", "Capteurs pluie et vent", "Éclairage LED intégré", "Structure aluminium thermolaqué"],
      ar: ["شفرات قابلة للتوجيه 0-135°", "محرك Somfy IO", "تصريف مياه داخل الأعمدة", "حساسات المطر والرياح", "إضاءة LED مدمجة", "هيكل ألمنيوم مطلي"],
      en: ["0–135° rotating louvres", "Somfy IO motorisation", "Rainwater drainage in posts", "Rain and wind sensors", "Integrated LED lighting", "Powder-coated aluminium frame"],
    },
    specs: {
      fr: [["Dimensions", "Sur mesure jusqu'à 7 x 14 m"], ["Lames", "Aluminium 200 mm extrudé"], ["Motorisation", "Somfy IO / RTS"], ["Résistance vent", "Jusqu'à 160 km/h"], ["Charge neige", "80 kg/m²"], ["Finition", "RAL au choix"]],
      ar: [["الأبعاد", "حسب المقاس حتى 7×14 م"], ["الشفرات", "ألمنيوم مبثوق 200 مم"], ["المحرك", "Somfy IO / RTS"], ["مقاومة الرياح", "حتى 160 كم/س"], ["حمل الثلج", "80 كغ/م²"], ["التشطيب", "RAL حسب الطلب"]],
      en: [["Dimensions", "Bespoke up to 7 x 14 m"], ["Louvres", "200 mm extruded aluminium"], ["Motorisation", "Somfy IO / RTS"], ["Wind resistance", "Up to 160 km/h"], ["Snow load", "80 kg/m²"], ["Finish", "Any RAL colour"]],
    },
    applications: {
      fr: ["Terrasses de villas", "Restaurants et cafés", "Hôtels et resorts", "Toitures-terrasses", "Patios de riads"],
      ar: ["شرفات الفيلات", "المطاعم والمقاهي", "الفنادق والمنتجعات", "أسطح المباني", "أفنية الرياض"],
      en: ["Villa terraces", "Restaurants and cafés", "Hotels and resorts", "Roof terraces", "Riad patios"],
    },
    options: {
      fr: ["Stores latéraux zip", "Parois vitrées coulissantes", "Chauffage radiant", "Sonorisation", "Brumisation", "Domotique"],
      ar: ["ستائر جانبية zip", "جدران زجاجية منزلقة", "تدفئة مشعة", "نظام صوتي", "رذاذ تبريد", "منزل ذكي"],
      en: ["Zip side screens", "Sliding glass walls", "Radiant heating", "Sound system", "Misting system", "Home automation"],
    },
    skus: ["PER-BIO-30", "PER-BIO-40", "PER-TOIL", "PER-ALU-PLAT"],
  },
  {
    key: "momo-box",
    slug: "momo-box",
    navKey: "nav.momoBox",
    title: { fr: "Momo Box", ar: "مومو بوكس", en: "Momo Box" },
    tagline: {
      fr: "Structures modulaires livrées montées, installées en un jour",
      ar: "وحدات نمطية تُسلَّم مُجمَّعة وتُركَّب في يوم واحد",
      en: "Modular structures delivered assembled, installed in a day",
    },
    description: {
      fr: "Momo Box est notre gamme de structures modulaires : bureaux, bases vie de chantier, guérites et modules habitables. Ossature acier galvanisé, isolation laine de roche, menuiseries Cristalu intégrées et finitions prêtes à l'emploi.",
      ar: "مومو بوكس هي مجموعتنا من الوحدات النمطية: مكاتب، قواعد حياة للورش، أكشاك وأجهزة قابلة للسكن. هيكل من الفولاذ المغلفن، عزل بالصوف الصخري، نجاجير Cristalu مدمجة وتشطيبات جاهزة.",
      en: "Momo Box is our modular structure range: offices, site camps, security booths and habitable units. Galvanised steel frame, rockwool insulation, integrated Cristalu joinery and turnkey finishes.",
    },
    image: "/images/ranges/momo-box.jpg",
    accent: "#10B981",
    features: {
      fr: ["Livré monté ou en kit", "Installation en une journée", "Isolation laine de roche 100 mm", "Électricité complète précâblée", "Levage 4 points certifié", "Empilable jusqu'à 3 niveaux"],
      ar: ["يُسلَّم مُجمَّعاً أو مفككاً", "تركيب في يوم واحد", "عزل صوف صخري 100 مم", "كهرباء كاملة مسبقة التوصيل", "رفع بأربع نقاط معتمد", "قابل للتكديس حتى 3 طوابق"],
      en: ["Delivered assembled or flat-pack", "One-day installation", "100 mm rockwool insulation", "Fully pre-wired electrics", "Certified 4-point lifting", "Stackable up to 3 levels"],
    },
    specs: {
      fr: [["Modules", "15 / 20 / 30 m²"], ["Ossature", "Acier galvanisé 2 mm"], ["Isolation", "Laine de roche 100 mm"], ["Plancher", "OSB 22 mm + PVC"], ["Menuiseries", "Aluminium Cristalu"], ["Transport", "Camion plateau standard"]],
      ar: [["الوحدات", "15 / 20 / 30 م²"], ["الهيكل", "فولاذ مغلفن 2 مم"], ["العزل", "صوف صخري 100 مم"], ["الأرضية", "OSB 22 مم + PVC"], ["النجاجير", "ألمنيوم Cristalu"], ["النقل", "شاحنة مسطحة عادية"]],
      en: [["Modules", "15 / 20 / 30 m²"], ["Frame", "2 mm galvanised steel"], ["Insulation", "100 mm rockwool"], ["Floor", "22 mm OSB + PVC"], ["Joinery", "Cristalu aluminium"], ["Transport", "Standard flatbed truck"]],
    },
    applications: {
      fr: ["Bureaux de chantier", "Bases vie", "Guérites de sécurité", "Bungalows commerciaux", "Salles de classe modulaires", "Infirmeries"],
      ar: ["مكاتب الورش", "قواعد الحياة", "أكشاك الحراسة", "أكواخ تجارية", "فصول دراسية نمطية", "مستوصفات"],
      en: ["Site offices", "Site camps", "Security booths", "Commercial kiosks", "Modular classrooms", "First-aid stations"],
    },
    options: {
      fr: ["Sanitaires intégrés", "Climatisation pré-équipée", "Bardage bois ou composite", "Terrasse extérieure", "Raccordement solaire", "Signalétique sur mesure"],
      ar: ["مرافق صحية مدمجة", "تجهيز مسبق للتكييف", "تكسية خشبية أو مركبة", "شرفة خارجية", "توصيل بالطاقة الشمسية", "لافتات حسب الطلب"],
      en: ["Integrated sanitary unit", "Air-con pre-fitted", "Timber or composite cladding", "External deck", "Solar ready", "Bespoke signage"],
    },
    skus: ["MOM-20", "MOM-30", "MOM-CH", "MOM-GU"],
  },
  {
    key: "curtain-walls",
    slug: "curtain-walls",
    navKey: "nav.curtainWalls",
    title: { fr: "Murs Rideaux", ar: "الجدران الستائرية", en: "Curtain Walls" },
    tagline: {
      fr: "Façades VEC et VEA haute performance",
      ar: "واجهات VEC وVEA عالية الأداء",
      en: "High-performance VEC and unitised façades",
    },
    description: {
      fr: "Notre bureau d'études conçoit des façades complètes : mur rideau VEC semi-capitif, système VEA préfabriqué en atelier et garde-corps verre structurel. Notes de calcul, essais et pose assurés par nos équipes.",
      ar: "يصمم مكتب دراساتنا واجهات كاملة: جدار ستائري VEC، ونظام VEA مُصنَّع مسبقاً في الورشة، وحواجز وقاية زجاجية إنشائية. الحسابات والاختبارات والتركيب من طرف فرقنا.",
      en: "Our engineering office designs complete façades: semi-captured VEC curtain wall, factory-built VEA unitised system and structural glass balustrades. Calculations, testing and installation by our own teams.",
    },
    image: "/images/ranges/curtain-walls.jpg",
    accent: "#6366F1",
    features: {
      fr: ["Préfabrication en atelier", "Notes de calcul et essais", "Double vitrage ITR", "Ucw jusqu'à 1,6 W/m²K", "Ossature à rupture de pont thermique", "Pose en grande hauteur"],
      ar: ["تصنيع مسبق في الورشة", "حسابات واختبارات", "زجاج مزدوج عازل", "Ucw حتى 1.6 واط/م²كلفن", "هيكل بعزل حراري", "تركيب على ارتفاعات كبيرة"],
      en: ["Factory prefabrication", "Structural calculations and testing", "Low-E double glazing", "Ucw down to 1.6 W/m²K", "Thermally broken frame", "High-rise installation"],
    },
    specs: {
      fr: [["Systèmes", "VEC semi-capitif / VEA panneau"], ["Trame", "1 200 à 1 800 mm"], ["Vitrage", "Jusqu'à 52 mm"], ["Ucw", "1,6 – 2,2 W/m²K"], ["Étanchéité", "A*4 E*1950 V*C5"], ["Hauteur max", "Illimitée par modules"]],
      ar: [["الأنظمة", "VEC شبه مقفل / VEA بألواح"], ["الشبكة", "1200 إلى 1800 مم"], ["الزجاج", "حتى 52 مم"], ["Ucw", "1.6 – 2.2 واط/م²كلفن"], ["الإحكام", "A*4 E*1950 V*C5"], ["الارتفاع الأقصى", "غير محدود بالوحدات"]],
      en: [["Systems", "Semi-captured VEC / VEA panel"], ["Grid", "1,200 to 1,800 mm"], ["Glazing", "Up to 52 mm"], ["Ucw", "1.6 – 2.2 W/m²K"], ["Weathertightness", "A*4 E*1950 V*C5"], ["Max height", "Unlimited by module"]],
    },
    applications: {
      fr: ["Tours de bureaux", "Sièges sociaux", "Hôtels", "Centres commerciaux", "Cliniques et hôpitaux", "Aéroports"],
      ar: ["أبراج المكاتب", "المقار الرئيسية", "الفنادق", "المراكز التجارية", "المصحات والمستشفيات", "المطارات"],
      en: ["Office towers", "Headquarters", "Hotels", "Shopping centres", "Clinics and hospitals", "Airports"],
    },
    options: {
      fr: ["Brise-soleil orientable", "Vitrage sérigraphié", "Ouvrant pompiers", "Photovoltaïque intégré", "Éclairage architectural", "Nettoyage par nacelle"],
      ar: ["كاسرات شمس قابلة للتوجيه", "زجاج مطبوع", "نافذة إطفاء", "ألواح شمسية مدمجة", "إضاءة معمارية", "تنظيف بمنصة رافعة"],
      en: ["Orientable sun shading", "Fritted glazing", "Smoke vent opener", "Integrated photovoltaics", "Architectural lighting", "Cradle access"],
    },
    skus: ["MUR-VEC", "MUR-VEA", "MUR-GC"],
  },
  {
    key: "partitions",
    slug: "partitions",
    navKey: "nav.partitions",
    title: { fr: "Cloisons & Aménagement", ar: "الفواصل والتهيئة", en: "Partitions & Fit-out" },
    tagline: {
      fr: "Cloisons amovibles vitrées et pleines pour bureaux",
      ar: "فواصل قابلة للفك زجاجية ومصمتة للمكاتب",
      en: "Demountable glazed and solid office partitions",
    },
    description: {
      fr: "Aménagez vos plateaux avec nos cloisons amovibles : aluminium simple ou double vitrage, verre Sécurit sans montant et cloisons pleines modulaires. Démontables et réutilisables lors de vos réaménagements.",
      ar: "هيّئ فضاءاتكم بفواصلنا القابلة للفك: ألمنيوم بزجاج مفرد أو مزدوج، زجاج Sécurit بدون قوائم، وفواصل مصمتة نمطية. قابلة للفك وإعادة الاستعمال.",
      en: "Fit out your floors with our demountable partitions: single or double glazed aluminium, frameless Sécurit glass and modular solid panels. Dismantlable and reusable at every refit.",
    },
    image: "/images/ranges/partitions.jpg",
    accent: "#8B5CF6",
    features: {
      fr: ["100% démontable et réutilisable", "Affaiblissement acoustique jusqu'à 42 dB", "Store intégré entre vitrages", "Portes vitrées ou pleines", "Passage de câbles intégré", "Pose sans poussière"],
      ar: ["قابلة للفك وإعادة الاستعمال 100٪", "عزل صوتي حتى 42 ديسيبل", "ستارة مدمجة بين الزجاج", "أبواب زجاجية أو مصمتة", "مرور الكابلات مدمج", "تركيب بدون غبار"],
      en: ["100% demountable and reusable", "Sound reduction up to 42 dB", "Integrated between-glass blinds", "Glazed or solid doors", "Integrated cable routing", "Dust-free installation"],
    },
    specs: {
      fr: [["Hauteur", "Jusqu'à 3 500 mm"], ["Épaisseur", "45 / 84 / 100 mm"], ["Vitrage", "Simple 10 mm / double 6-70-6"], ["Acoustique", "34 à 42 dB"], ["Finition", "Aluminium laqué ou mélaminé"], ["Démontabilité", "100%"]],
      ar: [["الارتفاع", "حتى 3500 مم"], ["السماكة", "45 / 84 / 100 مم"], ["الزجاج", "مفرد 10 مم / مزدوج 6-70-6"], ["الصوتيات", "34 إلى 42 ديسيبل"], ["التشطيب", "ألمنيوم مطلي أو ميلامين"], ["قابلية الفك", "100٪"]],
      en: [["Height", "Up to 3,500 mm"], ["Thickness", "45 / 84 / 100 mm"], ["Glazing", "Single 10 mm / double 6-70-6"], ["Acoustics", "34 to 42 dB"], ["Finish", "Powder-coated aluminium or melamine"], ["Demountability", "100%"]],
    },
    applications: {
      fr: ["Plateaux de bureaux", "Salles de réunion", "Open spaces", "Cabinets médicaux", "Banques et assurances", "Espaces de coworking"],
      ar: ["طوابق المكاتب", "قاعات الاجتماعات", "الفضاءات المفتوحة", "العيادات", "البنوك والتأمين", "فضاءات العمل المشترك"],
      en: ["Office floors", "Meeting rooms", "Open spaces", "Medical practices", "Banks and insurance", "Coworking spaces"],
    },
    options: {
      fr: ["Store vénitien intégré", "Vitrage acoustique renforcé", "Porte coulissante à galandage", "Habillage bois", "Éclairage linéaire", "Signalétique intégrée"],
      ar: ["ستارة فينيسية مدمجة", "زجاج عازل للصوت معزز", "باب منزلق مخفي", "تكسية خشبية", "إضاءة خطية", "لافتات مدمجة"],
      en: ["Integrated venetian blinds", "Enhanced acoustic glazing", "Pocket sliding door", "Timber veneer", "Linear lighting", "Integrated signage"],
    },
    skus: ["CLO-ALU-VIT", "CLO-ALU-DBL", "CLO-VER-SEC", "CLO-BUR"],
  },
];

export const RANGE_BY_SLUG: Record<string, Range> = Object.fromEntries(RANGES.map((r) => [r.slug, r]));

export function localise<T>(value: Record<Locale, T>, locale: Locale): T {
  return value[locale] ?? value.fr;
}
