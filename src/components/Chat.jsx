// components/Chat.jsx
import { useState, useEffect } from "react";
import { ref, onValue, update, get } from "firebase/database";
import { db } from "../firebase";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";

export default function Chat({ currentUser }) {
  const [selectedFriend, setSelectedFriend] = useState(null);

  const handleSelectChat = async (
    friendId,
    friendName,
    friendPhoto,
    friendStatus,
  ) => {
    // Marcar mensajes como leídos antes de abrir el chat
    const userChatRef = ref(db, `userChats/${currentUser.uid}/${friendId}`);
    await update(userChatRef, { unreadCount: 0 });

    setSelectedFriend({ friendId, friendName, friendPhoto, friendStatus });
  };

  const handleBack = () => {
    setSelectedFriend(null);
  };

  return (
    <div className="h-full bg-[#18191A]">
      {/* Desktop: vista dividida */}
      <div className="hidden md:flex h-full rounded-xl overflow-hidden shadow-xl">
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
      <div className="md:hidden h-full">
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
