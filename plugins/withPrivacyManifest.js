const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

/**
 * Config plugin that copies PrivacyInfo.xcprivacy into the iOS app target directory.
 * Registration in the Xcode project is handled by React Native's CocoaPods
 * post-install hook (privacy_manifest_utils.rb / ensure_reference).
 *
 * Required for iOS 17+ / App Store notarization.
 */
const withPrivacyManifest = (config) => {
  return withDangerousMod(config, ['ios', (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const platformRoot = config.modRequest.platformProjectRoot;
    const projectName = config.modRequest.projectName;

    const src = path.join(projectRoot, 'PrivacyInfo.xcprivacy');
    const destDir = path.join(platformRoot, projectName);
    const dest = path.join(destDir, 'PrivacyInfo.xcprivacy');

    if (!fs.existsSync(src)) {
      console.warn('[withPrivacyManifest] PrivacyInfo.xcprivacy not found at project root — skipping.');
      return config;
    }

    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(src, dest);

    return config;
  }]);
};

module.exports = withPrivacyManifest;
