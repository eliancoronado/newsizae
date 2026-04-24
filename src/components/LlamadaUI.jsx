// components/LlamadaUI.jsx
import React, { useState, useEffect } from "react";
import { useWebRTC } from "../hooks/useWebRTC";

const LlamadaUI = ({
  usuarioActual,
  otroUsuario,
  otroUsuarioNombre,
  onClose, // 👈 Nuevo prop para cerrar el panel
}) => {
  const [mostrarLlamada, setMostrarLlamada] = useState(true); // Cambiar a true por defecto
  const { iniciarLlamada, colgarLlamada, enLlamada, llamando } = useWebRTC(
    usuarioActual,
    otroUsuario,
  );

  // Cerrar el panel cuando la llamada termina
  useEffect(() => {
    if (!enLlamada && !llamando && !mostrarLlamada) {
      // Si no hay llamada activa y el panel está cerrado, llamar a onClose
      const timer = setTimeout(() => {
        onClose();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [enLlamada, llamando, mostrarLlamada]);

  return (
    // Modal overlay para mejor experiencia
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-80">
        <div className="flex flex-col items-center space-y-4">
          <div className="text-center">
            <div className="text-white font-semibold text-lg">
              {enLlamada
                ? "📞 En llamada"
                : llamando
                  ? "🔔 Llamando..."
                  : "Llamada de voz"}
            </div>
            <div className="text-gray-400 text-sm mt-1">
              {enLlamada
                ? `Hablando con ${otroUsuarioNombre}`
                : llamando
                  ? `Llamando a ${otroUsuarioNombre}`
                  : `${otroUsuarioNombre}`}
            </div>
          </div>

          {/* Control de la llamada */}
          {!enLlamada && !llamando ? (
            <div className="flex space-x-3 w-full">
              <button
                onClick={() => {
                  iniciarLlamada();
                  setMostrarLlamada(false);
                }}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full flex-1"
              >
                Llamar
              </button>
              <button
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-full flex-1"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={colgarLlamada} // <-- NUEVO NOMBRE
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full text-sm"
            >
              Colgar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LlamadaUI;
