// hooks/useAgoraCall.js - CORREGIDO
import { useState, useEffect, useRef, useCallback } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { ref, set, onValue, update, push, off } from "firebase/database";
import { db } from "../firebase";

const APP_ID = "36bb337ed3fd4f8a9d9f32e1ebc67807";

export function useAgoraCall(
  currentUserId,
  currentUserName,
  friendId,
  onCallEnd,
) {
  // BUGFIX #1: el hook ahora recibe currentUserName para usarlo como callerName real

  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const rtcClientRef = useRef(null);
  const callTimerRef = useRef(null);
  const currentCallIdRef = useRef(null);

  // BUGFIX #2: guardar localAudioTrack en un ref además del estado,
  // para evitar el stale closure en leaveChannel
  const localAudioTrackRef = useRef(null);

  // BUGFIX #4: flag para saber si YO ya inicié el fin de la llamada,
  // así no entro en loop cuando el otro cuelga y firebase actualiza a "ended"
  const isEndingCallRef = useRef(false);

  const initAgoraClient = () => {
    if (rtcClientRef.current) return rtcClientRef.current;
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    rtcClientRef.current = client;
    console.log("✅ [Agora] Cliente inicializado");
    return client;
  };

  const joinChannel = async (channel) => {
    console.log("🎧 [Agora] joinChannel llamado, canal:", channel);
    const client = initAgoraClient();

    if (
      client.connectionState === "CONNECTED" ||
      client.connectionState === "CONNECTING"
    ) {
      console.log("⚠️ [Agora] Ya conectado, saliendo primero...");
      await leaveChannel();
    }

    const uid = Math.floor(Math.random() * 100000);
    console.log("🔌 [Agora] Uniéndose al canal:", channel, "UID:", uid);
    await client.join(APP_ID, channel, null, uid);

    console.log("🎤 [Agora] Creando track de micrófono...");
    const track = await AgoraRTC.createMicrophoneAudioTrack();
    await client.publish(track);

    // BUGFIX #2: guardar en ref Y en estado
    localAudioTrackRef.current = track;
    setIsAudioEnabled(true);
    console.log("✅ [Agora] Micrófono publicado");

    client.on("user-published", async (user, mediaType) => {
      console.log("👤 [Agora] Usuario remoto publicó:", user.uid, mediaType);
      if (mediaType === "audio") {
        await client.subscribe(user, mediaType);
        user.audioTrack.play();
        console.log("🔊 [Agora] Audio remoto reproduciendo");
      }
    });

    client.on("user-unpublished", (user) => {
      console.log("🔇 [Agora] Usuario remoto dejó de publicar:", user.uid);
    });
  };

  // BUGFIX #2: leaveChannel usa el ref, no el estado (evita stale closure)
  const leaveChannel = async () => {
    console.log("📤 [Agora] leaveChannel llamado");
    const client = rtcClientRef.current;
    if (!client) {
      console.log("⚠️ [Agora] No hay cliente, skipping");
      return;
    }

    const track = localAudioTrackRef.current;
    if (track) {
      console.log("🎤 [Agora] Deteniendo track de micrófono...");
      try {
        track.stop();
        track.close();
        if (client.connectionState === "CONNECTED") {
          await client.unpublish(track);
        }
      } catch (err) {
        console.warn("⚠️ [Agora] Error al limpiar track:", err);
      }
      localAudioTrackRef.current = null;
    }

    if (
      client.connectionState === "CONNECTED" ||
      client.connectionState === "CONNECTING"
    ) {
      try {
        await client.leave();
        console.log("👋 [Agora] Cliente desconectado del canal");
      } catch (err) {
        console.warn("⚠️ [Agora] Error al salir del canal:", err);
      }
    }

    client.removeAllListeners();
  };

  // Escuchar llamadas entrantes
  useEffect(() => {
    if (!currentUserId) {
      console.log("⚠️ [Calls] No hay currentUserId, no se escuchan llamadas");
      return;
    }

    console.log("👂 [Calls] Escuchando llamadas para usuario:", currentUserId);
    const callsRef = ref(db, "calls");

    const handleSnapshot = (snapshot) => {
      const data = snapshot.val();
      console.log("📞 [Calls] Snapshot recibido:", data);

      if (!data) {
        console.log("📭 [Calls] No hay llamadas activas");
        // BUGFIX #3: si ya no hay llamadas y tenemos incomingCall, limpiarlo
        setIncomingCall(null);
        return;
      }

      let foundCall = null;
      for (const [callId, callData] of Object.entries(data)) {
        if (
          callData.calleeId === currentUserId &&
          callData.status === "calling"
        ) {
          console.log(
            "📲 [Calls] Llamada entrante encontrada:",
            callId,
            callData,
          );
          foundCall = { callId, ...callData };
          break;
        }
      }

      if (foundCall) {
        setIncomingCall(foundCall);
      } else {
        // BUGFIX #3: si no hay llamada en estado "calling" para mí, limpiar
        setIncomingCall((prev) => {
          if (prev)
            console.log(
              "🗑️ [Calls] Limpiando incomingCall porque ya no está en estado 'calling'",
            );
          return null;
        });
      }
    };

    onValue(callsRef, handleSnapshot);

    // BUGFIX #5: usar la función de unsubscribe correcta, no off() global
    return () => {
      console.log("👂 [Calls] Deteniendo escucha de llamadas");
      off(callsRef, "value", handleSnapshot);
    };
  }, [currentUserId]);

  // Iniciar llamada
  const startCall = async () => {
    console.log(
      "📞 [StartCall] Iniciando llamada de",
      currentUserId,
      "a",
      friendId,
    );

    if (!friendId || !currentUserId) {
      console.error("❌ [StartCall] Faltan IDs:", { friendId, currentUserId });
      return;
    }

    isEndingCallRef.current = false;
    setIsCalling(true);
    setCallDuration(0);

    const roomId = [currentUserId, friendId].sort().join("_");
    console.log("🏠 [StartCall] RoomId:", roomId);

    const callRef = push(ref(db, "calls"));
    const callId = callRef.key;
    currentCallIdRef.current = callId;
    console.log("🆔 [StartCall] CallId:", callId);

    // BUGFIX #1: callerName usa currentUserName (el nombre del usuario que llama)
    const callData = {
      callId,
      callerId: currentUserId,
      calleeId: friendId,
      callerName: currentUserName, // ← CORREGIDO
      status: "calling",
      roomId,
      createdAt: Date.now(),
    };

    console.log("💾 [StartCall] Guardando en Firebase:", callData);
    await set(callRef, callData);
    console.log("✅ [StartCall] Guardado en Firebase");

    // Escuchar cambios de estado de esta llamada específica
    const callStatusRef = ref(db, `calls/${callId}/status`);
    const unsubscribeStatus = onValue(callStatusRef, async (snap) => {
      const status = snap.val();
      console.log("🔄 [StartCall] Status actualizado:", status);

      if (status === "accepted") {
        console.log("✅ [StartCall] Llamada ACEPTADA");
        off(callStatusRef, "value");
        await joinChannel(roomId);
        setActiveCall({ callId, roomId, startTime: Date.now() });
        setIsCalling(false);

        if (callTimerRef.current) clearInterval(callTimerRef.current);
        callTimerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      } else if (status === "rejected") {
        console.log("❌ [StartCall] Llamada RECHAZADA");
        off(callStatusRef, "value");
        setIsCalling(false);
        setActiveCall(null);
        currentCallIdRef.current = null;

        // Limpiar el nodo de Firebase después de un momento
        setTimeout(async () => {
          await set(ref(db, `calls/${callId}`), null);
        }, 2000);

        alert("Llamada rechazada");
      } else if (status === "ended") {
        // BUGFIX #4: solo ejecutar si yo NO inicié el fin
        if (!isEndingCallRef.current) {
          console.log("🏁 [StartCall] Llamada terminada por el otro usuario");
          off(callStatusRef, "value");
          await _cleanupCall(callId, false); // false = no escribir "ended" en Firebase de nuevo
        }
      }
    });
  };

  // Aceptar llamada
  const acceptCall = async () => {
    console.log("✅ [AcceptCall] Aceptando llamada:", incomingCall);

    if (!incomingCall) {
      console.error("❌ [AcceptCall] No hay incomingCall");
      return;
    }

    const { callId, roomId } = incomingCall;
    isEndingCallRef.current = false;

    console.log(
      "📝 [AcceptCall] Actualizando status a 'accepted', callId:",
      callId,
    );
    await update(ref(db, `calls/${callId}`), {
      status: "accepted",
      acceptedAt: Date.now(),
    });

    console.log("🎧 [AcceptCall] Uniéndose al canal:", roomId);
    await joinChannel(roomId);

    setActiveCall({ callId, roomId, startTime: Date.now() });
    setIncomingCall(null);
    currentCallIdRef.current = callId;

    if (callTimerRef.current) clearInterval(callTimerRef.current);
    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    // Escuchar si el caller cuelga
    const callStatusRef = ref(db, `calls/${callId}/status`);
    const unsubscribeStatus = onValue(callStatusRef, async (snap) => {
      const status = snap.val();
      console.log("🔄 [AcceptCall] Status actualizado:", status);

      if (status === "ended" && !isEndingCallRef.current) {
        console.log("🏁 [AcceptCall] El caller colgó");
        off(callStatusRef, "value");
        await _cleanupCall(callId, false);
      }
    });
  };

  // Rechazar llamada
  const rejectCall = async () => {
    console.log("❌ [RejectCall] Rechazando llamada:", incomingCall);

    if (!incomingCall) return;

    const { callId } = incomingCall;
    await update(ref(db, `calls/${callId}`), {
      status: "rejected",
      rejectedAt: Date.now(),
    });

    setIncomingCall(null);

    setTimeout(async () => {
      await set(ref(db, `calls/${callId}`), null);
    }, 2000);
  };

  // Colgar llamada (llamado por el usuario local al presionar el botón)
  const endCall = async () => {
    console.log("🏁 [EndCall] Usuario local colgó, activeCall:", activeCall);

    const callId = activeCall?.callId || currentCallIdRef.current;
    if (!callId) {
      console.warn("⚠️ [EndCall] No hay callId para terminar");
      await _cleanupCall(null, false);
      return;
    }

    // BUGFIX #4: marcar que YO inicié el fin para no disparar el listener de nuevo
    isEndingCallRef.current = true;

    console.log(
      "📝 [EndCall] Escribiendo 'ended' en Firebase para callId:",
      callId,
    );
    await update(ref(db, `calls/${callId}`), {
      status: "ended",
      endTime: Date.now(),
    });

    await _cleanupCall(callId, true);
  };

  // Limpieza interna (no exportada) — writeNull controla si borramos el nodo
  const _cleanupCall = async (callId, writeNull = true) => {
    console.log(
      "🧹 [Cleanup] Limpiando llamada, callId:",
      callId,
      "writeNull:",
      writeNull,
    );

    await leaveChannel();

    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    if (callId && writeNull) {
      setTimeout(async () => {
        await set(ref(db, `calls/${callId}`), null);
        console.log("🗑️ [Cleanup] Nodo de Firebase eliminado");
      }, 2000);
    }

    setActiveCall(null);
    setIsCalling(false);
    setCallDuration(0);
    currentCallIdRef.current = null;
    isEndingCallRef.current = false;

    if (onCallEnd) onCallEnd();
  };

  const toggleAudio = async () => {
    const track = localAudioTrackRef.current;
    if (track) {
      const newState = !isAudioEnabled;
      await track.setEnabled(newState);
      setIsAudioEnabled(newState);
      console.log(
        "🎤 [Audio] Micrófono:",
        newState ? "activado" : "silenciado",
      );
    } else {
      console.warn("⚠️ [Audio] No hay track para toggle");
    }
  };

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      console.log("🧹 [Unmount] Limpiando hook useAgoraCall");
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      leaveChannel();
    };
  }, []);

  return {
    incomingCall,
    activeCall,
    isCalling,
    callDuration,
    isAudioEnabled,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
  };
}
