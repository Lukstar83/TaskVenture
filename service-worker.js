
/* TaskVenture service worker */
const CACHE = 'taskventure-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/utils.js',
  '/dice.js',
  '/sheet.js',
  '/wizard.js',
  '/nav.js',
  '/quests.js',
  '/settings.js',
  '/quest-styles.css',
  '/sheet.css',
  '/manifest.json',
  '/attached_assets/Taskventure_logo.png',
  '/attached_assets/bedroom.png',
  '/attached_assets/bg-music.mp3',
  '/attached_assets/button-click.aac'
];

self.addEventListener('install', (e) => {
  console.log('TaskVenture SW: Installing...');
  e.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE);
      await cache.addAll(ASSETS);
      console.log('TaskVenture SW: Assets cached');
      self.skipWaiting();
    } catch (error) {
      console.error('TaskVenture SW: Install failed', error);
    }
  })());
});

self.addEventListener('activate', (e) => {
  console.log('TaskVenture SW: Activating...');
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE ? caches.delete(k) : null)));
    self.clients.claim();
    console.log('TaskVenture SW: Activated');
  })());
});

self.addEventListener('fetch', (e) => {
  const { request } = e;

  // Cache-first for same-origin GETs
  if (request.method === 'GET' && new URL(request.url).origin === location.origin) {
    e.respondWith((async () => {
      try {
        const cached = await caches.match(request);
        if (cached) return cached;
        
        const fresh = await fetch(request);
        
        // Optionally put fresh static assets in cache
        if (ASSETS.some(p => request.url.endsWith(p.replace('/', '')))) {
          const cache = await caches.open(CACHE);
          cache.put(request, fresh.clone());
        }
        return fresh;
      } catch (error) {
        // Offline fallback for navigations
        if (request.mode === 'navigate') {
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
        }
        throw error;
      }
    })());
  }
});
