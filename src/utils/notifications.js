export const sendPushNotification = async (
  toUserId,
  senderName,
  messageText,
  senderPhoto,
) => {
  try {
    // 🔥 1. Intentar backend (Netlify Functions)
    const response = await fetch("/api/send-notification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        toUserId,
        senderName,
        messageText,
        senderPhoto,
      }),
    });

    // ❌ Si el backend no existe o falla
    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const result = await response.json();
    console.log("📬 Notificación enviada (backend):", result);
    return result;
  } catch (error) {
    console.warn("⚠️ Backend no disponible, usando fallback frontend");

    // 🔥 2. FALLBACK FRONTEND (SOLO TEST)
    try {
      const response = await fetch("https://api.onesignal.com/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Key os_v2_app_porymhcbk5c5thdz5mmjil5exg4s4recarreqtnoujjl7cflvlx752cggdamyw2b654i357lknzg5rofgdcpaegbeppmfwrm3lfq5zi", // ⚠️ SOLO TEST
        },
        body: JSON.stringify({
          app_id: "7ba3861c-4157-45d9-9c79-eb18942fa4b9",
          headings: { en: senderName },
          contents: { en: messageText },
          chrome_web_icon: senderPhoto,
          chrome_web_image: senderPhoto,
          url: "https://baboonet.netlify.app/dashboard",
          data: {
            friendId: toUserId,
          },
          included_segments: ["All"], // o tu targeting después
          filters: [
            {
              field: "tag",
              key: "user_id",
              relation: "=",
              value: toUserId,
            },
          ],
          web_buttons: [
            {
              id: "open",
              text: "Abrir chat",
              icon: senderPhoto,
            },
            {
              id: "ignore",
              text: "Ignorar",
            },
          ],
        }),
      });

      const result = await response.json();
      console.log("🧪 Notificación enviada (frontend TEST):", result);
      return result;
    } catch (err) {
      console.error("❌ Error incluso en fallback:", err);
      return null;
    }
  }
};
