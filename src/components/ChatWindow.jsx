// components/ChatWindow.jsx - Versión CORREGIDA
import { useEffect, useState, useRef } from "react";
import { ref, push, onValue, off, update, set, get } from "firebase/database";
import { db } from "../firebase";
import { usePresence } from "../hooks/usePresence";
import { Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaPhone,
  FaImage,
  FaSmile,
  FaPaperPlane,
  FaPlay,
  FaSignOutAlt,
} from "react-icons/fa";
import { getAuth } from "firebase/auth";
import { sendPushNotification } from "../utils/notifications";
import StickerPicker from "./StickerPicker";
import ImagePicker from "./ImagePicker";
import { uploadToS3 } from "../utils/uploadToS3SDK";
import ImagePreviewModal from "./ImagePreviewModal";
// Agrega esta importación al inicio del archivo
import AddMemberModal from "./AddMemberModal";
import { FaUserPlus } from "react-icons/fa"; // Si no está ya importado
import { useAgoraCall } from "../hooks/useAgoraCall";
import AgoraCallUI from "./AgoraCallUI";
import AgoraLlamadaEntrante from "./AgoraLlamadaEntrante";
// Agregar después de los otros imports
import ConferenceCall from "./ConferenceCall";

export default function ChatWindow({
  currentUser,
  friendId,
  friendName,
  friendPhoto,
  friendStatus,
  onBack,
  isMobile = false,
  isGroup,
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const chatId = isGroup
    ? friendId
    : [currentUser.uid, friendId].sort().join("_");
  const [friendIsTyping, setFriendIsTyping] = useState(false);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [isSending, setIsSending] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);

  const { status, statusText } = usePresence(friendId);
  const [showCallPanel, setShowCallPanel] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Estados para respuesta a mensajes
  const [replyingTo, setReplyingTo] = useState(null);
  const [showReplyBar, setShowReplyBar] = useState(false);

  // Estados para grabación de audio
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioChunks, setAudioChunks] = useState([]);
  const [isPlaying, setIsPlaying] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);

  // Agrega este estado después de los otros estados (cerca de línea ~50)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  const [showConferenceModal, setShowConferenceModal] = useState(false);
  const [conferenceRoomId, setConferenceRoomId] = useState(null);
  const [conferenceMode, setConferenceMode] = useState("join");
  const [autoJoinConference, setAutoJoinConference] = useState(false);

  // Scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [messages]);

  const {
    incomingCall,
    activeCall,
    isCalling,
    callDuration,
    isAudioEnabled,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
  } = useAgoraCall(currentUser.uid, currentUser.name, friendId, () => {
    console.log("Llamada terminada");
  });

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

  // ✅ Mantén SOLO este useEffect para cargar los miembros del grupo
  // ✅ CORREGIDO: Cargar miembros del grupo correctamente
  useEffect(() => {
    if (!friendId || !isGroup) return;

    const groupRef = ref(db, `groups/${friendId}`);
    const unsubscribe = onValue(groupRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.members) {
        const membersList = Object.entries(data.members).map(
          ([uid, member]) => ({
            uid,
            name: member.name,
            photo: member.photo,
            role: member.role,
            joinedAt: member.joinedAt,
          }),
        );
        setGroupMembers(membersList);
      } else {
        setGroupMembers([]);
      }
    });

    return () => unsubscribe();
  }, [friendId, isGroup]);

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

        // ✅ Marcar mensajes como leídos
        if (!isGroup) {
          // Chats privados: marcar en userChats
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
          // ✅ Grupos: marcar en userGroups
          const userGroupRef = ref(
            db,
            `userGroups/${currentUser.uid}/${friendId}`,
          );
          update(userGroupRef, { unreadCount: 0 });
        }
      } else {
        setMessages([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [chatId, currentUser.uid, friendId, isGroup]);

  // Agrega este useEffect para marcar mensajes como leídos en grupos
  useEffect(() => {
    if (!friendId || !isGroup) return;

    const userGroupRef = ref(db, `userGroups/${currentUser.uid}/${friendId}`);
    update(userGroupRef, { unreadCount: 0 });
  }, [friendId, isGroup, currentUser.uid]);

  const handleConferenceInvite = (message) => {
    if (message.type === "conference_invite" && message.conferenceData) {
      setConferenceRoomId(message.conferenceData.roomId);
      setConferenceMode("join");
       setAutoJoinConference(true); // Marcar que queremos unión automática
      setShowConferenceModal(true);
    }
  };

  // Manejar respuesta a un mensaje
  const handleReply = (message) => {
    setReplyingTo(message);
    setShowReplyBar(true);
  };

  // Cancelar respuesta
  const cancelReply = () => {
    setReplyingTo(null);
    setShowReplyBar(false);
  };

  // Solicitar permisos de micrófono
  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error) {
      alert("Necesitamos acceso al micrófono para grabar audios");
      return false;
    }
  };

  // Iniciar grabación
  const startRecording = async () => {
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        await sendAudioMessage(audioBlob, recordingDuration);
        setAudioChunks([]);
        setRecordingDuration(0);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      // Contador de duración
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordingDuration(elapsed);
      }, 1000);
      window.recordingInterval = interval;
    } catch (err) {
      console.error("Error al iniciar grabación:", err);
      alert("No se pudo iniciar la grabación");
    }
  };

  // Detener grabación y enviar
  const stopRecordingAndSend = async () => {
    if (!mediaRecorder) return;

    if (window.recordingInterval) {
      clearInterval(window.recordingInterval);
    }

    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
    setMediaRecorder(null);
  };

  // Enviar mensaje de audio
  const sendAudioMessage = async (audioBlob, durationSeconds) => {
    setIsSending(true);
    try {
      const file = new File([audioBlob], `audio_${Date.now()}.webm`, {
        type: "audio/webm",
      });
      const audioUrl = await uploadToS3(file);

      const message = {
        text: "",
        audioUrl,
        type: "audio",
        duration: durationSeconds,
        senderId: currentUser.uid,
        senderName: currentUser.name,
        senderPhoto: currentUser.picture,
        timestamp: Date.now(),
        read: false,
      };

      const messagesRef = ref(db, `chats/${chatId}/messages`);
      await push(messagesRef, message);

      await update(ref(db, `chats/${chatId}`), {
        lastMessage: {
          text: "🎤 Mensaje de voz",
          timestamp: Date.now(),
          senderId: currentUser.uid,
        },
      });

      await update(ref(db, `userChats/${friendId}/${currentUser.uid}`), {
        lastMessage: "🎤 Mensaje de voz",
        lastMessageTime: Date.now(),
        userName: currentUser.name,
        userPhoto: currentUser.picture,
        chatId,
      });

      await update(ref(db, `userChats/${currentUser.uid}/${friendId}`), {
        lastMessage: "🎤 Mensaje de voz",
        lastMessageTime: Date.now(),
        userName: friendName,
        userPhoto: friendPhoto,
        chatId,
        unreadCount: 0,
      });
    } catch (error) {
      console.error("Error sending audio:", error);
      alert("Error al enviar el audio");
    } finally {
      setIsSending(false);
    }
  };

  // Reproducir audio
  const playAudio = (audioUrl, messageId) => {
    if (isPlaying === messageId) {
      const audio = document.getElementById(`audio-${messageId}`);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setIsPlaying(null);
    } else {
      if (isPlaying) {
        const prevAudio = document.getElementById(`audio-${isPlaying}`);
        if (prevAudio) {
          prevAudio.pause();
          prevAudio.currentTime = 0;
        }
      }
      const audio = document.getElementById(`audio-${messageId}`);
      if (audio) {
        audio.play();
        setIsPlaying(messageId);
        audio.onended = () => setIsPlaying(null);
      }
    }
  };

  // Formatear duración
  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" + secs : secs}`;
  };

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

    // Si estamos respondiendo a un mensaje
    if (replyingTo) {
      message.replyTo = {
        messageId: replyingTo.id,
        text:
          replyingTo.text ||
          (replyingTo.type === "image"
            ? "📷 Imagen"
            : replyingTo.type === "audio"
              ? "🎤 Mensaje de voz"
              : ""),
        type: replyingTo.type || "text",
        senderName: replyingTo.senderName,
      };
      if (replyingTo.type === "image" && replyingTo.imageUrl) {
        message.replyTo.imageUrl = replyingTo.imageUrl;
      }
      if (replyingTo.type === "audio" && replyingTo.audioUrl) {
        message.replyTo.audioUrl = replyingTo.audioUrl;
        message.replyTo.duration = replyingTo.duration;
      }
    }

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

      if (isGroup && groupMembers.length > 0) {
        // ✅ Actualizar userGroups para cada miembro
        const updates = {};

        for (const member of groupMembers) {
          const memberGroupRef = `userGroups/${member.uid}/${friendId}`;
          const snapshot = await get(ref(db, memberGroupRef));
          const currentUnread = snapshot.val()?.unreadCount || 0;

          updates[memberGroupRef] = {
            groupId: friendId,
            groupName: friendName,
            groupPhoto: friendPhoto || "https://via.placeholder.com/50",
            lastMessage: messageToSend,
            lastMessageTime: Date.now(),
            unreadCount: member.uid === currentUser.uid ? 0 : currentUnread + 1,
          };
        }

        // ✅ También actualizar el último mensaje en el grupo
        updates[`groups/${friendId}/lastMessage`] = messageToSend;
        updates[`groups/${friendId}/lastMessageTime`] = Date.now();

        await update(ref(db), updates);
      } else {
        // ✅ PARA CHATS INDIVIDUALES: Actualizar userChats
        const friendChatRef = ref(
          db,
          `userChats/${friendId}/${currentUser.uid}`,
        );
        const snapshot = await get(friendChatRef);
        const currentUnread = snapshot.val()?.unreadCount || 0;
        const newUnread = currentUnread + 1;

        await update(ref(db, `userChats/${friendId}/${currentUser.uid}`), {
          lastMessage: messageToSend,
          lastMessageTime: Date.now(),
          userName: currentUser.name,
          userPhoto: currentUser.picture || "https://via.placeholder.com/50",
          chatId: chatId,
          unreadCount: newUnread,
        });

        await update(ref(db, `userChats/${currentUser.uid}/${friendId}`), {
          lastMessage: messageToSend,
          lastMessageTime: Date.now(),
          userName: friendName,
          userPhoto: friendPhoto || "https://via.placeholder.com/50",
          chatId: chatId,
          unreadCount: 0,
        });

        const typingRef = ref(
          db,
          `userChats/${friendId}/${currentUser.uid}/typing`,
        );
        await set(typingRef, false);

        // Enviar notificación push solo para chats individuales
        await sendPushNotification(
          friendId,
          currentUser.name,
          messageToSend,
          currentUser.picture,
        );
      }

      cancelReply(); // Limpiar respuesta después de enviar
    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(messageToSend);
      alert("Error al enviar mensaje. Intenta de nuevo.");
    } finally {
      setIsSending(false);
    }
  };

  const sendImageMessage = async (imageFile) => {
    setIsSending(true);
    try {
      const imageUrl = await uploadToS3(imageFile);

      const message = {
        text: "📷 Imagen",
        imageUrl: imageUrl,
        type: "image",
        senderId: currentUser.uid,
        senderName: currentUser.name,
        senderPhoto: currentUser.picture,
        timestamp: Date.now(),
        read: false,
      };

      const messagesRef = ref(db, `chats/${chatId}/messages`);
      await push(messagesRef, message);
      await update(ref(db, `chats/${chatId}`), {
        lastMessage: {
          text: "📷 Imagen",
          timestamp: Date.now(),
          senderId: currentUser.uid,
        },
      });

      const friendChatRef = ref(db, `userChats/${friendId}/${currentUser.uid}`);
      const snapshot = await get(friendChatRef);
      const currentUnread = snapshot.val()?.unreadCount || 0;
      const newUnread = currentUnread + 1;

      await update(ref(db, `userChats/${friendId}/${currentUser.uid}`), {
        lastMessage: "📷 Imagen",
        lastMessageTime: Date.now(),
        userName: currentUser.name,
        userPhoto: currentUser.picture,
        chatId: chatId,
        unreadCount: newUnread,
      });

      await update(ref(db, `userChats/${currentUser.uid}/${friendId}`), {
        lastMessage: "📷 Imagen",
        lastMessageTime: Date.now(),
        userName: friendName,
        userPhoto: friendPhoto,
        chatId: chatId,
        unreadCount: 0,
      });

      await sendPushNotification(
        friendId,
        currentUser.name,
        "📷 Imagen",
        currentUser.picture,
      );
    } catch (error) {
      console.error("Error sending image:", error);
      alert("Error al enviar imagen");
    } finally {
      setIsSending(false);
      setShowImagePicker(false);
    }
  };

  const sendStickerMessage = async (sticker) => {
    setIsSending(true);
    try {
      const message = {
        text: sticker.emoji || sticker.text,
        stickerUrl: sticker.image || null,
        type: "sticker",
        senderId: currentUser.uid,
        senderName: currentUser.name,
        senderPhoto: currentUser.picture,
        timestamp: Date.now(),
        read: false,
      };

      const messagesRef = ref(db, `chats/${chatId}/messages`);
      await push(messagesRef, message);
      await update(ref(db, `chats/${chatId}`), {
        lastMessage: {
          text: sticker.emoji || sticker.text,
          timestamp: Date.now(),
          senderId: currentUser.uid,
        },
      });

      const friendChatRef = ref(db, `userChats/${friendId}/${currentUser.uid}`);
      const snapshot = await get(friendChatRef);
      const currentUnread = snapshot.val()?.unreadCount || 0;
      const newUnread = currentUnread + 1;

      await update(ref(db, `userChats/${friendId}/${currentUser.uid}`), {
        lastMessage: sticker.emoji || sticker.text,
        lastMessageTime: Date.now(),
        userName: currentUser.name,
        userPhoto: currentUser.picture,
        chatId: chatId,
        unreadCount: newUnread,
      });

      await update(ref(db, `userChats/${currentUser.uid}/${friendId}`), {
        lastMessage: sticker.emoji || sticker.text,
        lastMessageTime: Date.now(),
        userName: friendName,
        userPhoto: friendPhoto,
        chatId: chatId,
        unreadCount: 0,
      });

      await sendPushNotification(
        friendId,
        currentUser.name,
        sticker.emoji || sticker.text,
        currentUser.picture,
      );
    } catch (error) {
      console.error("Error sending sticker:", error);
      alert("Error al enviar sticker");
    } finally {
      setIsSending(false);
      setShowStickerPicker(false);
    }
  };

  // Salir del grupo
  const leaveGroup = async () => {
    if (!isGroup) return;
    if (
      !confirm(`¿Estás seguro de que quieres salir del grupo "${friendName}"?`)
    )
      return;

    try {
      // Eliminar al usuario de los miembros del grupo
      await set(ref(db, `groups/${friendId}/members/${currentUser.uid}`), null);

      // Actualizar el contador de miembros
      const groupRef = ref(db, `groups/${friendId}`);
      const groupSnap = await get(groupRef);
      const currentMembers = groupSnap.val()?.members || {};
      const newMemberCount = Object.keys(currentMembers).length - 1;
      await update(groupRef, { memberCount: newMemberCount });

      // Eliminar el grupo de userGroups del usuario
      await set(ref(db, `userGroups/${currentUser.uid}/${friendId}`), null);

      // Enviar mensaje de sistema
      const leaveMessage = {
        text: `${currentUser.name} abandonó el grupo`,
        senderId: currentUser.uid,
        senderName: "Sistema",
        senderPhoto: null,
        timestamp: Date.now(),
        type: "system",
        read: {},
      };
      await push(ref(db, `chats/${friendId}/messages`), leaveMessage);

      alert("Has salido del grupo");
      onBack();
    } catch (error) {
      console.error("Error leaving group:", error);
      alert("Error al salir del grupo");
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
    <div className="flex flex-col h-full min-h-0 bg-[#18191A] relative overflow-hidden">
      {/* Header - fijo arriba */}
      {/* Header - fijo arriba */}
      <div className="flex-shrink-0 flex items-center gap-3 p-3 border-b border-[#3E4042] bg-[#242526] z-10">
        {isMobile && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-[#3A3B3C] rounded-full transition-colors"
          >
            <FaArrowLeft className="text-[#E4E6EB] text-xl" />
          </button>
        )}

        <Link
          to={isGroup ? "#" : `/profile/${friendId}`}
          className="flex items-center gap-3 flex-1"
          onClick={(e) => isGroup && e.preventDefault()}
        >
          <div className="relative">
            <img
              src={friendPhoto || "https://via.placeholder.com/40"}
              alt={friendName}
              className="w-10 h-10 rounded-full object-cover"
            />
            {!isGroup && status === "online" && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#242526] animate-pulse"></span>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-[#E4E6EB]">{friendName}</h3>
            <p className="text-xs text-gray-400">
              {isGroup
                ? `${groupMembers.length} miembros`
                : friendIsTyping
                  ? "✍️ Escribiendo..."
                  : status === "online"
                    ? "En línea"
                    : statusText}
            </p>
          </div>
        </Link>

        <button
          onClick={startCall}
          className="p-2 hover:bg-[#3A3B3C] rounded-full transition-colors"
          disabled={isGroup}
        >
          <FaPhone
            className={`text-lg ${activeCall ? "text-green-500" : isGroup ? "text-gray-500" : "text-[#2e9b4f]"}`}
          />
        </button>

        {isGroup && (
          <>
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="p-2 hover:bg-[#3A3B3C] rounded-full transition-colors"
              title="Agregar miembros"
            >
              <FaUserPlus className="text-[#2e9b4f] text-lg" />
            </button>
            <button
              onClick={leaveGroup}
              className="p-2 hover:bg-red-500/20 rounded-full transition-colors"
              title="Salir del grupo"
            >
              <FaSignOutAlt className="text-red-500 text-lg" />
            </button>
          </>
        )}
      </div>

      {/* Mensajes - scrollable, no se empuja */}
      <div
        ref={messagesContainerRef}
        className="
    flex-1
    min-h-0
    overflow-y-auto
    overflow-x-hidden
    p-4
    space-y-3
    scrollbar-hide
  "
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
              onContextMenu={(e) => {
                e.preventDefault();
                handleReply(msg);
              }}
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
                {msg.type === "image" && msg.imageUrl && (
                  <div className="mb-1">
                    <img
                      src={msg.imageUrl}
                      alt="imagen"
                      className="rounded-2xl max-w-full max-h-60 object-cover cursor-pointer hover:opacity-90 transition"
                      onClick={() => setPreviewImage(msg.imageUrl)}
                    />
                  </div>
                )}
                {msg.type === "conference_invite" && msg.conferenceData && (
                  <div className="mb-1">
                    <div
                      onClick={() => handleConferenceInvite(msg)}
                      className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-2xl p-3 cursor-pointer hover:shadow-lg transition border border-green-500/50"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            msg.conferenceData.inviterPhoto ||
                            "https://via.placeholder.com/40"
                          }
                          alt={msg.conferenceData.inviter}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-white font-semibold text-sm">
                            {msg.conferenceData.inviter} te invitó a una
                            conferencia
                          </p>
                          <p className="text-green-400 text-xs font-mono">
                            Room ID: {msg.conferenceData.roomId}
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 10l4.5-4.5M15 10l-4.5 4.5M15 10H5m0 0v8a2 2 0 002 2h10a2 2 0 002-2v-8"
                            />
                          </svg>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm mt-2 text-center">
                        📞 Haz clic para unirte a la conferencia
                      </p>
                    </div>
                  </div>
                )}
                {msg.type === "system" && (
                  <div className="flex justify-center my-2">
                    <div className="bg-gray-700/50 text-gray-400 text-xs px-3 py-1 rounded-full">
                      {msg.text}
                    </div>
                  </div>
                )}
                {msg.type === "audio" && msg.audioUrl && (
                  <div className="mb-1">
                    <audio
                      id={`audio-${msg.id}`}
                      src={msg.audioUrl}
                      className="hidden"
                    />
                    <button
                      onClick={() => playAudio(msg.audioUrl, msg.id)}
                      className="flex items-center gap-3 bg-[#2a2a2a] px-4 py-2 rounded-full hover:bg-[#3a3a3a] transition"
                    >
                      <svg
                        className={`w-6 h-6 ${isPlaying === msg.id ? "text-[#0095f6]" : "text-white"}`}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {isPlaying === msg.id ? (
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        ) : (
                          <path d="M8 5v14l11-7z" />
                        )}
                      </svg>
                      <div className="flex items-center gap-1">
                        {[8, 14, 20, 14, 8].map((h, i) => (
                          <div
                            key={i}
                            className="w-1 bg-[#0095f6] rounded-full animate-pulse"
                            style={{ height: h }}
                          ></div>
                        ))}
                      </div>
                      <span className="text-white text-sm ml-2">
                        {formatDuration(msg.duration)}
                      </span>
                    </button>
                  </div>
                )}
                {msg.replyTo && (
                  <div className="mb-2 p-2 bg-white/5 rounded-lg border-l-3 border-[#0095f6] text-sm">
                    <p className="text-[#0095f6] text-xs font-semibold">
                      {msg.replyTo.senderName === currentUser.name
                        ? "Tú"
                        : msg.replyTo.senderName}
                    </p>
                    <p className="text-gray-400 text-xs truncate">
                      {msg.replyTo.text ||
                        (msg.replyTo.type === "image"
                          ? "📷 Imagen"
                          : msg.replyTo.type === "audio"
                            ? "🎤 Mensaje de voz"
                            : "")}
                    </p>
                  </div>
                )}
                {/* Video compartido */}
                {msg.type === "shared_video" && msg.videoId && (
                  <div
                    className="mb-1 cursor-pointer group relative"
                    onClick={() => {
                      localStorage.setItem("sharedVideoId", msg.videoId);
                      onBack();
                    }}
                  >
                    <div className="relative rounded-2xl overflow-hidden bg-gray-800">
                      {/* Preview del video con overlay */}
                      <div className="relative">
                        <div className="w-full h-48 flex items-center justify-center bg-gray-900">
                          <FaPlay className="text-white text-4xl opacity-50" />
                        </div>
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          <div className="bg-black/60 rounded-full p-3">
                            <FaPlay className="text-white text-2xl" />
                          </div>
                        </div>
                      </div>

                      {/* Info del video original */}
                      <div className="p-2 bg-gray-800/80">
                        <div className="flex items-center gap-2">
                          <img
                            src={msg.videoUserPhoto}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span className="text-xs text-gray-300">
                            Video de {msg.videoUserName}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Compartido por {msg.senderName}
                    </p>
                  </div>
                )}
                {msg.type === "sticker" && msg.stickerUrl && (
                  <div className="mb-1">
                    <img
                      src={msg.stickerUrl}
                      alt="sticker"
                      className="w-24 h-24 object-contain"
                    />
                  </div>
                )}
                {msg.type === "sticker" && !msg.stickerUrl && msg.text && (
                  <div className="text-6xl">{msg.text}</div>
                )}
                {(!msg.type || msg.type === "text") &&
                  msg.text &&
                  !msg.imageUrl &&
                  !msg.stickerUrl && (
                    <div
                      className={`rounded-2xl px-4 py-2 ${msg.senderId === currentUser.uid ? "bg-[#2e9b4f] text-white" : "bg-[#3A3B3C] text-[#E4E6EB]"}`}
                    >
                      <p className="break-words text-sm">{msg.text}</p>
                    </div>
                  )}
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

      {/* Barra de respuesta */}
      {showReplyBar && replyingTo && (
        <div className="flex-shrink-0 bg-[#1a1a2e] border-t border-[#3E4042] p-2 px-3 animate-slideUp">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-[#0095f6] rounded-full"></div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs text-[#0095f6]">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                  />
                </svg>
                <span>
                  Respondiendo a{" "}
                  {replyingTo.senderName === currentUser.name
                    ? "ti mismo"
                    : replyingTo.senderName}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {replyingTo.type === "image" && replyingTo.imageUrl && (
                  <img
                    src={replyingTo.imageUrl}
                    className="w-5 h-5 rounded object-cover"
                  />
                )}
                {replyingTo.type === "audio" && (
                  <svg
                    className="w-4 h-4 text-[#0095f6]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                )}
                <span className="text-sm text-gray-300 truncate">
                  {replyingTo.text ||
                    (replyingTo.type === "image"
                      ? "📷 Imagen"
                      : replyingTo.type === "audio"
                        ? "🎤 Mensaje de voz"
                        : "")}
                </span>
              </div>
            </div>
            <button
              onClick={cancelReply}
              className="p-1 hover:bg-[#3A3B3C] rounded-full"
            >
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Input - fijo abajo, se mantiene visible */}
      <div className="flex-shrink-0 p-3 border-t border-[#3E4042] bg-[#242526]">
        <form autoComplete="off" onSubmit={sendMessage} className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowStickerPicker(!showStickerPicker)}
            className="bg-[#3A3B3C] hover:bg-[#4A4B4C] text-yellow-400 p-2 rounded-full transition"
          >
            <FaSmile className="text-xl" />
          </button>

          <button
            type="button"
            onClick={() => setShowImagePicker(!showImagePicker)}
            className="bg-[#3A3B3C] hover:bg-[#4A4B4C] text-[#2e9b4f] p-2 rounded-full transition"
          >
            <FaImage className="text-xl" />
          </button>

          <button
            type="button"
            onMouseDown={startRecording}
            onMouseUp={stopRecordingAndSend}
            onTouchStart={startRecording}
            onTouchEnd={stopRecordingAndSend}
            className={`bg-[#3A3B3C] hover:bg-[#4A4B4C] p-2 rounded-full transition ${isRecording ? "text-red-500" : "text-[#0095f6]"}`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </button>

          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Escribe un mensaje..."
            className="
    flex-1
    min-h-[40px]
    max-h-[100px]
    bg-[#3A3B3C]
    text-[#E4E6EB]
    px-4
    py-2
    rounded-3xl
    outline-none
    focus:ring-2
    focus:ring-[#2e9b4f]
    transition
    text-sm
    resize-none
    overflow-y-auto
  "
            rows={1}
            style={{ maxHeight: "100px", overflowY: "auto" }}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="bg-[#2e9b4f] hover:bg-[#268e46] text-white px-5 py-2 rounded-full font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <FaPaperPlane />
          </button>
        </form>
      </div>

      {/* Pickers y modales */}
      {showStickerPicker && (
        <StickerPicker
          currentUser={currentUser}
          onSelectSticker={sendStickerMessage}
          onClose={() => setShowStickerPicker(false)}
        />
      )}

      {showImagePicker && (
        <ImagePicker
          onSelectImage={sendImageMessage}
          onClose={() => setShowImagePicker(false)}
        />
      )}

      {/* Modal de llamada entrante */}
      <AgoraLlamadaEntrante
        incomingCall={incomingCall}
        onAccept={acceptCall}
        onReject={rejectCall}
      />

      {/* Pantalla de llamada activa */}
      {(activeCall || isCalling) && (
        <AgoraCallUI
          otroUsuarioNombre={friendName}
          callDuration={callDuration}
          isAudioEnabled={isAudioEnabled}
          toggleAudio={toggleAudio}
          endCall={endCall}
        />
      )}

      {/* Modal para agregar miembros */}
      {showAddMemberModal && (
        <AddMemberModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          currentUser={currentUser}
          groupId={friendId}
          groupName={friendName}
          groupPhoto={friendPhoto}
          currentMembers={groupMembers}
          onMemberAdded={(newMembers) => {
            // Actualizar la lista de miembros localmente
            setGroupMembers((prev) => [...prev, ...newMembers]);
            setShowAddMemberModal(false);
          }}
        />
      )}

      {/* Modal de conferencia */}
      <ConferenceCall
        isOpen={showConferenceModal}
        onClose={() => {
          setShowConferenceModal(false);
          setConferenceRoomId(null);
        }}
        currentUser={currentUser}
        roomId={conferenceRoomId}
        mode={conferenceMode}
        autoJoin={autoJoinConference} // Nueva prop
      />
    </div>
  );
}
