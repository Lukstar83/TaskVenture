
const CACHE_NAME = 'taskventure-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/sheet.css',
  '/quest-styles.css',
  '/app.js',
  '/dice.js',
  '/utils.js',
  '/sheet.js',
  '/quests.js',
  '/nav.js',
  '/wizard.js',
  '/settings.js',
  '/build.js',
  '/data/cards.json',
  '/data/users.json',
  '/attached_assets/Taskventure_logo.png',
  '/attached_assets/logo.png',
  '/attached_assets/TaskVenture splash screen.png',
  '/attached_assets/bg-music.mp3',
  '/attached_assets/button-click.aac'
];

// Install event - cache resources
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(function(error) {
        console.log('Cache install failed:', error);
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
