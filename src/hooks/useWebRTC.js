import { useEffect, useRef, useState } from "react";
import {
  getDatabase,
  ref,
  set,
  onValue,
  push,
  update,
} from "firebase/database";

export const useWebRTC = (userId, otroUserId, onCallEnd) => {
  const [llamando, setLlamando] = useState(false);
  const [enLlamada, setEnLlamada] = useState(false);
  const [llamadaEntrante, setLlamadaEntrante] = useState(null);
  const [audioStream, setAudioStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const peerConnection = useRef(null);
  const llamadaRef = useRef(null);
  const db = getDatabase();
  const addedCandidatesCreador = useRef(new Set());
  const addedCandidatesDestinatario = useRef(new Set());

  const configuration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
  };

  const obtenerMicrofono = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      return stream;
    } catch (error) {
      console.error("Error al acceder al micrófono:", error);
      throw error;
    }
  };

  const limpiarEstado = () => {
    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
    }

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    setEnLlamada(false);
    setLlamando(false);
    setAudioStream(null);
    setRemoteStream(null);
    llamadaRef.current = null;
    addedCandidatesCreador.current.clear();
    addedCandidatesDestinatario.current.clear();
  };

  // ESCUCHAR LLAMADAS ENTRANTES
  const escucharLlamadasEntrantes = () => {
    if (!userId) return;
    console.log(`👂 Escuchando llamadas para: ${userId}`);

    const llamadasRef = ref(db, "llamadas");

    return onValue(llamadasRef, (snapshot) => {
      const data = snapshot.val();
      console.log("📊 Datos en /llamadas:", data);

      if (!data) {
        if (llamadaEntrante) setLlamadaEntrante(null);
        return;
      }

      let llamadaActiva = null;

      for (const [callId, callData] of Object.entries(data)) {
        if (
          callData.destinatario === userId &&
          callData.estado !== "finalizada" &&
          callData.creador !== userId
        ) {
          llamadaActiva = { callId, ...callData };
          break;
        }
      }

      if (llamadaActiva) {
        setLlamadaEntrante({
          callId: llamadaActiva.callId,
          creador: llamadaActiva.creador,
          creadorNombre: llamadaActiva.creadorNombre,
          oferta: llamadaActiva.oferta,
          estado: llamadaActiva.estado,
        });
      } else if (llamadaEntrante) {
        setLlamadaEntrante(null);
      }
    });
  };
  // INICIAR LLAMADA
  const iniciarLlamada = async (nombreCreador = "Usuario") => {
    if (!otroUserId) {
      console.error("No hay destinatario");
      return;
    }

    if (enLlamada || llamando) {
      console.log("⚠️ Ya hay una llamada en curso");
      alert("Ya hay una llamada en curso");
      return;
    }

    try {
      setLlamando(true);
      console.log("📞 Iniciando llamada a:", otroUserId);

      const stream = await obtenerMicrofono();
      peerConnection.current = new RTCPeerConnection(configuration);

      stream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, stream);
      });

      peerConnection.current.ontrack = (event) => {
        console.log("📡 Stream remoto recibido en llamador");
        setRemoteStream(event.streams[0]);
        // 🔥 ESTA LÍNEA CAMBIA TODO
        setLlamando(false);
        setEnLlamada(true);
      };

      // 🔥 ENVIAR ICE (creador)
      peerConnection.current.onicecandidate = async (event) => {
        if (event.candidate && llamadaRef.current) {
          const candidatosRef = ref(
            db,
            `candidatos/${llamadaRef.current.key}/creador`,
          );
          await push(candidatosRef, event.candidate);
        }
      };

      peerConnection.current.oniceconnectionstatechange = () => {
        console.log(
          "ICE connection state:",
          peerConnection.current?.iceConnectionState,
        );

        if (
          peerConnection.current?.iceConnectionState === "connected" ||
          peerConnection.current?.iceConnectionState === "completed"
        ) {
          console.log("🎉 Conexión ICE establecida!");
          setLlamando(false);
          setEnLlamada(true);
        } else if (peerConnection.current?.iceConnectionState === "failed") {
          colgarLlamada();
        }
      };

      // 🔥 CREAR OFERTA
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      const nuevaLlamadaRef = push(ref(db, "llamadas"));
      llamadaRef.current = nuevaLlamadaRef;

      await set(nuevaLlamadaRef, {
        estado: "llamando",
        creador: userId,
        creadorNombre: nombreCreador,
        destinatario: otroUserId,
        creado_en: Date.now(),
        oferta: offer,
      });

      console.log("✅ Llamada guardada, esperando respuesta...");

      const callId = nuevaLlamadaRef.key;

      // 🔥🔥🔥 ESCUCHAR ICE DEL DESTINATARIO (LO MÁS IMPORTANTE)
      const candidatosDestinatarioRef = ref(
        db,
        `candidatos/${callId}/destinatario`,
      );

      onValue(candidatosDestinatarioRef, (snapshot) => {
        const candidatos = snapshot.val();

        if (candidatos && peerConnection.current) {
          Object.entries(candidatos).forEach(([key, candidato]) => {
            if (!addedCandidatesDestinatario.current.has(key)) {
              addedCandidatesDestinatario.current.add(key);
              peerConnection.current.addIceCandidate(
                new RTCIceCandidate(candidato),
              );
            }
          });
        }
      });

      // 🔥 ESCUCHAR RESPUESTA
      const callRef = ref(db, `llamadas/${callId}`);
      const unsubscribeRespuesta = onValue(callRef, async (snapshot) => {
        const data = snapshot.val();

        if (!data || data.estado === "finalizada") {
          console.log("📴 La llamada fue finalizada");
          colgarLlamada();
          limpiarEstado();
          unsubscribeRespuesta();
          return;
        }

        // 🔥 PROTECCIÓN para no setear varias veces
        if (
          data.respuesta &&
          peerConnection.current &&
          !peerConnection.current.currentRemoteDescription
        ) {
          console.log("✅ Respuesta recibida del destinatario!");

          try {
            await peerConnection.current.setRemoteDescription(
              new RTCSessionDescription(data.respuesta),
            );
          } catch (err) {
            console.error("Error setRemoteDescription:", err);
          }
        }
      });

      // ⏰ TIMEOUT
      setTimeout(() => {
        if (llamando && !enLlamada) {
          console.log("⏰ Timeout - No contestaron");
          colgarLlamada();
        }
      }, 30000);
    } catch (error) {
      console.error("Error al iniciar llamada:", error);
      setLlamando(false);
    }
  };

  // ACEPTAR LLAMADA
  const aceptarLlamada = async () => {
    if (!llamadaEntrante) return;

    try {
      console.log("✅ Aceptando llamada de:", llamadaEntrante.creador);

      const stream = await obtenerMicrofono();
      peerConnection.current = new RTCPeerConnection(configuration);

      stream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, stream);
      });

      peerConnection.current.ontrack = (event) => {
        console.log("📡 Stream remoto recibido en receptor");
        setRemoteStream(event.streams[0]);
        // 🔥 ESTA LÍNEA CAMBIA TODO
        setLlamando(false);
        setEnLlamada(true);
      };

      peerConnection.current.onicecandidate = async (event) => {
        if (event.candidate) {
          const candidatosRef = ref(
            db,
            `candidatos/${llamadaEntrante.callId}/destinatario`,
          );
          await push(candidatosRef, event.candidate);
        }
      };

      peerConnection.current.oniceconnectionstatechange = () => {
        console.log(
          "ICE connection state (receptor):",
          peerConnection.current?.iceConnectionState,
        );
        if (
          peerConnection.current?.iceConnectionState === "connected" ||
          peerConnection.current?.iceConnectionState === "completed"
        ) {
          console.log("🎉 Conexión ICE establecida!");
          setEnLlamada(true);
        } else if (peerConnection.current?.iceConnectionState === "failed") {
          colgarLlamada();
        }
      };

      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(llamadaEntrante.oferta),
      );

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      const llamadaRefFirebase = ref(db, `llamadas/${llamadaEntrante.callId}`);
      await update(llamadaRefFirebase, {
        respuesta: answer,
        estado: "en_curso",
      });

      const candidatosCreadorRef = ref(
        db,
        `candidatos/${llamadaEntrante.callId}/creador`,
      );

      onValue(candidatosCreadorRef, (snapshot) => {
        const candidatos = snapshot.val();
        if (candidatos && peerConnection.current) {
          Object.entries(candidatos).forEach(([key, candidato]) => {
            if (!addedCandidatesCreador.current.has(key)) {
              addedCandidatesCreador.current.add(key);
              peerConnection.current.addIceCandidate(
                new RTCIceCandidate(candidato),
              );
            }
          });
        }
      });

      setLlamadaEntrante(null);
    } catch (error) {
      console.error("Error al aceptar llamada:", error);
      alert("Error al conectar la llamada");
    }
  };

  // COLGAR LLAMADA
  const colgarLlamada = async () => {
    console.log("📞 Colgando llamada...");

    const callId = llamadaEntrante?.callId || llamadaRef.current?.key;

    if (callId) {
      const callRef = ref(db, `llamadas/${callId}`);
      await update(callRef, { estado: "finalizada" });
    }

    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
    }

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    limpiarEstado();
    setEnLlamada(false);
    setLlamando(false);
    setAudioStream(null);
    setRemoteStream(null);
    llamadaRef.current = null;

    if (onCallEnd) onCallEnd();
  };

  useEffect(() => {
    const unsubscribe = escucharLlamadasEntrantes();
    return () => {
      if (unsubscribe) unsubscribe();
      colgarLlamada();
    };
  }, [userId]);

  return {
    iniciarLlamada,
    aceptarLlamada,
    colgarLlamada,
    enLlamada,
    llamando,
    llamadaEntrante,
    remoteStream,
  };
};
