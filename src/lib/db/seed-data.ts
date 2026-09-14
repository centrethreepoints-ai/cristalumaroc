/* ------------------------------------------------------------------
 * CRISTALU MAROC — jeu de données de démonstration réaliste
 * ------------------------------------------------------------------ */

export const CATEGORIES = [
  { code: "ALU", name: "Aluminium", name_ar: "الألمنيوم", name_en: "Aluminium", kind: "product", icon: "SquareStack" },
  { code: "PVC", name: "PVC", name_ar: "PVC", name_en: "PVC", kind: "product", icon: "RectangleHorizontal" },
  { code: "VER", name: "Verre", name_ar: "الزجاج", name_en: "Glass", kind: "product", icon: "PanelsTopLeft" },
  { code: "PER", name: "Pergolas", name_ar: "البرغولات", name_en: "Pergolas", kind: "product", icon: "Tent" },
  { code: "MOM", name: "Momo Box", name_ar: "مومو بوكس", name_en: "Momo Box", kind: "product", icon: "Box" },
  { code: "MUR", name: "Murs rideaux", name_ar: "الجدران الستائرية", name_en: "Curtain Walls", kind: "product", icon: "Building2" },
  { code: "CLO", name: "Cloisons", name_ar: "الفواصل", name_en: "Partitions", kind: "product", icon: "Columns3" },
  { code: "QUI", name: "Quincaillerie", name_ar: "المعدات", name_en: "Hardware", kind: "material", icon: "Wrench" },
  { code: "PRO", name: "Profils aluminium", name_ar: "مقاطع الألمنيوم", name_en: "Aluminium profiles", kind: "material", icon: "Ruler" },
  { code: "PVP", name: "Profils PVC", name_ar: "مقاطع PVC", name_en: "PVC profiles", kind: "material", icon: "Minus" },
  { code: "JOI", name: "Joints & étanchéité", name_ar: "الوصلات والعزل", name_en: "Seals", kind: "material", icon: "WrapText" },
] as const;

