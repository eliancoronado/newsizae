// hooks/useWebRTC.js
import { useEffect, useRef, useState } from "react";
import {
  getDatabase,
  ref,
  set,
  onValue,
  push,
  update,
  get,
} from "firebase/database";

export const useWebRTC = (userId, otroUserId, onCallEnd) => {
  const [llamando, setLlamando] = useState(false);
  const [enLlamada, setEnLlamada] = useState(false);
  const [llamadaEntrante, setLlamadaEntrante] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // 🔥 USAR UN SOLO peerConnection (como en la guía)
  const peerConnection = useRef(null);
  const callDocRef = useRef(null);
  const currentCallId = useRef(null);
  const db = getDatabase();
  const addedCandidates = useRef(new Set());

  const configuration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

  // 🔥 Obtener medios (como en la guía)
  const obtenerMedios = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error("Error al acceder a cámara/micrófono:", error);
      throw error;
    }
  };

  // 🔥 Limpiar llamada (como en la guía)
  const limpiarLlamada = () => {
    console.log("🧹 Limpiando llamada...");

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // 🔥 No detener los streams aquí, dejar que React los limpie naturalmente
    // Solo limpiar referencias
    setLocalStream(null);
    setRemoteStream(null);
    setEnLlamada(false);
    setLlamando(false);
    setLlamadaEntrante(null);
    callDocRef.current = null;
    currentCallId.current = null;
  };

  // 🔥 Escuchar llamadas entrantes (como en la guía)
  useEffect(() => {
    if (!userId) return;

    const llamadasRef = ref(db, "llamadas");

    const unsubscribe = onValue(llamadasRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      // Buscar llamada donde soy destinatario y está "llamando"
      for (const [callId, callData] of Object.entries(data)) {
        if (
          callData.destinatario === userId &&
          callData.estado === "llamando"
        ) {
          setLlamadaEntrante({
            callId: callId,
            creador: callData.creador,
            creadorNombre: callData.creadorNombre,
            oferta: callData.oferta,
          });
          currentCallId.current = callId;
          break;
        }
      }
    });

    return () => unsubscribe();
  }, [userId]);

  // 🔥 INICIAR LLAMADA (COMO CREADOR) - BASADO EN LA GUÍA
  const iniciarLlamada = async (nombreCreador = "Usuario") => {
    if (!otroUserId) {
      console.error("No hay destinatario");
      return;
    }

    try {
      addedCandidates.current = new Set(); // ✅ AQUÍ
      setLlamando(true);
      console.log("📞 Iniciando llamada a:", otroUserId);

      // 1. Obtener medios
      const stream = await obtenerMedios();

      // 2. Crear peer connection
      peerConnection.current = new RTCPeerConnection(configuration);

      peerConnection.current.onconnectionstatechange = () => {
        console.log(
          "🌐 Estado conexión:",
          peerConnection.current.connectionState,
        );

        if (peerConnection.current.connectionState === "connected") {
          console.log("✅ CONEXIÓN REAL ESTABLECIDA");

          // 👉 AQUÍ ya puedes confiar en audio/video
        }
      };

      // 3. Agregar tracks locales
      stream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, stream);
      });

      // 4. Manejar tracks remotos
      peerConnection.current.ontrack = (event) => {
        console.log("📡 STREAM remoto recibido");

        const [stream] = event.streams;

        if (stream) {
          setRemoteStream(stream); // 🔥 SIEMPRE asignar
        }
      };

      peerConnection.current.oniceconnectionstatechange = () => {
        console.log(
          "🧊 ICE estado:",
          peerConnection.current.iceConnectionState,
        );
      };

      // 5. Manejar ICE candidates
      peerConnection.current.onicecandidate = async (event) => {
        if (event.candidate && callDocRef.current) {
          const candidateRef = ref(
            db,
            `candidatos/${callDocRef.current.key}/creador`,
          );
          await push(candidateRef, event.candidate.toJSON());
        }
      };

      // 6. Crear oferta
      const offerDescription = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offerDescription);

      // 7. Guardar en Firebase
      const callDoc = push(ref(db, "llamadas"));
      callDocRef.current = callDoc;
      currentCallId.current = callDoc.key;

      await set(callDoc, {
        estado: "llamando",
        creador: userId,
        creadorNombre: nombreCreador,
        destinatario: otroUserId,
        creado_en: Date.now(),
        oferta: {
          sdp: offerDescription.sdp,
          type: offerDescription.type,
        },
      });

      // hooks/useWebRTC.js - Reemplaza la sección de "Escuchar RESPUESTA"

      // 8. Escuchar RESPUESTA (como en la guía)
      const unsubscribeRespuesta = onValue(
        ref(db, `llamadas/${callDoc.key}`),
        async (snapshot) => {
          const data = snapshot.val();
          if (!data) return;

          // Si hay respuesta y no tenemos remote description
          if (
            data.respuesta &&
            peerConnection.current.signalingState !== "stable"
          ) {
            console.log("✅ Respuesta recibida del destinatario!");
            const answerDescription = new RTCSessionDescription(data.respuesta);
            await peerConnection.current.setRemoteDescription(
              answerDescription,
            );
            console.log("🎉 Conexión establecida!");
            setLlamando(false);
            setEnLlamada(true);
            // 🔥 NO cerrar el listener aquí
          }

          // 🔥 SOLO finalizar si el estado es finalizada (no limpiar antes)
          if (data.estado === "finalizada" && enLlamada) {
            console.log("📴 Llamada finalizada por el otro usuario");
            limpiarLlamada();
            if (onCallEnd) onCallEnd();
            unsubscribeRespuesta();
            unsubscribeCandidatos();
          }
        },
      );

      // 9. Escuchar ICE candidates del DESTINATARIO (como en la guía)
      const unsubscribeCandidatos = onValue(
        ref(db, `candidatos/${callDoc.key}/destinatario`),
        (snapshot) => {
          const candidatos = snapshot.val();
          if (candidatos && peerConnection.current) {
            Object.entries(candidatos).forEach(([key, candidato]) => {
              if (!addedCandidates.current.has(key)) {
                addedCandidates.current.add(key);
                peerConnection.current.addIceCandidate(
                  new RTCIceCandidate(candidato),
                );
              }
            });
          }
        },
      );

      // 10. Timeout (como en la guía)
      setTimeout(() => {
        if (llamando && !enLlamada) {
          console.log("⏰ Timeout - No contestaron");
          colgarLlamada();
          unsubscribeRespuesta();
          unsubscribeCandidatos();
        }
      }, 30000);
    } catch (error) {
      console.error("Error al iniciar llamada:", error);
      setLlamando(false);
    }
  };

  // 🔥 ACEPTAR LLAMADA (COMO RECEPTOR) - BASADO EN LA GUÍA
  const aceptarLlamada = async () => {
    if (!llamadaEntrante) return;

    try {
      addedCandidates.current = new Set(); // ✅ AQUÍ - Limpiar candidatos agregados para esta llamada
      console.log("✅ Aceptando llamada de:", llamadaEntrante.creador);

      // 1. Obtener medios
      const stream = await obtenerMedios();

      // 2. Crear peer connection
      peerConnection.current = new RTCPeerConnection(configuration);

      peerConnection.current.onconnectionstatechange = () => {
        console.log(
          "🌐 Estado conexión:",
          peerConnection.current.connectionState,
        );

        if (peerConnection.current.connectionState === "connected") {
          console.log("✅ CONEXIÓN REAL ESTABLECIDA");
        }
      };

      // 3. Agregar tracks locales
      stream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, stream);
      });

      // 4. Manejar tracks remotos
      peerConnection.current.ontrack = (event) => {
        console.log("📡 STREAM remoto recibido");

        const [stream] = event.streams;

        if (stream) {
          setRemoteStream(stream); // 🔥 SIEMPRE asignar
        }
      };

      peerConnection.current.oniceconnectionstatechange = () => {
        console.log(
          "🧊 ICE estado:",
          peerConnection.current.iceConnectionState,
        );
      };

      // 5. Manejar ICE candidates
      peerConnection.current.onicecandidate = async (event) => {
        if (event.candidate) {
          const candidateRef = ref(
            db,
            `candidatos/${llamadaEntrante.callId}/destinatario`,
          );
          await push(candidateRef, event.candidate.toJSON());
        }
      };

      // 6. Set remote description con la oferta (como en la guía)
      const offerDescription = new RTCSessionDescription(
        llamadaEntrante.oferta,
      );
      await peerConnection.current.setRemoteDescription(offerDescription);

      // 7. Crear respuesta (como en la guía)
      const answerDescription = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answerDescription);

      // 8. Guardar respuesta en Firebase (como en la guía)
      await update(ref(db, `llamadas/${llamadaEntrante.callId}`), {
        respuesta: {
          sdp: answerDescription.sdp,
          type: answerDescription.type,
        },
        estado: "en_curso",
      });

      // 9. Escuchar ICE candidates del CREADOR (como en la guía)
      const unsubscribeCandidatos = onValue(
        ref(db, `candidatos/${llamadaEntrante.callId}/creador`),
        (snapshot) => {
          const candidatos = snapshot.val();
          if (candidatos && peerConnection.current) {
            Object.entries(candidatos).forEach(([key, candidato]) => {
              if (!addedCandidates.current.has(key)) {
                addedCandidates.current.add(key);
                peerConnection.current.addIceCandidate(
                  new RTCIceCandidate(candidato),
                );
              }
            });
          }
        },
      );

      setLlamadaEntrante(null);
      setEnLlamada(true);
      setLlamando(false);
    } catch (error) {
      console.error("Error al aceptar llamada:", error);
      alert("Error al conectar la llamada");
      colgarLlamada();
    }
  };

  // 🔥 COLGAR LLAMADA - ACTUALIZA ESTADO EN FIREBASE
  const colgarLlamada = async () => {
    console.log("📞 Colgando llamada...");

    if (currentCallId.current) {
      await update(ref(db, `llamadas/${currentCallId.current}`), {
        estado: "finalizada",
      });
    }

    limpiarLlamada();
    if (onCallEnd) onCallEnd();
  };

  // 🔥 Alternar video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  };

  // 🔥 Alternar audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  };

  return {
    iniciarLlamada,
    aceptarLlamada,
    colgarLlamada,
    enLlamada,
    llamando,
    llamadaEntrante,
    localStream,
    remoteStream,
    toggleVideo,
    toggleAudio,
  };
};
