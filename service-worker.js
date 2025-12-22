const CACHE_NAME = 'pph-incidents-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/report.html',
  '/confirmation.html',
  '/admin.html',
  '/css/style.css',
  '/manifest.json'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// استرجاع الملفات من Cache
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // إذا وجد في Cache، أرجعه
        if (response) {
          return response;
        }
        // وإلا، احصل عليه من الإنترنت
        return fetch(event.request)
          .then(response => {
            // تأكد أن الاستجابة صالحة
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // احفظ نسخة في Cache
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          });
      })
      .catch(() => {
        // إذا فشل كل شيء، أرجع صفحة offline
        return caches.match('/index.html');
      })
  );
});