/** [sku, name, name_ar, category, unit, cost, price, vat, minStock, kind, description] */
export const PRODUCTS: any[] = [
  // ---- Produits finis ALUMINIUM ----
  ["ALU-FEN-2V", "Fenêtre aluminium 2 vantaux série 60", "نافذة ألمنيوم بضلفتين سلسلة 60", "ALU", "U", 2350, 4200, 20, 0, "finished",
    "Fenêtre à la française 2 vantaux, profilé série 60 mm à rupture de pont thermique, double vitrage 4/16/4."],
  ["ALU-FEN-COUL", "Fenêtre aluminium coulissante 2 rails", "نافذة ألمنيوم منزلقة بسكتين", "ALU", "U", 1980, 3600, 20, 0, "finished",
    "Coulissant 2 vantaux sur 2 rails, roulettes inox charge lourde, serrure 3 points."],
  ["ALU-POR-FR", "Porte aluminium à la française", "باب ألمنيوم بضلفة", "ALU", "U", 4600, 8400, 20, 0, "finished",
    "Porte d'entrée monobloc, panneau isolant 24 mm, paumelles 3D réglables, serrure 5 points."],
  ["ALU-POR-COUL", "Baie coulissante aluminium 3 rails", "باب منزلق ألمنيوم بثلاث سكات", "ALU", "U", 7200, 13500, 20, 0, "finished",
    "Grande baie coulissante 3 rails 6 vantaux, seuil PMR, double vitrage faiblement émissif."],
  ["ALU-OSC-BAT", "Fenêtre oscillo-battante série 70", "نافذة ألمنيوم بنظام مزدوج سلسلة 70", "ALU", "U", 3100, 5600, 20, 0, "finished",
    "Oscillo-battante série 70 mm, ferrage périmétrique, triple joint d'étanchéité."],
  ["ALU-VOLET", "Volet roulant aluminium intégré", "ستارة ألمنيوم مدمجة", "ALU", "U", 1750, 3200, 20, 0, "finished",
    "Coffre PVC/aluminium intégré, lames aluminium injectées mousse polyuréthane, motorisation Somfy."],

  // ---- Produits finis PVC ----
  ["PVC-FEN-2V", "Fenêtre PVC 2 vantaux série 70", "نافذة PVC بضلفتين سلسلة 70", "PVC", "U", 1650, 3100, 20, 0, "finished",
    "Fenêtre PVC 5 chambres, profilé 70 mm renfort acier galvanisé, double vitrage 4/16/4argon."],
  ["PVC-FEN-COUL", "Coulissant PVC 2 vantaux", "نافذة PVC منزلقة بضلفتين", "PVC", "U", 1450, 2750, 20, 0, "finished",
    "Coulissant PVC renforcé, rail aluminium, brosse d'étanchéité double."],
  ["PVC-POR-ENT", "Porte d'entrée PVC renforcée", "باب مدخل PVC مقوّى", "PVC", "U", 3400, 6300, 20, 0, "finished",
    "Porte PVC renfort acier, panneau décoratif, seuil aluminium rupture de pont thermique."],
  ["PVC-OSC-BAT", "Fenêtre oscillo-battante PVC", "نافذة PVC بنظام مزدوج", "PVC", "U", 2100, 3900, 20, 0, "finished",
    "Oscillo-battante PVC 70 mm, quincaillerie Roto, Uw 1,3 W/m²K."],

  // ---- Verre ----
  ["VER-DV-4164", "Double vitrage 4/16/4", "زجاج مزدوج 4/16/4", "VER", "M2", 210, 420, 20, 0, "finished",
    "Double vitrage isolant 4/16/4 avec intercalaire aluminium, gaz argon 90%."],
  ["VER-DV-4164A", "Double vitrage 4/16/4 argon ITR", "زجاج مزدوج عازل 4/16/4 أرغون", "VER", "M2", 265, 530, 20, 0, "finished",
    "Double vitrage à isolation thermique renforcée, couche faiblement émissive, argon."],
  ["VER-LAM-44-2", "Verre feuilleté 44.2 sécurité", "زجاج مصفح 44.2 للأمان", "VER", "M2", 290, 580, 20, 0, "finished",
    "Verre feuilleté de sécurité 2 x 4 mm avec 2 films PVB, classement 1B1."],
  ["VER-TEMP-8", "Verre trempé 8 mm", "زجاج مقسّى 8 مم", "VER", "M2", 240, 470, 20, 0, "finished",
    "Verre trempé sécurité 8 mm, bords polis, conforme EN 12150."],
  ["VER-TEMP-10", "Verre trempé 10 mm", "زجاج مقسّى 10 مم", "VER", "M2", 310, 610, 20, 0, "finished",
    "Verre trempé 10 mm pour garde-corps et cloisons, perçages sur mesure."],
  ["VER-SAB", "Verre sablé décoratif 6 mm", "زجاج مصقول زخرفي 6 مم", "VER", "M2", 275, 545, 20, 0, "finished",
    "Verre sablé mat une face pour cloisons de bureau et portes intérieures."],

  // ---- Pergolas ----
  ["PER-BIO-30", "Pergola bioclimatique 3 x 4 m", "برغولا بيومناخية 3×4 م", "PER", "U", 42000, 78000, 20, 0, "finished",
    "Pergola bioclimatique lames orientables 0-135°, motorisation Somfy IO, éclairage LED intégré, évacuation d'eau dans les poteaux."],
  ["PER-BIO-40", "Pergola bioclimatique 4 x 6 m", "برغولا بيومناخية 4×6 م", "PER", "U", 68000, 125000, 20, 0, "finished",
    "Pergola bioclimatique double motorisation, capteur pluie et vent, structure aluminium thermolaqué."],
  ["PER-TOIL", "Pergola toile rétractable 3 x 5 m", "برغولا بقماش قابل للطي 3×5 م", "PER", "U", 26000, 48000, 20, 0, "finished",
    "Pergola adossée toile acrylique rétractable, motorisation radio, armature aluminium."],
  ["PER-ALU-PLAT", "Pergola aluminium à toit plat fixe", "برغولا ألمنيوم بسقف ثابت", "PER", "U", 31000, 57000, 20, 0, "finished",
    "Pergola toit plat bac acier isolé, gouttière intégrée, finition thermolaquée RAL au choix."],

  // ---- Momo Box ----
  ["MOM-20", "Momo Box 20 — Bureau modulaire 20 m²", "مومو بوكس 20 — مكتب نمطي 20 م²", "MOM", "U", 88000, 155000, 20, 0, "finished",
    "Structure modulaire 5 x 4 m, ossature acier galvanisé, isolation laine de roche 100 mm, 2 fenêtres alu, 1 porte, électricité complète."],
  ["MOM-30", "Momo Box 30 — Module 30 m²", "مومو بوكس 30 — وحدة 30 م²", "MOM", "U", 124000, 218000, 20, 0, "finished",
    "Module 7,5 x 4 m, sanitaires intégrés, climatisation prête à raccorder, plancher OSB 22 mm."],
  ["MOM-CH", "Momo Box Chantier — Base vie 15 m²", "مومو بوكس ورش — قاعدة حياة 15 م²", "MOM", "U", 62000, 108000, 20, 0, "finished",
    "Base vie chantier 5 x 3 m, vestiaires, point d'eau, isolation renforcée, levage 4 points."],
  ["MOM-GU", "Momo Box Guérite de sécurité", "مومو بوكس — كشك حراسة", "MOM", "U", 34000, 62000, 20, 0, "finished",
    "Guérite 2,5 x 2 m, vitrage panoramique 4 faces, climatisation, comptoir intégré."],

  // ---- Murs rideaux ----
  ["MUR-VEC", "Mur rideau VEC semi-capitif", "جدار ستائري VEC", "MUR", "M2", 1850, 3450, 20, 0, "finished",
    "Mur rideau verre extérieur collé, ossature aluminium laquée, double vitrage ITR, Uw 1,6 W/m²K."],
  ["MUR-VEA", "Mur rideau VEA panneau", "جدار ستائري VEA بألواح", "MUR", "M2", 2150, 3980, 20, 0, "finished",
    "Mur rideau panneau préfabriqué en atelier, joint EPDM double barrière, rupture de pont thermique."],
  ["MUR-GC", "Garde-corps verre structurel", "حاجز وقاية زجاجي إنشائي", "MUR", "ML", 1450, 2750, 20, 0, "finished",
    "Garde-corps en verre trempé feuilleté 10.10.4, profilé aluminium encastré ou sur platine."],

  // ---- Cloisons ----
  ["CLO-ALU-VIT", "Cloison aluminium vitrée toute hauteur", "فاصل ألمنيوم زجاجي", "CLO", "M2", 980, 1850, 20, 0, "finished",
    "Cloison amovible aluminium simple vitrage 10 mm, montants 45 mm, joint silicone."],
  ["CLO-ALU-DBL", "Cloison aluminium double vitrage", "فاصل ألمنيوم بزجاج مزدوج", "CLO", "M2", 1320, 2450, 20, 0, "finished",
    "Cloison double vitrage 6/70/6 avec store intégré optionnel, affaiblissement acoustique 38 dB."],
  ["CLO-VER-SEC", "Cloison verre Sécurit sans montant", "فاصل زجاجي بدون قوائم", "CLO", "M2", 1180, 2200, 20, 0, "finished",
    "Cloison en verre trempé 12 mm sans montant vertical, pinces inox, profilé U haut et bas."],
  ["CLO-BUR", "Cloison de bureau modulaire pleine", "فاصل مكتبي نمطي", "CLO", "M2", 620, 1150, 20, 0, "finished",
    "Cloison modulaire mélaminé double peau, laine minérale 45 mm, hauteur 2,70 m."],

  // ---- Matières premières : profils aluminium ----
  ["PRF-ALU-60-DR", "Profilé dormant série 60 — 6,5 m", "مقطع إطار ثابت سلسلة 60 — 6.5 م", "PRO", "U", 168, 0, 20, 120, "material",
    "Barre de profilé dormant aluminium 60 mm, 6,5 m, alliage 6060 T5, brut anodisé."],
  ["PRF-ALU-60-OU", "Profilé ouvrant série 60 — 6,5 m", "مقطع ضلفة سلسلة 60 — 6.5 م", "PRO", "U", 142, 0, 20, 150, "material",
    "Barre de profilé ouvrant aluminium série 60, 6,5 m, gorge européenne 16 mm."],
  ["PRF-ALU-70-DR", "Profilé dormant série 70 RPT — 6,5 m", "مقطع إطار سلسلة 70 بعزل — 6.5 م", "PRO", "U", 245, 0, 20, 80, "material",
    "Profilé 70 mm à rupture de pont thermique, barrettes polyamide 24 mm."],
  ["PRF-ALU-70-OU", "Profilé ouvrant série 70 RPT — 6,5 m", "مقطع ضلفة سلسلة 70 بعزل — 6.5 م", "PRO", "U", 218, 0, 20, 100, "material",
    "Profilé ouvrant 70 mm RPT, gorge 16 mm, finition brut."],
  ["PRF-ALU-COUL", "Rail coulissant 3 voies — 6,5 m", "سكة منزلقة بثلاث مسارات — 6.5 م", "PRO", "U", 310, 0, 20, 60, "material",
    "Rail coulissant aluminium 3 voies avec inox rapporté, 6,5 m."],
  ["PRF-ALU-PLAT", "Tubulaire aluminium 100x100 — 6 m", "أنبوب ألمنيوم 100×100 — 6 م", "PRO", "U", 425, 0, 20, 40, "material",
    "Tubulaire aluminium 100 x 100 x 3 mm pour structures pergola, 6 m."],
  ["PRF-ALU-LAME", "Lame bioclimatique orientable — 6 m", "شفرة بيومناخية قابلة للتوجيه — 6 م", "PRO", "U", 285, 0, 20, 50, "material",
    "Lame aluminium extrudée 200 mm pour pergola bioclimatique, axe intégré."],
  ["PRF-ALU-MR", "Montant mur rideau T60 — 6,5 m", "قائمة جدار ستائري T60 — 6.5 م", "PRO", "U", 355, 0, 20, 45, "material",
    "Montant aluminium T60 pour mur rideau avec capot extérieur, 6,5 m."],

  // ---- Matières premières : profils PVC ----
  ["PRF-PVC-70-DR", "Profilé dormant PVC 70 — 6,5 m", "مقطع إطار PVC 70 — 6.5 م", "PVP", "U", 132, 0, 20, 90, "material",
    "Profilé PVC 5 chambres 70 mm, blanc, avec chambre de renfort acier."],
  ["PRF-PVC-70-OU", "Profilé ouvrant PVC 70 — 6,5 m", "مقطع ضلفة PVC 70 — 6.5 م", "PVP", "U", 118, 0, 20, 110, "material",
    "Profilé ouvrant PVC 70 mm blanc, gorge ferrage 16 mm."],
  ["PRF-PVC-RENF", "Renfort acier galvanisé 2 mm — 6,5 m", "تقوية فولاذية مغلفنة 2 مم — 6.5 م", "PVP", "U", 68, 0, 20, 130, "material",
    "Renfort tubulaire acier galvanisé 2 mm pour profils PVC."],

  // ---- Quincaillerie ----
  ["QUI-POIG-ALU", "Poignée aluminium laquée (blanc/noir)", "مقبض ألمنيوم مطلي", "QUI", "U", 38, 0, 20, 200, "material",
    "Poignée béquille aluminium, entraxe 70 mm, finition thermolaquée."],
  ["QUI-PAUM-3D", "Paumelle 3D réglable (jeu de 3)", "مفصلات ثلاثية الأبعاد (طقم 3)", "QUI", "LOT", 92, 0, 20, 80, "material",
    "Jeu de 3 paumelles réglables 3 dimensions, charge 120 kg."],
  ["QUI-SER-5P", "Serrure 5 points porte", "قفل بخمس نقاط للباب", "QUI", "U", 480, 0, 20, 40, "material",
    "Serrure multipoints 5 points, axe 35 mm, têtière filante."],
  ["QUI-CREM-OB", "Ferrage oscillo-battant périmétrique", "آلية فتح مزدوج محيطية", "QUI", "U", 620, 0, 20, 35, "material",
    "Ensemble ferrage oscillo-battant périmétrique, compas d'entrebâillement."],
  ["QUI-ROUL-COUL", "Roulette coulissante charge lourde", "عجلة منزلقة للحمل الثقيل", "QUI", "U", 46, 0, 20, 180, "material",
    "Roulette double galet inox, charge 150 kg par vantail."],
  ["QUI-VIS-INOX", "Vis inox 4,2 x 38 — boîte 500", "براغي إينوكس 4.2×38 — علبة 500", "QUI", "LOT", 145, 0, 20, 25, "material",
    "Boîte de 500 vis autoperceuses inox A2 tête fraisée."],
  ["QUI-JOINT-EP", "Joint EPDM 4-6 mm — rouleau 250 m", "وصلة EPDM — لفة 250 م", "JOI", "U", 320, 0, 20, 20, "material",
    "Rouleau de joint EPDM noir 250 m pour menuiseries aluminium."],
  ["QUI-SIL-NEU", "Silicone neutre transparent — 310 ml", "سيليكون محايد شفاف — 310 مل", "QUI", "U", 42, 0, 20, 60, "material",
    "Cartouche de mastic silicone neutre pour vitrage, résistant UV."],
  ["QUI-MOUSSE-PU", "Mousse polyuréthane expansive — 750 ml", "رغوة بولي يوريثان — 750 مل", "QUI", "U", 58, 0, 20, 45, "material",
    "Mousse expansive pour calfeutrement et isolation des menuiseries."],
  ["QUI-INT-ALU", "Intercalaire aluminium 16 mm — 6 m", "فاصل ألمنيوم 16 مم — 6 م", "JOI", "U", 88, 0, 20, 55, "material",
    "Barre d'intercalaire aluminium 16 mm pour double vitrage."],
];

