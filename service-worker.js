/* =========================================================
   NOSSO PROJETO 3D — service-worker.js
   Faz cache dos arquivos principais para o app funcionar
   offline depois de instalado, e é o que "habilita" o
   navegador a oferecer a instalação como PWA.
   Sempre que os arquivos do projeto forem atualizados, mude
   o CACHE_NAME abaixo (ex: np3d-calc-v2) para forçar os
   usuários a baixarem a versão nova.
   ========================================================= */

const CACHE_NAME = "np3d-calc-v1";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./assets/logo.png",
  "./assets/favicon.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
];

// Ao instalar o service worker, guarda os arquivos principais em cache.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Ao ativar, remove caches de versões antigas do app.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Estratégia "cache primeiro, rede como respaldo": tenta servir do
// cache (funciona offline); se não achar, busca na rede.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).catch(() => cachedResponse);
    })
  );
});
