/**
 * Catalogue produits — source unique de vérité pour configurateur & showroom.
 * À terme : remplaçable par une API/CMS (même schéma JSON).
 * `model` : chemin GLB optionnel (assets/models/…). S'il est absent, le moteur
 * génère le produit procéduralement via buildProduct().
 */
export const CATALOG = {
  types: [
    { id: 'fenetre',   label: 'Fenêtre',     leaves: [1, 2, 3], w: [0.4, 2.4, 1.2], h: [0.4, 2.2, 1.3], base: 1400, model: null },
    { id: 'porte',     label: 'Porte',       leaves: [1],       w: [0.8, 1.4, 0.9], h: [2.0, 2.6, 2.15], base: 3200, model: null },
    { id: 'baie',      label: 'Baie vitrée', leaves: [2, 3, 4], w: [1.4, 6.0, 2.4], h: [1.8, 2.8, 2.2], base: 2100, model: null },
    { id: 'murrideau', label: 'Mur rideau',  leaves: [2, 3, 4], w: [2.0, 8.0, 3.0], h: [2.4, 6.0, 3.0], base: 2600, model: null },
    { id: 'pergola',   label: 'Pergola',     leaves: [1],       w: [2.5, 6.0, 3.5], h: [2.3, 3.0, 2.6], base: 2900, model: null },
  ],
  materials: [
    { id: 'alu', label: 'Aluminium', factor: 1.0 },
    { id: 'pvc', label: 'PVC',       factor: 0.78 },
  ],
  finishes: [
    { id: 'anthracite', label: 'Anthracite', hex: '#2b2d30', factor: 1.0 },
    { id: 'noir',       label: 'Noir',       hex: '#121314', factor: 1.0 },
    { id: 'blanc',      label: 'Blanc',      hex: '#f2f2ef', factor: 0.95 },
    { id: 'alu',        label: 'Alu brossé', hex: '#b9bcc0', factor: 1.05 },
    { id: 'bronze',     label: 'Bronze',     hex: '#6b5646', factor: 1.1 },
    { id: 'chene',      label: 'Chêne doré', hex: '#9a6b3c', factor: 1.15 },
  ],
  glazing: [
    { id: 'dv',   label: 'Double vitrage 4/16/4', factor: 1.0 },
    { id: 'dvf',  label: 'Feuilleté sécurité',    factor: 1.18 },
    { id: 'ac',   label: 'Acoustique',            factor: 1.25 },
    { id: 'tv',   label: 'Triple vitrage',        factor: 1.4 },
  ],
};

/** Estimation indicative (MAD) — à remplacer par la grille tarifaire réelle. */
export function estimate(s) {
  const t = CATALOG.types.find(x => x.id === s.type);
  const m = CATALOG.materials.find(x => x.id === s.material);
  const f = CATALOG.finishes.find(x => x.id === s.finish);
  const g = CATALOG.glazing.find(x => x.id === s.glazing);
  const area = s.width * s.height;
  return Math.round(t.base * area * m.factor * f.factor * g.factor / 50) * 50;
}