export const WAREHOUSES = [
  { code: "WH-PRINC", name: "Entrepôt principal", name_ar: "المستودع الرئيسي", name_en: "Main Warehouse", address: "Zone Industrielle Sidi Ghanem, Casablanca", is_default: 1 },
  { code: "WH-ALU", name: "Entrepôt Aluminium", name_ar: "مستودع الألمنيوم", name_en: "Aluminium Warehouse", address: "Bâtiment A — Zone Industrielle Sidi Ghanem", is_default: 0 },
  { code: "WH-PVC", name: "Entrepôt PVC", name_ar: "مستودع PVC", name_en: "PVC Warehouse", address: "Bâtiment B — Zone Industrielle Sidi Ghanem", is_default: 0 },
  { code: "WH-VER", name: "Entrepôt Verre", name_ar: "مستودع الزجاج", name_en: "Glass Warehouse", address: "Bâtiment C — Zone Industrielle Sidi Ghanem", is_default: 0 },
  { code: "WH-ACC", name: "Entrepôt Accessoires", name_ar: "مستودع الإكسسوارات", name_en: "Accessories Warehouse", address: "Mezzanine — Zone Industrielle Sidi Ghanem", is_default: 0 },
  { code: "WH-PF", name: "Produits finis", name_ar: "المنتجات النهائية", name_en: "Finished Products", address: "Quai d'expédition — Zone Industrielle Sidi Ghanem", is_default: 0 },
] as const;

export const USERS = [
  { email: "admin@cristalu.ma", full_name: "Youssef El Amrani", role: "admin", job_title: "Directeur général", phone: "+212 661 20 45 12", color: "#E30613" },
  { email: "direction@cristalu.ma", full_name: "Nadia Berrada", role: "direction", job_title: "Directrice d'exploitation", phone: "+212 662 33 18 07", color: "#0EA5E9" },
  { email: "commercial@cristalu.ma", full_name: "Karim Idrissi", role: "commercial", job_title: "Responsable commercial", phone: "+212 663 44 21 55", color: "#F59E0B" },
  { email: "sara@cristalu.ma", full_name: "Sara Benjelloun", role: "commercial", job_title: "Chargée d'affaires", phone: "+212 664 51 09 33", color: "#8B5CF6" },
  { email: "stock@cristalu.ma", full_name: "Hicham Ouazzani", role: "stock", job_title: "Magasinier principal", phone: "+212 665 77 40 21", color: "#10B981" },
  { email: "production@cristalu.ma", full_name: "Rachid Tazi", role: "production", job_title: "Responsable production", phone: "+212 666 82 15 44", color: "#EF4444" },
  { email: "compta@cristalu.ma", full_name: "Leila Fassi", role: "accountant", job_title: "Responsable comptabilité", phone: "+212 667 90 28 76", color: "#6366F1" },
  { email: "pose@cristalu.ma", full_name: "Mohammed Sabri", role: "installer", job_title: "Chef d'équipe pose", phone: "+212 668 13 55 90", color: "#14B8A6" },
] as const;

