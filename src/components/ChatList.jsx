// components/ChatList.jsx
import { useEffect, useState } from "react";
import { ref, onValue, off } from "firebase/database";
import { db } from "../firebase";
import { FaSearch, FaComment, FaUserFriends } from "react-icons/fa";

export default function ChatList({
  currentUser,
  onSelectChat,
  isMobile = false,
}) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!currentUser?.uid) return;

    const userChatsRef = ref(db, `userChats/${currentUser.uid}`);

    const unsubscribe = onValue(userChatsRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const chatsList = Object.entries(data)
          .map(([friendId, chatInfo]) => ({
            friendId,
            ...chatInfo,
          }))
          .sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));

        setChats(chatsList);
      } else {
        setChats([]);
      }
      setLoading(false);
    });

    return () => off(userChatsRef);
  }, [currentUser]);

  const filteredChats = chats.filter((chat) =>
    chat.userName?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Cargando chats...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-[#3E4042] bg-[#242526]">
        <h2 className="text-xl font-bold text-[#E4E6EB] mb-3">Chats</h2>

        {/* Barra de búsqueda */}
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Buscar chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#3A3B3C] text-[#E4E6EB] pl-10 pr-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-[#2e9b4f] text-sm"
          />
        </div>
      </div>

      {/* Lista de chats */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {chats.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-[#B0B3B8]">No tienes conversaciones</p>
            <p className="text-sm text-gray-500 mt-2">
              Busca amigos para empezar a chatear
            </p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No se encontraron chats</p>
          </div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat.friendId}
              onClick={() =>
                onSelectChat(
                  chat.friendId,
                  chat.userName,
                  chat.userPhoto,
                  chat.status,
                )
              }
              className="flex items-center gap-3 p-3 hover:bg-[#3A3B3C] active:bg-[#4A4B4D] cursor-pointer transition border-b border-[#3E4042]"
            >
              <div className="relative">
                <img
                  src={chat.userPhoto || "https://via.placeholder.com/50"}
                  alt={chat.userName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                {chat.status === "online" && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#242526]"></span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold text-[#E4E6EB] truncate">
                    {chat.userName}
                  </h3>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                    {chat.lastMessageTime
                      ? new Date(chat.lastMessageTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </div>
                <p className="text-sm text-gray-400 truncate">
                  {chat.lastMessage || "Nuevo chat"}
                </p>
              </div>
              {chat.unreadCount > 0 && (
                <div className="bg-[#2e9b4f] text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
                  {chat.unreadCount}
                </div>
              )}
            </div>
          ))
        )}

        {/* Espaciador para que el último chat no quede detrás del BottomBar */}
        <div className="h-[70px]" />
      </div>
    </div>
  );
}
