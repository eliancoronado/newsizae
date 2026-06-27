import { useEffect, useRef } from "react";
import { ref, onValue, set } from "firebase/database";
import { auth, db } from "./firebase";

export default function useRealtimeSync({
  roomId,
  selectedPage,
  path,
  value,
  onRemoteChange,
  delay = 600,
}) {
  const timeout = useRef(null);
  const lastLocalValue = useRef(null);
  const lastRemoteTimestamp = useRef(0);
  const isSending = useRef(false);
  const isReceiving = useRef(false);

  // Obtener UID del usuario actual de forma estable
  const currentUid = auth.currentUser?.uid;

  // -----------------------------
  // ESCUCHAR CAMBIOS REMOTOS
  // -----------------------------
  useEffect(() => {
    if (!roomId || !selectedPage || !currentUid) return;

    const roomRef = ref(db, `rooms/${roomId}/${selectedPage}/${path}`);

    const unsubscribe = onValue(roomRef, (snapshot) => {
      // Si estamos enviando, ignorar
      if (isSending.current) {
        console.log("⏳ Ignorando cambio remoto (estamos enviando)");
        return;
      }

      if (!snapshot.exists()) return;

      const data = snapshot.val();

      if (!data) return;

      // Ignorar mis propios cambios
      if (data.updatedBy === currentUid) {
        console.log("⏳ Ignorando cambio propio (UID:", currentUid, ")");
        return;
      }

      // Ignorar versiones viejas
      if (data.updatedAt <= lastRemoteTimestamp.current) {
        console.log("⏳ Ignorando versión vieja o igual");
        return;
      }

      console.log("📥 Recibiendo cambio remoto de:", data.updatedBy);

      isReceiving.current = true;

      // Actualizar timestamp
      lastRemoteTimestamp.current = data.updatedAt;

      // Restaurar elementos (función recursiva)
      const restore = (elements = []) => {
        return elements.map((el) => ({
          ...el,
          children: restore(el.children || []),
        }));
      };

      const restoredData = restore(data.value);

      // Actualizar referencia local
      lastLocalValue.current = restoredData;

      // Aplicar cambio remoto
      onRemoteChange(restoredData);

      isReceiving.current = false;
    });

    return () => {
      unsubscribe();
      // Limpiar timeouts al desmontar
      clearTimeout(timeout.current);
    };
  }, [roomId, selectedPage, path, currentUid, onRemoteChange]);

  // -----------------------------
  // ENVIAR CAMBIOS LOCALES
  // -----------------------------
  useEffect(() => {
    if (!roomId || !selectedPage || !currentUid) return;

    // Si estamos recibiendo, no enviar
    if (isReceiving.current) {
      console.log("⏳ Recibiendo datos, no enviar");
      return;
    }

    const valueStr = JSON.stringify(value);
    const lastStr = JSON.stringify(lastLocalValue.current);

    // Si no hay cambio, salir
    if (valueStr === lastStr) {
      return;
    }

    console.log("📤 Detectado cambio local, programando envío...");

    // Actualizar referencia local ANTES del timeout
    lastLocalValue.current = value;

    clearTimeout(timeout.current);

    timeout.current = setTimeout(async () => {
      try {
        isSending.current = true;

        const newTimestamp = Date.now();

        await set(ref(db, `rooms/${roomId}/${selectedPage}/${path}`), {
          value,
          updatedBy: currentUid,
          updatedAt: newTimestamp,
        });

        // Actualizar timestamp local después del envío exitoso
        lastRemoteTimestamp.current = newTimestamp;

        console.log("✅ Cambio enviado correctamente");
      } catch (error) {
        console.error("❌ Error al enviar cambio:", error);
        // Revertir lastLocalValue si falló el envío
        lastLocalValue.current = null;
      } finally {
        isSending.current = false;
      }
    }, delay);

    return () => {
      clearTimeout(timeout.current);
    };
  }, [value, roomId, selectedPage, path, currentUid, delay]);

  // -----------------------------
  // LIMPIEZA AL DESMONTAR
  // -----------------------------
  useEffect(() => {
    return () => {
      clearTimeout(timeout.current);
      isSending.current = false;
      isReceiving.current = false;
    };
  }, []);
}
