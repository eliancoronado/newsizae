// components/ToastNotification.jsx
import { useEffect } from "react";

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

  const isGroup = notification.isGroup || false;
  const senderName = notification.senderName || "Alguien";
  const groupName = notification.groupName || "";
  const message = notification.message || "";
  const senderPhoto = notification.senderPhoto || "https://via.placeholder.com/40";
  const groupPhoto = notification.groupPhoto || "https://via.placeholder.com/40";

  // Determinar título y avatar según el tipo
  let title = "";
  let avatarUrl = senderPhoto;
  let messageTypeText = "";

  if (isGroup) {
    title = groupName;
    avatarUrl = groupPhoto;
    messageTypeText = `👥 ${senderName} en grupo`;
  } else {
    title = senderName;
    avatarUrl = senderPhoto;
    messageTypeText = notification.messageType === "image" ? "📷 Envió una imagen" : "💬 Nuevo mensaje";
  }

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
              src={avatarUrl}
              alt="avatar"
              className="w-12 h-12 rounded-full border-2 border-[#0095f6] object-cover"
            />
            {!isGroup && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1a2e]"></div>
            )}
            {isGroup && (
              <div className="absolute -bottom-1 -right-1 bg-[#25D366] rounded-full p-0.5">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-1 .05 1.16.84 2 1.87 2 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white text-sm truncate max-w-[150px]">
                {title}
              </span>
              <span className="text-gray-400 text-[10px] ml-2 flex-shrink-0">{notification.time}</span>
            </div>
            <p className="text-[#0095f6] text-xs mt-0.5">
              {messageTypeText}
            </p>
            <p className="text-gray-300 text-xs line-clamp-2">
              {notification.messageType === "image" ? "📷 Imagen" : truncate(isGroup ? `${senderName}: ${message}` : message)}
            </p>
          </div>
          <div className="bg-[rgba(0,149,246,0.15)] rounded-full p-2 flex-shrink-0">
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