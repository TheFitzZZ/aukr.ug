import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';

import { REPO_ROOT } from './content';

/** Top-level entries that belong to the app/tooling and are not published on the website. */
export const EXCLUDED_FROM_SITE = new Set([
  '.git',
  '.github',
  '.vscode',
  '_site',
  'app',
  'node_modules',
  'packages',
  'tools',
  'package.json',
  'package-lock.json',
]);

export function isPublished(relativePath: string): boolean {
  const parts = relativePath.split(/[\\/]/);
  if (!parts[0] || EXCLUDED_FROM_SITE.has(parts[0])) return false;
  return !parts.includes('node_modules') && !relativePath.endsWith('.DS_Store');
}

/** Copies the publishable website (including content/) into `outDir`. */
export function buildSite(outDir = path.join(REPO_ROOT, '_site'), root = REPO_ROOT) {
  const target = path.resolve(outDir);
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  for (const entry of readdirSync(root)) {
    const source = path.join(root, entry);
    if (!isPublished(entry) || path.resolve(source) === target) continue;
    cpSync(source, path.join(target, entry), {
      recursive: true,
      filter: (file) => isPublished(path.relative(root, file)),
    });
  }
  return target;
}
