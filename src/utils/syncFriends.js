// utils/syncFriends.js
import { ref, set, get } from "firebase/database";
import { db } from "../firebase";

export const syncFriendsToFirebase = async (currentUser, friendsList) => {
  if (!currentUser?.uid) return;
  
  try {
    for (const friend of friendsList) {
      const chatId = [currentUser.uid, friend.uid].sort().join("_");
      
      // Verificar si ya existe en userChats
      const userChatRef = ref(db, `userChats/${currentUser.uid}/${friend.uid}`);
      const snapshot = await get(userChatRef);
      
      if (!snapshot.exists()) {
        // Solo crear si no existe
        await set(userChatRef, {
          chatId: chatId,
          lastMessage: "",
          lastMessageTime: Date.now(),
          userName: friend.name,
          userPhoto: friend.picture,
          unreadCount: 0
        });
      }
    }
  } catch (error) {
    console.error("Error syncing friends:", error);
  }
};