export const CITIES = [
  "Casablanca", "Rabat", "Marrakech", "Tanger", "Agadir", "Fès", "Meknès",
  "Kénitra", "Oujda", "El Jadida", "Mohammedia", "Salé", "Tétouan", "Bouskoura",
] as const;

/** [company, contact, city, type, activity, ice, if, rc] */
export const CUSTOMERS: any[] = [
  ["Atlas Immobilier SA", "Omar Benkirane", "Casablanca", "entreprise", "Promotion immobilière", "001847293000045", "40287155", "198472"],
  ["Groupe Marina Holding", "Hind Alami", "Rabat", "entreprise", "Hôtellerie & resorts", "002938471000082", "15039284", "283741"],
  ["BTP Sahel Construction", "Abdellah Cherkaoui", "Agadir", "entreprise", "Gros œuvre", "003748291000019", "22847190", "374819"],
  ["Résidences Al Manar", "Rachida Naciri", "Marrakech", "entreprise", "Promotion immobilière", "004829173000064", "51928374", "482917"],
  ["Casablanca Business Park", "Mehdi Bennis", "Casablanca", "entreprise", "Immobilier tertiaire", "005719283000037", "61829374", "571928"],
  ["Hôtel Riad Zellige", "Fatima Zahra Idrissi", "Marrakech", "entreprise", "Hôtellerie", "006918273000052", "72918374", "691827"],
  ["Société Tanger Free Trade", "Yassine Bouzid", "Tanger", "entreprise", "Zone industrielle", "007182937000028", "81729384", "718293"],
  ["Villa Amira", "Amira Sebti", "Bouskoura", "particulier", "Résidence privée", "", "", ""],
  ["Cabinet Dr. Bennani", "Soufiane Bennani", "Rabat", "entreprise", "Santé", "008293718000091", "91827364", "829371"],
  ["Écoles Al Fath", "Khalid Rharbi", "Fès", "entreprise", "Enseignement privé", "009382718000046", "18293746", "938271"],
  ["Industries Souss Métal", "Nawal Ait Taleb", "Agadir", "entreprise", "Métallurgie", "010293847000073", "29183746", "1029384"],
  ["Résidence Les Palmiers", "Adil Mounir", "El Jadida", "entreprise", "Promotion immobilière", "011382947000018", "38291746", "1138294"],
  ["Café Glacier Milano", "Giuseppe Rinaldi", "Casablanca", "entreprise", "Restauration", "012493827000059", "47192837", "1249382"],
  ["Villa Les Oliviers", "Samira Ouahbi", "Meknès", "particulier", "Résidence privée", "", "", ""],
  ["Technopark Kénitra", "Hicham Laroussi", "Kénitra", "entreprise", "Immobilier tertiaire", "013829471000032", "58291734", "1382947"],
  ["Groupe Scolaire Horizon", "Zineb Alaoui", "Casablanca", "entreprise", "Enseignement privé", "014718293000085", "69182735", "1471829"],
  ["Riad Dar Yasmine", "Karima El Fassi", "Marrakech", "entreprise", "Hôtellerie", "015293847000027", "72918345", "1529384"],
  ["Clinique Al Amane", "Dr. Reda Sqalli", "Rabat", "entreprise", "Santé", "016382917000064", "81827394", "1638291"],
  ["Villa Océane", "Yasmine Bouhaddou", "Mohammedia", "particulier", "Résidence privée", "", "", ""],
  ["Société Nador Industrie", "Mustapha Aouragh", "Oujda", "entreprise", "Industrie agroalimentaire", "017293817000049", "91728394", "1729381"],
];

