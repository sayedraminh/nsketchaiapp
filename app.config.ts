import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "NSketch",
  slug: "nsketchapp",
  scheme: "nsketchapp",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/logo.png",
  userInterfaceStyle: "dark",
  splash: {
    image: "./assets/logo.png",
    resizeMode: "contain",
    backgroundColor: "#000000",
  },
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.nsketchai.app",
    infoPlist: {
      CFBundleURLTypes: [
        {
          CFBundleURLSchemes: ["nsketchapp"],
        },
      ],
      NSPhotoLibraryAddUsageDescription: "Allow NSketch to save generated images to your photo library.",
    },
  },
  android: {
    edgeToEdgeEnabled: true,
    package: "com.nsketchai.app",
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "nsketchapp",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  plugins: [
    "expo-asset",
    "expo-build-properties",
    "expo-font",
    "expo-image-picker",
    "expo-secure-store",
  ],
  extra: {
    clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
    clerkRedirectUrl: process.env.EXPO_PUBLIC_CLERK_REDIRECT_URL,
    clerkProxyUrl: process.env.EXPO_PUBLIC_CLERK_PROXY_URL,
    convexUrl: process.env.EXPO_PUBLIC_CONVEX_URL,
    convexEnv: process.env.EXPO_PUBLIC_CONVEX_ENV,
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    appEnv: process.env.EXPO_PUBLIC_APP_ENV || "development",
  },
});
