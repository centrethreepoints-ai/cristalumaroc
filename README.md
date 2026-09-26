# CRISTALU MAROC — site vitrine

Site statique (HTML/CSS/JS vanilla, SEO friendly) + moteur 3D Three.js.

- `src/*.html` + `partials/` → `python3 build.py` génère les pages à la racine.
- `assets/js/engine/viewer.js` — moteur 3D réutilisable (`createViewer`, `buildProduct`, `loadModel(glb)`, `setFinish`).
- `assets/js/config/catalog.js` — catalogue produits/finitions/vitrages + `estimate()` (source unique pour configurateur & showroom). Renseigner `model: 'assets/models/xxx.glb'` pour brancher de vrais modèles 3D.
- Aperçu local : `python3 -m http.server 8000`