/** Prospects (leads not yet converted) */
export const PROSPECTS: any[] = [
  ["Projet Marina Bay Tanger", "Anas Belkadi", "Tanger", "entreprise", "Promotion immobilière", "018392718000011", "", ""],
  ["Villa Nadia", "Nadia Chraibi", "Casablanca", "particulier", "Résidence privée", "", "", ""],
  ["Hotel Atlas Premium", "Omar Filali", "Marrakech", "entreprise", "Hôtellerie", "019283718000093", "", ""],
  ["Centre Commercial Fès Mall", "Hakim Zerhouni", "Fès", "entreprise", "Retail", "020192837000056", "", ""],
  ["Usine Atlantic Agro", "Salma Berrada", "Kénitra", "entreprise", "Agroalimentaire", "021293817000034", "", ""],
  ["Résidence Jardins d'Anfa", "Tarik Lahlou", "Casablanca", "entreprise", "Promotion immobilière", "022392817000078", "", ""],
  ["Villa Riad Salam", "Ibtissam Kabbaj", "Rabat", "particulier", "Résidence privée", "", "", ""],
  ["Café Lounge Skyline", "Amine Benali", "Tanger", "entreprise", "Restauration", "023192837000042", "", ""],
  ["Ecole Internationale Agadir", "Rachid Boukhris", "Agadir", "entreprise", "Enseignement privé", "024293817000065", "", ""],
  ["Showroom Auto Premium", "Kenza Alaoui", "Casablanca", "entreprise", "Automobile", "025392817000029", "", ""],
];

export const SUPPLIERS: any[] = [
  ["AluProfil Maroc SARL", "Profils aluminium", "Said Berrada", "Casablanca", "001293847000011", "12938471", "129384", "+212 522 34 56 78", 5],
  ["PVC Extrusion Atlas", "Profils PVC", "Hassan Moutawakil", "Kénitra", "002392817000048", "23928174", "239281", "+212 537 45 67 89", 4],
  ["Saint-Gobain Glass Maroc", "Vitrage", "Claire Dubois", "Casablanca", "003291837000092", "32918374", "329183", "+212 522 78 90 12", 5],
  ["Verre du Souss", "Vitrage", "Mohamed Ait Lahcen", "Agadir", "004192837000035", "41928374", "419283", "+212 528 23 45 67", 4],
  ["Quincaillerie Industrielle Casa", "Quincaillerie", "Abderrahim Fassi", "Casablanca", "005293817000076", "52938174", "529381", "+212 522 56 78 90", 4],
  ["Somfy Maroc", "Motorisation", "Julien Marchand", "Casablanca", "006382917000029", "63829174", "638291", "+212 522 89 01 23", 5],
  ["Roto Frank Maghreb", "Quincaillerie", "Stefan Weber", "Tanger", "007192837000063", "71928374", "719283", "+212 539 34 56 78", 5],
  ["Sika Maroc", "Étanchéité", "Youssef Bakkali", "Casablanca", "008293718000017", "82937184", "829371", "+212 522 12 34 56", 4],
  ["Thermolaquage Atlas", "Traitement de surface", "Karim Ziani", "Mohammedia", "009381728000054", "93817284", "938172", "+212 523 67 89 01", 3],
  ["Transport Atlas Logistique", "Transport", "Lahcen Bouzid", "Casablanca", "010293817000098", "10293817", "1029381", "+212 522 90 12 34", 4],
  ["Acier & Dérivés Casa", "Acier", "Noureddine Sabri", "Casablanca", "011392817000041", "11392817", "1139281", "+212 522 45 67 89", 3],
  ["Isolation Pro Maroc", "Isolation", "Imane Rachidi", "Rabat", "012293817000086", "12293817", "1229381", "+212 537 78 90 12", 4],
] as const;

export const PROJECTS: any[] = [
  ["marina-bay-residences", "Marina Bay Residences", "إقامة مارينا باي", "Marina Bay Residences", "Murs rideaux", "Groupe Marina Holding", "Tanger", 2025, 4800,
    "Façade VEC de 4 800 m² sur 22 niveaux, double vitrage ITR, livrée en 9 mois avec deux équipes de pose en rotation."],
  ["villa-anfa-premium", "Villa Anfa Premium", "فيلا أنفا بريميم", "Villa Anfa Premium", "Aluminium", "Privé", "Casablanca", 2026, 420,
    "Baies coulissantes 3 rails toute hauteur, 42 ml de garde-corps verre et 6 fenêtres oscillo-battantes."],
  ["riad-zellige", "Riad Zellige — Rénovation", "رياض الزليج — ترميم", "Riad Zellige — Renovation", "Pergolas", "Hôtel Riad Zellige", "Marrakech", 2025, 260,
    "Pergola bioclimatique 12 x 6 m sur patio central, lames orientables et éclairage LED intégré."],
  ["technopark-kenitra", "Technopark Kénitra — Cloisons", "تكنوبارك القنيطرة — فواصل", "Technopark Kenitra — Partitions", "Cloisons", "Technopark Kénitra", "Kénitra", 2025, 1900,
    "1 900 m² de cloisons aluminium double vitrage avec stores intégrés sur 3 plateaux de bureaux."],
  ["momo-box-chantier", "Base vie — Chantier LGV", "قاعدة حياة — ورش القطار فائق السرعة", "Site camp — LGV worksite", "Momo Box", "BTP Sahel Construction", "Kénitra", 2026, 900,
    "18 modules Momo Box Chantier livrés et installés en 6 semaines pour la base vie du chantier."],
  ["atlas-towers", "Atlas Towers — Fenêtres PVC", "أبراج أطلس — نوافذ PVC", "Atlas Towers — PVC windows", "PVC", "Atlas Immobilier SA", "Casablanca", 2024, 3200,
    "840 fenêtres PVC oscillo-battantes sur 4 tours d'habitation, Uw 1,3 W/m²K."],
  ["clinique-al-amane", "Clinique Al Amane — Murs rideaux", "مصحة الأمان — جدران ستائرية", "Al Amane Clinic — Curtain walls", "Murs rideaux", "Clinique Al Amane", "Rabat", 2026, 1150,
    "Mur rideau VEA 1 150 m² avec vitrage feuilleté de sécurité et protection solaire."],
  ["hotel-atlas-premium", "Hôtel Atlas Premium — Pergolas", "فندق أطلس بريميم — برغولات", "Atlas Premium Hotel — Pergolas", "Pergolas", "Hotel Atlas Premium", "Marrakech", 2025, 640,
    "6 pergolas bioclimatiques sur terrasses, motorisation Somfy IO pilotée par GTB."],
] as const;

