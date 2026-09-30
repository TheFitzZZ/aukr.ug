# Firebase configuration (not committed)

Place the files downloaded from the Firebase console here to enable push notifications and analytics in local builds:

- `GoogleService-Info.plist` (iOS app `com.bitanker.aukrug`)
- `google-services.json` (Android app `com.bitanker.aukrug`)

For EAS builds, upload them as file environment variables `GOOGLE_SERVICE_INFO_PLIST` and `GOOGLE_SERVICES_JSON` instead.
Without both files the app builds and runs, but notifications and analytics are disabled.
