import { readFileSync } from 'node:fs';
import path from 'node:path';

import type { ContentBundle } from '@aukrug/content';

import { BUNDLE_PATH, listHtmlFiles, REPO_ROOT } from './content';
import { applyMarkers } from './markers';
import { siteFragments } from './site-render';

export interface RenderedFile {
  /** Path relative to the repository root. */
  file: string;
  content: string;
  changed: boolean;
}

export function serializeBundle(bundle: ContentBundle): string {
  return `${JSON.stringify(bundle, null, 2)}\n`;
}

/** Computes all generated files (website marker blocks and the app content bundle). */
export function renderAll(bundle: ContentBundle, root = REPO_ROOT): { files: RenderedFile[]; problems: string[] } {
  const fragments = siteFragments(bundle);
  const files: RenderedFile[] = [];
  const problems: string[] = [];

  for (const file of listHtmlFiles(root)) {
    const current = readFileSync(path.join(root, file), 'utf8');
    const { html, replaced, unknown } = applyMarkers(current, fragments);
    problems.push(...unknown.map((name) => `${file}: unbekannter Inhaltsbereich "${name}"`));
    if (replaced.length) files.push({ file, content: html, changed: html !== current });
  }

  const bundleJson = serializeBundle(bundle);
  let currentBundle = '';
  try {
    currentBundle = readFileSync(path.join(root, BUNDLE_PATH), 'utf8');
  } catch {
    // Not generated yet.
  }
  files.push({ file: BUNDLE_PATH, content: bundleJson, changed: bundleJson !== currentBundle });
  return { files, problems };
}