export const NEWS: any[] = [
  ["Nouvelle ligne de vitrage isolant automatisée", "خط تزجيج عازل آلي جديد",
    "Production", "2026-06-18",
    "Cristalu Maroc investit dans une ligne de vitrage isolant entièrement automatisée : capacité portée à 12 000 m² par mois, contrôle dimensionnel laser et traçabilité unitaire.",
    "استثمرت كريستالو المغرب في خط تزجيج عازل آلي بالكامل: طاقة إنتاجية تصل إلى 12000 م² شهرياً."],
  ["Lancement de la gamme Momo Box 30", "إطلاق مجموعة مومو بوكس 30",
    "Produit", "2026-04-02",
    "Le nouveau module Momo Box 30 de 30 m² intègre sanitaires, isolation renforcée et préparation climatisation. Livré monté ou en kit, installé en une journée.",
    "تدمج وحدة مومو بوكس 30 الجديدة مرافق صحية وعزلاً معززاً وتجهيزاً للتكييف."],
  ["Cristalu Maroc certifié ISO 9001:2015", "كريستالو المغرب تحصل على شهادة ISO 9001:2015",
    "Entreprise", "2026-01-27",
    "Notre système de management de la qualité a été certifié ISO 9001:2015 par Bureau Veritas, confirmant la rigueur de notre process industriel.",
    "تم اعتماد نظام إدارة الجودة لدينا وفق ISO 9001:2015 من طرف Bureau Veritas."],
  ["Ouverture du showroom de Tanger", "افتتاح قاعة العرض بطنجة",
    "Entreprise", "2025-11-14",
    "Un showroom de 450 m² ouvre ses portes à Tanger Free Zone : échantillons grandeur réelle de fenêtres, coulissants, pergolas et modules Momo Box.",
    "افتُتحت قالة عرض بمساحة 450 م² في المنطقة الحرة بطنجة."],
  ["Pergolas bioclimatiques : le guide 2026", "البرغولات البيومناخية: دليل 2026",
    "Conseils", "2025-09-30",
    "Tout savoir sur les pergolas à lames orientables : orientation, motorisation, évacuation d'eau, entretien et réglementation au Maroc.",
    "كل ما تحتاج معرفته عن البرغولات ذات الشفرات القابلة للتوجيه."],
] as const;

export const QC_CRITERIA = [
  "Dimensions", "Profil", "Coloris", "Vitrage", "Quincaillerie", "Ouverture", "Finition", "Nettoyage",
] as const;

