import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const packageJson = require("./package.json") as { version: string };
const appVersion = process.env.APP_VERSION?.trim();
const viteAppVersion = process.env.VITE_APP_VERSION?.trim();
const buildVersion =
  appVersion ||
  viteAppVersion ||
  `${packageJson.version}-${new Date().toISOString()}`;

export default defineConfig({
  plugins: [
    react(),
    {
      name: "build-version",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "version.json",
          source: `${JSON.stringify({ version: buildVersion })}\n`
        });
      }
    },
    VitePWA({
      registerType: "prompt",
      injectRegister: null,
      includeAssets: ["icons/icon.svg"],
      manifest: {
        name: "Family Meal Planner",
        short_name: "Meals",
        description: "A family meal translation assistant for picky eaters.",
        theme_color: "#20483f",
        background_color: "#fbfaf6",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api(?:\/|$)/],
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8787"
    }
  },
  build: {
    outDir: "dist/client"
  }
});
