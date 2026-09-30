// Adds a monochrome Android status-bar icon for Firebase Cloud Messaging notifications.
const fs = require('node:fs');
const path = require('node:path');
const { AndroidConfig, withAndroidManifest, withDangerousMod } = require('expo/config-plugins');

const ICON_SOURCE = 'assets/images/notification-icon.png';
const ICON_NAME = 'notification_icon';
const META_ICON = 'com.google.firebase.messaging.default_notification_icon';

function withNotificationIconFile(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const target = path.join(cfg.modRequest.platformProjectRoot, 'app/src/main/res/drawable');
      fs.mkdirSync(target, { recursive: true });
      fs.copyFileSync(path.join(cfg.modRequest.projectRoot, ICON_SOURCE), path.join(target, `${ICON_NAME}.png`));
      return cfg;
    },
  ]);
}

function withNotificationIconMetadata(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;
    manifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    application['meta-data'] = (application['meta-data'] ?? []).filter((m) => m.$['android:name'] !== META_ICON);
    application['meta-data'].push({
      $: { 'android:name': META_ICON, 'android:resource': `@drawable/${ICON_NAME}`, 'tools:replace': 'android:resource' },
    });
    return cfg;
  });
}

module.exports = function withNotificationIcon(config) {
  return withNotificationIconMetadata(withNotificationIconFile(config));
};
