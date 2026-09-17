const APP_VERSION = "2026-09-17.2";
const CACHE_NAME = `nanyuan-course-${APP_VERSION}`;
const base = self.registration.scope;
const absolute = (path) => new URL(path, base).href;
const INDEX = absolute("./index.html");
const CORE_ASSETS = ["./index.html", "./styles.css?v=6", "./app.js?v=6", "./official-adjustments.js?v=6", "./pwa.js?v=6", "./manifest.webmanifest?v=6", "./icons/course-schedule-192.png", "./icons/course-schedule-512.png"];
const ownedCache = (name) => name.startsWith("nanyuan-course-") || name.startsWith("cs26-shell-");
const unavailable = () => new Response("暂时无法连接，请联网后重试。", {status: 503, headers: {"Content-Type": "text/plain; charset=utf-8"}});
const usable = (response, url) => {
  if (!response.ok || !response.url || new URL(response.url).origin !== self.location.origin) return false;
  const type = response.headers.get("content-type") || "";
  if (url.pathname.endsWith(".js")) return /javascript/.test(type);
  if (url.pathname.endsWith(".css")) return /text\/css/.test(type);
  if (url.pathname.endsWith(".webmanifest")) return /json/.test(type);
  if (url.pathname.endsWith(".html")) return /text\/html/.test(type);
  return true;
};

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    // Finish downloading the new shell before replacing the working offline copy.
    const fresh = await Promise.all(CORE_ASSETS.map(async (path) => {
      const url = new URL(path, base);
      const response = await fetch(url.href, {cache: "no-store"});
      if (!usable(response, url)) throw new Error("Incomplete app release");
      return [url.href, response];
    }));
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(fresh.map(([url, response]) => cache.put(url, response)));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const old = (await caches.keys()).filter((name) => ownedCache(name) && name !== CACHE_NAME);
    await Promise.all(old.map((name) => caches.delete(name)));
    await self.clients.claim();
    // Old cached pages have no update listener: move those windows to a fresh URL.
    if (old.length) {
      const windows = await self.clients.matchAll({type: "window", includeUncontrolled: true});
      await Promise.all(windows.map(async (client) => {
        const url = new URL(client.url);
        if (url.origin !== self.location.origin || ![new URL(base).pathname, new URL(INDEX).pathname, new URL("./index", base).pathname].includes(url.pathname)) return;
        url.searchParams.set("__refresh", `${APP_VERSION}-${Date.now()}`);
        try { await client.navigate(url.href); } catch { /* Closed window. */ }
      }));
    }
  })());
});

const networkFirst = async (request) => {
  const url = new URL(request.url);
  const navigation = request.mode === "navigate";
  const key = navigation ? INDEX : request;
  let response;
  try { response = await fetch(request, {cache: "no-store"}); } catch { /* Offline fallback below. */ }
  if (response && response.status < 500) {
    if (usable(response, navigation ? new URL(INDEX) : url)) {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(key, response.clone());
      } catch { /* Storage failure must never replace a fresh response with stale data. */ }
    }
    return response;
  }
  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(key, {ignoreSearch: true});
    if (cached) return cached;
  } catch { /* Storage unavailable. */ }
  return response || unavailable();
};

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (["release.json", "repair-cache", "repair-cache.html", "sw.js"].some((path) => url.pathname === new URL(path, base).pathname)) {
    event.respondWith(fetch(request, {cache: "no-store"}).catch(unavailable));
    return;
  }
  const home = [new URL(base).pathname, new URL(INDEX).pathname, new URL("./index", base).pathname].includes(url.pathname);
  const shell = CORE_ASSETS.some((path) => new URL(path, base).pathname === url.pathname);
  if (home || shell) event.respondWith(networkFirst(request));
});
