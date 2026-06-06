import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/how-are-you/",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectRegister: false,
      manifest: false,
      devOptions: { enabled: true },
    }),
  ],
  server: {
    host: "127.0.0.1",
    port: 3300,
  },
  preview: {
    host: "127.0.0.1",
    port: 3300,
  },
});
