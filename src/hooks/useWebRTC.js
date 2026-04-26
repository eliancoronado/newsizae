// hooks/useWebRTC.js
import { useEffect, useRef, useState } from "react";
import { getDatabase, ref, set, onValue, push, update } from "firebase/database";

export const useWebRTC = (userId, otroUserId, onCallEnd) => {
  const [llamando, setLlamando] = useState(false);
  const [enLlamada, setEnLlamada] = useState(false);
  const [llamadaEntrante, setLlamadaEntrante] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [remoteStreamVideo, setRemoteStreamVideo] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const peerConnection = useRef(null);
  const callDocRef = useRef(null);
  const callIdRef = useRef(null);
  const db = getDatabase();

  const configuration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
    iceCandidatePoolSize: 10,
  };

  // Obtener medios (cámara y micrófono)
  const obtenerMedios = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      console.log("🎥 Medios obtenidos:", stream.getTracks().length);
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error("Error al acceder a cámara/micrófono:", error);
      throw error;
    }
  };

  const limpiarEstado = () => {
    console.log("🧹 Limpiando estado de llamada...");
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setRemoteStreamVideo(null);
    setEnLlamada(false);
    setLlamando(false);
    setLlamadaEntrante(null);
    callDocRef.current = null;
    callIdRef.current = null;
  };

  // Escuchar llamadas entrantes
  useEffect(() => {
    if (!userId) return;
    
    const llamadasRef = ref(db, "llamadas");
    
    const unsubscribe = onValue(llamadasRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        if (llamadaEntrante) setLlamadaEntrante(null);
        return;
      }
      
      // Buscar llamada donde soy destinatario y no está finalizada
      for (const [callId, callData] of Object.entries(data)) {
        if (callData.destinatario === userId && callData.estado === "llamando") {
          setLlamadaEntrante({
            callId: callId,
            creador: callData.creador,
            creadorNombre: callData.creadorNombre,
            oferta: callData.oferta,
          });
          callIdRef.current = callId;
          break;
        }
      }
    });
    
    return () => unsubscribe();
  }, [userId]);

  // INICIAR LLAMADA (como creador)
  const iniciarLlamada = async (nombreCreador = "Usuario") => {
    if (!otroUserId) {
      console.error("No hay destinatario");
      return;
    }

    try {
      setLlamando(true);
      console.log("📞 Iniciando llamada a:", otroUserId);
      
      // 1. Obtener medios
      const stream = await obtenerMedios();
      
      // 2. Crear peer connection
      peerConnection.current = new RTCPeerConnection(configuration);
      
      // 3. Agregar tracks locales
      stream.getTracks().forEach(track => {
        peerConnection.current.addTrack(track, stream);
      });
      
      // 4. Manejar tracks remotos
      peerConnection.current.ontrack = (event) => {
        console.log("📡 Track remoto recibido:", event.track.kind);
        const remote = new MediaStream();
        event.streams[0].getTracks().forEach(track => {
          remote.addTrack(track);
        });
        setRemoteStream(remote);
        setRemoteStreamVideo(remote);
      };
      
      // 5. Manejar ICE candidates
      peerConnection.current.onicecandidate = async (event) => {
        if (event.candidate && callDocRef.current) {
          const candidateRef = ref(db, `candidatos/${callDocRef.current.key}/creador`);
          await push(candidateRef, event.candidate.toJSON());
        }
      };
      
      // 6. Crear oferta
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      
      // 7. Guardar en Firebase (estructura similar a la guía)
      const callDoc = push(ref(db, "llamadas"));
      callDocRef.current = callDoc;
      callIdRef.current = callDoc.key;
      
      await set(callDoc, {
        estado: "llamando",
        creador: userId,
        creadorNombre: nombreCreador,
        destinatario: otroUserId,
        creado_en: Date.now(),
        oferta: {
          sdp: offer.sdp,
          type: offer.type,
        },
      });
      
      // 8. Escuchar respuesta
      const unsubscribeRespuesta = onValue(ref(db, `llamadas/${callDoc.key}`), async (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        
        // Si hay respuesta y no tenemos remote description
        if (data.respuesta && peerConnection.current && !peerConnection.current.currentRemoteDescription) {
          console.log("✅ Respuesta recibida!");
          const answer = new RTCSessionDescription(data.respuesta);
          await peerConnection.current.setRemoteDescription(answer);
          setLlamando(false);
          setEnLlamada(true);
          unsubscribeRespuesta();
        }
        
        if (data.estado === "finalizada") {
          limpiarEstado();
          if (onCallEnd) onCallEnd();
          unsubscribeRespuesta();
        }
      });
      
      // 9. Escuchar ICE candidates del destinatario
      const unsubscribeCandidatos = onValue(ref(db, `candidatos/${callDoc.key}/destinatario`), (snapshot) => {
        const candidatos = snapshot.val();
        if (candidatos && peerConnection.current) {
          Object.values(candidatos).forEach(candidato => {
            peerConnection.current.addIceCandidate(new RTCIceCandidate(candidato));
          });
        }
      });
      
      // Guardar referencias para limpiar
      const cleanup = () => {
        unsubscribeRespuesta();
        unsubscribeCandidatos();
      };
      
      // Timeout de 30 segundos
      setTimeout(() => {
        if (llamando && !enLlamada) {
          console.log("⏰ Timeout - No contestaron");
          colgarLlamada();
          cleanup();
        }
      }, 30000);
      
    } catch (error) {
      console.error("Error al iniciar llamada:", error);
      setLlamando(false);
    }
  };
  
  // ACEPTAR LLAMADA (como receptor)
  const aceptarLlamada = async () => {
    if (!llamadaEntrante) return;
    
    try {
      console.log("✅ Aceptando llamada de:", llamadaEntrante.creador);
      
      // 1. Obtener medios
      const stream = await obtenerMedios();
      
      // 2. Crear peer connection
      peerConnection.current = new RTCPeerConnection(configuration);
      
      // 3. Agregar tracks locales
      stream.getTracks().forEach(track => {
        peerConnection.current.addTrack(track, stream);
      });
      
      // 4. Manejar tracks remotos
      peerConnection.current.ontrack = (event) => {
        console.log("📡 Track remoto recibido:", event.track.kind);
        const remote = new MediaStream();
        event.streams[0].getTracks().forEach(track => {
          remote.addTrack(track);
        });
        setRemoteStream(remote);
        setRemoteStreamVideo(remote);
      };
      
      // 5. Manejar ICE candidates
      peerConnection.current.onicecandidate = async (event) => {
        if (event.candidate) {
          const candidateRef = ref(db, `candidatos/${llamadaEntrante.callId}/destinatario`);
          await push(candidateRef, event.candidate.toJSON());
        }
      };
      
      // 6. Set remote description con la oferta
      const offer = new RTCSessionDescription(llamadaEntrante.oferta);
      await peerConnection.current.setRemoteDescription(offer);
      
      // 7. Crear respuesta
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      
      // 8. Guardar respuesta en Firebase
      await update(ref(db, `llamadas/${llamadaEntrante.callId}`), {
        respuesta: {
          sdp: answer.sdp,
          type: answer.type,
        },
        estado: "en_curso",
      });
      
      // 9. Escuchar ICE candidates del creador
      const unsubscribeCandidatos = onValue(ref(db, `candidatos/${llamadaEntrante.callId}/creador`), (snapshot) => {
        const candidatos = snapshot.val();
        if (candidatos && peerConnection.current) {
          Object.values(candidatos).forEach(candidato => {
            peerConnection.current.addIceCandidate(new RTCIceCandidate(candidato));
          });
        }
      });
      
      setLlamadaEntrante(null);
      setEnLlamada(true);
      setLlamando(false);
      
    } catch (error) {
      console.error("Error al aceptar llamada:", error);
      alert("Error al conectar la llamada");
      colgarLlamada();
    }
  };
  
  // COLGAR LLAMADA
  const colgarLlamada = async () => {
    console.log("📞 Colgando llamada...");
    
    if (callIdRef.current) {
      await update(ref(db, `llamadas/${callIdRef.current}`), {
        estado: "finalizada",
      });
    }
    
    limpiarEstado();
    if (onCallEnd) onCallEnd();
  };
  
  // Alternar video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };
  
  // Alternar audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
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
    remoteStreamVideo,
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio,
  };
};