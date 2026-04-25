// Dashboard.jsx
import { useEffect, useState } from "react";
import { setupPresence } from "./precense";
import { useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { auth } from "./firebase";
import { ref, onValue, set, get, update } from "firebase/database";
import { db } from "./firebase";
import FriendsManager from "./components/FriendsManager";
import { onAuthStateChanged } from "firebase/auth";
import { FaSearch } from "react-icons/fa";
import Chat from "./components/Chat";
import { syncFriendsToFirebase } from "./utils/syncFriends";
import Feed from "./components/Feed";
import { getUserStories } from "./utils/stories";
import StoryRing from "./components/StoryRing";
import StoriesViewer from "./components/StoriesViewer";
import StoryUploader from "./components/StoryUploader";
import BottomBar from "./components/BottomBar";
import { useFullscreen } from "./hooks/useFullscreen";
import ReelsFeed from "./components/ReelsFeed";
import ReelUploader from "./components/ReelUploader";
import { useNotifications } from "./hooks/useNotifications";
import NotificationToast from "./components/NotificationToast";
import ProjectsPage from "./components/ProjectsPage";
import Video from "./components/Video";
import { FaCodeBranch, FaFacebookMessenger } from "react-icons/fa6";

// 🎨 Componente Skeleton para los amigos (lista horizontal)
const FriendsSkeleton = () => (
  <div className="w-full h-auto mt-3 py-1 flex items-center px-4 gap-3 overflow-x-auto">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="flex flex-col items-center p-3 min-w-[90px]">
        <div className="relative">
          <div className="w-[55px] h-[55px] rounded-full bg-gray-700 animate-pulse"></div>
        </div>
        <div className="h-4 w-16 bg-gray-700 rounded mt-2 animate-pulse"></div>
        <div className="h-3 w-12 bg-gray-700 rounded mt-1 animate-pulse"></div>
      </div>
    ))}
  </div>
);

// 🎨 Componente Skeleton para el header del Dashboard
const HeaderSkeleton = () => (
  <div className="w-full h-[55px] flex items-center px-4 pt-1 justify-between">
    <div className="w-auto min-w-[500px] h-[80%] rounded-xl flex items-center gap-4 px-4 bg-[#201f1f]/60 backdrop-blur-md">
      <div className="w-4 h-4 bg-gray-600 rounded animate-pulse"></div>
      <div className="flex-1 h-4 bg-gray-600 rounded animate-pulse"></div>
    </div>
    <div className="flex items-center gap-4 h-full pl-3 pr-2">
      <div className="flex flex-col items-end gap-1">
        <div className="h-4 w-24 bg-gray-700 rounded animate-pulse"></div>
        <div className="h-3 w-32 bg-gray-700 rounded animate-pulse"></div>
      </div>
      <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse"></div>
    </div>
  </div>
);

