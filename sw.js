
const CACHE_NAME = 'cripes-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Listen for messages from the main app to update scheduled reminders
let scheduledReminders = [];

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_REMINDERS') {
    scheduledReminders = event.data.reminders;
    console.log('[SW] Reminders updated:', scheduledReminders);
  }
});

// Periodic check (if supported by browser/platform)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-reminders') {
    event.waitUntil(checkAndNotify());
  }
});

async function checkAndNotify() {
  const now = new Date();
  const currentHHmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  // In a real app, we'd fetch the latest completions from IndexedDB here
  // For this local-first demo, we rely on the list passed via message
  for (const reminder of scheduledReminders) {
    if (reminder.time === currentHHmm) {
      await self.registration.showNotification('CRIPES Reminder', {
        body: `Time for: ${reminder.name}. Stay consistent!`,
        icon: 'https://cdn-icons-png.flaticon.com/512/4345/4345512.png',
        tag: reminder.id,
        badge: 'https://cdn-icons-png.flaticon.com/512/4345/4345512.png'
      });
    }
  }
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
