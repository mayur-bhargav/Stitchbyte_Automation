// Firebase Cloud Messaging Service Worker
// This file handles background notifications

console.log('[SW] Firebase messaging service worker loaded');

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

console.log('[SW] Firebase scripts imported');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyCnx0Cth8wr4DNnnIL9J2aeUDw6j8WCXU0",
  authDomain: "ganges-17474.firebaseapp.com",
  projectId: "ganges-17474",
  storageBucket: "ganges-17474.appspot.com",
  messagingSenderId: "223384815478",
  appId: "1:223384815478:web:990eeb51977ebcbb855c57",
  measurementId: "G-VJ1X52L4CH"
});

console.log('[SW] Firebase initialized');

// Get messaging instance
const messaging = firebase.messaging();

console.log('[SW] Messaging instance created');

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] 🔔 Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: payload.notification?.icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: payload.data?.tag || 'notification',
    data: payload.data,
    requireInteraction: false,
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Also listen for push events directly (backup handler)
self.addEventListener('push', (event) => {
  console.log('[SW] 📬 Push event received:', event);
  
  if (event.data) {
    console.log('[SW] Push data:', event.data.text());
    
    try {
      const payload = event.data.json();
      console.log('[SW] Parsed payload:', payload);
      
      const title = payload.notification?.title || payload.data?.title || 'New Notification';
      const options = {
        body: payload.notification?.body || payload.data?.body || 'You have a new message',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'fcm-notification',
      };
      
      event.waitUntil(
        self.registration.showNotification(title, options)
      );
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
    }
  } else {
    console.log('[SW] Push event has no data');
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  
  event.notification.close();
  
  // Open the app or focus if already open
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If a window is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise, open a new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});