// 🎨 Componente Skeleton principal del Dashboard
const DashboardSkeleton = () => (
  <div className="flex-1 h-screen bg-[#121212]">
    <HeaderSkeleton />
    <FriendsSkeleton />
  </div>
);

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [storiesStatus, setStoriesStatus] = useState({});
  const [selectedStoryUser, setSelectedStoryUser] = useState(null);
  const [showStoryUploader, setShowStoryUploader] = useState(false);
  const [myStoryStatus, setMyStoryStatus] = useState({
    hasStories: false,
    hasUnseen: false,
  });
  const [totalUnread, setTotalUnread] = useState(0);
  const { enterFullscreen } = useFullscreen();
  // Agrega estos estados
  const [showReelUploader, setShowReelUploader] = useState(false);
  // ... estados existentes ...
  const { requestPermission, notification, setNotification } =
    useNotifications(user);

  // Solicitar permisos de notificación cuando el usuario está logueado
  useEffect(() => {
    if (user) {
      // Esperar un momento para no molestar al usuario al cargar
      const timer = setTimeout(() => {
        requestPermission();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [user, requestPermission]);

  // 🔥 Listener global para detectar mensajes entrantes y actualizar unreadCount
  useEffect(() => {
    if (!user) return;

    const userChatsRef = ref(db, `userChats/${user.uid}`);

    const unsubscribe = onValue(userChatsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setTotalUnread(0);
        return;
      }

      let total = 0;

      Object.values(data).forEach((chat) => {
        total += chat.unreadCount || 0;
      });

      console.log("📊 Total unread:", total);

      setTotalUnread(total);
      console.log("🔥 userChats snapshot:", data);
    });

    return () => unsubscribe();
  }, [user]);

  // Función para obtener datos del usuario desde Firebase
  const getUserData = async (uid) => {
    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  };

  // Función para obtener la lista de amigos desde Firebase
  const getUserFriends = async (uid) => {
    const userRef = ref(db, `users/${uid}/friends`);
    const snapshot = await get(userRef);
    const friendsIds = snapshot.val() || {};

    const friendsList = [];
    for (const friendId of Object.keys(friendsIds)) {
      const friendData = await getUserData(friendId);
      if (friendData) {
        friendsList.push({
          uid: friendId,
          name: friendData.name,
          picture: friendData.photo,
          email: friendData.email,
          status: "offline", // se actualizará después con presencia
        });
      }
    }
    return friendsList;
  };

  // Obtener estado de historias para cada amigo
  useEffect(() => {
    if (!user || users.length === 0) return;

    const fetchStoriesStatus = () => {
      users.forEach((friend) => {
        getUserStories(friend.uid, (storiesList) => {
          const hasStories = storiesList.length > 0;
          const hasUnseen = storiesList.some(
            (story) => !story.viewers?.[user.uid],
          );
          setStoriesStatus((prev) => ({
            ...prev,
            [friend.uid]: { hasStories, hasUnseen },
          }));
        });
      });
    };

    fetchStoriesStatus();
  }, [users, user]);

  // Obtener historias del propio usuario
  useEffect(() => {
    if (!user) return;
    const unsubscribe = getUserStories(user.uid, (storiesList) => {
      const hasStories = storiesList.length > 0;
      setMyStoryStatus({ hasStories, hasUnseen: false });
    });
    return () => unsubscribe();
  }, [user]);

  // Autenticación inicial y carga de datos desde Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.uid);

      if (!firebaseUser) {
        console.log("No user, navigating to login");
        navigate("/");
        setLoading(false);
        return;
      }

      try {
        // Obtener datos del usuario desde Firebase
        const userData = await getUserData(firebaseUser.uid);

        if (!userData) {
          console.error("User data not found in Firebase");
          await auth.signOut();
          navigate("/");
          return;
        }

        console.log("User data from Firebase:", userData);
        setUser({
          uid: firebaseUser.uid,
          name: userData.name,
          email: userData.email,
          picture: userData.photo,
          bio: userData.bio || "",
          role: userData.role || "bronze",
          coverPhoto: userData.coverPhoto || null,
          projects: userData.projects || [],
        });

        // Activar presencia
        setupPresence(firebaseUser);
      } catch (error) {
        console.error("Error fetching user data:", error);
        await auth.signOut();
        navigate("/");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Cargar lista de amigos desde Firebase
  useEffect(() => {
    if (!user) return;

    const loadFriends = async () => {
      setFriendsLoading(true);
      try {
        console.log("Loading friends from Firebase...");
        const friendsList = await getUserFriends(user.uid);
        console.log("Friends loaded:", friendsList);
        setUsers(friendsList);

        // Sincronizar amigos con Firebase para el chat (si es necesario)
        await syncFriendsToFirebase(user, friendsList);
      } catch (error) {
        console.error("Error loading friends:", error);
        setUsers([]);
      } finally {
        setFriendsLoading(false);
      }
    };

    loadFriends();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const userRef = ref(db, `users/${user.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const updatedUser = snapshot.val();
      if (updatedUser) {
        setUser((prev) => ({
          ...prev,
          name: updatedUser.name,
          picture: updatedUser.photo,
        }));

        // Actualizar localStorage
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        storedUser.name = updatedUser.name;
        storedUser.picture = updatedUser.photo;
        localStorage.setItem("user", JSON.stringify(storedUser));
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Estado de presencia (online/offline)
  useEffect(() => {
    if (!user) return;

    const statusRef = ref(db, "status/");

    const unsubscribe = onValue(statusRef, (snapshot) => {
      const statusData = snapshot.val() || {};

      setUsers((currentUsers) =>
        currentUsers.map((u) => {
          const status = statusData[u.uid];

          if (!status) {
            return { ...u, status: "offline" };
          }

          if (status.state === "online") {
            return { ...u, status: "online" };
          }

          const diff = Date.now() - status.lastChanged;
          const minutes = Math.floor(diff / 60000);
          const hours = Math.floor(diff / 3600000);

          let text = "offline";
          if (minutes < 1) text = "hace unos segundos";
          else if (minutes < 60) text = `hace ${minutes} min`;
          else if (hours < 24) text = `hace ${hours} hrs`;
          else text = "ayer";

          return { ...u, status: text };
        }),
      );
    });

    return () => unsubscribe();
  }, [user]);

  const logout = async () => {
    try {
      await auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={logout}
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen bg-[#121212] flex relative">
      {notification && (
        <NotificationToast
          notification={notification}
          onClose={() => setNotification(null)}
        />
      )}
      {activeTab === "reels" ? (
        ""
      ) : (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={logout}
        />
      )}

      <div className="h-[calc(100vh-7vh)] w-full md:w-auto md:flex-1">
        {activeTab === "home" && (
          <div className="flex-1 h-full max-h-full overflow-y-auto bg-[#121212] pb-20 md:pb-0">
            {/* Header Responsive */}
            <div className="w-full h-[10vh] md:h-[55px] sticky top-0 z-10 bg-[#121212]/95 backdrop-blur-sm">
              <div className="w-full h-full flex items-center px-3 md:px-4 pt-1 justify-between gap-3">
                {/* Search Bar - Responsive */}
                <div className="flex-1 max-w-full hidden md:flex md:max-w-[400px] lg:max-w-[500px] h-[80%] rounded-xl items-center gap-2 md:gap-4 px-3 md:px-4 bg-[#201f1f]/60 backdrop-blur-md">
                  <FaSearch className="text-gray-400 text-sm md:text-base flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Buscar proyectos o miembros"
                    className="h-full bg-transparent border-none focus:outline-none flex-1 text-gray-400 text-sm md:text-base placeholder:text-xs md:placeholder:text-sm min-w-0"
                  />
                </div>

                <div className="h-full px-1 flex items-center md:hidden">
                  <img src="/logo2.png" className="h-[75%] w-auto" alt="" />
                </div>

                {/* User Profile - Responsive */}
                <div
                  className="flex items-center gap-2 md:gap-4 h-full pl-2 md:pl-3 pr-1 md:pr-2 hover:bg-[#393939]/60 hover:backdrop-blur-md transition-all rounded-xl cursor-pointer flex-shrink-0"
                  onClick={() => navigate(`/profile/${user?.uid}`)}
                >
                  <div className="hidden sm:flex flex-col">
                    <p className="text-xs md:text-sm self-end font-bold text-white truncate max-w-[120px] md:max-w-none">
                      {user?.name}
                    </p>
                    <p className="hidden lg:block text-[10px] text-gray-400 font-light truncate max-w-[150px]">
                      {user?.email}
                    </p>
                  </div>
                  <img
                    src={user?.picture}
                    className="hidden lg:block rounded-full h-9 w-9 md:h-2/3 md:w-auto object-cover"
                    alt=""
                  />
                </div>
                <div className="gap-2 flex items-center">
                  <button
                    onClick={() => setActiveTab("messages")}
                    className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all relative border-2 border-white`}
                  >
                    <FaFacebookMessenger className="text-2xl text-white" />
                    {totalUnread > 0 && (
                      <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {totalUnread > 99 ? "99+" : totalUnread}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("projects")}
                    className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all relative border-2 border-white`}
                  >
                    <FaCodeBranch className="text-2xl text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Stories Section - Responsive */}
            <div className="w-full h-auto">
              <div className="w-full h-auto flex items-center px-3 md:px-4 gap-2 md:gap-3 overflow-x-auto scrollbar-hide">
                {/* MI ESTADO - Siempre primero */}
                <div
                  className="flex flex-col items-center hover:bg-[#393939]/60 hover:backdrop-blur-md transition-all rounded-xl cursor-pointer p-2 md:p-3 min-w-[70px] md:min-w-[90px] flex-shrink-0"
                  onClick={() => {
                    if (myStoryStatus.hasStories) {
                      setSelectedStoryUser({
                        uid: user.uid,
                        name: user.name,
                        picture: user.picture,
                      });
                    } else {
                      setShowStoryUploader(true);
                    }
                  }}
                >
                  <div className="relative w-[55px] h-[55px] md:w-[55px] md:h-[55px]">
                    <StoryRing
                      hasStories={myStoryStatus.hasStories}
                      hasUnseenStory={false}
                    >
                      <img
                        src={user?.picture}
                        className="w-full h-full rounded-full object-cover"
                        alt=""
                      />
                    </StoryRing>
                  </div>
                  <p className="text-sm md:text-sm font-bold text-white text-center truncate max-w-[60px] md:max-w-[80px]">
                    Mi Estado
                  </p>
                  <p className="text-[12px] md:text-[12px] text-gray-400 text-center">
                    {myStoryStatus.hasStories ? "Ver historia" : "Agregar"}
                  </p>
                </div>

                <div className="px-3 md:px-4">
                  <button
                    onClick={() => setShowStoryUploader(true)}
                    className="border-2 border-white text-white px-3 md:px-4 py-2 md:py-2 text-xs md:text-sm font-semibold w-full sm:w-auto flex flex-col items-center hover:bg-[#393939]/60 hover:backdrop-blur-md transition-all rounded-xl cursor-pointer p-2 md:p-3 min-w-[70px] md:min-w-[90px] flex-shrink-0"
                  >
                    + Agregar historia
                  </button>
                </div>

                {/* Separador visual */}
                <div className="w-px h-10 md:h-12 bg-gray-600 mx-1 md:mx-2 flex-shrink-0"></div>

                {friendsLoading ? (
                  <FriendsSkeleton />
                ) : users.length === 0 ? (
                  <div className="w-full text-center py-8 px-4">
                    <p className="text-gray-400 text-sm md:text-base">
                      No tienes amigos aún
                    </p>
                    <p className="text-xs md:text-sm text-gray-500 mt-1">
                      Ve a la pestaña "Comunidad" para agregar amigos
                    </p>
                  </div>
                ) : (
                  users.map((u) => {
                    const storyStatus = storiesStatus[u.uid] || {
                      hasStories: false,
                      hasUnseen: false,
                    };

                    return (
                      <div
                        key={u.uid}
                        className="flex flex-col items-center hover:bg-[#393939]/60 hover:backdrop-blur-md transition-all rounded-xl cursor-pointer p-2 md:p-3 min-w-[70px] md:min-w-[90px] flex-shrink-0"
                      >
                        <div className="relative w-[40px] h-[40px] md:w-[45px] md:h-[45px]">
                          <StoryRing
                            hasStories={storyStatus.hasStories}
                            hasUnseenStory={storyStatus.hasUnseen}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (storyStatus.hasStories) {
                                setSelectedStoryUser(u);
                              }
                            }}
                          >
                            <img
                              src={u.picture}
                              className="w-full h-full rounded-full object-cover"
                              alt=""
                            />
                          </StoryRing>

                          {/* Indicador online */}
                          {u.status === "online" && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-400 rounded-full border-2 border-black z-10"></span>
                          )}
                        </div>

                        <p className="text-sm md:text-sm font-bold text-white text-center truncate max-w-[60px] md:max-w-[80px]">
                          {u.name}
                        </p>
                        <p className="text-[10px] md:text-[12px] text-gray-400 text-center">
                          {u.status === "online" ? "En línea" : u.status}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <Feed currentUser={user} />
          </div>
        )}
        {activeTab === "reels" && <Video currentUser={user} />}
        {activeTab === "projects" && <ProjectsPage currentUser={user} />}
        {activeTab === "community" && <FriendsManager user={user} />}
        {activeTab === "messages" && <Chat currentUser={user} />}

        {/* BottomBar - Solo visible en móvil */}
      </div>
      <BottomBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalUnread={totalUnread}
        user={user}
      />
      {showReelUploader && (
        <ReelUploader
          currentUser={user}
          onClose={() => setShowReelUploader(false)}
          onSuccess={() => {
            // Opcional: refrescar
          }}
        />
      )}
      {/* Modales fuera del contenido principal */}
      {selectedStoryUser && (
        <StoriesViewer
          userId={selectedStoryUser.uid}
          userName={selectedStoryUser.name}
          userPhoto={selectedStoryUser.picture}
          currentUserId={user.uid}
          onClose={() => setSelectedStoryUser(null)}
        />
      )}
      {showStoryUploader && (
        <StoryUploader
          userId={user.uid}
          onClose={() => setShowStoryUploader(false)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}
