// components/NotificationToast.jsx
import { useEffect } from "react";
import { FaTimes } from "react-icons/fa";

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

  return (
    <div className="fixed top-4 right-4 z-50 bg-[#242526] rounded-lg shadow-xl p-4 max-w-sm animate-slide-in">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400"
      >
        <FaTimes />
      </button>
      <div className="flex items-start gap-3">
        {notification.image && (
          <img
            src={notification.image}
            alt="Notification"
            className="w-10 h-10 rounded-full object-cover"
          />
        )}

        <div className="flex-1 flex-col">
          <h4 className="font-bold text-white">{notification.title}</h4>
          <p className="text-gray-300 text-sm">{notification.body}</p>
        </div>
      </div>
    </div>
  );
}
