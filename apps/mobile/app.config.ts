import type { ExpoConfig } from "expo/config";
const isLocal = process.env.APP_ENV !== "production";
const urls = [
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_IDENTITY_URL,
  process.env.EXPO_PUBLIC_CONTENT_URL,
  process.env.EXPO_PUBLIC_LEARNING_URL,
];
const recoveryUrl = process.env.EXPO_PUBLIC_WEB_RECOVERY_URL;
if (
  !isLocal &&
  (urls.some(
    (url) =>
      !url ||
      !url.startsWith("https://") ||
      /localhost|127\.0\.0\.1|10\.0\.2\.2/.test(url),
  ) ||
    !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    (recoveryUrl && !recoveryUrl.startsWith("https://")))
)
  throw new Error(
    "Production requires HTTPS service URLs and a public Supabase key.",
  );
const config: ExpoConfig = {
  name: "Sprout",
  slug: "sprout-english",
  scheme: "sprout",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  icon: "./assets/icon.png",
  android: {
    package: "com.pbl6.sprout",
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundColor: "#F6F5EC",
    },
    blockedPermissions: ["android.permission.RECORD_AUDIO"],
  },
  ios: { bundleIdentifier: "com.pbl6.sprout", supportsTablet: false },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-web-browser",
    [
      "expo-audio",
      {
        microphonePermission: false,
        recordAudioAndroid: false,
        enableBackgroundRecording: false,
        enableBackgroundPlayback: false,
      },
    ],
    ["expo-build-properties", { android: { usesCleartextTraffic: isLocal } }],
  ],
  extra: {
    environment: isLocal ? "development" : "production",
    ...(process.env.EAS_PROJECT_ID
      ? { eas: { projectId: process.env.EAS_PROJECT_ID } }
      : {}),
  },
};
export default config;
