// components/ShareVideoModal.jsx
import { useState, useEffect } from "react";
import { FaTimes, FaUserPlus, FaCheck } from "react-icons/fa";
import { ref, push, set, get, update } from "firebase/database";
import { db } from "../firebase";

export default function ShareVideoModal({
  currentUser,
  video,
  onClose,
  onShare,
}) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [sharing, setSharing] = useState(false);
  // Agrega este estado al inicio con los otros
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // Agrega esta función para mostrar toast
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  useEffect(() => {
    const loadFriends = async () => {
      try {
        const friendsRef = ref(db, `users/${currentUser.uid}/friends`);
        const snapshot = await get(friendsRef);
        const friendsObj = snapshot.val() || {};
        const friendsList = [];

        for (const friendId of Object.keys(friendsObj)) {
          const userRef = ref(db, `users/${friendId}`);
          const userSnapshot = await get(userRef);
          if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            friendsList.push({
              uid: friendId,
              name: userData.name,
              photo: userData.photo,
              email: userData.email,
            });
          }
        }
        setFriends(friendsList);
      } catch (error) {
        console.error("Error loading friends:", error);
      } finally {
        setLoading(false);
      }
    };
    loadFriends();
  }, [currentUser.uid]);

  // Modifica handleShare para incluir los datos del dueño original y mostrar toast
  const handleShare = async () => {
    if (!selectedFriend) return;
    setSharing(true);
    try {
      const chatId = [currentUser.uid, selectedFriend.uid].sort().join("_");

      // Enviar todos los datos del video original
      const message = {
        type: "shared_video",
        videoId: video.id,
        videoUrl: video.video.url,
        videoContent: video.content,
        videoUserPhoto: video.userPhoto,
        videoUserName: video.userName,
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
          text: `📹 ${currentUser.name} te compartió un video: ${video.userName}`,
          timestamp: Date.now(),
          senderId: currentUser.uid,
        },
      });

      const friendChatRef = ref(
        db,
        `userChats/${selectedFriend.uid}/${currentUser.uid}`,
      );
      const snapshot = await get(friendChatRef);
      const currentUnread = snapshot.val()?.unreadCount || 0;

      await update(
        ref(db, `userChats/${selectedFriend.uid}/${currentUser.uid}`),
        {
          lastMessage: `📹 Te compartió un video de ${video.userName}`,
          lastMessageTime: Date.now(),
          userName: currentUser.name,
          userPhoto: currentUser.picture,
          chatId: chatId,
          unreadCount: currentUnread + 1,
        },
      );

      await update(
        ref(db, `userChats/${currentUser.uid}/${selectedFriend.uid}`),
        {
          lastMessage: `📹 Compartiste un video de ${video.userName} con ${selectedFriend.name}`,
          lastMessageTime: Date.now(),
          userName: selectedFriend.name,
          userPhoto: selectedFriend.photo,
          chatId: chatId,
          unreadCount: 0,
        },
      );

      // Mostrar toast de éxito
      showToast(`✅ Video compartido con ${selectedFriend.name}`, "success");
      onShare(selectedFriend.uid);

      // Cerrar modal después de un momento para ver el toast
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error("Error sharing video:", error);
      showToast(`❌ Error: ${error.message}`, "error");
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h3 className="text-white font-semibold text-lg">Compartir video</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FaTimes className="text-xl" />
          </button>
        </div>

        <div className="p-4">
          {/* Vista previa del video */}
          <div className="bg-gray-800/50 rounded-xl p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <img
                src={video.userPhoto}
                alt=""
                className="w-8 h-8 rounded-full"
              />
              <div>
                <p className="text-white text-sm font-medium">
                  {video.userName}
                </p>
                <p className="text-gray-400 text-xs">Video original</p>
              </div>
            </div>
            <video
              src={video.video.url}
              className="w-full h-40 object-cover rounded-lg"
              controls={false}
            />
            <p className="text-gray-300 text-sm mt-2 truncate">
              {video.content}
            </p>
          </div>

          {/* Lista de amigos */}
          <label className="block text-white text-sm font-medium mb-2">
            Selecciona un amigo
          </label>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center py-4">
                <div className="w-6 h-6 border-2 border-[#2e9b4f] border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : friends.length === 0 ? (
              <p className="text-gray-400 text-center py-4">
                No tienes amigos aún
              </p>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend.uid}
                  onClick={() => setSelectedFriend(friend)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${
                    selectedFriend?.uid === friend.uid
                      ? "bg-[#2e9b4f]/20 border-2 border-[#2e9b4f]"
                      : "bg-gray-800/50 hover:bg-gray-700"
                  }`}
                >
                  <img
                    src={friend.photo || "https://via.placeholder.com/40"}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium">{friend.name}</p>
                    <p className="text-gray-400 text-xs">{friend.email}</p>
                  </div>
                  {selectedFriend?.uid === friend.uid && (
                    <FaCheck className="text-[#2e9b4f]" />
                  )}
                </div>
              ))
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleShare}
              disabled={!selectedFriend || sharing}
              className="flex-1 py-2 bg-[#2e9b4f] text-white rounded-lg hover:bg-[#268e46] transition disabled:opacity-50"
            >
              {sharing ? "Compartiendo..." : "Compartir"}
            </button>
          </div>
        </div>
      </div>
      {toast.show && (
        <div
          className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[100] px-4 py-2 rounded-lg shadow-lg animate-fadeIn ${
            toast.type === "error" ? "bg-red-500" : "bg-[#2e9b4f]"
          } text-white text-sm`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
