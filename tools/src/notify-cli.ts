import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';

import { isSafeRoute, NOTIFICATION_TOPICS, type NotificationTarget, type NotificationTopic } from '@aukrug/content';

import { parseContent, REPO_ROOT } from './content';
import { detectNotifications, truncate, type AppNotification } from './notify/changes';
import { sendNotifications } from './notify/fcm';

const SKIP_MARKER = '[skip notify]';

function git(args: string[]): string | undefined {
  try {
    return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return undefined;
  }
}

function bundleAt(sha: string) {
  if (!sha || /^0+$/.test(sha)) return undefined;
  const raw = git(['show', `${sha}:content/bundle.json`]);
  if (!raw) return undefined;
  const result = parseContent(JSON.parse(raw));
  if (!result.ok) throw new Error(`content/bundle.json in ${sha} ist ungültig:\n- ${result.issues.join('\n- ')}`);
  return result.bundle;
}

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    from: { type: 'string' },
    to: { type: 'string' },
    topic: { type: 'string' },
    title: { type: 'string' },
    body: { type: 'string' },
    route: { type: 'string', default: '/' },
    target: { type: 'string', default: 'production' },
    'dry-run': { type: 'boolean', default: false },
    'print-only': { type: 'boolean', default: false },
  },
});

function fail(message: string): never {
  console.error(`✖ ${message}`);
  process.exit(1);
}

async function main() {
  const target = values.target as NotificationTarget;
  if (target !== 'production' && target !== 'development') fail('--target muss "production" oder "development" sein');

  let notifications: AppNotification[];
  switch (positionals[0]) {
    case 'diff': {
      if (!values.to) fail('--to <commit> fehlt');
      const message = git(['log', '-1', '--format=%B', values.to]) ?? '';
      if (message.includes(SKIP_MARKER)) {
        console.log(`ℹ Commit enthält ${SKIP_MARKER} – keine Benachrichtigungen`);
        return;
      }
      const next = bundleAt(values.to);
      if (!next) fail(`content/bundle.json in ${values.to} nicht gefunden`);
      const previous = bundleAt(values.from ?? '');
      if (!previous) console.log('ℹ Keine vorherige Version gefunden – keine Benachrichtigungen');
      notifications = detectNotifications(previous, next);
      break;
    }
    case 'send': {
      const topic = values.topic as NotificationTopic;
      if (!NOTIFICATION_TOPICS.includes(topic)) fail(`--topic muss eines von ${NOTIFICATION_TOPICS.join(', ')} sein`);
      if (!values.title?.trim() || !values.body?.trim()) fail('--title und --body sind erforderlich');
      if (!isSafeRoute(values.route)) fail('--route muss ein App-Pfad wie "/" oder "/events/<id>" sein');
      notifications = [
        {
          topic,
          title: truncate(values.title.trim(), 80),
          body: truncate(values.body.trim()),
          route: values.route,
          key: `manual:${Date.now()}`,
        },
      ];
      break;
    }
    default:
      fail('Verwendung: notify-cli.ts <diff --from <sha> --to <sha> | send --topic <t> --title <t> --body <t> [--route /]> [--target production|development] [--dry-run] [--print-only]');
  }

  if (notifications.length === 0) {
    console.log('ℹ Keine relevanten Änderungen – nichts zu senden');
    return;
  }
  for (const n of notifications) console.log(`• [${target}/${n.topic}] ${n.title} – ${n.body} → ${n.route}`);
  if (values['print-only']) return;

  const projectId = process.env.FCM_PROJECT_ID;
  if (!projectId) fail('Umgebungsvariable FCM_PROJECT_ID fehlt');
  const results = await sendNotifications(notifications, { projectId, target, validateOnly: values['dry-run'] });
  console.log(`✔ ${values['dry-run'] ? 'Von FCM geprüft (nicht gesendet)' : 'Gesendet'}: ${results.map((r) => r.key).join(', ')}`);
}

main().catch((error: unknown) => fail(error instanceof Error ? error.message : String(error)));
