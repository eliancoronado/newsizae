// hooks/usePresence.js
import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";

export const usePresence = (userId) => {
  const [status, setStatus] = useState("offline");
  const [statusText, setStatusText] = useState("offline");

  useEffect(() => {
    if (!userId) return;

    const statusRef = ref(db, `status/${userId}`);
    
    const unsubscribe = onValue(statusRef, (snapshot) => {
      const data = snapshot.val();
      
      if (!data) {
        setStatus("offline");
        setStatusText("offline");
        return;
      }

      if (data.state === "online") {
        setStatus("online");
        setStatusText("en línea");
        return;
      }

      // Calcular tiempo desde que estuvo en línea
      const diff = Date.now() - data.lastChanged;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      let text = "";
      if (minutes < 1) text = "ult. vez hace unos segundos";
      else if (minutes < 60) text = `ult. vez hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
      else if (hours < 24) text = `ult. vez hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
      else if (days < 7) text = `ult. vez hace ${days} ${days === 1 ? 'día' : 'días'}`;
      else text = "visto hace más de una semana";

      setStatus("offline");
      setStatusText(text);
    });

    return () => unsubscribe();
  }, [userId]);

  return { status, statusText };
};