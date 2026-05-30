// components/AgoraCallUI.jsx
import React from "react";
import { FaMicrophone, FaMicrophoneSlash, FaPhoneSlash } from "react-icons/fa";

const AgoraCallUI = ({
  otroUsuarioNombre,
  callDuration,
  isAudioEnabled,
  toggleAudio,
  endCall,
}) => {
  const formatDuration = (sec) => {
    const mins = Math.floor(sec / 60);
    const remainSec = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${remainSec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      <div className="bg-gray-900 rounded-2xl p-8 w-80 text-center shadow-xl">
        <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaMicrophone className="text-white text-4xl" />
        </div>
        <h3 className="text-white text-2xl font-bold">{otroUsuarioNombre}</h3>
        <p className="text-gray-400 text-lg mt-1">
          {formatDuration(callDuration)}
        </p>
        <div className="flex justify-center gap-6 mt-8">
          <button
            onClick={toggleAudio}
            className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition"
          >
            {isAudioEnabled ? (
              <FaMicrophone className="text-white text-2xl" />
            ) : (
              <FaMicrophoneSlash className="text-red-500 text-2xl" />
            )}
          </button>
          <button
            onClick={endCall}
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition"
          >
            <FaPhoneSlash className="text-white text-2xl" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgoraCallUI;
