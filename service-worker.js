/* =========================================================
   NOSSO PROJETO 3D — service-worker.js
   Faz cache dos arquivos principais para o app funcionar
   offline depois de instalado, e é o que "habilita" o
   navegador a oferecer a instalação como PWA.
   Os arquivos centrais (index.html, script.js, style.css,
   manifest.json) usam estratégia "rede primeiro", então eles
   já chegam atualizados sozinhos quando a pessoa está online.
   Mudar o CACHE_NAME (ex: np3d-calc-v2) continua sendo uma
   segurança extra, mas não é mais a única linha de defesa
   contra versão antiga.
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

// Arquivos centrais do app: sempre buscamos a versão mais nova da rede
// primeiro, pra ninguém ficar preso numa versão antiga depois de um deploy.
const CORE_FILE_NAMES = ["index.html", "script.js", "style.css", "manifest.json"];

function isCoreRequest(request) {
  if (request.mode === "navigate") return true;
  const pathname = new URL(request.url).pathname;
  return CORE_FILE_NAMES.some((name) => pathname.endsWith(name));
}

// Ao instalar o service worker, guarda os arquivos principais em cache e já
// assume que essa versão nova deve ficar pronta pra assumir assim que
// possível — a atualização acontece de forma silenciosa, sem avisar a pessoa.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Ao ativar, remove caches de versões antigas do app e assume o controle das
// abas já abertas (sem recarregar nada à força).
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (isCoreRequest(event.request)) {
    // Estratégia "rede primeiro": tenta buscar a versão mais recente;
    // se conseguir, atualiza o cache e usa essa resposta. Se a rede
    // falhar (offline), cai pro que estiver salvo em cache.
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Demais arquivos estáticos (imagens, ícones): "cache primeiro, rede
  // como respaldo" — eles raramente mudam e isso mantém o carregamento rápido.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).catch(() => cachedResponse);
    })
  );
});
