import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.famousli.app",
  appName: "Famousli",
  webDir: "out", // Next.js static export output
  server: {
    // In dev, point to your local server instead of the bundled files
    ...(process.env.NODE_ENV === "development" && {
      url: "http://192.168.10.174:3000", // your local IP
      cleartext: true,
    }),
  },
  plugins: {
    StatusBar: {
      style: "DARK",
      backgroundColor: "#FF6B35",
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#FF6B35",
      showSpinner: false,
    },
    Keyboard: {
      resize: "body",
      style: "DARK",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
  ios: {
    scheme: "Famousli",
    contentInset: "automatic",
  },
  android: {
    backgroundColor: "#FF6B35",
    allowMixedContent: true,
  },
};

export default config;
