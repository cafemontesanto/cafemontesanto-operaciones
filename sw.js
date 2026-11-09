// Café Montesanto — Operaciones: service worker mínimo (red primero, caché como respaldo)
const CACHE = "montesanto-ops-v1";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c){ return Promise.all(SHELL.map(function(u){ return c.add(u).catch(function(){ return null; }); })); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys()
      .then(function(keys){ return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); })); })
      .then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  var url = new URL(req.url);
  if(url.origin !== self.location.origin) return;   // Firebase y demás servicios externos van directo a la red
  e.respondWith(
    fetch(req).then(function(res){
      if(res && res.ok){ var copia = res.clone(); caches.open(CACHE).then(function(c){ c.put(req, copia); }); }
      return res;
    }).catch(function(){
      return caches.match(req).then(function(r){ return r || caches.match("./index.html"); });
    })
  );
});
