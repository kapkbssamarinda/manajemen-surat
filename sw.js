const CACHE = "surat-v2";
const BASE  = "/manajemen-surat";

const PRECACHE = [
  BASE + "/",
  BASE + "/index.html",
  BASE + "/icon-192.png",
  BASE + "/icon-512.png",
  "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.31.0/dist/tabler-icons.min.css",
  "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = e.request.url;

  // API Apps Script → selalu network, jangan cache
  if (url.includes("script.google.com")) return;

  // Aset CDN → cache first
  if (url.includes("cdn.jsdelivr.net") || url.includes("fonts.googleapis.com")) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(resp => {
          caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
          return resp;
        });
      })
    );
    return;
  }

  // Aset lokal → network first, fallback ke cache
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
