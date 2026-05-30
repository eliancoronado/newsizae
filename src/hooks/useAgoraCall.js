// hooks/useAgoraCall.js
import { useState, useEffect, useRef } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { ref, set, onValue, update, push, get, off } from "firebase/database";
import { db } from "../firebase";

const APP_ID = "36bb337ed3fd4f8a9d9f32e1ebc67807";

export function useAgoraCall(currentUserId, friendId, friendName, onCallEnd) {
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null); // { callId, channel, startTime }
  const [isCalling, setIsCalling] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [remoteAudioTrack, setRemoteAudioTrack] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const rtcClientRef = useRef(null);
  const callTimerRef = useRef(null);

  // Inicializar cliente Agora una sola vez
  const initAgoraClient = () => {
    if (rtcClientRef.current) return rtcClientRef.current;
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    rtcClientRef.current = client;
    return client;
  };

  // Unirse a un canal (audio)
  const joinChannel = async (channel, uid) => {
    const client = initAgoraClient();
    if (!client) throw new Error("No Agora client");

    // Si ya está en un canal, salir primero
    if (client.channelName) {
      await leaveChannel();
    }

    await client.join(
      APP_ID,
      channel,
      null,
      uid || Math.floor(Math.random() * 2032),
    );
    const track = await AgoraRTC.createMicrophoneAudioTrack();
    await client.publish(track);
    setLocalAudioTrack(track);
    setIsAudioEnabled(true);

    client.on("user-published", async (user, mediaType) => {
      if (mediaType === "audio") {
        await client.subscribe(user, mediaType);
        user.audioTrack.play();
        setRemoteAudioTrack(user.audioTrack);
      }
    });
    client.on("user-unpublished", (user) => {
      if (user.audioTrack) {
        user.audioTrack.stop();
        setRemoteAudioTrack(null);
      }
    });
  };

  const leaveChannel = async () => {
    const client = rtcClientRef.current;
    if (!client) return;
    if (localAudioTrack) {
      localAudioTrack.stop();
      localAudioTrack.close();
      await client.unpublish(localAudioTrack);
      setLocalAudioTrack(null);
    }
    if (client.channelName) {
      await client.leave();
    }
    // Eliminar listeners para evitar duplicados
    client.removeAllListeners();
    setRemoteAudioTrack(null);
  };

  // Escuchar llamadas entrantes para el usuario actual
  useEffect(() => {
    if (!currentUserId) return;
    const callsRef = ref(db, "calls");
    const unsubscribe = onValue(callsRef, (snapshot) => {
      const allCalls = snapshot.val() || {};
      // Buscar llamada con callee = currentUserId y estado 'calling'
      for (const [callId, data] of Object.entries(allCalls)) {
        if (data.calleeId === currentUserId && data.status === "calling") {
          setIncomingCall({ callId, ...data });
          break;
        }
      }
    });
    return () => off(callsRef);
  }, [currentUserId]);

  // Iniciar llamada (desde el botón llamar)
  const startCall = async () => {
    if (!friendId || !currentUserId) return;
    setIsCalling(true);
    // Crear un ID único para la llamada
    const callRef = push(ref(db, "calls"));
    const callId = callRef.key;
    const callData = {
      callerId: currentUserId,
      calleeId: friendId,
      callerName: friendName, // Nota: esto es el nombre del amigo (quien recibe verá esto)
      calleeName: "", // se llenará con datos del usuario actual? No necesario
      status: "calling",
      roomId: callId, // usamos callId como channel de Agora
      startTime: Date.now(),
      createdAt: Date.now(),
    };
    await set(callRef, callData);
    // Esperar respuesta (aceptación o rechazo)
    const callStatusRef = ref(db, `calls/${callId}/status`);
    const unsubscribe = onValue(callStatusRef, async (snap) => {
      const status = snap.val();
      if (status === "accepted") {
        unsubscribe();
        await joinChannel(callId);
        setActiveCall({ callId, channel: callId, startTime: Date.now() });
        setIsCalling(false);
        // Iniciar timer
        if (callTimerRef.current) clearInterval(callTimerRef.current);
        callTimerRef.current = setInterval(() => {
          setCallDuration(
            Math.floor((Date.now() - activeCall?.startTime) / 1000),
          );
        }, 1000);
      } else if (status === "rejected") {
        unsubscribe();
        setIsCalling(false);
        // Eliminar nodo de llamada
        await set(ref(db, `calls/${callId}`), null);
        alert("Llamada rechazada");
      } else if (status === "ended") {
        unsubscribe();
        endCall();
      }
    });
    // Cleanup si el componente se desmonta mientras espera
    return () => unsubscribe();
  };

  // Aceptar llamada entrante
  const acceptCall = async () => {
    if (!incomingCall) return;
    const { callId, callerId, roomId } = incomingCall;
    // Actualizar estado a 'accepted'
    await update(ref(db, `calls/${callId}`), {
      status: "accepted",
      acceptedAt: Date.now(),
    });
    // Unirse al canal
    await joinChannel(roomId);
    setActiveCall({ callId, channel: roomId, startTime: Date.now() });
    setIncomingCall(null);
    // Timer
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    callTimerRef.current = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - activeCall?.startTime) / 1000));
    }, 1000);
  };

  // Rechazar llamada
  const rejectCall = async () => {
    if (!incomingCall) return;
    const { callId } = incomingCall;
    await update(ref(db, `calls/${callId}`), {
      status: "rejected",
      rejectedAt: Date.now(),
    });
    // Eliminar nodo después de un tiempo
    setTimeout(() => set(ref(db, `calls/${callId}`), null), 2000);
    setIncomingCall(null);
  };

  // Colgar llamada actual
  const endCall = async () => {
    if (activeCall) {
      const { callId } = activeCall;
      await update(ref(db, `calls/${callId}`), {
        status: "ended",
        endTime: Date.now(),
      });
      // Guardar duración final en algún lugar (opcional)
      // Eliminar nodo después
      setTimeout(() => set(ref(db, `calls/${callId}`), null), 2000);
    }
    await leaveChannel();
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    setActiveCall(null);
    setCallDuration(0);
    setIsCalling(false);
    if (onCallEnd) onCallEnd();
  };

  // toggle micrófono
  const toggleAudio = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  // Limpieza final
  useEffect(() => {
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      leaveChannel();
    };
  }, []);

  return {
    // Estados
    incomingCall,
    activeCall,
    isCalling,
    callDuration,
    isAudioEnabled,
    // Funciones
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
  };
}
