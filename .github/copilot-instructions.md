# Aukrug Borsfleth – Website, App & Content

Repository for the German restaurant "Aukrug Borsfleth" (https://aukr.ug):

- **Website**: static HTML based on the HTML5 UP "Phantom" template, deployed via GitHub Pages.
- **Shared content** (`content/`): single source of truth for opening hours, notices, events, the structured menu and app pages.
- **App** (`app/`): Expo / React Native (TypeScript, Expo Router) for iOS and Android with Firebase Cloud Messaging push notifications.

Always reference these instructions first and fall back to search or shell commands only when you encounter unexpected information.

## Repository Structure

```
.github/workflows/static.yml   # validate content → deploy Pages → send push notifications for changes
.github/workflows/notify.yml   # manual push notification (workflow_dispatch)
content/                       # JSON + Markdown content, content/bundle.json is generated
packages/content/              # @aukrug/content: zod schemas, date/opening-hours/event helpers, notification topics
tools/                         # @aukrug/tools: validate, render website blocks, build _site, notify (FCM)
app/                           # @aukrug/app: Expo app (see app/README.md)
assets/                        # website CSS (assets/css/main.css – edit directly, there is no SASS source), JS, posters, menu PDF/PNG
images/, carussel/             # website images and logos
*.html                         # website pages (index, kalender, menu, kontakt, raemlichkeiten, ueberuns, impressum, datenschutz)
```

`generic.html`, `elements.html`, `menu-blank.html`, `menu copy.html` and `alter-placeholder/` are template/backup files.

## Working Effectively

- `npm install` in the repository root installs all workspaces (Node 22.13+, 24 LTS recommended).
- Content changes: edit `content/*.json` / `content/pages/*.md`, then run `npm run content:render`. This validates the content and regenerates:
  - website blocks between `<!-- content:NAME … -->` and `<!-- /content:NAME -->` markers (opening hours header and notices on all live pages, contact hours on `kontakt.html`, event carousel + poster modals on `index.html`, teasers and calendar image on `kalender.html`) – never edit these blocks by hand;
  - `content/bundle.json` (served to the app and bundled into it as offline snapshot).
- `npm run content:check` must pass before pushing (CI fails otherwise).
- Event/notice expiry: items carry `data-visible-until`; `assets/js/content-visibility.js` removes expired ones in the browser (loaded before `event-carousel.js`).
- Short-term banners outside the generated blocks can still use `.event-banner` + `assets/js/event-banner.js` with `data-hide-after`.
- The website menu is an image/PDF (`assets/menu.png`, `assets/menu.pdf`); the app uses `content/menu.json`. Update both when the menu changes and bump `version` to notify app users.
- Deployment: pushing to `main` runs `.github/workflows/static.yml`, which publishes only `_site/` (website + `content/`, built by `npm run site:build`) – app/tool sources are excluded.

## Validation

- Tests: `npm test` (vitest for `packages/content` and `tools`, jest-expo for `app`); types: `npm run typecheck`; app: `cd app && npm run doctor`.
- Website: run `python3 -m http.server 8000` and check:
  1. Homepage loads at `http://localhost:8000`, event carousel works
  2. Navigation menu opens and links work
  3. Menu page (`/menu.html`), contact page with map (`/kontakt.html`), calendar (`/kalender.html`)
  4. PDF menu link (`/assets/menu.pdf`)
- App: `cd app && npm run ios` / `npm run android` (development builds; Expo Go is not supported because of React Native Firebase). Route files live in `app/src/app/`; tests belong in `app/src/__tests__/`.

## Conventions

- Website and app texts are German; the website addresses guests with "Sie" (event posters may use "euch").
- IDs in `content/` are stable slugs; they are used for deep links (`/events/<id>`) and change detection for notifications.
- Push topics: `events`, `notices`, `hours`, `menu`, `general`; non-production app builds use `dev-` prefixed topics.
- React must stay on the version pinned by Expo (root `package.json` `overrides`).
- External CDN resources (fonts, analytics, cookie manager) may be blocked in some environments.
