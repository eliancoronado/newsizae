// components/NotificationToast.jsx
import { useEffect } from "react";
import { FaTimes, FaUsers } from "react-icons/fa";

export default function NotificationToast({ notification, onClose }) {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const isGroup = notification.isGroup || false;
  const senderName = notification.senderName || "Alguien";
  const groupName = notification.groupName || "";
  const message = notification.message || "";
  const senderPhoto = notification.senderPhoto || "https://via.placeholder.com/40";
  const groupPhoto = notification.groupPhoto || "https://via.placeholder.com/40";

  // Determinar título y cuerpo según el tipo
  let title = "";
  let body = "";
  let avatarUrl = senderPhoto;

  if (isGroup) {
    // Para grupos: muestra "Grupo: {nombre del grupo}" como título
    title = `${groupName}`;
    // Cuerpo: "{remitente}: {mensaje}"
    body = `${senderName}: ${message}`;
    avatarUrl = groupPhoto;
  } else {
    // Para chats privados
    title = senderName;
    body = message;
    avatarUrl = senderPhoto;
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-[#242526] rounded-lg shadow-xl p-4 max-w-sm animate-slide-in border-l-4 border-[#25D366]">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-white transition"
      >
        <FaTimes size={14} />
      </button>
      
      <div className="flex items-start gap-3">
        {/* Avatar - muestra foto de grupo o contacto */}
        <div className="relative flex-shrink-0">
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-12 h-12 rounded-full object-cover"
          />
          {isGroup && (
            <div className="absolute -bottom-1 -right-1 bg-[#25D366] rounded-full p-0.5">
              <FaUsers size={10} className="text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-white text-sm truncate">
              {title}
            </h4>
            {isGroup && (
              <span className="text-[10px] text-gray-400 bg-gray-700 px-1.5 py-0.5 rounded-full">
                Grupo
              </span>
            )}
          </div>
          <p className="text-gray-300 text-xs mt-0.5 line-clamp-2">
            {body}
          </p>
          <p className="text-gray-500 text-[10px] mt-1">
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
    </div>
  );
}