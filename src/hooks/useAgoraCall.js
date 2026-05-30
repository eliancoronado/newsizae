// hooks/useAgoraCall.js - VERSIÓN FINAL con manejo de errores
import { useState, useEffect, useRef } from "react";
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
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const rtcClientRef = useRef(null);
  const callTimerRef = useRef(null);
  const currentCallIdRef = useRef(null);
  const localAudioTrackRef = useRef(null);
  const isEndingCallRef = useRef(false);
  // Guardar la función de unsubscribe del listener de status para poder limpiarla
  const statusUnsubRef = useRef(null);

  // ─── Agora helpers ────────────────────────────────────────────────────────

  const initAgoraClient = () => {
    if (rtcClientRef.current) return rtcClientRef.current;
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    rtcClientRef.current = client;
    console.log("✅ [Agora] Cliente creado");
    return client;
  };

  const joinChannel = async (channel) => {
    console.log("🎧 [Agora] joinChannel →", channel);
    const client = initAgoraClient();

    if (
      client.connectionState === "CONNECTED" ||
      client.connectionState === "CONNECTING"
    ) {
      console.log("⚠️ [Agora] Ya conectado, saliendo primero...");
      await leaveChannel();
    }

    const uid = Math.floor(Math.random() * 100000);
    await client.join(APP_ID, channel, null, uid);
    console.log("✅ [Agora] Unido al canal con UID:", uid);

    const track = await AgoraRTC.createMicrophoneAudioTrack();
    await client.publish(track);
    localAudioTrackRef.current = track;
    setIsAudioEnabled(true);
    console.log("✅ [Agora] Micrófono publicado");

    client.on("user-published", async (user, mediaType) => {
      console.log("👤 [Agora] Remoto publicó:", user.uid, mediaType);
      if (mediaType === "audio") {
        await client.subscribe(user, mediaType);
        user.audioTrack.play();
        console.log("🔊 [Agora] Audio remoto reproduciendo");
      }
    });
  };

  const leaveChannel = async () => {
    console.log("📤 [Agora] leaveChannel");
    const client = rtcClientRef.current;
    if (!client) return;

    const track = localAudioTrackRef.current;
    if (track) {
      try {
        track.stop();
        track.close();
        if (client.connectionState === "CONNECTED") {
          await client.unpublish(track);
        }
      } catch (e) {
        console.warn("⚠️ [Agora] Error limpiando track:", e);
      }
      localAudioTrackRef.current = null;
    }

    if (
      client.connectionState === "CONNECTED" ||
      client.connectionState === "CONNECTING"
    ) {
      try {
        await client.leave();
        console.log("👋 [Agora] Salió del canal");
      } catch (e) {
        console.warn("⚠️ [Agora] Error saliendo del canal:", e);
      }
    }
    client.removeAllListeners();
  };

  // ─── Limpieza interna ─────────────────────────────────────────────────────

  const _cleanupLocalState = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    if (statusUnsubRef.current) {
      statusUnsubRef.current();
      statusUnsubRef.current = null;
    }
    setActiveCall(null);
    setIsCalling(false);
    setCallDuration(0);
    currentCallIdRef.current = null;
    isEndingCallRef.current = false;
  };

  const _startTimer = () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  // ─── Escuchar llamadas entrantes ──────────────────────────────────────────

  useEffect(() => {
    if (!currentUserId) return;

    console.log("👂 [Calls] Escuchando llamadas para:", currentUserId);
    const callsRef = ref(db, "calls");

    const handler = (snapshot) => {
      const data = snapshot.val();
      console.log("📦 CALLS DATA:", data);

      if (!data) {
        setIncomingCall(null);
        return;
      }

      let found = null;
      for (const [callId, callData] of Object.entries(data)) {
        console.log(
          "🔍 Revisando:",
          callData.calleeId,
          currentUserId,
          callData.status,
        );
        if (
          callData.calleeId === currentUserId &&
          callData.status === "calling"
        ) {
          console.log("📲 [Calls] Llamada entrante:", callId, callData);
          found = { callId, ...callData };
          break;
        }
      }

      setIncomingCall(found); // null si no encontró nada → limpia el modal
    };

    const unsubscribe = onValue(callsRef, handler);
    return () => {
      console.log("👂 [Calls] Dejando de escuchar llamadas");
      unsubscribe();
    };
  }, [currentUserId]);

  // ─── Escuchar cuando el otro cuelga (para quien aceptó) ───────────────────

  const _listenForRemoteEnd = (callId) => {
    const callStatusRef = ref(db, `calls/${callId}/status`);

    const handler = async (snap) => {
      const status = snap.val();
      console.log("🔄 [StatusListener] status:", status);

      if (status === "ended" && !isEndingCallRef.current) {
        console.log("🏁 [StatusListener] El otro usuario colgó");
        off(callStatusRef, "value", handler);
        await leaveChannel();
        _cleanupLocalState();
        if (onCallEnd) onCallEnd();
      }
    };

    onValue(callStatusRef, handler);
    // Guardar para poder limpiar si el componente se desmonta
    statusUnsubRef.current = () => off(callStatusRef, "value", handler);
  };

  // ─── Iniciar llamada ──────────────────────────────────────────────────────

  const startCall = async () => {
    console.log("📞 [StartCall] De:", currentUserId, "→", friendId);

    if (!friendId || !currentUserId) {
      console.error("❌ [StartCall] Faltan IDs");
      return;
    }

    isEndingCallRef.current = false;
    setIsCalling(true);
    setCallDuration(0);

    const roomId = [currentUserId, friendId].sort().join("_");
    const callRef = push(ref(db, "calls"));
    const callId = callRef.key;
    currentCallIdRef.current = callId;

    const callData = {
      callId,
      callerId: currentUserId,
      calleeId: friendId,
      callerName: currentUserName, // nombre del que llama ← CORREGIDO
      status: "calling",
      roomId,
      createdAt: Date.now(),
    };

    console.log("💾 [StartCall] Guardando:", callData);

    try {
      await set(callRef, callData);
      console.log("✅ [StartCall] Guardado en Firebase");
    } catch (err) {
      console.error("❌ [StartCall] Error al guardar en Firebase:", err);
      console.error(
        "👉 Revisa las reglas de Firebase Realtime Database para /calls",
      );
      setIsCalling(false);
      currentCallIdRef.current = null;
      alert("No se pudo iniciar la llamada. Revisa los permisos de Firebase.");
      return;
    }

    // Escuchar respuesta del callee
    const callStatusRef = ref(db, `calls/${callId}/status`);

    const handler = async (snap) => {
      const status = snap.val();
      console.log("🔄 [StartCall] Status:", status);

      if (status === "accepted") {
        console.log("✅ [StartCall] Aceptada");
        off(callStatusRef, "value", handler);
        try {
          await joinChannel(roomId);
        } catch (e) {
          console.error("❌ [StartCall] Error al unirse al canal Agora:", e);
        }
        setActiveCall({ callId, roomId, startTime: Date.now() });
        setIsCalling(false);
        _startTimer();
        _listenForRemoteEnd(callId);
      } else if (status === "rejected") {
        console.log("❌ [StartCall] Rechazada");
        off(callStatusRef, "value", handler);
        _cleanupLocalState();
        setTimeout(() => set(ref(db, `calls/${callId}`), null), 2000);
        alert("Llamada rechazada");
      } else if (status === "ended" && !isEndingCallRef.current) {
        console.log("🏁 [StartCall] Terminada por el otro");
        off(callStatusRef, "value", handler);
        await leaveChannel();
        _cleanupLocalState();
        if (onCallEnd) onCallEnd();
      }
    };

    onValue(callStatusRef, handler);
    statusUnsubRef.current = () => off(callStatusRef, "value", handler);
  };

  // ─── Aceptar llamada ──────────────────────────────────────────────────────

  const acceptCall = async () => {
    console.log("✅ [AcceptCall] Aceptando:", incomingCall);
    if (!incomingCall) return;

    const { callId, roomId } = incomingCall;
    isEndingCallRef.current = false;
    currentCallIdRef.current = callId;

    try {
      await update(ref(db, `calls/${callId}`), {
        status: "accepted",
        acceptedAt: Date.now(),
      });
      console.log("✅ [AcceptCall] Status actualizado a 'accepted'");
    } catch (err) {
      console.error("❌ [AcceptCall] Error al actualizar Firebase:", err);
      console.error(
        "👉 Revisa las reglas de Firebase Realtime Database para /calls",
      );
      alert("No se pudo aceptar la llamada. Revisa los permisos de Firebase.");
      return;
    }

    try {
      await joinChannel(roomId);
    } catch (e) {
      console.error("❌ [AcceptCall] Error al unirse al canal Agora:", e);
    }

    setActiveCall({ callId, roomId, startTime: Date.now() });
    setIncomingCall(null);
    _startTimer();
    _listenForRemoteEnd(callId);
  };

  // ─── Rechazar llamada ─────────────────────────────────────────────────────

  const rejectCall = async () => {
    console.log("❌ [RejectCall] Rechazando:", incomingCall);
    if (!incomingCall) return;

    const { callId } = incomingCall;

    try {
      await update(ref(db, `calls/${callId}`), {
        status: "rejected",
        rejectedAt: Date.now(),
      });
    } catch (err) {
      console.error("❌ [RejectCall] Error Firebase:", err);
    }

    setIncomingCall(null);
    setTimeout(() => set(ref(db, `calls/${callId}`), null), 2000);
  };

  // ─── Colgar ───────────────────────────────────────────────────────────────

  const endCall = async () => {
    const callId = activeCall?.callId || currentCallIdRef.current;
    console.log(
      "🏁 [EndCall] Colgando. activeCall:",
      activeCall,
      "| callId desde ref:",
      currentCallIdRef.current,
    );

    if (!callId) {
      console.warn("⚠️ [EndCall] No hay callId, solo limpiando estado local");
      await leaveChannel();
      _cleanupLocalState();
      if (onCallEnd) onCallEnd();
      return;
    }

    isEndingCallRef.current = true;

    try {
      await update(ref(db, `calls/${callId}`), {
        status: "ended",
        endTime: Date.now(),
      });
      console.log("✅ [EndCall] 'ended' escrito en Firebase");
    } catch (err) {
      console.error("❌ [EndCall] Error al escribir 'ended' en Firebase:", err);
      // Aunque falle Firebase, limpiamos local igual
    }

    setTimeout(() => {
      set(ref(db, `calls/${callId}`), null).catch(() => {});
    }, 2000);

    await leaveChannel();
    _cleanupLocalState();
    if (onCallEnd) onCallEnd();
  };

  // ─── Toggle micrófono ─────────────────────────────────────────────────────

  const toggleAudio = async () => {
    const track = localAudioTrackRef.current;
    if (!track) {
      console.warn("⚠️ [Audio] No hay track activo");
      return;
    }
    const next = !isAudioEnabled;
    await track.setEnabled(next);
    setIsAudioEnabled(next);
    console.log("🎤 [Audio]", next ? "activado" : "silenciado");
  };

  // ─── Cleanup al desmontar ─────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      console.log("🧹 [Unmount] Limpiando useAgoraCall");
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (statusUnsubRef.current) statusUnsubRef.current();
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
