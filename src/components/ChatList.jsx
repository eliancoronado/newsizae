// components/ChatList.jsx
import { useEffect, useState } from "react";
import { ref, onValue, off } from "firebase/database";
import { db } from "../firebase";
import { FaSearch, FaComment, FaUserFriends, FaPhone } from "react-icons/fa";
import { FaPlus, FaUsers } from "react-icons/fa";
import CreateGroupModal from "./CreateGroupModal";

export default function ChatList({
  currentUser,
  onSelectChat,
  isMobile = false,
}) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groups, setGroups] = useState([]);
  const [showConferenceModal, setShowConferenceModal] = useState(false);
  const [conferenceMode, setConferenceMode] = useState("create");

  useEffect(() => {
    const handleOpenConference = (e) => {
      setConferenceMode(e.detail.mode);
      setShowConferenceModal(true);
    };
    window.addEventListener("openConference", handleOpenConference);
    return () =>
      window.removeEventListener("openConference", handleOpenConference);
  }, []);

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

  useEffect(() => {
    if (!currentUser?.uid) return;

    const userGroupsRef = ref(db, `userGroups/${currentUser.uid}`);

    const unsubscribe = onValue(userGroupsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const groupsList = Object.entries(data).map(([groupId, groupInfo]) => ({
          id: groupId,
          isGroup: true,
          ...groupInfo,
        }));
        setGroups(groupsList);
      } else {
        setGroups([]);
      }
    });

    return () => off(userGroupsRef);
  }, [currentUser]);

  const allChats = [...chats, ...groups];

  const sortedChats = allChats.sort(
    (a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0),
  );

  const filteredChats = sortedChats.filter(
    (chat) =>
      chat.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.groupName?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 7) return date.toLocaleDateString();
    if (days > 0) return `${days}d`;
    if (now.getDate() !== date.getDate()) return "Ayer";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Cargando chats...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-6 pb-3 bg-[#0a0a0a]">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Chats
          </h1>
          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="w-11 h-11 rounded-full bg-[#1a1a1a] hover:bg-[#2a2a2a] flex items-center justify-center transition-all duration-200 active:scale-95"
          >
            <FaPlus className="text-[#25D366] text-xl" />
          </button>
          <button
            onClick={() => {
              // Abrir modal de conferencia en modo crear
              window.dispatchEvent(
                new CustomEvent("openConference", {
                  detail: { mode: "create" },
                }),
              );
            }}
            className="w-11 h-11 rounded-full bg-[#1a1a1a] hover:bg-[#2a2a2a] flex items-center justify-center transition-all duration-200 active:scale-95 ml-2"
          >
            <FaPhone className="text-[#25D366] text-xl" />
          </button>
        </div>

        {/* Barra de búsqueda */}
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-500 text-sm" />
          </div>
          <input
            type="text"
            placeholder="Buscar chat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a1a1a] text-white placeholder-gray-500 pl-10 pr-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-[#25D366] transition-all text-base"
          />
        </div>
      </div>

      {/* Lista de chats */}
      <div className="flex-1 overflow-y-auto">
        {allChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-8 py-16">
            <div className="w-24 h-24 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4">
              <FaComments className="text-4xl text-[#25D366]" />
            </div>
            <p className="text-white text-lg font-semibold text-center">
              No tienes conversaciones
            </p>
            <p className="text-gray-500 text-sm text-center mt-2">
              Busca amigos para empezar a chatear
            </p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-8 py-16">
            <div className="w-20 h-20 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-3">
              <FaSearch className="text-3xl text-gray-600" />
            </div>
            <p className="text-gray-400 text-base text-center">
              No se encontraron chats
            </p>
          </div>
        ) : (
          <>
            {filteredChats.map((chat) => (
              <div
                key={`${chat.isGroup ? "group_" : "chat_"}_${chat.id || chat.friendId}`}
                onClick={() => {
                  if (chat.isGroup) {
                    onSelectChat(
                      chat.id,
                      chat.groupName,
                      chat.groupPhoto,
                      null,
                      null,
                      true,
                    );
                  } else {
                    onSelectChat(
                      chat.friendId,
                      chat.userName,
                      chat.userPhoto,
                      chat.status,
                      null,
                      false,
                    );
                  }
                }}
                className="flex items-center gap-3 px-4 py-3 active:bg-[#1a1a1a] hover:bg-[#111111] cursor-pointer transition-all duration-150"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={
                      chat.isGroup
                        ? chat.groupPhoto || "https://via.placeholder.com/50"
                        : chat.userPhoto || "https://via.placeholder.com/50"
                    }
                    alt={chat.isGroup ? chat.groupName : chat.userName}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  {!chat.isGroup && chat.status === "online" && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#25D366] rounded-full border-2 border-[#0a0a0a]"></span>
                  )}
                </div>

                {/* Info del chat */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold text-white text-base truncate">
                      {chat.isGroup ? chat.groupName : chat.userName}
                    </h3>
                    <span className="text-[11px] text-gray-500 flex-shrink-0 ml-2">
                      {formatTime(chat.lastMessageTime)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {chat.isGroup && (
                      <FaUserFriends className="text-[10px] text-gray-500 flex-shrink-0" />
                    )}
                    <p className="text-sm text-gray-400 truncate">
                      {chat.lastMessage ||
                        (chat.isGroup ? "Grupo creado" : "Nuevo chat")}
                    </p>
                  </div>
                </div>

                {/* Badge de mensajes no leídos */}
                {chat.unreadCount > 0 && (
                  <div className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#25D366] flex items-center justify-center">
                    <span className="text-white text-[11px] font-bold">
                      {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                    </span>
                  </div>
                )}
              </div>
            ))}
            {/* Espaciador inferior */}
            <div className="h-4" />
          </>
        )}
      </div>

      {/* Modal de crear grupo */}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        currentUser={currentUser}
        onGroupCreated={() => {
          const userGroupsRef = ref(db, `userGroups/${currentUser.uid}`);
          onValue(
            userGroupsRef,
            (snapshot) => {
              const data = snapshot.val();
              if (data) {
                const groupsList = Object.entries(data)
                  .map(([groupId, groupInfo]) => ({
                    id: groupId,
                    isGroup: true,
                    ...groupInfo,
                  }))
                  .sort(
                    (a, b) =>
                      (b.lastMessageTime || 0) - (a.lastMessageTime || 0),
                  );
                setGroups(groupsList);
              }
            },
            { onlyOnce: true },
          );
        }}
      />

      <ConferenceCall
        isOpen={showConferenceModal}
        onClose={() => setShowConferenceModal(false)}
        currentUser={currentUser}
        mode={conferenceMode}
      />
    </div>
  );
}
