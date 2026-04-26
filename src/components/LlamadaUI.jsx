// components/LlamadaUI.jsx
import React, { useRef } from "react";
import {
  FaPhone,
  FaPhoneSlash,
  FaVideo,
  FaVideoSlash,
  FaMicrophone,
  FaMicrophoneSlash,
  FaTimes,
} from "react-icons/fa";

const LlamadaUI = ({
  enLlamada,
  llamando,
  colgarLlamada,
  otroUsuarioNombre,
  localStream,
  remoteStream,
  isVideoEnabled,
  isAudioEnabled,
  toggleVideo,
  toggleAudio,
  onClose,
}) => {
  const videoRef = useRef(null);
  const localVideoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && remoteStream) {
      console.log("🎬 Asignando remoteStream al video element");
      videoRef.current.srcObject = remoteStream;
      videoRef.current
        .play()
        .catch((e) => console.log("Error playing remote video:", e));
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      console.log("🎬 Asignando localStream al video element");
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current
        .play()
        .catch((e) => console.log("Error playing local video:", e));
    }
  }, [localStream]);

  if (!llamando && !enLlamada) return null;

  return (
    <div className="fixed inset-0 pb-[70px] bg-black z-50 flex flex-col">
      {/* Video remoto (fullscreen) */}
      <div className="flex-1 relative bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Video local (pip en esquina) */}
        <div className="absolute bottom-4 right-4 w-32 h-48 rounded-xl overflow-hidden shadow-lg border-2 border-white/50">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>

        {/* Información de llamada */}
        <div className="absolute top-4 left-0 right-0 text-center">
          <p className="text-white text-xl font-semibold">
            {otroUsuarioNombre}
          </p>
          <p className="text-gray-300 text-sm">
            {llamando ? "Llamando..." : "En llamada"}
          </p>
        </div>

        {/* Controles */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6">
          {/* Micrófono */}
          <button
            onClick={toggleAudio}
            className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-all"
          >
            {isAudioEnabled ? (
              <FaMicrophone className="text-white text-2xl" />
            ) : (
              <FaMicrophoneSlash className="text-red-500 text-2xl" />
            )}
          </button>

          {/* Video */}
          <button
            onClick={toggleVideo}
            className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-all"
          >
            {isVideoEnabled ? (
              <FaVideo className="text-white text-2xl" />
            ) : (
              <FaVideoSlash className="text-red-500 text-2xl" />
            )}
          </button>

          {/* Colgar */}
          <button
            onClick={colgarLlamada}
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all"
          >
            <FaPhoneSlash className="text-white text-2xl" />
          </button>
        </div>

        {/* Botón cerrar (para modo prueba) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-all"
        >
          <FaTimes className="text-white text-xl" />
        </button>
      </div>
    </div>
  );
};

export default LlamadaUI;
