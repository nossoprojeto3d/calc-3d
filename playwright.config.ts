import { defineConfig, devices } from "@playwright/test";

// Testes de ponta a ponta no build de produção (com a CSP ligada).
// Rode antes: npm run build && npm run preview
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:4173/calc-3d/",
    locale: "pt-BR",
    acceptDownloads: true,
    screenshot: "only-on-failure",
    // sem animações nem rolagem suave (o app respeita "reduzir movimento"): o
    // teste não toca num campo que ainda está deslizando até o lugar
    reducedMotion: "reduce",
  },
  projects: [
    { name: "iPhone Safari", use: { ...devices["iPhone 15"] } },
    { name: "iPhone SE 375px", use: { ...devices["iPhone SE"] } },
    { name: "Android Chrome", use: { ...devices["Pixel 7"] } },
    { name: "Desktop Chrome", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "Desktop Safari", use: { ...devices["Desktop Safari"], viewport: { width: 1280, height: 860 } } },
  ],
});
