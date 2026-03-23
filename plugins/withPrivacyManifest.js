const { withXcodeProject } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

/**
 * Config plugin that copies PrivacyInfo.xcprivacy into the iOS app target
 * and registers it as a resource in the Xcode project.
 *
 * Required for iOS 17+ / App Store notarization.
 */
const withPrivacyManifest = (config) => {
  return withXcodeProject(config, (config) => {
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

    const project = config.modResults;
    const groupName = projectName;

    // Avoid adding the file twice on repeated prebuild runs
    const alreadyAdded = project
      .pbxFileReferenceSection()
      && Object.values(project.pbxFileReferenceSection()).some(
        (ref) => ref && ref.path === '"PrivacyInfo.xcprivacy"'
      );

    if (!alreadyAdded) {
      project.addResourceFile(
        `${projectName}/PrivacyInfo.xcprivacy`,
        { target: project.getFirstTarget().uuid },
        groupName
      );
    }

    return config;
  });
};

module.exports = withPrivacyManifest;
