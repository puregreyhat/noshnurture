self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        includeUncontrolled: true,
        type: 'window',
      });
      if (allClients.length > 0) {
        const client = allClients[0];
        client.focus();
      } else {
        self.clients.openWindow('/settings');
      }
    })()
  );
});