/** BOM templates keyed by finished product SKU. basis: unit | area | perimeter */
export const BOM_TEMPLATES: Record<string, [string, string, number, number][]> = {
  // [componentSku, basis, qtyPer, wastage%]
  "ALU-FEN-2V": [
    ["PRF-ALU-60-DR", "perimeter", 1, 8],
    ["PRF-ALU-60-OU", "perimeter", 0.5, 8],
    ["VER-DV-4164", "area", 0.85, 3],
    ["QUI-JOINT-EP", "perimeter", 0.35, 5],
    ["QUI-POIG-ALU", "unit", 2, 0],
    ["QUI-PAUM-3D", "unit", 1, 0],
    ["QUI-VIS-INOX", "unit", 0.06, 0],
    ["QUI-SIL-NEU", "perimeter", 0.012, 0],
  ],
  "ALU-FEN-COUL": [
    ["PRF-ALU-COUL", "unit", 1, 6],
    ["PRF-ALU-60-OU", "perimeter", 0.5, 8],
    ["VER-DV-4164", "area", 0.8, 3],
    ["QUI-ROUL-COUL", "unit", 4, 0],
    ["QUI-JOINT-EP", "perimeter", 0.3, 5],
    ["QUI-VIS-INOX", "unit", 0.05, 0],
  ],
  "ALU-POR-FR": [
    ["PRF-ALU-70-DR", "perimeter", 1, 8],
    ["PRF-ALU-70-OU", "perimeter", 1, 8],
    ["VER-LAM-44-2", "area", 0.6, 2],
    ["QUI-SER-5P", "unit", 1, 0],
    ["QUI-PAUM-3D", "unit", 1, 0],
    ["QUI-POIG-ALU", "unit", 1, 0],
    ["QUI-JOINT-EP", "perimeter", 0.4, 5],
    ["QUI-MOUSSE-PU", "unit", 0.5, 0],
  ],
  "ALU-POR-COUL": [
    ["PRF-ALU-COUL", "unit", 1.6, 6],
    ["PRF-ALU-70-OU", "perimeter", 0.6, 8],
    ["VER-DV-4164A", "area", 0.82, 3],
    ["QUI-ROUL-COUL", "unit", 6, 0],
    ["QUI-JOINT-EP", "perimeter", 0.38, 5],
    ["QUI-VIS-INOX", "unit", 0.1, 0],
  ],
  "ALU-OSC-BAT": [
    ["PRF-ALU-70-DR", "perimeter", 1, 8],
    ["PRF-ALU-70-OU", "perimeter", 0.5, 8],
    ["VER-DV-4164A", "area", 0.85, 3],
    ["QUI-CREM-OB", "unit", 1, 0],
    ["QUI-POIG-ALU", "unit", 1, 0],
    ["QUI-JOINT-EP", "perimeter", 0.42, 5],
    ["QUI-SIL-NEU", "perimeter", 0.015, 0],
  ],
  "PVC-FEN-2V": [
    ["PRF-PVC-70-DR", "perimeter", 1, 7],
    ["PRF-PVC-70-OU", "perimeter", 0.5, 7],
    ["PRF-PVC-RENF", "perimeter", 0.8, 5],
    ["VER-DV-4164", "area", 0.85, 3],
    ["QUI-POIG-ALU", "unit", 2, 0],
    ["QUI-PAUM-3D", "unit", 1, 0],
    ["QUI-JOINT-EP", "perimeter", 0.35, 5],
  ],
  "PVC-OSC-BAT": [
    ["PRF-PVC-70-DR", "perimeter", 1, 7],
    ["PRF-PVC-70-OU", "perimeter", 0.5, 7],
    ["PRF-PVC-RENF", "perimeter", 0.8, 5],
    ["VER-DV-4164A", "area", 0.85, 3],
    ["QUI-CREM-OB", "unit", 1, 0],
    ["QUI-POIG-ALU", "unit", 1, 0],
  ],
  "PER-BIO-30": [
    ["PRF-ALU-PLAT", "unit", 4, 4],
    ["PRF-ALU-LAME", "unit", 6, 5],
    ["QUI-VIS-INOX", "unit", 0.8, 0],
    ["QUI-SIL-NEU", "unit", 4, 0],
  ],
  "PER-BIO-40": [
    ["PRF-ALU-PLAT", "unit", 6, 4],
    ["PRF-ALU-LAME", "unit", 9, 5],
    ["QUI-VIS-INOX", "unit", 1.4, 0],
    ["QUI-SIL-NEU", "unit", 6, 0],
  ],
  "MOM-20": [
    ["PRF-ALU-PLAT", "unit", 6, 4],
    ["PRF-ALU-60-DR", "unit", 2, 5],
    ["VER-DV-4164", "area", 4, 3],
    ["QUI-VIS-INOX", "unit", 2, 0],
    ["QUI-MOUSSE-PU", "unit", 6, 0],
  ],
  "MUR-VEC": [
    ["PRF-ALU-MR", "perimeter", 0.9, 6],
    ["VER-DV-4164A", "area", 0.95, 2],
    ["QUI-JOINT-EP", "perimeter", 0.5, 5],
    ["QUI-SIL-NEU", "area", 0.08, 0],
    ["QUI-VIS-INOX", "unit", 0.2, 0],
  ],
  "CLO-ALU-VIT": [
    ["PRF-ALU-60-DR", "perimeter", 0.8, 6],
    ["VER-TEMP-10", "area", 0.92, 2],
    ["QUI-JOINT-EP", "perimeter", 0.4, 5],
    ["QUI-SIL-NEU", "area", 0.05, 0],
  ],
};

export const OPENING_SYSTEMS = [
  "À la française", "Oscillo-battant", "Coulissant 2 rails", "Coulissant 3 rails",
  "Fixe", "Soufflet", "Pivotant", "Levante-coulissant",
] as const;

export const GLASS_TYPES = [
  "Simple vitrage 6 mm", "Double vitrage 4/16/4", "Double vitrage ITR argon",
  "Verre feuilleté 44.2", "Verre trempé 8 mm", "Verre trempé 10 mm", "Verre sablé",
] as const;

export const COLORS = [
  "Blanc RAL 9016", "Gris anthracite RAL 7016", "Noir mat RAL 9005",
  "Aluminium naturel anodisé", "Bronze", "Chêne doré (PVC)", "Sur mesure RAL",
] as const;
