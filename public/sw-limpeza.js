/* Apaga os caches do service worker da V3 (np3d-calc-v3.x), que não são mais usados. */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith("np3d-calc-")).map((key) => caches.delete(key))))
  );
});
