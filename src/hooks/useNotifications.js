// hooks/useNotifications.js
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, set } from "firebase/database";

export const useNotifications = (currentUser) => {
  const [permission, setPermission] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [notification, setNotification] = useState(null);
  const [oneSignalReady, setOneSignalReady] = useState(false);

  // Esperar a que OneSignal esté listo
  useEffect(() => {
    const checkOneSignal = () => {
      if (
        window.OneSignal &&
        window.OneSignal.User &&
        window.OneSignal.Notifications &&
        window.OneSignal.init
      ) {
        setOneSignalReady(true);
        console.log("✅ OneSignal SDK listo");
      } else {
        setTimeout(checkOneSignal, 500);
      }
    };
    checkOneSignal();
  }, []);

  const waitForServiceWorker = async () => {
    const registration = await navigator.serviceWorker.ready;

    // Esperar hasta que tenga controller activo
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => {
        navigator.serviceWorker.addEventListener("controllerchange", resolve);
      });
    }

    return registration;
  };

  // Inicializar OneSignal para el usuario
  const initOneSignal = async () => {
    if (!currentUser || !oneSignalReady || isInitialized) return;

    try {
      // 🧠 Esperar SW listo
      await waitForServiceWorker();

      // Login del usuario (identificar al usuario)
      await window.OneSignal.login(currentUser.uid);

      // Agregar tags (datos del usuario)
      await window.OneSignal.User.addTags({
        user_name: currentUser.name,
        user_email: currentUser.email,
        user_id: currentUser.uid,
      });

      // Obtener el ID de la suscripción
      const subscriptionId = window.OneSignal.User?.PushSubscription?.id;

      if (subscriptionId) {
        await set(
          ref(db, `fcmTokens/${currentUser.uid}/${subscriptionId}`),
          true,
        );
        console.log("✅ Suscripción OneSignal guardada:", subscriptionId);
      }

      setIsInitialized(true);
    } catch (error) {
      console.error("Error initializing OneSignal:", error);
    }
  };

  const requestPermission = async () => {
    if (!currentUser) return;

    try {
      // Esperar a que OneSignal esté listo
      if (!oneSignalReady) {
        await new Promise((resolve) => {
          const check = setInterval(() => {
            if (
              window.OneSignal &&
              window.OneSignal.User &&
              window.OneSignal.Notifications &&
              window.OneSignal.init
            ) {
              clearInterval(check);
              resolve();
            }
          }, 500);
        });
      }

      const permissionStatus = await Notification.requestPermission();
      setPermission(permissionStatus);

      if (permissionStatus === "granted") {
        await initOneSignal();
      }
    } catch (error) {
      console.error("Error getting notification permission:", error);
    }
  };

  // Escuchar notificaciones (versión compatible con OneSignal v16)
  useEffect(() => {
    if (!oneSignalReady) return;

    // En la nueva versión, los eventos se manejan de forma diferente
    const handleNotification = (event) => {
      console.log("📨 Notificación recibida:", event);

      const notif = event.notification;

      setNotification({
        title: notif.title,
        body: notif.body,
        image: notif.icon, // 👈 esto trae la foto
        data: notif.additionalData,
      });

      // 🔥 IMPORTANTE: permitir que también se muestre la notificación del sistema
      event.preventDefault();
      event.notification.display();
    };

    // Usar el método correcto para escuchar notificaciones
    if (window.OneSignal && window.OneSignal.Notifications) {
      window.OneSignal.Notifications.addEventListener(
        "foregroundWillDisplay",
        handleNotification,
      );
    }

    return () => {
      if (window.OneSignal && window.OneSignal.Notifications) {
        window.OneSignal.Notifications.removeEventListener(
          "foregroundWillDisplay",
          handleNotification,
        );
      }
    };
  }, [oneSignalReady]);

  return {
    permission,
    requestPermission,
    notification,
    isInitialized,
    setNotification,
  };
};
