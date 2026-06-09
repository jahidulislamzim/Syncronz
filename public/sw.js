const CACHE_NAME = 'syncro-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icon.svg',
  '/badge.png'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Network-first with offline fallback)
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and exclude Firebase auth/REST endpoints
  if (event.request.method !== 'GET' || event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('googleapis.com')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache valid responses
        if (response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Return cache match on offline fallback
        return caches.match(event.request);
      })
  );
});

// Push Notification Event
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'Syncro Task Manager';
    const options = {
      body: data.body || '',
      icon: data.icon || '/icon.svg',
      badge: data.badge || '/badge.png',
      vibrate: [100, 50, 100],
      tag: data.tag || 'syncro-task-alert',
      renotify: true,
      data: {
        url: data.url || '/'
      },
      actions: [
        { action: 'open', title: 'Open Workspace' },
        { action: 'close', title: 'Dismiss' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (err) {
    console.error('Error rendering web push notification:', err);
    // Fallback if payload isn't JSON or fails parsing
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('Syncro Update', {
        body: text,
        icon: '/icon.svg',
        badge: '/badge.png',
        vibrate: [100, 50, 100]
      })
    );
  }
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open at the target URL, focus it
      for (const client of clientList) {
        const urlMatches = client.url.endsWith(targetUrl) || client.url.includes(targetUrl);
        if (urlMatches && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
