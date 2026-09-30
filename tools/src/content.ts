import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  contentBundleSchema,
  markdownTitle,
  PAGE_IDS,
  type ContentBundle,
} from '@aukrug/content';

export const REPO_ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
export const BUNDLE_PATH = 'content/bundle.json';

function readJson(file: string): unknown {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`${path.relative(REPO_ROOT, file)}: ${(error as Error).message}`);
  }
}

function readPage(root: string, id: string) {
  const file = path.join(root, 'content', 'pages', `${id}.md`);
  if (!existsSync(file)) return undefined;
  const source = readFileSync(file, 'utf8');
  return {
    title: markdownTitle(source) ?? '',
    markdown: source.replace(/^#\s+.+\n+/, '').trim(),
  };
}

/** Reads content/*.json and content/pages/*.md into an unvalidated bundle. */
export function readRawContent(root = REPO_ROOT) {
  const dir = path.join(root, 'content');
  return {
    schemaVersion: 1,
    site: readJson(path.join(dir, 'site.json')),
    openingHours: readJson(path.join(dir, 'opening-hours.json')),
    notices: readJson(path.join(dir, 'notices.json')),
    events: readJson(path.join(dir, 'events.json')),
    menu: readJson(path.join(dir, 'menu.json')),
    pages: Object.fromEntries(PAGE_IDS.map((id) => [id, readPage(root, id)])),
  };
}

export type ParseResult = { ok: true; bundle: ContentBundle } | { ok: false; issues: string[] };

const SECTION_FILES: Record<string, string> = {
  site: 'content/site.json',
  openingHours: 'content/opening-hours.json',
  notices: 'content/notices.json',
  events: 'content/events.json',
  menu: 'content/menu.json',
  pages: 'content/pages',
};

export function parseContent(raw: unknown): ParseResult {
  const result = contentBundleSchema.safeParse(raw);
  if (result.success) return { ok: true, bundle: result.data };
  return {
    ok: false,
    issues: result.error.issues.map((issue) => {
      const [section, ...rest] = issue.path.map(String);
      const file = SECTION_FILES[section ?? ''] ?? 'content';
      return `${file}${rest.length ? ` → ${rest.join('.')}` : ''}: ${issue.message}`;
    }),
  };
}

export function loadBundle(root = REPO_ROOT): ContentBundle {
  const result = parseContent(readRawContent(root));
  if (!result.ok) throw new Error(`Ungültige Inhalte:\n- ${result.issues.join('\n- ')}`);
  return result.bundle;
}

/** Top-level website pages that may contain content markers. */
export function listHtmlFiles(root = REPO_ROOT): string[] {
  return readdirSync(root)
    .filter((name) => name.endsWith('.html'))
    .sort();
}
