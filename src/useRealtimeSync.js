import { useEffect, useRef } from "react";
import { ref, onValue, set } from "firebase/database";
import { auth, db } from "./firebase";

export default function useRealtimeSync({
  roomId,
  path,
  value,
  onRemoteChange,
  delay = 600,
}) {
  const timeout = useRef(null);

  const lastLocalValue = useRef(null);

  const lastRemoteTimestamp = useRef(0);

  const sending = useRef(false);

  // -----------------------------
  // ESCUCHAR CAMBIOS
  // -----------------------------
  useEffect(() => {
    if (!roomId) return;

    const roomRef = ref(db, `rooms/${roomId}/${path}`);

    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const data = snapshot.val();

      if (!data) return;

      // Ignorar mis propios cambios
      if (data.updatedBy === auth.currentUser?.uid) return;

      // Ignorar versiones viejas
      if (data.updatedAt <= lastRemoteTimestamp.current) return;

      lastRemoteTimestamp.current = data.updatedAt;

      const remote = JSON.stringify(data.value);

      const local = JSON.stringify(lastLocalValue.current);

      // Si son iguales no hacer nada
      if (remote === local) return;

      lastLocalValue.current = data.value;

      const restore = (elements = []) => {
        return elements.map((el) => ({
          ...el,

          children: restore(el.children || []),
        }));
      };

      onRemoteChange(restore(data.value));
    });

    return () => unsubscribe();
  }, [roomId]);

  // -----------------------------
  // ENVIAR CAMBIOS
  // -----------------------------
  useEffect(() => {
    if (!roomId) return;

    const json = JSON.stringify(value);

    if (json === JSON.stringify(lastLocalValue.current)) return;

    lastLocalValue.current = value;

    clearTimeout(timeout.current);

    timeout.current = setTimeout(async () => {
      sending.current = true;

      await set(ref(db, `rooms/${roomId}/${path}`), {
        value,
        updatedBy: auth.currentUser?.uid,
        updatedAt: Date.now(),
      });

      sending.current = false;
    }, delay);

    return () => clearTimeout(timeout.current);
  }, [value]);
}
