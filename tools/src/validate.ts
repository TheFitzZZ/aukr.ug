import { existsSync } from 'node:fs';
import path from 'node:path';

import {
  activeNotices,
  isEventVisible,
  parseMarkdown,
  toLocalMoment,
  type Block,
  type ContentBundle,
} from '@aukrug/content';

import { REPO_ROOT } from './content';

function isLocal(link: string) {
  return !/^[a-z][a-z0-9+.-]*:/i.test(link) && !link.startsWith('#');
}

function localPath(link: string) {
  return decodeURIComponent(link.split(/[?#]/)[0]!.replace(/^\/+/, ''));
}

function markdownLinks(blocks: Block[]): string[] {
  return blocks.flatMap((block) => {
    if (block.type === 'gallery') return block.images.map((i) => i.src);
    const inlines = block.type === 'paragraph' ? block.content : block.type === 'list' ? block.items.flat() : [];
    return inlines.flatMap((i) => (i.type === 'link' ? [i.url] : []));
  });
}

/** Referenced local files that do not exist in the repository. */
export function findMissingFiles(bundle: ContentBundle, root = REPO_ROOT): string[] {
  const references: [string, string][] = [
    ['content/site.json → menuPdf', bundle.site.menuPdf],
    ['content/events.json → calendar.image', bundle.events.calendar.image],
    ...bundle.events.events.flatMap((e): [string, string][] => [
      [`content/events.json → ${e.id}.poster`, e.poster.src],
      ...e.actions.map((a): [string, string] => [`content/events.json → ${e.id}.actions`, a.url]),
    ]),
    ...Object.entries(bundle.pages).flatMap(([id, page]) =>
      markdownLinks(parseMarkdown(page.markdown)).map((link): [string, string] => [`content/pages/${id}.md`, link]),
    ),
  ];
  return references
    .filter(([, link]) => isLocal(link) && !existsSync(path.join(root, localPath(link))))
    .map(([where, link]) => `${where}: Datei "${localPath(link)}" nicht gefunden`);
}

/** Hints for content that has expired and can be removed. */
export function findExpiredContent(bundle: ContentBundle, now = new Date()): string[] {
  const today = toLocalMoment(now).date;
  const active = new Set(activeNotices(bundle.notices.notices, today).map((n) => n.id));
  return [
    ...bundle.events.events
      .filter((e) => !isEventVisible(e, today))
      .map((e) => `content/events.json: "${e.id}" ist abgelaufen und kann entfernt werden`),
    ...bundle.notices.notices
      .filter((n) => !active.has(n.id))
      .map((n) => `content/notices.json: "${n.id}" ist abgelaufen und kann entfernt werden`),
    ...bundle.openingHours.exceptions
      .filter((e) => e.date < today)
      .map((e) => `content/opening-hours.json: Ausnahme ${e.date} liegt in der Vergangenheit`),
  ];
}
