// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: null,
        strategies: "generateSW",
        filename: "sw.js",
        manifest: false, // manifest is served from /public/manifest.webmanifest
        devOptions: { enabled: false },
        workbox: {
          // Precache only hashed static assets and local icons/manifest/fonts.
          globPatterns: [
            "assets/**/*.{js,css,woff,woff2,ttf,otf}",
            "icons/**/*.png",
            "manifest.webmanifest",
            "favicon.png",
          ],
          // Never cache HTML/navigations — app is online-first.
          navigateFallback: null,
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: false,
          // No runtimeCaching: all dynamic requests (Supabase, APIs, HTML) bypass the SW.
        },
      }),
    ],
  },
});
