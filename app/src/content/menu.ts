import type { MenuCategory, MenuItem } from '@aukrug/content';

function normalize(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function matches(item: MenuItem, query: string) {
  const haystack = [item.name, item.description, ...item.choices, ...item.variants.map((v) => v.label)].join(' ');
  return normalize(haystack).includes(query);
}

/** Keeps categories whose title or items match the search query. */
export function filterMenu(categories: MenuCategory[], query: string): MenuCategory[] {
  const q = normalize(query.trim());
  if (!q) return categories;
  return categories
    .map((c) => ({ ...c, items: normalize(c.title).includes(q) ? c.items : c.items.filter((i) => matches(i, q)) }))
    .filter((c) => c.items.length > 0);
}
