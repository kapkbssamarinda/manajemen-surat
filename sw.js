const CACHE = "surat-v1";

// File yang di-cache saat install
const PRECACHE = [
  "/",
  "/index.html",
  "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.31.0/dist/tabler-icons.min.css",
  "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"
];

// Install — cache aset statis
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

// Activate — hapus cache lama
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — strategi:
// - Aset CDN (tabler, xlsx)  → cache first
// - Apps Script API (/exec)  → network only (selalu fresh)
// - index.html & aset lokal  → network first, fallback cache
self.addEventListener("fetch", e => {
  const url = e.request.url;

  // API Apps Script → selalu network, jangan cache
  if (url.includes("script.google.com")) {
    return; // biarkan browser handle normal
  }

  // Aset CDN → cache first
  if (url.includes("cdn.jsdelivr.net") || url.includes("fonts.googleapis.com")) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(resp => {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return resp;
        });
      })
    );
    return;
  }

  // Aset lokal (index.html, icon, dll) → network first, fallback cache
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
