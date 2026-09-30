# aukr.ug

Website, app and shared content for the **Aukrug Borsfleth** restaurant (https://aukr.ug).

| Folder | Purpose |
|---|---|
| `*.html`, `assets/`, `images/`, `carussel/` | Static website (HTML5 UP "Phantom"), deployed via GitHub Pages |
| `content/` | **Single source of truth** for opening hours, notices, events, menu and app pages |
| `packages/content/` | Shared schemas (zod) and helpers used by the website tools and the app |
| `tools/` | Validation, website rendering, Pages build and push-notification sending |
| `app/` | Expo / React Native app (iOS + Android), see [`app/README.md`](app/README.md) |

## Requirements

Node.js 22.13+ (24 LTS recommended) and npm. Install everything once from the repository root:

```bash
npm install
```

## Updating content

1. Edit the files in `content/` (see table below).
2. Run `npm run content:render` – validates the content, updates the generated website sections and `content/bundle.json`.
3. Preview the website: `python3 -m http.server 8000` → http://localhost:8000
4. Commit and push to `main`. GitHub Actions validates, deploys and then notifies app users about relevant changes.

| File | Content | Notification topic |
|---|---|---|
| `content/opening-hours.json` | Weekly hours, kitchen note, special days (`exceptions`) | `hours` when regular hours change or a future special day is added/changed |
| `content/notices.json` | Short-notice hints (`visibleUntil` required) | `notices` for new notices |
| `content/events.json` | Events (`kind: "event"`, needs `start`) and offers (`kind: "offer"`), calendar poster | `events` for new events or a changed date |
| `content/menu.json` | Structured menu for the app | `menu` when `version` changes |
| `content/site.json` | Contact data and links | – |
| `content/pages/*.md` | App pages (Willkommen, Räumlichkeiten, Über uns, Feiern, Impressum, Datenschutz) | – |

Rules and tips:

- IDs (`id`) must be unique and stable – they are used for deep links (`/events/<id>`) and to detect new items. Reuse of an old ID will not trigger a notification.
- Set `"notify": false` on an event or notice to publish it silently; add `[skip notify]` to the commit message to skip all notifications of a push.
- Events disappear automatically after their day (or `visibleUntil`) on the website and in the app. `npm run content:validate` warns about expired entries that can be deleted.
- The website menu is still the image/PDF (`assets/menu.png`, `assets/menu.pdf`). When the menu changes, update **both** the images and `content/menu.json`, and bump `version` to notify users.
- Static website pages (Über uns, Räumlichkeiten, Impressum, Datenschutz) are maintained in HTML **and** in `content/pages/*.md` for the app.
- Generated website blocks are marked with `<!-- content:… -->` comments – do not edit them by hand.

## Commands

| Command | What it does |
|---|---|
| `npm run content:validate` | Validate `content/` and check referenced files exist |
| `npm run content:render` | Regenerate website blocks and `content/bundle.json` |
| `npm run content:check` | Fail if generated files are out of date (used in CI) |
| `npm run site:build` | Assemble the publishable website into `_site/` (excludes `app/`, `tools/`, `packages/`) |
| `npm test` | Run all tests (content package, tools, app) |
| `npm run typecheck` | Type-check all workspaces |

## Push notifications

Sent via Firebase Cloud Messaging topics by `.github/workflows/static.yml` (automatic, after a successful deploy) and `.github/workflows/notify.yml` (manual messages via *Actions → Send app notification*). Setup: see [`app/README.md`](app/README.md#push-notifications).
