import { writeFileSync } from 'node:fs';
import path from 'node:path';

import { buildSite } from './build-site';
import { parseContent, readRawContent, REPO_ROOT } from './content';
import { renderAll } from './render';
import { findExpiredContent, findMissingFiles } from './validate';

const command = process.argv[2];

function fail(message: string): never {
  console.error(`✖ ${message}`);
  process.exit(1);
}

function loadValidated() {
  const result = parseContent(readRawContent());
  if (!result.ok) fail(`Ungültige Inhalte:\n  - ${result.issues.join('\n  - ')}`);
  const missing = findMissingFiles(result.bundle);
  if (missing.length) fail(`Fehlende Dateien:\n  - ${missing.join('\n  - ')}`);
  for (const hint of findExpiredContent(result.bundle)) console.warn(`⚠ ${hint}`);
  return result.bundle;
}

switch (command) {
  case 'validate': {
    loadValidated();
    console.log('✔ Inhalte sind gültig');
    break;
  }
  case 'render': {
    const { files, problems } = renderAll(loadValidated());
    if (problems.length) fail(problems.join('\n'));
    const changed = files.filter((f) => f.changed);
    for (const file of changed) writeFileSync(path.join(REPO_ROOT, file.file), file.content);
    console.log(changed.length ? `✔ Aktualisiert: ${changed.map((f) => f.file).join(', ')}` : '✔ Alles aktuell');
    break;
  }
  case 'check': {
    const { files, problems } = renderAll(loadValidated());
    if (problems.length) fail(problems.join('\n'));
    const stale = files.filter((f) => f.changed).map((f) => f.file);
    if (stale.length) fail(`Nicht synchron mit content/: ${stale.join(', ')}\n  → "npm run content:render" ausführen und committen`);
    console.log('✔ Website und content/bundle.json sind synchron');
    break;
  }
  case 'build-site': {
    const out = buildSite(process.argv[3] ? path.resolve(process.argv[3]) : undefined);
    console.log(`✔ Website nach ${path.relative(process.cwd(), out) || out} kopiert`);
    break;
  }
  default:
    fail('Verwendung: cli.ts <validate|render|check|build-site [Zielordner]>');
}
