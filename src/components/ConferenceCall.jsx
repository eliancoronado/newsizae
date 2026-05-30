import { useState, useEffect, useRef } from "react";
import { ref, push, set, get, update } from "firebase/database";
import { db } from "../firebase";
import AgoraRTC from "agora-rtc-sdk-ng";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaPhoneSlash,
  FaShare,
  FaUserPlus,
  FaCopy,
  FaVideo,
  FaCheck,
} from "react-icons/fa";

const appId = "36bb337ed3fd4f8a9d9f32e1ebc67807"; // Reemplaza con tu App ID

export default function ConferenceCall({
  isOpen,
  onClose,
  currentUser,
  roomId: externalRoomId = null,
  mode = "join", // "create" o "join"
}) {
  const [roomId, setRoomId] = useState(externalRoomId || "");
  const [inputRoomId, setInputRoomId] = useState("");
  const [step, setStep] = useState(mode === "create" ? "create" : "join");
  const [inCall, setInCall] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [sendingInvites, setSendingInvites] = useState(false);

  const rtcClient = useRef(null);
  const localAudioTrack = useRef(null);
  const remoteAudioTracks = useRef({});

  // Generar roomId al crear
  const generateRoomId = () => {
    const newId = Math.random().toString(36).substring(2, 10).toUpperCase();
    setRoomId(newId);
    setInputRoomId(newId);
  };

  useEffect(() => {
    if (step === "create" && !roomId) {
      generateRoomId();
    }
  }, [step]);

  // Iniciar llamada
  const startCall = async () => {
    const finalRoomId = step === "create" ? roomId : inputRoomId;
    if (!finalRoomId) return;

    try {
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      rtcClient.current = client;

      const uid = Math.floor(Math.random() * 2032);

      client.on("user-joined", handleUserJoined);
      client.on("user-published", handleUserPublished);
      client.on("user-left", handleUserLeft);

      await client.join(appId, finalRoomId, null, uid);

      localAudioTrack.current = await AgoraRTC.createMicrophoneAudioTrack();
      await client.publish(localAudioTrack.current);

      // Guardar en Firebase que el usuario está en llamada
      const callRef = ref(
        db,
        `activeCalls/${finalRoomId}/participants/${currentUser.uid}`,
      );
      await set(callRef, {
        uid: currentUser.uid,
        name: currentUser.name,
        photo: currentUser.picture,
        email: currentUser.email,
        joinedAt: Date.now(),
      });

      setParticipants([
        {
          uid: currentUser.uid,
          name: currentUser.name,
          photo: currentUser.picture,
          email: currentUser.email,
        },
      ]);
      setInCall(true);
    } catch (error) {
      console.error("Error starting call:", error);
      alert("Error al iniciar la conferencia");
    }
  };

  const handleUserJoined = async (user) => {
    // Obtener datos del usuario desde Firebase
    const userRef = ref(db, `activeCalls/${roomId}/participants/${user.uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      setParticipants((prev) => [...prev, snapshot.val()]);
    }
  };

  const handleUserPublished = async (user, mediaType) => {
    await rtcClient.current.subscribe(user, mediaType);
    if (mediaType === "audio") {
      remoteAudioTracks.current[user.uid] = user.audioTrack;
      user.audioTrack.play();
    }
  };

  const handleUserLeft = async (user) => {
    delete remoteAudioTracks.current[user.uid];
    setParticipants((prev) => prev.filter((p) => p.uid !== user.uid));
  };

  const endCall = async () => {
    if (localAudioTrack.current) {
      localAudioTrack.current.stop();
      localAudioTrack.current.close();
    }
    if (rtcClient.current) {
      await rtcClient.current.unpublish();
      await rtcClient.current.leave();
    }

    // Limpiar de Firebase
    if (roomId) {
      const participantRef = ref(
        db,
        `activeCalls/${roomId}/participants/${currentUser.uid}`,
      );
      await set(participantRef, null);
    }

    setInCall(false);
    setParticipants([]);
    onClose();
  };

  const toggleAudio = async () => {
    if (localAudioTrack.current) {
      await localAudioTrack.current.setEnabled(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  // Cargar amigos para invitar
  const loadFriends = async () => {
    const friendsRef = ref(db, `users/${currentUser.uid}/friends`);
    const snapshot = await get(friendsRef);
    const friendsData = snapshot.val() || {};

    const friendsList = [];
    for (const friendId of Object.keys(friendsData)) {
      const userRef = ref(db, `users/${friendId}`);
      const userSnap = await get(userRef);
      if (userSnap.exists()) {
        friendsList.push({
          uid: friendId,
          name: userSnap.val().name || "Usuario",
          photo: userSnap.val().photo || "https://via.placeholder.com/50",
          email: userSnap.val().email || "",
        });
      }
    }
    setFriends(friendsList);
  };

  useEffect(() => {
    if (showInviteModal) {
      loadFriends();
    }
  }, [showInviteModal]);

  // Enviar invitación por mensaje
  const sendInvites = async () => {
    if (selectedFriends.length === 0) return;

    setSendingInvites(true);
    try {
      for (const friend of selectedFriends) {
        const chatId = [currentUser.uid, friend.uid].sort().join("_");

        const inviteMessage = {
          text: `📞 Te invito a una conferencia de video`,
          type: "conference_invite",
          conferenceData: {
            roomId: roomId,
            inviter: currentUser.name,
            inviterPhoto: currentUser.picture,
            conferenceId: `conf_${roomId}_${Date.now()}`,
          },
          senderId: currentUser.uid,
          senderName: currentUser.name,
          senderPhoto: currentUser.picture,
          timestamp: Date.now(),
          read: false,
        };

        const messagesRef = ref(db, `chats/${chatId}/messages`);
        await push(messagesRef, inviteMessage);

        // Actualizar último mensaje
        await update(ref(db, `chats/${chatId}`), {
          lastMessage: {
            text: "📞 Te invito a una conferencia de video",
            timestamp: Date.now(),
            senderId: currentUser.uid,
          },
        });

        // Actualizar userChats
        await update(ref(db, `userChats/${friend.uid}/${currentUser.uid}`), {
          lastMessage: "📞 Te invito a una conferencia de video",
          lastMessageTime: Date.now(),
          userName: currentUser.name,
          userPhoto: currentUser.picture,
          chatId: chatId,
        });

        await update(ref(db, `userChats/${currentUser.uid}/${friend.uid}`), {
          lastMessage: "📞 Te invito a una conferencia de video",
          lastMessageTime: Date.now(),
          userName: friend.name,
          userPhoto: friend.photo,
          chatId: chatId,
        });
      }

      alert(`Invitaciones enviadas a ${selectedFriends.length} amigos`);
      setShowInviteModal(false);
      setSelectedFriends([]);
    } catch (error) {
      console.error("Error sending invites:", error);
      alert("Error al enviar invitaciones");
    } finally {
      setSendingInvites(false);
    }
  };

  const toggleFriendSelection = (friend) => {
    if (selectedFriends.some((f) => f.uid === friend.uid)) {
      setSelectedFriends(selectedFriends.filter((f) => f.uid !== friend.uid));
    } else {
      setSelectedFriends([...selectedFriends, friend]);
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  // Modal de entrada (crear/unirse)
  if (!inCall) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-700">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FaVideo className="text-white text-3xl" />
            </div>
            <h2 className="text-2xl font-bold text-white">Conferencia</h2>
            <p className="text-gray-400 text-sm mt-1">
              Reuniones por voz con amigos
            </p>
          </div>

          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setStep("create")}
              className={`flex-1 py-2 rounded-xl font-semibold transition ${
                step === "create"
                  ? "bg-green-500 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Crear Sala
            </button>
            <button
              onClick={() => setStep("join")}
              className={`flex-1 py-2 rounded-xl font-semibold transition ${
                step === "join"
                  ? "bg-green-500 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Unirse a Sala
            </button>
          </div>

          {step === "create" && (
            <div className="space-y-4">
              <div className="bg-gray-700/50 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-2">Tu Room ID:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-900 px-3 py-2 rounded-lg text-green-400 font-mono text-sm">
                    {roomId}
                  </code>
                  <button
                    onClick={copyRoomId}
                    className="p-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition"
                  >
                    {copied ? (
                      <FaCheck className="text-green-400" />
                    ) : (
                      <FaCopy className="text-gray-300" />
                    )}
                  </button>
                </div>
              </div>
              <button
                onClick={startCall}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
              >
                Iniciar Conferencia
              </button>
            </div>
          )}

          {step === "join" && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Ingresa el Room ID"
                value={inputRoomId}
                onChange={(e) => setInputRoomId(e.target.value.toUpperCase())}
                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={startCall}
                disabled={!inputRoomId.trim()}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
              >
                Unirse a Conferencia
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full mt-4 py-2 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // Pantalla de conferencia activa (estilo Cisco Webex)
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-black/50 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-white font-medium">Conferencia Activa</span>
          <code className="bg-gray-800 px-2 py-1 rounded text-xs text-green-400 font-mono">
            ID: {roomId}
          </code>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-white transition"
          >
            <FaUserPlus /> Invitar
          </button>
          <button
            onClick={toggleAudio}
            className={`p-2 rounded-xl transition ${
              isAudioEnabled
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {isAudioEnabled ? (
              <FaMicrophone className="text-white" />
            ) : (
              <FaMicrophoneSlash className="text-white" />
            )}
          </button>
          <button
            onClick={endCall}
            className="p-2 bg-red-600 hover:bg-red-700 rounded-xl transition"
          >
            <FaPhoneSlash className="text-white" />
          </button>
        </div>
      </div>

      {/* Grid de participantes estilo Webex */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {participants.map((p) => (
            <div
              key={p.uid}
              className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 flex flex-col items-center border border-gray-700 hover:border-green-500/50 transition"
            >
              <div className="relative">
                <img
                  src={p.photo || "https://via.placeholder.com/100"}
                  alt={p.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-green-500"
                />
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800"></div>
              </div>
              <h3 className="text-white font-semibold mt-3">{p.name}</h3>
              <p className="text-gray-400 text-xs">{p.email}</p>
              <div className="flex items-center gap-1 mt-2">
                <FaMicrophone className="text-green-400 text-xs" />
                <span className="text-gray-400 text-xs">Conectado</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Barra de control inferior */}
      <div className="flex-shrink-0 bg-black/50 backdrop-blur-md px-6 py-4 flex justify-center gap-4 border-t border-gray-800">
        <button
          onClick={toggleAudio}
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition ${
            isAudioEnabled
              ? "bg-gray-700 hover:bg-gray-600"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {isAudioEnabled ? (
            <FaMicrophone className="text-white text-xl" />
          ) : (
            <FaMicrophoneSlash className="text-white text-xl" />
          )}
          <span className="text-white text-xs">Micrófono</span>
        </button>
        <button
          onClick={endCall}
          className="flex flex-col items-center gap-1 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-xl transition"
        >
          <FaPhoneSlash className="text-white text-xl" />
          <span className="text-white text-xs">Salir</span>
        </button>
      </div>

      {/* Modal de invitación */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Invitar Amigos</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="mb-4 p-3 bg-gray-700/30 rounded-xl">
                <p className="text-gray-400 text-xs">Room ID</p>
                <code className="text-green-400 font-mono">{roomId}</code>
              </div>
              <p className="text-gray-400 text-sm mb-3">Selecciona amigos:</p>
              {friends.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No tienes amigos para invitar
                </p>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend.uid}
                    onClick={() => toggleFriendSelection(friend)}
                    className={`flex items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer transition ${
                      selectedFriends.some((f) => f.uid === friend.uid)
                        ? "bg-green-500/20 border border-green-500"
                        : "bg-gray-700/30 hover:bg-gray-700/50"
                    }`}
                  >
                    <img
                      src={friend.photo}
                      alt={friend.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-white font-medium">{friend.name}</p>
                      <p className="text-gray-400 text-xs">{friend.email}</p>
                    </div>
                    {selectedFriends.some((f) => f.uid === friend.uid) && (
                      <FaCheck className="text-green-500" />
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="p-6 border-t border-gray-700 flex gap-3">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 py-2 bg-gray-700 rounded-xl text-white"
              >
                Cancelar
              </button>
              <button
                onClick={sendInvites}
                disabled={selectedFriends.length === 0 || sendingInvites}
                className="flex-1 py-2 bg-green-600 rounded-xl text-white font-semibold disabled:opacity-50"
              >
                {sendingInvites
                  ? "Enviando..."
                  : `Invitar (${selectedFriends.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
