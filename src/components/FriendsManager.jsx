// FriendsManager.jsx
import { useEffect, useState } from "react";
import { ref, set } from "firebase/database";
import { db } from "../firebase";
import {
  getMyFriends,
  getReceivedRequests,
  sendFriendRequest,
  acceptFriendRequest,
  searchUsers,
} from "../firebaseService";

export default function FriendsManager({ user}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [activeTab, setActiveTab] = useState("friends"); // 'friends' o 'requests'
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  // Mostrar notificación temporal
  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "" }),
      3000,
    );
  };

  // 🔍 BUSCAR USUARIOS
  const handleSearch = async () => {
    if (!search.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const resultsData = await searchUsers(user.uid, search);
      setResults(resultsData);
    } catch (error) {
      console.error("Error searching users:", error);
      showNotification(error.message || "Error al buscar usuarios", "error");
    } finally {
      setLoading(false);
    }
  };

  // 🤝 ENVIAR SOLICITUD
  const handleSendRequest = async (to_uid, userName) => {
    try {
      await sendFriendRequest(user.uid, to_uid);
      showNotification(`Solicitud enviada a ${userName} 🚀`);
      setResults((prev) => prev.filter((u) => u.uid !== to_uid));
    } catch (error) {
      console.error("Error sending request:", error);
      showNotification(error.message || "Error al enviar solicitud", "error");
    }
  };

  // 📩 OBTENER SOLICITUDES
  const fetchRequests = async () => {
    try {
      const requestsData = await getReceivedRequests(user.uid);
      setRequests(requestsData);
    } catch (error) {
      console.error("Error fetching requests:", error);
      setRequests([]);
    }
  };

  // 👥 OBTENER MIS AMIGOS
  const fetchFriends = async () => {
    try {
      const friendsData = await getMyFriends(user.uid);
      setFriends(friendsData);
    } catch (error) {
      console.error("Error fetching friends:", error);
      setFriends([]);
    }
  };

  // ✅ ACEPTAR SOLICITUD - Versión corregida
  const handleAcceptRequest = async (from_uid, userName, userPhoto) => {
    try {
      await acceptFriendRequest(user.uid, from_uid);

      // Inicializar chat en Firebase
      const chatId = [user.uid, from_uid].sort().join("_");

      // Usar la foto que viene de la solicitud
      const friendPhoto = userPhoto || "";

      await set(ref(db, `userChats/${user.uid}/${from_uid}`), {
        chatId: chatId,
        lastMessage: "",
        lastMessageTime: Date.now(),
        userName: userName,
        userPhoto: friendPhoto,
        unreadCount: 0,
      });

      await set(ref(db, `userChats/${from_uid}/${user.uid}`), {
        chatId: chatId,
        lastMessage: "",
        lastMessageTime: Date.now(),
        userName: user.name,
        userPhoto: user.picture,
        unreadCount: 0,
      });

      showNotification(`¡Ahora eres amigo de ${userName}! 🎉`);
      setRequests((prev) => prev.filter((r) => r.uid !== from_uid));
      fetchFriends(); // Recargar lista de amigos
    } catch (error) {
      console.error("Error accepting request:", error);
      showNotification(error.message || "Error al aceptar solicitud", "error");
    }
  };

  // 🗑️ RECHAZAR SOLICITUD (opcional)
  const handleRejectRequest = async (from_uid, userName) => {
    try {
      // Eliminar solicitudes
      await set(
        ref(db, `users/${user.uid}/receivedRequests/${from_uid}`),
        null,
      );
      await set(ref(db, `users/${from_uid}/sentRequests/${user.uid}`), null);
      showNotification(`Solicitud de ${userName} rechazada`, "info");
      setRequests((prev) => prev.filter((r) => r.uid !== from_uid));
    } catch (error) {
      console.error("Error rejecting request:", error);
      showNotification("Error al rechazar solicitud", "error");
    }
  };

  // Debounce para búsqueda
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (search.trim()) {
        handleSearch();
      } else {
        setResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  // Cargar datos iniciales
  useEffect(() => {
    if (user) {
      fetchRequests();
      fetchFriends();

      // Refresh cada 30 segundos
      const interval = setInterval(() => {
        fetchRequests();
        fetchFriends();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <div className="h-[calc(100vh - 70px)] bg-[#18191A] flex flex-col">
      {/* Notificación flotante estilo Facebook */}
      {notification.show && (
        <div
          className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg animate-fade-in ${
            notification.type === "error" ? "bg-red-500" : "bg-[#2e9b4f]"
          } text-white font-medium`}
        >
          {notification.message}
        </div>
      )}

      <div className="max-w-5xl mx-auto h-full px-4 py-6 flex flex-col flex-1 overflow-auto pb-[80px]">
        {/* Header con buscador estilo Facebook */}
        <div className="bg-[#242526] rounded-2xl p-4 mb-6 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-2xl font-bold text-[#E4E6EB]">Amigos</h1>

            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar amigos..."
                className="w-full bg-[#3A3B3C] text-[#E4E6EB] pl-10 pr-4 py-2 rounded-full outline-none focus:ring-2 focus:ring-[#2e9b4f] transition"
              />
            </div>
          </div>
        </div>

        {/* Resultados de búsqueda (si hay) */}
        {search && results.length > 0 && (
          <div className="bg-[#242526] rounded-2xl p-4 mb-6 shadow-lg">
            <h3 className="text-lg font-semibold text-[#E4E6EB] mb-3">
              Resultados de búsqueda
            </h3>
            <div className="space-y-2">
              {results.map((u) => (
                <div
                  key={u.uid}
                  className="flex items-center justify-between p-3 hover:bg-[#3A3B3C] rounded-xl transition"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={u.picture || "https://via.placeholder.com/50"}
                      alt={u.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-[#E4E6EB]">{u.name}</p>
                      <p className="text-sm text-gray-400">{u.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSendRequest(u.uid, u.name)}
                    className="bg-[#2e9b4f] hover:bg-[#268e46] text-white px-4 py-2 rounded-full text-sm font-semibold transition"
                  >
                    Agregar amigo
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs estilo Facebook */}
        <div className="bg-[#242526] rounded-2xl shadow-lg ">
          <div className="border-b border-[#3E4042]">
            <div className="flex">
              <button
                onClick={() => setActiveTab("friends")}
                className={`flex-1 px-6 py-4 text-center font-semibold transition relative ${
                  activeTab === "friends"
                    ? "text-[#2e9b4f]"
                    : "text-[#B0B3B8] hover:bg-[#3A3B3C]"
                }`}
              >
                Mis Amigos
                {friends.length > 0 && (
                  <span className="ml-2 bg-[#3A3B3C] text-[#E4E6EB] px-2 py-0.5 rounded-full text-xs">
                    {friends.length}
                  </span>
                )}
                {activeTab === "friends" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#2e9b4f] rounded-t-full"></div>
                )}
              </button>

              <button
                onClick={() => setActiveTab("requests")}
                className={`flex-1 px-6 py-4 text-center font-semibold transition relative ${
                  activeTab === "requests"
                    ? "text-[#2e9b4f]"
                    : "text-[#B0B3B8] hover:bg-[#3A3B3C]"
                }`}
              >
                Solicitudes
                {requests.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">
                    {requests.length}
                  </span>
                )}
                {activeTab === "requests" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#2e9b4f] rounded-t-full"></div>
                )}
              </button>
            </div>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            {/* Tab de Mis Amigos */}
            {activeTab === "friends" && (
              <>
                {friends.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">👥</div>
                    <p className="text-[#B0B3B8] text-lg">
                      No tienes amigos aún
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      Busca personas para agregar como amigos
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {friends.map((friend) => (
                      <div
                        key={friend.uid}
                        className="bg-[#3A3B3C] rounded-xl p-4 hover:bg-[#4E4F50] transition"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              friend.photo || "https://via.placeholder.com/60"
                            }
                            alt={friend.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-[#E4E6EB] text-lg">
                              {friend.name}
                            </p>
                            <p className="text-sm text-gray-400">
                              {friend.email}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <button className="text-xs text-[#2e9b4f] hover:text-[#268e46] transition">
                                Mensaje
                              </button>
                              <span className="text-gray-600">•</span>
                              <button className="text-xs text-gray-400 hover:text-white transition">
                                Ver perfil
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Tab de Solicitudes */}
            {activeTab === "requests" && (
              <>
                {requests.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📬</div>
                    <p className="text-[#B0B3B8] text-lg">
                      No hay solicitudes pendientes
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      Cuando alguien te envíe una solicitud, aparecerá aquí
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requests.map((request) => (
                      <div
                        key={request.uid}
                        className="bg-[#3A3B3C] rounded-xl p-4 hover:bg-[#4E4F50] transition"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                request.picture ||
                                "https://via.placeholder.com/50"
                              }
                              alt={request.name}
                              className="w-14 h-14 rounded-full object-cover"
                            />
                            <div>
                              <p className="font-semibold text-[#E4E6EB] text-lg">
                                {request.name}
                              </p>
                              <p className="text-sm text-gray-400">
                                {request.email}
                              </p>
                              <p className="text-xs text-[#2e9b4f] mt-1">
                                Te envió una solicitud de amistad
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleAcceptRequest(
                                  request.uid,
                                  request.name,
                                  request.picture,
                                )
                              }
                              className="bg-[#2e9b4f] hover:bg-[#268e46] text-white px-6 py-2 rounded-full text-sm font-semibold transition"
                            >
                              Confirmar
                            </button>
                            <button className="bg-[#4E4F50] hover:bg-[#5E5F60] text-[#E4E6EB] px-6 py-2 rounded-full text-sm font-semibold transition">
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
