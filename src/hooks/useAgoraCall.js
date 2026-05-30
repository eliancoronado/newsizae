// hooks/useAgoraCall.js - VERSIÓN CORREGIDA
import { useState, useEffect, useRef } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import {
  ref,
  set,
  onValue,
  update,
  push,
  onChildAdded,
  query,
  orderByChild,
  equalTo,
  off,
} from "firebase/database";
import { db } from "../firebase";

const APP_ID = "36bb337ed3fd4f8a9d9f32e1ebc67807";

export function useAgoraCall(currentUserId, friendId, friendName, onCallEnd) {
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const rtcClientRef = useRef(null);
  const callTimerRef = useRef(null);
  const currentCallIdRef = useRef(null);

  const initAgoraClient = () => {
    if (rtcClientRef.current) return rtcClientRef.current;
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    rtcClientRef.current = client;
    return client;
  };

  const joinChannel = async (channel) => {
    const client = initAgoraClient();
    if (!client) throw new Error("No Agora client");

    if (client.channelName) {
      await leaveChannel();
    }

    const uid = Math.floor(Math.random() * 2032);
    await client.join(APP_ID, channel, null, uid);

    const track = await AgoraRTC.createMicrophoneAudioTrack();
    await client.publish(track);
    setLocalAudioTrack(track);
    setIsAudioEnabled(true);

    client.on("user-published", async (user, mediaType) => {
      if (mediaType === "audio") {
        await client.subscribe(user, mediaType);
        user.audioTrack.play();
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

    client.removeAllListeners();
  };

  // Escuchar llamadas entrantes (CORREGIDO)
  useEffect(() => {
    if (!currentUserId) return;

    const callsRef = ref(db, "calls");
    const callsQuery = query(
      callsRef,
      orderByChild("calleeId"),
      equalTo(currentUserId),
    );

    const unsubscribe = onValue(callsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Buscar la primera llamada en estado "calling"
        for (const [callId, callData] of Object.entries(data)) {
          if (callData.status === "calling" && !incomingCall) {
            setIncomingCall({ callId, ...callData });
            break;
          }
        }
      }
    });

    return () => {
      off(callsQuery);
    };
  }, [currentUserId]);

  // Iniciar llamada (CORREGIDO)
  const startCall = async () => {
    if (!friendId || !currentUserId) return;

    setIsCalling(true);

    // Usar el roomId como el ID del chat (ordenado alfabéticamente)
    const roomId = [currentUserId, friendId].sort().join("_");
    const callRef = push(ref(db, "calls"));
    const callId = callRef.key;
    currentCallIdRef.current = callId;

    const callData = {
      callId: callId,
      callerId: currentUserId,
      calleeId: friendId,
      callerName: friendName,
      status: "calling",
      roomId: roomId,
      startTime: Date.now(),
      createdAt: Date.now(),
    };

    await set(callRef, callData);

    // Escuchar cambios en esta llamada específica
    const callStatusRef = ref(db, `calls/${callId}/status`);
    const unsubscribe = onValue(callStatusRef, async (snap) => {
      const status = snap.val();

      if (status === "accepted") {
        unsubscribe();
        await joinChannel(roomId);
        setActiveCall({ callId, roomId, startTime: Date.now() });
        setIsCalling(false);

        // Iniciar timer
        if (callTimerRef.current) clearInterval(callTimerRef.current);
        callTimerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      } else if (status === "rejected") {
        unsubscribe();
        setIsCalling(false);
        setActiveCall(null);
        currentCallIdRef.current = null;
        await set(ref(db, `calls/${callId}`), null);
        alert("Llamada rechazada");
      } else if (status === "ended") {
        unsubscribe();
        endCall();
      }
    });
  };

  // Aceptar llamada (CORREGIDO)
  const acceptCall = async () => {
    if (!incomingCall) return;

    const { callId, roomId, callerId } = incomingCall;

    await update(ref(db, `calls/${callId}`), {
      status: "accepted",
      acceptedAt: Date.now(),
    });

    await joinChannel(roomId);
    setActiveCall({ callId, roomId, startTime: Date.now() });
    setIncomingCall(null);

    // Iniciar timer
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
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

    setTimeout(async () => {
      await set(ref(db, `calls/${callId}`), null);
    }, 2000);

    setIncomingCall(null);
  };

  // Colgar llamada (CORREGIDO)
  const endCall = async () => {
    if (activeCall) {
      const { callId } = activeCall;
      await update(ref(db, `calls/${callId}`), {
        status: "ended",
        endTime: Date.now(),
      });

      setTimeout(async () => {
        await set(ref(db, `calls/${callId}`), null);
      }, 2000);
    }

    await leaveChannel();

    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    setActiveCall(null);
    setCallDuration(0);
    setIsCalling(false);
    currentCallIdRef.current = null;

    if (onCallEnd) onCallEnd();
  };

  const toggleAudio = async () => {
    if (localAudioTrack) {
      const newState = !isAudioEnabled;
      await localAudioTrack.setEnabled(newState);
      setIsAudioEnabled(newState);
    }
  };

  useEffect(() => {
    return () => {
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
