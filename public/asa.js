// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Configuración de Firebase (misma que en tu firebase.js)
const firebaseConfig = {
  apiKey: "AIzaSyDfKGy9qWaQP9-_fgP9fWxM5C19Tb7I8lg",
  authDomain: "sizaenew.firebaseapp.com",
  projectId: "sizaenew",
  storageBucket: "sizaenew.firebasestorage.app",
  messagingSenderId: "116825955089",
  appId: "1:116825955089:web:b7b269ee09dbb000e1cab0"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Manejar mensajes en background
messaging.onBackgroundMessage((payload) => {
  console.log('📬 Mensaje en background:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/logo2.png',
    badge: '/logo2.png',
    data: {
      click_action: payload.data?.click_action || '/dashboard',
      url: payload.data?.url || '/dashboard',
      friendId: payload.data?.friendId
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar clic en notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Si ya hay una ventana abierta, enfocarla
        for (let client of windowClients) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // Si no, abrir nueva
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});