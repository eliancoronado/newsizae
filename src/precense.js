import { ref, set, onDisconnect, serverTimestamp } from "firebase/database";
import { db } from "./firebase";

export function setupPresence(user) {
  const userStatusRef = ref(db, "status/" + user.uid);

  // 🔌 Detectar conexión real
  const connectedRef = ref(db, ".info/connected");

  import("firebase/database").then(({ onValue }) => {
    onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === false) return;

      // 🔴 cuando se desconecta
      onDisconnect(userStatusRef).set({
        state: "offline",
        lastChanged: Date.now(),
      });

      // 🟢 cuando está online
      set(userStatusRef, {
        state: "online",
        lastChanged: Date.now(),
      });
    });
  });
}