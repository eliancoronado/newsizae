// components/Chat.jsx
import { useState, useEffect } from "react";
import { ref, onValue, update, get } from "firebase/database";
import { db } from "../firebase";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";

export default function Chat({
  currentUser,
  setActiveTab,
  setIsChatOpen,
  selectedFriend,
  setSelectedFriend,
}) {
  const handleSelectChat = async (
    friendId,
    friendName,
    friendPhoto,
    friendStatus,
    openVideo = null,
  ) => {
    // Marcar mensajes como leídos antes de abrir el chat
    const userChatRef = ref(db, `userChats/${currentUser.uid}/${friendId}`);
    await update(userChatRef, { unreadCount: 0 });
    // 🔥 Forzar un pequeño retraso para que Firebase procese el cambio
    setTimeout(() => {
      setSelectedFriend({ friendId, friendName, friendPhoto, friendStatus });
    }, 150);
    if (openVideo) {
      localStorage.setItem("openSharedVideo", JSON.stringify(openVideo));
    }
  };

  const handleOpenChat = (friend) => {
    setSelectedFriend(friend);
    if (setIsChatOpen) setIsChatOpen(true);
  };
  const handleCloseChat = () => {
    setSelectedFriend(null);
    if (setIsChatOpen) setIsChatOpen(false);
  };

  const handleBack = () => {
    setSelectedFriend(null);
    setActiveTab("home");
  };

  return (
    <div className="h-full bg-[#18191A]">
      {/* Desktop: vista dividida */}
      <div className="hidden md:flex h-full min-h-0 rounded-xl overflow-hidden shadow-xl">
        <div className="w-1/3 border-r border-[#3E4042] bg-[#242526]">
          <ChatList currentUser={currentUser} onSelectChat={handleSelectChat} />
        </div>
        <div className="flex-1">
          <ChatWindow
            currentUser={currentUser}
            friendId={selectedFriend?.friendId}
            friendName={selectedFriend?.friendName}
            friendPhoto={selectedFriend?.friendPhoto}
            friendStatus={selectedFriend?.friendStatus}
            onBack={handleBack}
            isMobile={false}
          />
        </div>
      </div>

      {/* Mobile: renderizado condicional simple */}
      <div className="md:hidden h-full min-h-0 overflow-hidden">
        {!selectedFriend ? (
          <ChatList
            currentUser={currentUser}
            onSelectChat={handleSelectChat}
            isMobile={true}
          />
        ) : (
          <ChatWindow
            currentUser={currentUser}
            friendId={selectedFriend.friendId}
            friendName={selectedFriend.friendName}
            friendPhoto={selectedFriend.friendPhoto}
            friendStatus={selectedFriend.friendStatus}
            onBack={handleBack}
            isMobile={true}
          />
        )}
      </div>
    </div>
  );
}
