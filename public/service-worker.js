const CACHE_NAME = "moss-and-letters-shell-v9";
const INDEX_URL = new URL("./index.html", self.registration.scope).href;
const LEGAL_URLS = [
  "./legal/datenschutz.html",
  "./legal/impressum.html",
  "./legal/nutzungsbedingungen.html",
  "./legal/legal.css"
]
  .map((path) => new URL(path, INDEX_URL).href);

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const response = await fetch(INDEX_URL);
    if (!response.ok) throw new Error(`App shell request failed: ${response.status}`);
    const html = await response.clone().text();
    const resources = [...html.matchAll(/<(?:script|link|img)\b[^>]*(?:src|href)=["']([^"']+)["'][^>]*>/gi)]
      .map((match) => new URL(match[1], INDEX_URL))
      .filter((url) => url.origin === self.location.origin)
      .map((url) => url.href);
    for (const stylesheet of resources.filter((url) => /\.css(?:$|\?)/i.test(url))) {
      const stylesheetResponse = await fetch(stylesheet);
      if (!stylesheetResponse.ok) continue;
      const css = await stylesheetResponse.text();
      const images = [...css.matchAll(/url\((?:["']?)([^"')]+)(?:["']?)\)/gi)]
        .map((match) => new URL(match[1], stylesheet))
        .filter((url) => url.origin === self.location.origin)
        .map((url) => url.href);
      resources.push(...images);
    }
    const cache = await caches.open(CACHE_NAME);
    await cache.put(INDEX_URL, response);
    await cache.addAll([...new Set([...resources, ...LEGAL_URLS])]);
  })());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin ||
      url.pathname.startsWith("/api/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () =>
      (await caches.match(request, { ignoreVary: true })) ||
      caches.match(INDEX_URL, { ignoreVary: true })
    ));
    return;
  }

  event.respondWith(
    fetch(request).then((response) => {
      if (response.ok) {
        caches.open(CACHE_NAME)
          .then((cache) => cache.put(request, response.clone()))
          .catch((error) => console.warn("Offline cache update failed.", error));
      }
      return response;
    }).catch(() => caches.match(request, { ignoreVary: true }))
  );
});
