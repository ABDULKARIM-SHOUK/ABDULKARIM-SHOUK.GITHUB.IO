/* حصر المنتجات · يتيح فتح الصفحة بدون إنترنت أو مع اتصال ضعيف (الشبكة أولاً لمدة 3 ثوانٍ ثم النسخة المحفوظة) */
var CACHE = 'hasr-v4';
self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll([new Request('./', { cache: 'reload' }), new Request('./index.html', { cache: 'reload' })]); }).catch(function () {}));
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
    var net = fetch(r.url, { cache: 'no-cache', credentials: 'same-origin' }).then(function (res) { return res.ok ? save(r, res) : res; });
    var stored = function () { return caches.match(r, { ignoreSearch: true }).then(function (m) { return m || (isIndex ? caches.match('./index.html') : undefined); }); };
    e.respondWith(new Promise(function (resolve) {
      var done = false; function give(x) { if (!done && x) { done = true; resolve(x); } }
      net.then(give, function () { stored().then(function (m) { give(m || Response.error()); }); });
      setTimeout(function () { stored().then(give); }, 3000);   // الشبكة لا ترد: افتح النسخة المحفوظة
    }));
    e.waitUntil(net.catch(function () {}));   // يكمل تحديث النسخة المحفوظة في الخلفية
    return;
  }
  if (/^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(caches.match(r).then(function (m) {
      var n = fetch(r).then(function (res) { return save(r, res); }).catch(function () { return m; });
      return m || n;
    }));
  }
});
