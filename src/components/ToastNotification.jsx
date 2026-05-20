import { useEffect } from "react";

// Componente ToastNotification para web
const ToastNotification = ({ notification, onPress, onHide }) => {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      if (onHide) onHide();
    }, 4000);
    return () => clearTimeout(timer);
  }, [notification, onHide]);

  if (!notification) return null;

  const truncate = (text, max = 60) => {
    if (!text) return "";
    return text.length > max ? text.slice(0, max) + "..." : text;
  };

  return (
    <div className="fixed top-5 left-4 right-4 z-[9999] animate-slideDown">
      <div
        onClick={() => {
          onHide();
          if (onPress) onPress(notification);
        }}
        className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] rounded-xl shadow-2xl border border-white/10 cursor-pointer overflow-hidden"
      >
        <div className="flex items-center p-3 gap-3">
          <div className="relative">
            <img
              src={notification.senderPhoto}
              alt="avatar"
              className="w-12 h-12 rounded-full border-2 border-[#0095f6] object-cover"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1a2e]"></div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white text-sm">{notification.senderName}</span>
              <span className="text-gray-400 text-[10px]">{notification.time}</span>
            </div>
            <p className="text-[#0095f6] text-xs mt-0.5">
              {notification.messageType === "image" ? "📷 Envió una imagen" : "💬 Nuevo mensaje"}
            </p>
            <p className="text-gray-300 text-xs line-clamp-2">
              {notification.messageType === "image" ? "📷 Imagen" : truncate(notification.message)}
            </p>
          </div>
          <div className="bg-[rgba(0,149,246,0.15)] rounded-full p-2">
            <svg className="w-6 h-6 text-[#0095f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToastNotification;