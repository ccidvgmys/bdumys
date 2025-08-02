const CACHE_NAME = 'parcel-calculator-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/calculator.html',
  '/routes.html',
  '/jpp.html',
  '/styles.css',
  '/script.js',
  '/calculator.js',
  '/routes.js',
  '/extracted_rates.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/jspdf@latest/dist/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf-autotable@latest/dist/jspdf.plugin.autotable.min.js'
];

// Install event - cache resources
self.addEventListener('install', event => {
 
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
       
        return cache.addAll(urlsToCache);
      })
      .then(() => {
       
        return self.skipWaiting();
      })
      .catch(error => {
       
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
 
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
         
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
     
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
 
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests (except CDN resources we want to cache)
  const url = new URL(event.request.url);
  if (url.origin !== location.origin && 
      !urlsToCache.includes(event.request.url)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
         
          return response;
        }

        
        return fetch(event.request)
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the fetched resource
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              
              });

            return response;
          })
          .catch(error => {
            console.error('Service Worker: Fetch failed', error);
            
            // Return offline page for navigation requests
            if (event.request.destination === 'document') {
                              return caches.match('/index.html');
            }
            
            return new Response('Network error occurred', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
 
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Push notification handling
self.addEventListener('push', event => {

  
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-96x96.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Parcel Calculator', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
 
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync function
async function doBackgroundSync() {
  try {
    // Perform any background tasks here
   
    
    // Example: Sync any offline data
    const offlineData = await getOfflineData();
    if (offlineData.length > 0) {
      // Sync data when online
     
    }
  } catch (error) {
    
  }
}

// Get offline data from IndexedDB or localStorage
async function getOfflineData() {
  // This would typically interact with IndexedDB
  // For now, return empty array
  return [];
}

// Handle app updates
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 