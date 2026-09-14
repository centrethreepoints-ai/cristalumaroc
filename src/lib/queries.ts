import { all, get } from "./db";

export function getProjects(opts: { featured?: boolean; limit?: number; category?: string } = {}) {
  const where: string[] = ["published = 1"];
  const params: any[] = [];
  if (opts.featured) where.push("featured = 1");
  if (opts.category) {
    where.push("category = ?");
    params.push(opts.category);
  }
  return all(
    `SELECT * FROM projects WHERE ${where.join(" AND ")} ORDER BY sort_order ASC, year DESC ${opts.limit ? "LIMIT " + Number(opts.limit) : ""}`,
    params,
  );
}

export function getProject(slug: string) {
  return get(`SELECT * FROM projects WHERE slug = ? AND published = 1`, [slug]);
}

export function getProjectCategories() {
  return all<{ category: string; n: number }>(
    `SELECT category, COUNT(*) AS n FROM projects WHERE published = 1 GROUP BY category ORDER BY category`,
  );
}

export function getNews(opts: { limit?: number; category?: string } = {}) {
  const where = ["published = 1"];
  const params: any[] = [];
  if (opts.category) {
    where.push("category = ?");
    params.push(opts.category);
  }
  return all(
    `SELECT * FROM news_posts WHERE ${where.join(" AND ")} ORDER BY published_at DESC ${opts.limit ? "LIMIT " + Number(opts.limit) : ""}`,
    params,
  );
}

export function getNewsPost(slug: string) {
  return get(`SELECT * FROM news_posts WHERE slug = ? AND published = 1`, [slug]);
}

export function getGallery(category?: string) {
  if (category && category !== "all") {
    return all(`SELECT * FROM gallery_images WHERE category = ? ORDER BY sort_order`, [category]);
  }
  return all(`SELECT * FROM gallery_images ORDER BY sort_order`);
}

export function getGalleryCategories() {
  return all<{ category: string; n: number }>(
    `SELECT category, COUNT(*) AS n FROM gallery_images GROUP BY category ORDER BY sort_order`,
  );
}

/** Public catalogue used by the product pages. */
export function getCatalogProducts(skus?: string[]) {
  if (skus?.length) {
    const placeholders = skus.map(() => "?").join(",");
    return all(
      `SELECT p.*, c.code AS category_code, c.name AS category_name
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.status = 'active' AND p.kind = 'finished' AND p.sku IN (${placeholders})`,
      skus,
    );
  }
  return all(
    `SELECT p.*, c.code AS category_code, c.name AS category_name
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.status = 'active' AND p.kind = 'finished' ORDER BY p.category_id, p.sku`,
  );
}

export function getProductBySku(sku: string) {
  return get(
    `SELECT p.*, c.code AS category_code, c.name AS category_name
     FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.sku = ?`,
    [sku],
  );
}

export function getCategories() {
  return all(`SELECT * FROM categories ORDER BY kind DESC, name`);
}

export function getCompanyInfo() {
  const rows = all<{ key: string; value: string }>(`SELECT key, value FROM settings`);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

/** Live counters shown on the public site as proof of activity. */
export function getPublicStats() {
  return {
    projects: get<{ c: number }>(`SELECT COUNT(*) AS c FROM projects WHERE published = 1`)?.c ?? 0,
    projectsSurface: get<{ s: number }>(`SELECT COALESCE(SUM(surface),0) AS s FROM projects WHERE published = 1`)?.s ?? 0,
    products: get<{ c: number }>(`SELECT COUNT(*) AS c FROM products WHERE status='active' AND kind='finished'`)?.c ?? 0,
    cities: get<{ c: number }>(`SELECT COUNT(DISTINCT city) AS c FROM projects WHERE published = 1`)?.c ?? 0,
  };
}
