import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// Política de segurança (CSP): só entra no build publicado. No modo de
// desenvolvimento o Vite injeta scripts inline (recarga ao vivo), que a CSP
// bloquearia. Só roda script do próprio site e das estatísticas (Cloudflare e
// Google, com consentimento). O gerador de PDF agora vem do próprio app.
const CSP = [
  "default-src 'self'",
  "script-src 'self' https://static.cloudflareinsights.com https://*.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data: blob: https://*.google-analytics.com https://*.googletagmanager.com",
  "connect-src 'self' https://cloudflareinsights.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join("; ");

const cspPlugin = (): Plugin => ({
  name: "np3d-csp",
  apply: "build",
  transformIndexHtml: (html) =>
    html.replace("<!-- CSP -->", `<meta http-equiv="Content-Security-Policy" content="${CSP}">`),
});

export default defineConfig({
  // publicado em https://nossoprojeto3d.github.io/calc-3d/
  base: "/calc-3d/",
  plugins: [
    react(),
    tailwindcss(),
    cspPlugin(),
    VitePWA({
      // mesmo nome do service worker da V3: o navegador troca o antigo pelo novo
      filename: "service-worker.js",
      registerType: "autoUpdate",
      injectRegister: "script-defer",
      includeAssets: ["assets/*.png", "medicao.js"],
      manifest: {
        name: "Nosso Projeto 3D — Calculadora",
        short_name: "NP3D Calc",
        description: "Calculadora gratuita de preço para impressão 3D: filamento, energia, custos do negócio e lucro.",
        start_url: "./",
        scope: "./",
        id: "./",
        display: "standalone",
        orientation: "any",
        background_color: "#0C0E11",
        theme_color: "#0C0E11",
        lang: "pt-BR",
        icons: [
          { src: "assets/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "assets/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "assets/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "assets/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,woff2}"],
        // o gerador de PDF e as fontes de outros alfabetos não entram no
        // download inicial: vão pro cache na primeira vez que forem usados
        globIgnores: ["**/jspdf*", "**/html2canvas*", "**/purify*", "**/index.es-*", "**/*cyrillic*", "**/*-ext-*", "**/*vietnamese*", "**/*greek*"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // apaga os caches da V3 (np3d-calc-*)
        importScripts: ["sw-limpeza.js"],
        // páginas: rede primeiro, como na V3 (ninguém fica preso numa versão antiga)
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: { cacheName: "np3d-paginas", networkTimeoutSeconds: 4 },
          },
          {
            urlPattern: ({ url, sameOrigin }) => sameOrigin && /\/assets\/.+\.(js|woff2)$/.test(url.pathname),
            handler: "CacheFirst",
            options: { cacheName: "np3d-sob-demanda", expiration: { maxEntries: 30 } },
          },
        ],
      },
    }),
  ],
  server: { port: 5173 },
  preview: { port: 4173 },
  test: { include: ["tests/**/*.test.ts"] },
});
