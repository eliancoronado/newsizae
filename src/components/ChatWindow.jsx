// components/ChatWindow.jsx
import { useEffect, useState, useRef } from "react";
import { ref, push, onValue, off, update, set, get } from "firebase/database";
import { db } from "../firebase";
import { usePresence } from "../hooks/usePresence";
import { useKeyboardHeight } from "../hooks/useKeyboardHeight";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaPhone } from "react-icons/fa";
import { getAuth } from "firebase/auth";
import { sendPushNotification } from "../utils/notifications";
import LlamadaUI from "./LlamadaUI";
import { useWebRTC } from "../hooks/useWebRTC";
import LlamadaEntrante from "./LlamadaEntrante";

const BOTTOM_BAR_HEIGHT = 0;

export default function ChatWindow({
  currentUser,
  friendId,
  friendName,
  friendPhoto,
  friendStatus,
  onBack,
  isMobile = false,
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const chatId = [currentUser.uid, friendId].sort().join("_");
  const [friendIsTyping, setFriendIsTyping] = useState(false);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [isSending, setIsSending] = useState(false);

  const keyboardHeight = useKeyboardHeight();
  const { status, statusText } = usePresence(friendId);
  const [showCallPanel, setShowCallPanel] = useState(false);

  // 🔥 NUEVO HOOK - BASADO EN LA GUÍA FUNCIONAL
  const {
    iniciarLlamada,
    aceptarLlamada,
    colgarLlamada,
    enLlamada,
    llamando,
    llamadaEntrante,
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio,
  } = useWebRTC(currentUser.uid, friendId, () => {
    setShowCallPanel(false);
  });

  const handleIniciarLlamada = () => {
    const auth = getAuth();
    if (!auth.currentUser) {
      alert("Debes estar autenticado para llamar");
      return;
    }
    if (!currentUser?.uid || !friendId) {
      alert("Error: No se pudo identificar al usuario");
      return;
    }
    console.log("📞 Iniciando llamada desde:", currentUser.uid, "a:", friendId);
    iniciarLlamada(currentUser.name);
    setShowCallPanel(false);
  };

  const handleTyping = () => {
    if (!friendId) return;
    const typingRef = ref(
      db,
      `userChats/${friendId}/${currentUser.uid}/typing`,
    );
    set(typingRef, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      set(typingRef, false);
    }, 2000);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "auto" });
      }
    }, 50);
    return () => clearTimeout(timeout);
  }, [messages, keyboardHeight]);

  useEffect(() => {
    if (!friendId) return;
    const typingRef = ref(
      db,
      `userChats/${currentUser.uid}/${friendId}/typing`,
    );
    const unsubscribe = onValue(typingRef, (snapshot) => {
      setFriendIsTyping(snapshot.val() || false);
    });
    return () => unsubscribe();
  }, [friendId, currentUser.uid]);

  useEffect(() => {
    if (!chatId) return;
    const messagesRef = ref(db, `chats/${chatId}/messages`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesList = Object.entries(data)
          .map(([id, msg]) => ({ id, ...msg }))
          .sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messagesList);

        const unreadMessages = messagesList.filter(
          (msg) => !msg.read && msg.senderId !== currentUser.uid,
        );
        if (unreadMessages.length > 0) {
          unreadMessages.forEach((msg) => {
            const messageRef = ref(
              db,
              `chats/${chatId}/messages/${msg.id}/read`,
            );
            set(messageRef, true);
          });
          const userChatRef = ref(
            db,
            `userChats/${currentUser.uid}/${friendId}`,
          );
          update(userChatRef, { unreadCount: 0 });
        }
      } else {
        setMessages([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [chatId, currentUser.uid, friendId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const messageText = newMessage.trim();
    if (!messageText) return;

    setIsSending(true);
    const messageToSend = messageText;

    const message = {
      text: messageToSend,
      senderId: currentUser.uid,
      senderName: currentUser.name,
      senderPhoto: currentUser.picture,
      timestamp: Date.now(),
      read: false,
    };

    try {
      setNewMessage("");
      const messagesRef = ref(db, `chats/${chatId}/messages`);
      await push(messagesRef, message);

      await update(ref(db, `chats/${chatId}`), {
        lastMessage: {
          text: messageToSend,
          timestamp: Date.now(),
          senderId: currentUser.uid,
        },
      });

      const friendChatRef = ref(db, `userChats/${friendId}/${currentUser.uid}`);
      const snapshot = await get(friendChatRef);
      const currentUnread = snapshot.val()?.unreadCount || 0;
      const newUnread = currentUnread + 1;

      await update(ref(db, `userChats/${friendId}/${currentUser.uid}`), {
        lastMessage: messageToSend,
        lastMessageTime: Date.now(),
        userName: currentUser.name,
        userPhoto: currentUser.picture,
        chatId: chatId,
        unreadCount: newUnread,
      });

      await update(ref(db, `userChats/${currentUser.uid}/${friendId}`), {
        lastMessage: messageToSend,
        lastMessageTime: Date.now(),
        userName: friendName,
        userPhoto: friendPhoto,
        chatId: chatId,
        unreadCount: 0,
      });

      const typingRef = ref(
        db,
        `userChats/${friendId}/${currentUser.uid}/typing`,
      );
      await set(typingRef, false);
      await sendPushNotification(
        friendId,
        currentUser.name,
        messageToSend,
        currentUser.picture,
      );

      inputRef.current?.focus();
    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(messageToSend);
      alert("Error al enviar mensaje. Intenta de nuevo.");
    } finally {
      setIsSending(false);
    }
  };

  if (!friendId) {
    return (
      <div className="flex items-center justify-center h-full bg-[#18191A]">
        <div className="text-center px-4">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-[#B0B3B8] text-lg">
            Selecciona un chat para empezar
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Elige una conversación de la lista
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#18191A]">
        <div className="text-gray-400">Cargando mensajes...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#18191A] pb-[70px]">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 p-3 border-b border-[#3E4042] bg-[#242526]">
        {isMobile && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-[#3A3B3C] rounded-full transition-colors"
          >
            <FaArrowLeft className="text-[#E4E6EB] text-xl" />
          </button>
        )}
        <Link
          to={`/profile/${friendId}`}
          className="flex items-center gap-3 flex-1"
        >
          <div className="relative">
            <img
              src={friendPhoto || "https://via.placeholder.com/40"}
              alt={friendName}
              className="w-10 h-10 rounded-full object-cover"
            />
            {status === "online" && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#242526] animate-pulse"></span>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-[#E4E6EB]">{friendName}</h3>
            <p
              className={`text-xs ${friendIsTyping ? "text-[#2e9b4f] animate-pulse" : status === "online" ? "text-green-500" : "text-gray-400"}`}
            >
              {friendIsTyping
                ? "✍️ Escribiendo..."
                : status === "online"
                  ? "En línea"
                  : statusText}
            </p>
          </div>
        </Link>

        {(enLlamada || llamando) && (
          <div className="absolute top-0 right-0 mt-1 mr-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={handleIniciarLlamada}
            className="p-2 hover:bg-[#3A3B3C] rounded-full transition-colors"
            disabled={enLlamada}
          >
            <FaPhone
              className={`text-lg ${enLlamada ? "text-green-500" : "text-[#2e9b4f]"}`}
            />
          </button>
        </div>
      </div>

      {/* Mensajes */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide"
        style={{
          maxHeight: `calc(100vh - ${isMobile ? 140 + keyboardHeight : 140}px)`,
        }}
      >
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No hay mensajes aún</p>
            <p className="text-sm text-gray-500 mt-2">
              Envía un mensaje para empezar la conversación
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderId === currentUser.uid ? "justify-end" : "justify-start"} animate-fade-in`}
            >
              {msg.senderId !== currentUser.uid && (
                <img
                  src={msg.senderPhoto || "https://via.placeholder.com/32"}
                  alt={msg.senderName}
                  className="w-8 h-8 rounded-full object-cover mr-2 self-end"
                />
              )}
              <div
                className={`max-w-[70%] ${msg.senderId === currentUser.uid ? "order-2" : "order-1"}`}
              >
                <div
                  className={`rounded-2xl px-4 py-2 ${msg.senderId === currentUser.uid ? "bg-[#2e9b4f] text-white" : "bg-[#3A3B3C] text-[#E4E6EB]"}`}
                >
                  <p className="break-words text-sm">{msg.text}</p>
                </div>
                <div
                  className={`text-xs text-gray-500 mt-1 flex items-center gap-1 ${msg.senderId === currentUser.uid ? "justify-end" : "justify-start"}`}
                >
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {msg.senderId === currentUser.uid && msg.read && (
                    <span className="text-[#2e9b4f]">✓✓</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="flex-shrink-0 p-3 border-t border-[#3E4042] bg-[#242526]"
        style={{
          marginBottom: isMobile ? keyboardHeight : 0,
          transition: "margin-bottom 0.3s ease-out",
        }}
      >
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-[#3A3B3C] text-[#E4E6EB] px-4 py-2 rounded-full outline-none focus:ring-2 focus:ring-[#2e9b4f] transition text-sm"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-[#2e9b4f] hover:bg-[#268e46] text-white px-5 py-2 rounded-full font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Enviar
          </button>
        </form>
      </div>

      {/* Modales de llamada */}
      <LlamadaEntrante
        llamadaEntrante={llamadaEntrante}
        onAceptar={aceptarLlamada}
        onRechazar={colgarLlamada}
        nombreCreador={llamadaEntrante?.creadorNombre || ""}
      />

      {showCallPanel && !enLlamada && !llamando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-80">
            <div className="text-center mb-4">
              <h3 className="text-white text-xl">Llamar a {friendName}</h3>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleIniciarLlamada}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full flex-1"
              >
                Llamar
              </button>
              <button
                onClick={() => setShowCallPanel(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-full flex-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UI de llamada en curso */}
      {(llamando || enLlamada) && (
        <LlamadaUI
          enLlamada={enLlamada}
          llamando={llamando}
          colgarLlamada={colgarLlamada}
          otroUsuarioNombre={friendName}
          localStream={localStream}
          remoteStream={remoteStream}
          isVideoEnabled={isVideoEnabled}
          isAudioEnabled={isAudioEnabled}
          toggleVideo={toggleVideo}
          toggleAudio={toggleAudio}
          onClose={() => {}}
        />
      )}
    </div>
  );
}
