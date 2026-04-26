// components/LlamadaEntrante.jsx
import React from "react";
import { FaPhone, FaPhoneSlash } from "react-icons/fa";

const LlamadaEntrante = ({
  llamadaEntrante,
  onAceptar,
  onRechazar,
  nombreCreador,
}) => {
  if (!llamadaEntrante) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-2xl p-8 w-80 text-center">
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <FaPhone className="text-white text-3xl" />
        </div>

        <h3 className="text-white text-2xl font-bold mb-2">Llamada entrante</h3>
        <p className="text-gray-300 text-lg mb-1">{nombreCreador}</p>
        <p className="text-gray-400 text-sm mb-6">Llamada de video...</p>

        <div className="flex justify-center gap-6">
          <button
            onClick={onAceptar}
            className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-all transform hover:scale-105"
          >
            <FaPhone className="text-white text-2xl" />
          </button>

          <button
            onClick={onRechazar}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all transform hover:scale-105"
          >
            <FaPhoneSlash className="text-white text-2xl" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LlamadaEntrante;
