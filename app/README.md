# Aukrug app

Expo (SDK 57) / React Native app for iOS and Android. It shows the same information as https://aukr.ug – opening hours with live status, notices, events, the structured menu, pages (Räumlichkeiten, Über uns, Feiern, Impressum, Datenschutz) and contact actions – and sends push notifications for news.

- Bundle / package ID: `com.bitanker.aukrug`, display name **Aukrug**
- Content comes from `https://aukr.ug/content/bundle.json` (generated from `../content/`). A snapshot of `content/bundle.json` is bundled for offline/first start; downloaded content is cached on the device.
- Design follows the website: dark header `#2c2a2a`, Source Sans, sunset logo, event cards in the website's colours.

## Development

Prerequisites: Xcode (iOS), Android Studio + SDK 36 (Android), Node 22.13+.

```bash
npm install                # in the repository root
cd app
npm run ios                # builds a development build and starts the iOS simulator
npm run android            # same for the Android emulator
npm start                  # Metro only, for an already installed development build
```

The app uses native Firebase modules and therefore **does not run in Expo Go** – always use a development build (`npm run ios` / `npm run android` or an EAS build).

For a USB-connected iPhone, run `npm run ios -- --device`. To build directly in Xcode, open
`ios/Aukrug.xcworkspace` (not `.xcodeproj`), select the Aukrug scheme and your iPhone, and choose your
development team under Signing & Capabilities. Keep `npm start` running for Debug builds; the iPhone
must be able to reach Metro on the Mac.

UIKit scene lifecycle support is enabled through `expo-build-properties` for iOS 27 compatibility.
After changing native configuration in `app.config.ts`, run `npx expo prebuild --platform ios`
from `app/` before rebuilding in Xcode.

Quality checks:

```bash
npm test                   # Jest (logic + screen tests)
npm run typecheck
npm run doctor             # expo-doctor
```

Screens live in `src/app/` (Expo Router). Tests must not be placed there (every file is a route) – use `src/__tests__/`.

## Push notifications

Push notifications and analytics are enabled when the Firebase config files exist. Without them the app works normally and the settings screen says notifications are unavailable.

1. Create a Firebase project (e.g. `aukrug-app`), add an **iOS app** and an **Android app** with ID `com.bitanker.aukrug`.
2. Download `GoogleService-Info.plist` and `google-services.json`:
   - local builds: put them into `app/firebase/` (git-ignored),
   - EAS builds: upload as file environment variables `GOOGLE_SERVICE_INFO_PLIST` and `GOOGLE_SERVICES_JSON` (`eas env:create --type file --visibility secret …`) for the `preview` and `production` environments.
3. Apple Developer → Keys → create an **APNs key**, upload it in Firebase → Project settings → Cloud Messaging → Apple app configuration.
4. Google Analytics for Firebase: set data retention to **2 months** (Analytics → Admin → Data retention) and keep Google signals / ads personalisation off – this is what the privacy policy states.
5. Restrict the Firebase API keys in Google Cloud Console to the iOS bundle ID and Android package/SHA-1.
6. GitHub → repository settings → *Secrets and variables → Actions*:
   - variable `FCM_PROJECT_ID` = Firebase project ID (enables the notify job),
   - recommended: Workload Identity Federation – variables `GCP_WORKLOAD_IDENTITY_PROVIDER` and `GCP_SERVICE_ACCOUNT` (service account with role *Firebase Cloud Messaging API Admin*),
   - alternative: secret `FCM_SERVICE_ACCOUNT_JSON` with a service-account key.

Topics: `events`, `notices`, `hours`, `menu`, `general`. Builds with `APP_VARIANT=production` subscribe to these; all other builds (local, `preview`) use `dev-events`, `dev-notices`, … so tests never reach real users.

Testing a notification without touching production users:

```bash
# from the repository root, authenticated with gcloud (application-default credentials)
FCM_PROJECT_ID=<project> npm run notify --workspace tools -- send --topic general \
  --title "Test" --body "Hallo aus dem Aukrug" --route /events --target development
```

or run *Actions → Send app notification* with target `development` (`dry_run` only validates the message).
Automatic notifications can be previewed locally with `npm run notify --workspace tools -- diff --from <old-sha> --to <new-sha> --print-only`.

## Builds and store release (EAS)

Profiles in `eas.json`:

| Profile | Use | Notification topics |
|---|---|---|
| `preview` | Internal test builds (TestFlight internal / APK) | `dev-*` |
| `production` | Store builds, build number auto-incremented | production |

One-time setup:

```bash
npm install -g eas-cli
cd app
eas login                          # CSIT Expo account
eas init                           # creates the project; then set EAS_PROJECT_ID / EXPO_OWNER as EAS env variables
eas credentials                    # iOS distribution certificate + provisioning, Android upload keystore
```

Release:

```bash
eas build --profile production --platform all
eas submit --profile production --platform ios       # App Store Connect / TestFlight
eas submit --profile production --platform android   # Play Console internal track (draft)
```

Store checklist:

- [ ] Apple Developer Program and Google Play developer accounts for Christoph Schmidt IT Dienstleistungen (organisation accounts need a D-U-N-S number), EU trader (DSA) details entered.
- [ ] Written authorisation from Aukrug Borsfleth to publish the app; add it to the App Review notes (Apple guideline 5.2.1) and mention the native features (push topics, offline content, structured menu, calendar) for guideline 4.2.
- [ ] Store name: "Aukrug" may be taken or confused with the municipality – use "Aukrug Borsfleth" as listing name if needed (home-screen name stays "Aukrug").
- [ ] Listing texts, screenshots and privacy answers: see [`store/README.md`](store/README.md).
- [ ] Privacy policy URL: https://aukr.ug/datenschutz.html#app (legal review recommended).
- [ ] Test on real devices: onboarding, permission denial, every notification topic, deep links, offline start.
