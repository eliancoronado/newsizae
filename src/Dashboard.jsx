// Dashboard.jsx
import { useEffect, useState, useRef } from "react";
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
import { BiSolidMessageAltDetail } from "react-icons/bi";
import { preloadFFmpeg } from "./utils/uploadToS3SDK";
import SubscriptionPage from "./components/SubscriptionPage";

// Agregar al inicio del archivo, después de las importaciones
const styles = `
  @keyframes glowPulse {
    0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
    70% { box-shadow: 0 0 0 20px rgba(255, 215, 0, 0); }
    100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
  }
  
  @keyframes slideInDown {
    from {
      opacity: 0;
      transform: translateY(-100px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(100px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }
  
  @keyframes shine {
    0% { background-position: -100% 0; }
    100% { background-position: 200% 0; }
  }
  
  @keyframes borderPulse {
    0%, 100% { border-color: rgba(255, 215, 0, 0.3); }
    50% { border-color: rgba(255, 215, 0, 1); }
  }
  
  .modal-overlay {
    animation: fadeIn 0.3s ease-out;
  }
  
  .modal-content-ceo {
    animation: slideInDown 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
  
  .modal-content-executive {
    animation: slideInUp 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
  
  .modal-content-investor {
    animation: scaleIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
  
  .glow-effect {
    animation: glowPulse 2s infinite;
  }
  
  .float-effect {
    animation: float 3s ease-in-out infinite;
  }
  
  .shine-effect {
    background: linear-gradient(90deg, transparent, rgba(255,215,0,0.2), transparent);
    background-size: 200% 100%;
    animation: shine 2s infinite;
  }
  
  .border-pulse {
    animation: borderPulse 2s ease-in-out infinite;
  }
  
  .confetti {
    position: absolute;
    width: 10px;
    height: 10px;
    background: gold;
    animation: fall 3s linear forwards;
  }
  
  @keyframes fall {
    to {
      transform: translateY(100vh) rotate(360deg);
      opacity: 0;
    }
  }
`;

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
  const [isAuthInitialized, setIsAuthInitialized] = useState(false); // 🔥 NUEVO ESTADO
  const [totalUnread, setTotalUnread] = useState(0);
  const { enterFullscreen } = useFullscreen();
  // Agrega estos estados
  const [badgeVersion, setBadgeVersion] = useState(0);
  const [showReelUploader, setShowReelUploader] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [userRole, setUserRole] = useState(null);
  // ... estados existentes ...
  const { requestPermission, notification, setNotification } =
    useNotifications(user);

  useEffect(() => {
    preloadFFmpeg(); // Precargar FFmpeg en segundo plano
  }, []);

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

  // Modal de bienvenida para junta directiva
  useEffect(() => {
    if (!user || !user.email) return;

    // Definir los miembros de la junta directiva
    const executiveTeam = {
      "cuentaparaelian12@gmail.com": {
        role: "CEO",
        name: "Elián",
        fullName: "Elián Coronado",
        title: "CEO, Fundador y Dueño 1/4",
        company: "SIZAE Corp. | BabooNET | BabooApp",
        honorific: "🌟 Visionario Supremo 🌟",
        color: "from-yellow-400 to-amber-600",
        borderColor: "border-yellow-400",
        bgGradient:
          "bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100",
        icon: "👑",
        description:
          "Creador de la visión, líder indiscutible y el corazón de toda la operación. Su genialidad ha hecho posible este ecosistema digital.",
      },
      "gabrielquirozg26@gmail.com": {
        role: "COO",
        name: "Gabriel",
        fullName: "Gabriel Quiroz G.",
        title: "COO - Director de Operaciones 1/4",
        company: "SIZAE Corp.",
        honorific: "✨ El Estratega Maestro ✨",
        color: "from-blue-400 to-indigo-600",
        borderColor: "border-blue-400",
        bgGradient: "bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100",
        icon: "⚙️",
        description:
          "Inspirador del Lenguaje de Bloques Qui-roz, aprueba los cambios y garantiza la excelencia operativa. La mente maestra detrás de la ejecución perfecta.",
      },
      "waskartgonzalez53@gmail.com": {
        role: "INVESTOR",
        name: "Waskart",
        fullName: "Waskart González",
        title: "Inversor Principal 1/4",
        company: "SIZAE Corp.",
        honorific: "💎 El Patrocinador Legendario 💎",
        color: "from-green-400 to-emerald-600",
        borderColor: "border-green-400",
        bgGradient:
          "bg-gradient-to-br from-green-50 via-emerald-50 to-green-100",
        icon: "💎",
        description:
          'Su nombre inspira el lenguaje de programación "Waskart", el primer lenguaje en español rápido, fácil y eficiente. El pilar financiero de la revolución tecnológica.',
      },
    };

    const userEmail = user.email;
    const member = executiveTeam[userEmail];

    // Verificar si el usuario es miembro de la junta y si ya ha visto el modal
    if (member) {
      const hasSeenModal = localStorage.getItem(`welcome_modal_${userEmail}`);
      if (!hasSeenModal) {
        setUserRole(member);
        setShowWelcomeModal(true);
      }
    }
  }, [user?.email]);

  // 🔥 Listener global para detectar mensajes entrantes y actualizar unreadCount
  useEffect(() => {
    if (!user) return;

    const userChatsRef = ref(db, `userChats/${user.uid}`);

    const unsubscribe = onValue(userChatsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setTotalUnread(0);
        setBadgeVersion((prev) => prev + 1); // 🔥 Forzar actualización
        return;
      }

      let total = 0;
      Object.values(data).forEach((chat) => {
        total += chat.unreadCount || 0;
      });

      console.log("📊 Total unread en Dashboard:", total);
      setTotalUnread(total);
      setBadgeVersion((prev) => prev + 1); // 🔥 Forzar actualización del badge
    });

    return () => unsubscribe();
  }, [user, activeTab]);

  // Cargar video compartido al cambiar a reels
  // Detectar cuando hay un video compartido para cambiar a reels
  useEffect(() => {
    const checkSharedVideo = () => {
      const sharedVideoId = localStorage.getItem("sharedVideoId");
      if (sharedVideoId && activeTab !== "reels") {
        setActiveTab("reels");
      }
    };

    // Verificar al montar y cuando cambia la URL
    checkSharedVideo();

    // También verificar periódicamente (por si acaso)
    const interval = setInterval(checkSharedVideo, 500);
    return () => clearInterval(interval);
  }, [activeTab]);

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

  // 🔥 PRIMERO: Verificar si hay login por API en localStorage
  useEffect(() => {
    const checkApiLogin = async () => {
      const apiLogin = localStorage.getItem("apiLogin");
      const storedUser = localStorage.getItem("user");

      if (apiLogin === "true" && storedUser) {
        console.log("🔐 Login por API detectado");
        const userData = JSON.parse(storedUser);

        // Crear un usuario simulado para Firebase Auth (opcional)
        // No necesitamos Firebase Auth real, solo los datos
        setUser({
          uid: userData.uid,
          name: userData.name,
          email: userData.email,
          picture: userData.picture,
          bio: userData.bio || "",
          role: userData.role || "",
          coverPhoto: null,
          projects: [],
        });

        setLoading(false);
        setIsAuthInitialized(true);
        return true; // Indica que es login por API
      }
      return false;
    };

    checkApiLogin();
  }, []);

  // 🔥 PRIMERO: Esperar a que Firebase Auth termine de inicializar
  // 🔥 SEGUNDO: Esperar a que Firebase Auth termine de inicializar (solo para login normal)
  useEffect(() => {
    // Si ya hay login por API, no procesar Firebase Auth
    const apiLogin = localStorage.getItem("apiLogin");
    if (apiLogin === "true") {
      console.log("⏭️ Saltando Firebase Auth por API Login");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("🔐 Auth state changed:", firebaseUser?.uid);
      setIsAuthInitialized(true);

      if (!firebaseUser) {
        console.log("❌ No authenticated user");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("apiLogin");
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // 🔥 SEGUNDO: Cargar datos del usuario SOLO después de que Auth esté inicializado
  // En Dashboard.jsx, modifica el useEffect de autenticación:

  // 🔥 PRIMERO: Verificar si hay login por API en localStorage
  useEffect(() => {
    const checkApiLogin = async () => {
      const apiLogin = localStorage.getItem("apiLogin");
      const storedUser = localStorage.getItem("user");

      if (apiLogin === "true" && storedUser) {
        console.log("🔐 Login por API detectado");
        const userData = JSON.parse(storedUser);

        // Crear un usuario simulado para Firebase Auth (opcional)
        // No necesitamos Firebase Auth real, solo los datos
        setUser({
          uid: userData.uid,
          name: userData.name,
          email: userData.email,
          picture: userData.picture,
          bio: userData.bio || "",
          role: userData.role || "",
          coverPhoto: null,
          projects: [],
        });

        setLoading(false);
        setIsAuthInitialized(true);
        return true; // Indica que es login por API
      }
      return false;
    };

    checkApiLogin();
  }, []);

  // 🔥 SEGUNDO: Esperar a que Firebase Auth termine de inicializar (solo para login normal)
  useEffect(() => {
    // Si ya hay login por API, no procesar Firebase Auth
    const apiLogin = localStorage.getItem("apiLogin");
    if (apiLogin === "true") {
      console.log("⏭️ Saltando Firebase Auth por API Login");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("🔐 Auth state changed:", firebaseUser?.uid);
      setIsAuthInitialized(true);

      if (!firebaseUser) {
        console.log("❌ No authenticated user");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("apiLogin");
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // 🔥 TERCERO: Cargar datos del usuario (funciona para ambos casos)
  useEffect(() => {
    if (!isAuthInitialized) return;

    const loadUserData = async () => {
      // Verificar API login primero
      const apiLogin = localStorage.getItem("apiLogin");
      const storedUser = localStorage.getItem("user");

      if (apiLogin === "true" && storedUser) {
        const userData = JSON.parse(storedUser);
        console.log("✅ Usuario por API:", userData);

        // Asegurar que el usuario existe en Firebase DB
        try {
          const userRef = ref(db, `users/${userData.uid}`);
          const snapshot = await get(userRef);

          if (!snapshot.exists()) {
            await set(userRef, {
              uid: userData.uid,
              email: userData.email || "",
              name: userData.name || "Usuario",
              photo: userData.picture || "",
              bio: "Hola, estoy usando esta increíble app",
              role: "none",
              coverPhoto: null,
              projects: [],
              friends: {},
              sentRequests: {},
              receivedRequests: {},
              createdAt: Date.now(),
              lastSeen: Date.now(),
            });
          }

          // Actualizar datos del usuario
          const freshUserData = await getUserData(userData.uid);
          if (freshUserData) {
            setUser({
              uid: userData.uid,
              name: freshUserData.name,
              email: freshUserData.email,
              picture: freshUserData.photo,
              bio: freshUserData.bio || "",
              role: freshUserData.role || "none",
              coverPhoto: freshUserData.coverPhoto || null,
              projects: freshUserData.projects || [],
            });
          } else {
            setUser({
              uid: userData.uid,
              name: userData.name,
              email: userData.email,
              picture: userData.picture,
              bio: "",
              role: "none",
              coverPhoto: null,
              projects: [],
            });
          }
        } catch (error) {
          console.error("Error syncing API user to DB:", error);
          setUser({
            uid: userData.uid,
            name: userData.name,
            email: userData.email,
            picture: userData.picture,
            bio: "",
            role: "none",
            coverPhoto: null,
            projects: [],
          });
        }

        setLoading(false);
        return;
      }

      // Login normal con Firebase
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const userData = await getUserData(firebaseUser.uid);
        if (!userData) {
          await auth.signOut();
          navigate("/");
          return;
        }

        setUser({
          uid: firebaseUser.uid,
          name: userData.name,
          email: userData.email,
          picture: userData.photo,
          bio: userData.bio || "",
          role: userData.role || "none",
          coverPhoto: userData.coverPhoto || null,
          projects: userData.projects || [],
        });

        setupPresence(firebaseUser);
      } catch (error) {
        console.error("Error fetching user data:", error);
        await auth.signOut();
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [isAuthInitialized, navigate]);

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
      // Limpiar localStorage
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("apiLogin");

      // Cerrar sesión de Firebase solo si hay usuario autenticado
      const currentUser = auth.currentUser;
      if (currentUser) {
        await auth.signOut();
      }
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Modal de bienvenida para junta directiva
  const WelcomeModal = () => {
    if (!showWelcomeModal || !userRole) return null;

    const isCEO = userRole.role === "CEO";
    const isCOO = userRole.role === "COO";
    const isInvestor = userRole.role === "INVESTOR";

    const handleClose = () => {
      localStorage.setItem(`welcome_modal_${user.email}`, "true");
      setShowWelcomeModal(false);
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center modal-overlay bg-black/70 backdrop-blur-sm">
        {/* Confeti animado solo para CEO */}
        {isCEO && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  background: `hsl(${Math.random() * 60 + 40}, 100%, 50%)`,
                  width: `${Math.random() * 8 + 4}px`,
                  height: `${Math.random() * 8 + 4}px`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${Math.random() * 2 + 2}s`,
                }}
              />
            ))}
          </div>
        )}

        <div
          className={`relative w-full max-w-2xl mx-4 ${
            isCEO
              ? "modal-content-ceo"
              : isCOO
                ? "modal-content-executive"
                : "modal-content-investor"
          }`}
        >
          {/* Caja principal */}
          <div
            className={`relative rounded-2xl overflow-hidden ${userRole.bgGradient} border-2 ${userRole.borderColor} shadow-2xl`}
          >
            {/* Efecto shine solo para CEO */}
            {isCEO && (
              <div className="absolute inset-0 shine-effect pointer-events-none"></div>
            )}

            {/* Contenido */}
            <div className="relative p-6 md:p-8">
              {/* Icono superior flotante */}
              <div
                className={`flex justify-center mb-4 ${isCEO ? "float-effect" : ""}`}
              >
                <div
                  className={`text-7xl md:text-8xl ${isCEO ? "glow-effect" : ""}`}
                >
                  {userRole.icon}
                </div>
              </div>

              {/* Badge de honor */}
              <div className="flex justify-center mb-4">
                <div
                  className={`px-4 py-1 rounded-full bg-gradient-to-r ${userRole.color} text-white font-bold text-sm shadow-lg border-pulse`}
                >
                  {userRole.honorific}
                </div>
              </div>

              {/* Título principal */}
              <h1 className="text-3xl md:text-5xl font-bold text-center mb-2 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {isCEO
                  ? "🏆 ¡Bienvenido, Gran Líder! 🏆"
                  : isCOO
                    ? "✨ Honorable Miembro de la Junta ✨"
                    : "💎 Ilustre Visionario 💎"}
              </h1>

              {/* Nombre destacado */}
              <div className="text-center mb-6">
                <p className="text-xl md:text-2xl font-bold text-gray-800">
                  {userRole.fullName}
                </p>
                <p className="text-md md:text-lg text-gray-600 font-semibold mt-1">
                  {userRole.title}
                </p>
              </div>

              {/* Descripción y honores */}
              <div className="space-y-4 mb-6">
                <div className="bg-white/50 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-gray-700 text-center leading-relaxed">
                    {userRole.description}
                  </p>
                </div>

                {/* Datos de contacto */}
                <div className="bg-white/30 rounded-xl p-4">
                  <p className="text-gray-600 text-sm text-center">
                    <span className="font-semibold">📧 Correo:</span>{" "}
                    {user.email}
                  </p>
                  <p className="text-gray-600 text-sm text-center mt-1">
                    <span className="font-semibold">🏢 Empresa:</span>{" "}
                    {userRole.company}
                  </p>
                </div>
              </div>

              {/* Mensaje especial según el rol */}
              <div
                className={`rounded-xl p-4 mb-6 ${
                  isCEO
                    ? "bg-gradient-to-r from-yellow-100 to-amber-100 border-l-4 border-yellow-500"
                    : isCOO
                      ? "bg-gradient-to-r from-blue-100 to-indigo-100 border-l-4 border-blue-500"
                      : "bg-gradient-to-r from-green-100 to-emerald-100 border-l-4 border-green-500"
                }`}
              >
                <p className="text-gray-700 italic text-center text-sm md:text-base">
                  {isCEO
                    ? '👑 "Sin ti, nada de esto sería posible. Gracias por tu visión inquebrantable y liderazgo excepcional. La historia de la tecnología está siendo escrita por tus manos." - Equipo SIZAE'
                    : isCOO
                      ? '⚡ "Tu dedicación y genialidad inspiran cada línea de código. El lenguaje Qui-roz vive gracias a tu pasión por la innovación." - Equipo de Desarrollo'
                      : '💎 "Tu apoyo ha hecho realidad el sueño del primer lenguaje de programación en español. Waskart vivirá por siempre como legado de tu grandeza." - Comunidad de Desarrolladores'}
                </p>
              </div>

              {/* Footer con membrete corporativo */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <span>🏛️ SIZAE Corp.</span>
                  <span>•</span>
                  <span>🌐 BabooNET</span>
                  <span>•</span>
                  <span>📱 BabooApp</span>
                </div>
                <p className="text-xs text-gray-400">
                  Junta Directiva • Área de Innovación Tecnológica
                </p>

                {/* Botón de honor */}
                <button
                  onClick={handleClose}
                  className={`mt-6 px-8 py-3 rounded-xl font-bold text-white transition-all transform hover:scale-105 ${
                    isCEO
                      ? "bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700"
                      : isCOO
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                        : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  } shadow-lg`}
                >
                  {isCEO
                    ? "👑 Continuar al Tablero de Control 👑"
                    : isCOO
                      ? "✨ Acceder al Dashboard ✨"
                      : "💎 Ingresar al Ecosistema 💎"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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

  const stylesElement = document.createElement("style");
  stylesElement.textContent = styles;
  document.head.appendChild(stylesElement);

  return (
    <div
      className="bg-[#121212] flex relative"
      style={{
        height: "100vh",
        height: "100dvh",
      }}
    >
      {notification && (
        <NotificationToast
          notification={notification}
          onClose={() => setNotification(null)}
        />
      )}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={logout}
      />

      <div
        className={`w-full md:w-auto md:flex-1 ${activeTab === "messages" ? "h-full" : "h-[calc(100vh-7vh)] md:h-[100vh]"}`}
      >
        {activeTab === "home" && (
          <div className="flex-1 h-full max-h-full overflow-y-auto bg-[#121212]  pb-20 md:pb-0">
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
                <div className="gap-2 flex items-center md:hidden">
                  <button
                    onClick={() => setActiveTab("messages")}
                    className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all relative border-2 border-white`}
                  >
                    <BiSolidMessageAltDetail className="text-2xl text-white" />
                    {totalUnread > 0 && (
                      <span
                        key={`badge-${badgeVersion}-${totalUnread}`}
                        className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
                      >
                        {totalUnread > 99 ? "99+" : totalUnread}
                      </span>
                    )}
                  </button>
                  {user?.role && user?.role === "free" || user?.role === "admin" ? (
                    <button
                      onClick={() => setActiveTab("projects")}
                      className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all relative border-2 border-white`}
                    >
                      <FaCodeBranch className="text-2xl text-white" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Stories Section - Responsive */}
            <div className="w-full flex-shrink-0 max-w-[600px]">
              <div className="w-full flex items-center px-3 md:px-4 gap-2 md:gap-3 overflow-x-auto overflow-y-hidden scrollbar-hide">
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
        {activeTab === "messages" && (
          <Chat setActiveTab={setActiveTab} currentUser={user} />
        )}
        {activeTab === "settings" && (
          <SubscriptionPage setActiveTab={setActiveTab} />
        )}

        {/* BottomBar - Solo visible en móvil */}
      </div>
      {activeTab === "messages" ? (
        <></>
      ) : (
        <BottomBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          totalUnread={totalUnread}
          user={user}
        />
      )}

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
      <WelcomeModal />
    </div>
  );
}
