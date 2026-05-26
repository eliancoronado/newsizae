// components/CreateGroupModal.jsx
import { useState, useEffect } from "react";
import { ref, get, push, set, update } from "firebase/database";
import { db } from "../firebase";
import { FaTimes, FaCheck, FaUsers, FaImage } from "react-icons/fa";
import { uploadToS3 } from "../utils/uploadToS3SDK";

export default function CreateGroupModal({
  isOpen,
  onClose,
  currentUser,
  onGroupCreated,
}) {
  const [groupName, setGroupName] = useState("");
  const [groupPhoto, setGroupPhoto] = useState(null);
  const [groupPhotoPreview, setGroupPhotoPreview] = useState(null);
  const [friends, setFriends] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      loadFriends();
    }
  }, [isOpen, currentUser]);

  const loadFriends = async () => {
    try {
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
            photo: userSnap.val().photo || "https://via.placeholder.com/100",
            email: userSnap.val().email || "",
          });
        }
      }
      setFriends(friendsList);
    } catch (error) {
      console.error("Error loading friends:", error);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setGroupPhoto(file);
      setGroupPhotoPreview(URL.createObjectURL(file));
    }
  };

  const toggleMember = (friend) => {
    if (selectedMembers.some((m) => m.uid === friend.uid)) {
      setSelectedMembers(selectedMembers.filter((m) => m.uid !== friend.uid));
    } else {
      setSelectedMembers([...selectedMembers, friend]);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      alert("Por favor ingresa un nombre para el grupo");
      return;
    }
    if (selectedMembers.length === 0) {
      alert("Selecciona al menos un miembro para el grupo");
      return;
    }

    setLoading(true);
    try {
      let groupPhotoUrl = null;
      if (groupPhoto) {
        setUploadingPhoto(true);
        groupPhotoUrl = await uploadToS3(groupPhoto);
        setUploadingPhoto(false);
      }

      const groupId = push(ref(db, "groups")).key;
      const timestamp = Date.now();
      // En createGroup, cambia:
      // En createGroup, modifica allMembers:
      const allMembers = [
        {
          uid: currentUser.uid,
          name: currentUser.name || "Usuario",
          photo: currentUser.photo || "https://via.placeholder.com/100", // ⬅️ Valor por defecto
          role: "admin",
          joinedAt: timestamp,
        },
        ...selectedMembers.map((m) => ({
          uid: m.uid,
          name: m.name || "Usuario",
          photo: m.photo || "https://via.placeholder.com/100", // ⬅️ Valor por defecto
          role: "member",
          joinedAt: timestamp,
        })),
      ];
      // Crear el grupo
      await set(ref(db, `groups/${groupId}`), {
        id: groupId,
        name: groupName.trim(),
        photo: groupPhotoUrl,
        createdAt: timestamp,
        createdBy: currentUser.uid,
        createdByName: currentUser.name,
        members: allMembers.reduce((acc, m) => ({ ...acc, [m.uid]: m }), {}),
        memberCount: allMembers.length,
      });

      // Para cada miembro, agregar el grupo a userGroups
      for (const member of allMembers) {
        await set(ref(db, `userGroups/${member.uid}/${groupId}`), {
          groupId,
          groupName: groupName.trim(),
          groupPhoto: groupPhotoUrl,
          lastMessageTime: timestamp,
          unreadCount: 0,
          role: member.role,
        });
      }

      // Crear chat del grupo
      await set(ref(db, `chats/${groupId}`), {
        type: "group",
        participants: allMembers.reduce(
          (acc, m) => ({ ...acc, [m.uid]: true }),
          {},
        ),
        createdAt: timestamp,
        createdBy: currentUser.uid,
      });

      // Mensaje de bienvenida
      const welcomeMessage = {
        text: `${currentUser.name || "Usuario"} creó el grupo "${groupName}"`,
        senderId: currentUser.uid,
        senderName: currentUser.name || "Usuario",
        senderPhoto: currentUser.photo || "https://via.placeholder.com/100",
        timestamp: Date.now(),
        type: "system",
        read: {},
      };

      await push(ref(db, `chats/${groupId}/messages`), welcomeMessage);

      await update(ref(db, `chats/${groupId}`), {
        lastMessage: {
          text: welcomeMessage.text,
          timestamp: welcomeMessage.timestamp,
          senderId: currentUser.uid,
        },
      });

      onGroupCreated && onGroupCreated();
      onClose();
      resetForm();
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Error al crear el grupo");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setGroupName("");
    setGroupPhoto(null);
    setGroupPhotoPreview(null);
    setSelectedMembers([]);
    setSearchTerm("");
  };

  if (!isOpen) return null;

  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gradient-to-br from-gray-800 to-gray-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <FaUsers className="text-white text-xl" />
            </div>
            <h2 className="text-xl font-bold text-white">Crear grupo</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Foto del grupo */}
          <div className="flex justify-center mb-6">
            <label className="cursor-pointer group">
              <div className="relative">
                {groupPhotoPreview ? (
                  <img
                    src={groupPhotoPreview}
                    alt="Group"
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-600"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center border-4 border-gray-600">
                    <FaUsers className="text-4xl text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <FaImage className="text-white text-xl" />
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Nombre del grupo */}
          <input
            type="text"
            placeholder="Nombre del grupo"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
          />

          {/* Buscar amigos */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Buscar amigos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Lista de amigos */}
          <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
            <p className="text-sm text-gray-400 mb-2">
              Selecciona miembros ({selectedMembers.length})
            </p>
            {filteredFriends.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No hay amigos disponibles
              </p>
            ) : (
              filteredFriends.map((friend) => (
                <div
                  key={friend.uid}
                  onClick={() => toggleMember(friend)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${selectedMembers.some((m) => m.uid === friend.uid) ? "bg-green-500/20 border border-green-500" : "bg-gray-700/30 hover:bg-gray-700/50"}`}
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
                    <FaCheck className="text-green-500" />
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
              onClick={createGroup}
              disabled={
                loading || !groupName.trim() || selectedMembers.length === 0
              }
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear grupo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
