// iOS/iPadOS 27 kills an app at launch unless it adopts the UIScene lifecycle
// (App Review crash, 2026-10-07: ___UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption).
// Expo ships ExpoAppSceneDelegate for this, but the SDK 57 template doesn't wire it up yet.
// This plugin declares the scene in Info.plist and hands window creation to that delegate.
const { withInfoPlist, withAppDelegate } = require('expo/config-plugins');

module.exports = function withSceneLifecycle(config) {
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: 'EXExpoAppSceneDelegate',
          },
        ],
      },
    };
    return cfg;
  });

  return withAppDelegate(config, (cfg) => {
    let src = cfg.modResults.contents;
    if (!src.includes('ExpoReactNativeFactoryProvider')) {
      src = src.replace(
        'class AppDelegate: ExpoAppDelegate {',
        'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {'
      );
    }
    // The scene delegate creates the window and starts React Native; doing it here too would run it twice.
    src = src.replace(
      /#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?\)\n#endif\n/,
      ''
    );
    if (src.includes('UIWindow(frame:') || !src.includes('ExpoReactNativeFactoryProvider')) {
      throw new Error('withSceneLifecycle: AppDelegate.swift template changed; update the plugin.');
    }
    cfg.modResults.contents = src;
    return cfg;
  });
};
