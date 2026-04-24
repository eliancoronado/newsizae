// components/LlamadaEntrante.jsx
import React, { useEffect, useRef } from 'react';
import { FaPhone, FaPhoneSlash } from 'react-icons/fa';

const LlamadaEntrante = ({ 
  llamadaEntrante, 
  onAceptar, 
  onRechazar,
  nombreCreador 
}) => {
  const audioRef = useRef(null);
  // 👈 VALIDACIÓN ADICIONAL: Solo mostrar si realmente hay una llamada válida
  const esLlamadaValida = llamadaEntrante && 
                          llamadaEntrante.callId && 
                          llamadaEntrante.creador &&
                          llamadaEntrante.creador !== "undefined" &&
                          llamadaEntrante.oferta;
  
  if (!esLlamadaValida) return null;
  
  console.log("🎯 Mostrando modal para llamada:", llamadaEntrante);

  
  /* 
  useEffect(() => {
    if (llamadaEntrante && audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.play().catch(e => console.log('Error al reproducir:', e));
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [llamadaEntrante]);
  
  if (!llamadaEntrante) return null;
  */
  
  return (
    <>
      {/* Sonido de llamada 
      <audio ref={audioRef} src="/ringtone.mp3" preload="auto" />
      */}
      {/* Modal de llamada entrante */}
      <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-80 animate-pulse">
          <div className="flex flex-col items-center space-y-4">
            {/* Icono de llamada */}
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
              <FaPhone className="text-white text-3xl" />
            </div>
            
            {/* Texto */}
            <div className="text-center">
              <h3 className="text-white text-xl font-bold">Llamada entrante</h3>
              <p className="text-gray-300 text-lg mt-1">{nombreCreador}</p>
              <p className="text-gray-400 text-sm">Llamada de voz...</p>
            </div>
            
            {/* Botones */}
            <div className="flex gap-6 mt-4">
              <button
                onClick={onAceptar}
                className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full transition-all transform hover:scale-105"
              >
                <FaPhone className="text-2xl" />
              </button>
              
              <button
                onClick={onRechazar}
                className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition-all transform hover:scale-105"
              >
                <FaPhoneSlash className="text-2xl" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LlamadaEntrante;