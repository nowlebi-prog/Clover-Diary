import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon.svg"],
      manifest: {
        name: "Clover Desk",
        short_name: "Clover",
        description: "A soft personal productivity dashboard.",
        theme_color: "#F8FAF7",
        background_color: "#F8FAF7",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/icons/icon.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any maskable" },
          { src: "/icons/icon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" }
        ]
      }
    })
  ]
});
