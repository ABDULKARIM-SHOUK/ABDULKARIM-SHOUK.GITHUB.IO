/* حصر المنتجات · يتيح فتح الصفحة بدون إنترنت (الشبكة أولاً ثم النسخة المحفوظة) */
var CACHE = 'hasr-v2';
self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(['./', './index.html']); }).catch(function () {}));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE && k.indexOf('hasr-') === 0; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
function save(req, res) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, cp); }); return res; }
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  var u = new URL(r.url);
  if (u.origin === self.location.origin && /\/hasr\/(index\.html|admin\.html)?$/.test(u.pathname)) {
    var isIndex = !/admin\.html$/.test(u.pathname);
    e.respondWith(fetch(r).then(function (res) { return res.ok ? save(r, res) : res; }).catch(function () {
      return caches.match(r, { ignoreSearch: true }).then(function (m) { return m || (isIndex ? caches.match('./index.html') : Response.error()); });
    }));
    return;
  }
  if (/^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(caches.match(r).then(function (m) {
      var net = fetch(r).then(function (res) { return save(r, res); }).catch(function () { return m; });
      return m || net;
    }));
  }
});
