/* Чистый Прыжок - offline copy of the game.
   Every file is served from the device first. When any file changes, bump
   VERSION so installed copies pick up the update on their next online visit. */
var VERSION = 'clean-hop-v8-1';
var FILES = [
  './', 'index.html', 'manifest.webmanifest',
  'icon-180.png', 'icon-192.png', 'icon-512.png',
  'assets/sprites/cattail.svg', 'assets/sprites/cirrus.svg',
  'assets/sprites/cloud-1.svg', 'assets/sprites/cloud-2.svg',
  'assets/sprites/cloud-3.svg', 'assets/sprites/deco-berrybush.svg',
  'assets/sprites/deco-daisy.svg', 'assets/sprites/deco-grasstuft.svg',
  'assets/sprites/deco-seedling.svg', 'assets/sprites/deco-toadstool.svg',
  'assets/sprites/factory-chimney.svg', 'assets/sprites/factory-plant.svg',
  'assets/sprites/factory-tanks.svg', 'assets/sprites/factory-towers.svg',
  'assets/sprites/factory-works.svg', 'assets/sprites/farwork-1.svg',
  'assets/sprites/farwork-2.svg', 'assets/sprites/fg-cattails.svg',
  'assets/sprites/fg-grass.svg', 'assets/sprites/flag.svg',
  'assets/sprites/flower.svg', 'assets/sprites/island-1.svg',
  'assets/sprites/island-2.svg', 'assets/sprites/island-3.svg',
  'assets/sprites/island-lamp.svg',
  'assets/sprites/jetty.svg', 'assets/sprites/junk-bag.svg',
  'assets/sprites/junk-bottle.svg', 'assets/sprites/junk-can.svg',
  'assets/sprites/leaf.svg', 'assets/sprites/meadow-bush.svg',
  'assets/sprites/meadow-log.svg', 'assets/sprites/meadow-tree.svg',
  'assets/sprites/school.svg', 'assets/sprites/shore-bench.svg',
  'assets/sprites/shore-bush.svg',
  'assets/sprites/shore-lamp.svg', 'assets/sprites/shore-pine.svg',
  'assets/sprites/shore-poles.svg', 'assets/sprites/shore-tree.svg',
  'assets/sprites/signpost.svg', 'assets/sprites/trash-pile.svg',
  'assets/sprites/turbine-blades.svg', 'assets/sprites/turbine-tower.svg',
  'assets/sprites/van.svg'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(VERSION)
      .then(function (cache) { return cache.addAll(FILES); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== VERSION; })
                               .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      return hit || fetch(e.request);
    })
  );
});
