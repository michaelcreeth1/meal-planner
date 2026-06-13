import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
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
