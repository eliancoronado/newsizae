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
    chatId,
    chatName,
    chatPhoto,
    chatStatus,
    openVideo = null,
    isGroup = false,
  ) => {
    if (isGroup) {
      // ✅ Para grupos, actualizar userGroups en lugar de userChats
      const userGroupRef = ref(db, `userGroups/${currentUser.uid}/${chatId}`);
      await update(userGroupRef, { unreadCount: 0 });
    } else {
      const userChatRef = ref(db, `userChats/${currentUser.uid}/${chatId}`);
      await update(userChatRef, { unreadCount: 0 });
    }

    setTimeout(() => {
      setSelectedFriend({
        friendId: chatId,
        friendName: chatName,
        friendPhoto: chatPhoto,
        friendStatus: chatStatus,
        isGroup,
      });
    }, 150);
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
            isGroup={selectedFriend?.isGroup === true} // ✅ Asegurar booleano
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
            isGroup={selectedFriend?.isGroup === true} // ✅ Asegurar booleano
          />
        )}
      </div>
    </div>
  );
}
