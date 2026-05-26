// components/AddMemberModal.jsx
import { useState, useEffect } from "react";
import { ref, get, update, push, set } from "firebase/database";
import { db } from "../firebase";
import { FaTimes, FaCheck, FaUserPlus, FaSpinner } from "react-icons/fa";

export default function AddMemberModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  groupId, 
  groupName,
  groupPhoto,
  currentMembers,
  onMemberAdded 
}) {
  const [friends, setFriends] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser && groupId) {
      loadNonMemberFriends();
    }
  }, [isOpen, currentUser, groupId, currentMembers]);

  const loadNonMemberFriends = async () => {
    setLoading(true);
    try {
      // Obtener lista de amigos del usuario
      const friendsRef = ref(db, `users/${currentUser.uid}/friends`);
      const snapshot = await get(friendsRef);
      const friendsData = snapshot.val() || {};
      
      // Obtener UIDs de miembros actuales
      const memberIds = currentMembers.map(m => m.uid);
      
      // Filtrar amigos que NO están en el grupo
      const nonMemberFriends = [];
      
      for (const friendId of Object.keys(friendsData)) {
        if (!memberIds.includes(friendId)) {
          const userRef = ref(db, `users/${friendId}`);
          const userSnap = await get(userRef);
          if (userSnap.exists()) {
            nonMemberFriends.push({
              uid: friendId,
              name: userSnap.val().name || "Usuario",
              photo: userSnap.val().photo || "https://via.placeholder.com/100",
              email: userSnap.val().email || "",
            });
          }
        }
      }
      
      setFriends(nonMemberFriends);
    } catch (error) {
      console.error("Error loading non-member friends:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (friend) => {
    if (selectedMembers.some((m) => m.uid === friend.uid)) {
      setSelectedMembers(selectedMembers.filter((m) => m.uid !== friend.uid));
    } else {
      setSelectedMembers([...selectedMembers, friend]);
    }
  };

  const addMembers = async () => {
    if (selectedMembers.length === 0) {
      alert("Selecciona al menos un miembro para agregar");
      return;
    }

    setAdding(true);
    try {
      const timestamp = Date.now();
      
      // Preparar actualizaciones
      const updates = {};
      
      // 1. Agregar miembros al grupo
      for (const member of selectedMembers) {
        updates[`groups/${groupId}/members/${member.uid}`] = {
          uid: member.uid,
          name: member.name,
          photo: member.photo || "https://via.placeholder.com/100",
          role: "member",
          joinedAt: timestamp,
        };
      }
      
      // 2. Actualizar contador de miembros
      const newMemberCount = currentMembers.length + selectedMembers.length;
      updates[`groups/${groupId}/memberCount`] = newMemberCount;
      
      // 3. Agregar grupo a userGroups de los nuevos miembros
      for (const member of selectedMembers) {
        updates[`userGroups/${member.uid}/${groupId}`] = {
          groupId: groupId,
          groupName: groupName,
          groupPhoto: groupPhoto || "https://via.placeholder.com/100",
          lastMessageTime: timestamp,
          unreadCount: 0,
          role: "member",
          joinedAt: timestamp,
        };
      }
      
      // 4. Crear mensaje de sistema de bienvenida
      const memberNames = selectedMembers.map(m => m.name).join(", ");
      const welcomeMessage = {
        text: `${currentUser.name} agregó ${selectedMembers.length === 1 ? `a ${memberNames}` : `a ${memberNames}`} al grupo`,
        senderId: currentUser.uid,
        senderName: "Sistema",
        senderPhoto: null,
        timestamp: timestamp,
        type: "system",
        read: {},
      };
      
      const messagesRef = ref(db, `chats/${groupId}/messages`);
      const newMessageRef = push(messagesRef);
      updates[`chats/${groupId}/messages/${newMessageRef.key}`] = welcomeMessage;
      
      // 5. Actualizar último mensaje del chat
      updates[`chats/${groupId}/lastMessage`] = {
        text: welcomeMessage.text,
        timestamp: timestamp,
        senderId: currentUser.uid,
      };
      
      // Ejecutar todas las actualizaciones
      await update(ref(db), updates);
      
      // Callback para actualizar la UI
      onMemberAdded && onMemberAdded(selectedMembers);
      onClose();
      resetForm();
      
    } catch (error) {
      console.error("Error adding members:", error);
      alert("Error al agregar miembros al grupo");
    } finally {
      setAdding(false);
    }
  };

  const resetForm = () => {
    setSelectedMembers([]);
    setSearchTerm("");
  };

  if (!isOpen) return null;

  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gradient-to-br from-gray-800 to-gray-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <FaUserPlus className="text-white text-xl" />
            </div>
            <h2 className="text-xl font-bold text-white">Agregar miembros</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Info del grupo */}
          <div className="mb-4 p-3 bg-gray-700/30 rounded-xl">
            <p className="text-gray-400 text-xs">Grupo</p>
            <p className="text-white font-medium">{groupName}</p>
            <p className="text-gray-400 text-xs mt-1">
              {currentMembers.length} miembros actuales
            </p>
          </div>

          {/* Buscar amigos */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Buscar amigos para agregar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Lista de amigos */}
          <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
            <p className="text-sm text-gray-400 mb-2">
              Selecciona amigos para agregar ({selectedMembers.length})
            </p>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <FaSpinner className="text-blue-500 text-2xl animate-spin" />
              </div>
            ) : filteredFriends.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {searchTerm 
                  ? "No se encontraron amigos" 
                  : "No hay amigos disponibles para agregar"}
              </p>
            ) : (
              filteredFriends.map((friend) => (
                <div
                  key={friend.uid}
                  onClick={() => toggleMember(friend)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${
                    selectedMembers.some((m) => m.uid === friend.uid)
                      ? "bg-blue-500/20 border border-blue-500"
                      : "bg-gray-700/30 hover:bg-gray-700/50"
                  }`}
                >
                  <img
                    src={friend.photo || "https://via.placeholder.com/40"}
                    alt={friend.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium">{friend.name}</p>
                    <p className="text-gray-400 text-xs">{friend.email}</p>
                  </div>
                  {selectedMembers.some((m) => m.uid === friend.uid) && (
                    <FaCheck className="text-blue-500" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition"
            >
              Cancelar
            </button>
            <button
              onClick={addMembers}
              disabled={adding || selectedMembers.length === 0}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {adding ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Agregando...
                </>
              ) : (
                <>
                  <FaUserPlus />
                  Agregar ({selectedMembers.length})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}