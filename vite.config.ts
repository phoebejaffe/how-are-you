import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { execSync } from "node:child_process";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

function readGitCommitTime(): string | null {
  try {
    return execSync("git log -1 --format=%cI", { encoding: "utf8" }).trim() || null;
  } catch {
    return null;
  }
}

const buildTime = new Date().toISOString();
const gitCommitTime = readGitCommitTime() ?? buildTime;

export default defineConfig({
  base: "/how-are-you/",
  define: {
    __APP_BUILD_TIME__: JSON.stringify(buildTime),
    __APP_GIT_COMMIT_TIME__: JSON.stringify(gitCommitTime),
  },
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
