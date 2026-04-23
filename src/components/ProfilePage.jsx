// components/ProfilePage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaGlobe,
  FaProjectDiagram,
  FaEdit,
  FaCamera,
  FaArrowLeft,
  FaSpinner,
  FaHeart,
  FaComment,
  FaTrash,
} from "react-icons/fa";
import { uploadToImgBB } from "../utils/uploadImage";
import { uploadToS3 } from "../utils/uploadToS3SDK"; // o uploadToS3SDK
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { ref, onValue, push, set, remove, update } from "firebase/database";
import { db } from "../firebase";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  getProfile,
  updateProfile,
  createProject,
  getMyFriends,
  getCurrentUser,
} from "../firebaseService";

// Definición de rangos
const roleInfo = {
  bronze: { name: "Programador", icon: "🥉", color: "bg-amber-600" },
  silver: { name: "Plata", icon: "🥈", color: "bg-gray-400" },
  gold: { name: "Oro", icon: "🥇", color: "bg-yellow-500" },
  platinum: { name: "Platino", icon: "💎", color: "bg-cyan-400" },
  admin: { name: "Administrador", icon: "👑", color: "bg-purple-600" },
};

// Componente Collage de imágenes (reutilizado)
const ImageCollage = ({ images, onImageClick }) => {
  const count = images.length;
  if (count === 0) return null;
  if (count === 1) {
    return (
      <img
        src={images[0]}
        alt="post"
        className="w-full rounded-lg cursor-pointer"
        onClick={() => onImageClick(images[0])}
      />
    );
  }
  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-1">
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt="post"
            className="w-full h-64 object-cover rounded-lg cursor-pointer"
            onClick={() => onImageClick(img)}
          />
        ))}
      </div>
    );
  }
  if (count === 3) {
    return (
      <div className="grid grid-cols-2 gap-1">
        <img
          src={images[0]}
          alt="post"
          className="col-span-1 h-64 w-full object-cover rounded-lg cursor-pointer"
          onClick={() => onImageClick(images[0])}
        />
        <div className="grid grid-rows-2 gap-1">
          <img
            src={images[1]}
            alt="post"
            className="h-32 w-full object-cover rounded-lg cursor-pointer"
            onClick={() => onImageClick(images[1])}
          />
          <img
            src={images[2]}
            alt="post"
            className="h-32 w-full object-cover rounded-lg cursor-pointer"
            onClick={() => onImageClick(images[2])}
          />
        </div>
      </div>
    );
  }
  // 4+ imágenes: grid de 2x2
  return (
    <div className="grid grid-cols-2 gap-1">
      {images.slice(0, 4).map((img, idx) => (
        <img
          key={idx}
          src={img}
          alt="post"
          className="w-full h-48 object-cover rounded-lg cursor-pointer"
          onClick={() => onImageClick(img)}
        />
      ))}
      {images.length > 4 && (
        <div
          className="relative cursor-pointer"
          onClick={() => onImageClick(images[4])}
        >
          <img
            src={images[4]}
            alt="post"
            className="w-full h-48 object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-2xl font-bold rounded-lg">
            +{images.length - 4}
          </div>
        </div>
      )}
    </div>
  );
};

// Skeletons
const CoverSkeleton = () => (
  <div className="relative h-64 bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse">
    <div className="absolute inset-0 bg-black/20"></div>
  </div>
);
const AvatarSkeleton = () => (
  <div className="absolute -bottom-12 left-8">
    <div className="w-24 h-24 rounded-full border-4 border-[#18191A] bg-gray-700 animate-pulse"></div>
  </div>
);
const ProfileInfoSkeleton = () => (
  <div className="pt-16 px-8 pb-8">
    <div className="flex justify-between items-start mb-4">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-gray-700 rounded-lg animate-pulse"></div>
        <div className="h-4 w-64 bg-gray-700 rounded-lg animate-pulse"></div>
      </div>
      <div className="h-10 w-28 bg-gray-700 rounded-full animate-pulse"></div>
    </div>
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <div className="h-6 w-24 bg-gray-700 rounded-lg animate-pulse"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-gray-700 rounded-lg animate-pulse"></div>
        <div className="h-4 w-3/4 bg-gray-700 rounded-lg animate-pulse"></div>
      </div>
    </div>
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 bg-gray-700 rounded animate-pulse"></div>
          <div className="h-6 w-24 bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#242526] rounded-lg p-4">
          <div className="w-full h-40 bg-gray-700 rounded-lg mb-3 animate-pulse"></div>
          <div className="h-5 w-3/4 bg-gray-700 rounded mb-2 animate-pulse"></div>
          <div className="h-4 w-full bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="bg-[#242526] rounded-lg p-4">
          <div className="w-full h-40 bg-gray-700 rounded-lg mb-3 animate-pulse"></div>
          <div className="h-5 w-3/4 bg-gray-700 rounded mb-2 animate-pulse"></div>
          <div className="h-4 w-full bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
    <div>
      <div className="h-6 w-32 bg-gray-700 rounded-lg animate-pulse mb-3"></div>
      <div className="space-y-3">
        <div className="h-24 bg-gray-700 rounded-lg animate-pulse"></div>
        <div className="h-24 bg-gray-700 rounded-lg animate-pulse"></div>
      </div>
    </div>
  </div>
);

const LoadingSpinner = ({ size = "small" }) => (
  <FaSpinner
    className={`animate-spin ${size === "small" ? "w-4 h-4" : "w-6 h-6"}`}
  />
);

export default function ProfilePage() {
  const { uid } = useParams();
  console.log("🔍 [ProfilePage] 1. Componente montado. uid desde params:", uid);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState("");
  const [updating, setUpdating] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    image: null,
    link: "",
  });
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [posts, setPosts] = useState([]);
  const [friendsIds, setFriendsIds] = useState([]);
  const [showCommentInput, setShowCommentInput] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [expandedImage, setExpandedImage] = useState(null);
  const navigate = useNavigate();
  const [currentUserData, setCurrentUserData] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [editingPersonalInfo, setEditingPersonalInfo] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({
    birthDate: "",
    phone: "",
    department: "",
    municipality: "",
    university: "",
    career: "",
    relationshipStatus: "No definido",
  });

  const relationshipOptions = [
    "No definido",
    "Soltero/a",
    "Comprometido/a",
    "En una relación",
    "Casado/a",
  ];

  // Después del useEffect que carga el perfil, agrega:
  useEffect(() => {
    if (profile) {
      setPersonalInfo({
        birthDate: profile.birthDate || "",
        phone: profile.phone || "",
        department: profile.department || "",
        municipality: profile.municipality || "",
        university: profile.university || "",
        career: profile.career || "",
        relationshipStatus: profile.relationshipStatus || "No definido",
      });
    }
  }, [profile]);

  // Agrega este useEffect para esperar la autenticación
  useEffect(() => {
    console.log("🔄 [ProfilePage] Esperando autenticación...");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("📌 [ProfilePage] onAuthStateChanged - usuario:", user?.uid);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // 2. Reemplazar el useEffect que obtenía el perfil con fetch al backend
  // ELIMINA el fetchProfile actual y el useEffect que lo llamaba
  // Y reemplázalo con esto:

  // ==================== LOG 1: Cargar usuario actual ====================
  useEffect(() => {
    console.log("🔄 [ProfilePage] 2. useEffect para cargar currentUserData");
    const loadCurrentUser = async () => {
      try {
        const user = getCurrentUser();
        console.log("📌 [ProfilePage] getCurrentUser() retorna:", user?.uid);
        if (user) {
          // Obtener datos completos del usuario desde Firebase
          const userData = await getUserById(user.uid);
          console.log(
            "📌 [ProfilePage] Datos completos del usuario actual:",
            userData,
          );
          setCurrentUserData(userData);
        } else {
          console.warn("⚠️ [ProfilePage] No hay usuario autenticado");
        }
      } catch (err) {
        console.error("❌ [ProfilePage] Error cargando usuario actual:", err);
      }
    };
    loadCurrentUser();
  }, []);

  // Modifica el useEffect de carga de perfil para que dependa de isAuthReady
  useEffect(() => {
    console.log("🔄 [ProfilePage] 3. useEffect para cargar perfil. uid:", uid);
    const loadProfile = async () => {
      if (!uid) {
        console.warn("⚠️ [ProfilePage] No hay uid, cancelando carga de perfil");
        setLoading(false);
        return;
      }

      // Esperar a que la autenticación esté lista
      if (!isAuthReady) {
        console.log("⏳ [ProfilePage] Esperando autenticación...");
        return;
      }

      setLoading(true);
      console.log("⏳ [ProfilePage] Iniciando carga de perfil para uid:", uid);

      try {
        const currentUser = auth.currentUser; // Usar auth.currentUser directamente
        console.log(
          "📌 [ProfilePage] Usuario actual (auth):",
          currentUser?.uid,
        );

        if (!currentUser) {
          console.warn(
            "⚠️ [ProfilePage] No hay usuario autenticado, redirigiendo a /",
          );
          navigate("/");
          return;
        }

        console.log("📡 [ProfilePage] Llamando a getProfile con:", {
          currentUserId: currentUser.uid,
          targetUserId: uid,
        });

        const profileData = await getProfile(currentUser.uid, uid);
        console.log("✅ [ProfilePage] Perfil recibido:", profileData);

        setProfile(profileData);
        setIsOwnProfile(currentUser.uid === uid);
        setBioText(profileData.bio || "");
        setError(null);
      } catch (err) {
        console.error("❌ [ProfilePage] Error en loadProfile:", err);
        console.error("❌ [ProfilePage] Mensaje de error:", err.message);

        if (
          err.message.includes("permiso") ||
          err.message.includes("No tienes permiso")
        ) {
          console.warn("⚠️ [ProfilePage] Error de permisos, redirigiendo");
          alert("No puedes ver este perfil. Redirigiendo al dashboard.");
          navigate("/dashboard");
        } else {
          setError(err.message || "Error al cargar el perfil");
        }
      } finally {
        setLoading(false);
        console.log(
          "🏁 [ProfilePage] Carga de perfil finalizada, loading = false",
        );
      }
    };

    loadProfile();
  }, [uid, navigate, isAuthReady]); // Añadir isAuthReady como dependencia

  // ==================== LOG 3: Cargar amigos ====================
  useEffect(() => {
    console.log("🔄 [ProfilePage] 4. useEffect para cargar amigos");
    const fetchFriends = async () => {
      const currentUser = getCurrentUser();
      console.log(
        "📌 [ProfilePage] Usuario actual para amigos:",
        currentUser?.uid,
      );

      if (!currentUser) {
        console.warn(
          "⚠️ [ProfilePage] No hay usuario autenticado, no se cargan amigos",
        );
        return;
      }

      try {
        console.log(
          "📡 [ProfilePage] Llamando a getMyFriends para:",
          currentUser.uid,
        );
        const friends = await getMyFriends(currentUser.uid);
        console.log("✅ [ProfilePage] Amigos obtenidos:", friends);

        const friendIds = friends.map((f) => f.uid);
        console.log("📌 [ProfilePage] IDs de amigos:", friendIds);
        setFriendsIds(friendIds);
      } catch (err) {
        console.error("❌ [ProfilePage] Error cargando amigos:", err);
      }
    };
    fetchFriends();
  }, []);

  // Agrega después de handleUpdateBio
  const handleUpdatePersonalInfo = async () => {
    setUpdating(true);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) throw new Error("No autenticado");

      await updateProfile(currentUser.uid, {
        birthDate: personalInfo.birthDate,
        phone: personalInfo.phone,
        department: personalInfo.department,
        municipality: personalInfo.municipality,
        university: personalInfo.university,
        career: personalInfo.career,
        relationshipStatus: personalInfo.relationshipStatus,
      });

      setProfile({ ...profile, ...personalInfo });
      setEditingPersonalInfo(false);
    } catch (err) {
      console.error(err);
      alert("Error al actualizar información personal");
    } finally {
      setUpdating(false);
    }
  };

  // Agrega después de handleUpdatePersonalInfo
  const [editingName, setEditingName] = useState(false);
  const [nameText, setNameText] = useState("");

  useEffect(() => {
    if (profile) {
      setNameText(profile.name || "");
    }
  }, [profile]);

  const handleUpdateName = async () => {
    if (!nameText.trim()) return;
    setUpdating(true);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) throw new Error("No autenticado");

      await updateProfile(currentUser.uid, { name: nameText });
      setProfile({ ...profile, name: nameText });
      setEditingName(false);
    } catch (err) {
      console.error(err);
      alert("Error al actualizar nombre");
    } finally {
      setUpdating(false);
    }
  };

  // 4. Reemplazar handleUpdateBio
  const handleUpdateBio = async () => {
    setUpdating(true);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) throw new Error("No autenticado");
      await updateProfile(currentUser.uid, { bio: bioText });
      setProfile({ ...profile, bio: bioText });
      setEditingBio(false);
    } catch (err) {
      console.error(err);
      alert("Error al actualizar biografía");
    } finally {
      setUpdating(false);
    }
  };

  // 5. Reemplazar handleCoverPhotoUpload
  const handleCoverPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const imageUrl = await uploadToS3(file);
      const currentUser = getCurrentUser();
      if (!currentUser) throw new Error("No autenticado");
      await updateProfile(currentUser.uid, { coverPhoto: imageUrl });
      setProfile({ ...profile, coverPhoto: imageUrl });
    } catch (err) {
      console.error(err);
      alert("Error al subir la foto de portada");
    } finally {
      setUploadingCover(false);
    }
  };

  // 6. Reemplazar handleCreateProject
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.title || !newProject.description) return;
    setCreatingProject(true);
    try {
      let imageUrl = null;
      if (newProject.image) {
        imageUrl = await uploadToImgBB(newProject.image);
      }
      const currentUser = getCurrentUser();
      if (!currentUser) throw new Error("No autenticado");
      const projectData = {
        title: newProject.title,
        description: newProject.description,
        image: imageUrl,
        link: newProject.link,
      };
      const createdProject = await createProject(currentUser.uid, projectData);
      setProfile({
        ...profile,
        projects: [...(profile.projects || []), createdProject],
      });
      setNewProject({ title: "", description: "", image: null, link: "" });
      setShowProjectForm(false);
    } catch (err) {
      console.error(err);
      alert("Error al crear proyecto");
    } finally {
      setCreatingProject(false);
    }
  };

  // ==================== LOG 4: Escuchar posts ====================
  useEffect(() => {
    console.log("🔄 [ProfilePage] 5. useEffect para escuchar posts. uid:", uid);
    if (!uid) {
      console.warn("⚠️ [ProfilePage] No hay uid, cancelando listener de posts");
      return;
    }

    const postsRef = ref(db, "posts");
    console.log("📡 [ProfilePage] Conectando listener a /posts");

    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      console.log("📡 [ProfilePage] Posts recibidos de Firebase");

      if (data) {
        const postsList = Object.entries(data)
          .map(([id, post]) => ({
            id,
            ...post,
            likes: post.likes || {},
            comments: post.comments || {},
          }))
          .filter((post) => {
            const isUserPost = post.userId === uid;
            const isPublic = post.privacy === "public";
            const isFriendOnly = post.privacy === "friends";
            const isFriend = friendsIds.includes(uid);

            console.log(`🔍 [ProfilePage] Filtrando post ${post.id}:`, {
              isUserPost,
              isPublic,
              isFriendOnly,
              isFriend,
              privacy: post.privacy,
              userId: post.userId,
              targetUid: uid,
            });

            if (!isUserPost) return false;
            if (isPublic) return true;
            if (isFriendOnly && isFriend) return true;
            return false;
          })
          .sort((a, b) => b.timestamp - a.timestamp);

        console.log(
          `✅ [ProfilePage] Posts filtrados para uid ${uid}:`,
          postsList.length,
        );
        setPosts(postsList);
      } else {
        console.log("📡 [ProfilePage] No hay posts en Firebase");
        setPosts([]);
      }
    });

    return () => {
      console.log("🔌 [ProfilePage] Desconectando listener de posts");
      unsubscribe();
    };
  }, [uid, friendsIds]);

  // ==================== LOG 5: Estado actual ====================
  useEffect(() => {
    console.log("📊 [ProfilePage] Estado actual:", {
      uid,
      loading,
      error,
      isOwnProfile,
      profileExists: !!profile,
      profileName: profile?.name,
      postsCount: posts.length,
      friendsIdsCount: friendsIds.length,
      currentUserData: currentUserData?.uid,
    });
  }, [
    uid,
    loading,
    error,
    isOwnProfile,
    profile,
    posts,
    friendsIds,
    currentUserData,
  ]);

  // En las funciones de like, comment, delete, usa el currentUser de getCurrentUser()
  // para asegurar que siempre esté actualizado:
  const toggleLike = async (postId, currentLikes) => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    const likesObj = currentLikes || {};
    const likesRef = ref(db, `posts/${postId}/likes/${currentUser.uid}`);
    if (likesObj[currentUser.uid]) {
      await remove(likesRef);
    } else {
      await set(likesRef, true);
    }
  };

  const addComment = async (postId) => {
    const currentUser = getCurrentUser();
    if (!commentText.trim() || !currentUser) return;
    const commentsRef = ref(db, `posts/${postId}/comments`);
    const newCommentRef = push(commentsRef);
    await set(newCommentRef, {
      userId: currentUser.uid,
      userName: currentUser.name,
      userPhoto: currentUser.photo, // Usa photo
      text: commentText,
      timestamp: Date.now(),
    });
    setCommentText("");
    setShowCommentInput(null);
  };

  const deletePost = async (postId) => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    if (window.confirm("¿Eliminar este post?")) {
      await remove(ref(db, `posts/${postId}`));
      await remove(ref(db, `userPosts/${currentUser.uid}/${postId}`));
    }
  };

  const currentUser = auth.currentUser;
  // Renderizado condicional
  console.log(
    "🎨 [ProfilePage] Renderizando con loading =",
    loading,
    ", error =",
    error,
    ", profile =",
    !!profile,
  );

  if (loading) {
    console.log("⏳ [ProfilePage] Mostrando skeleton de carga");
    return (
      <div className="w-full bg-[#18191A] rounded-xl overflow-hidden shadow-xl">
        <div className="absolute top-5 left-5 z-20 rounded-full hover:bg-[#393939]/60 hover:backdrop-blur-md transition-all cursor-pointer py-3 px-3">
          <FaArrowLeft className="text-3xl text-white" />
        </div>
        <CoverSkeleton />
        <AvatarSkeleton />
        <ProfileInfoSkeleton />
      </div>
    );
  }

  if (error) {
    console.log("❌ [ProfilePage] Mostrando error:", error);
    return <div className="text-red-500 text-center p-8">{error}</div>;
  }

  if (!profile) {
    console.warn("⚠️ [ProfilePage] No hay perfil, retornando null");
    return null;
  }

  const role = roleInfo[profile.role] || roleInfo.bronze;
  console.log(
    "✅ [ProfilePage] Renderizando perfil completo de:",
    profile.name,
  );

  return (
    <div className="w-full bg-[#18191A] rounded-xl overflow-hidden shadow-xl">
      {/* Modal de imagen expandida */}
      {expandedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setExpandedImage(null)}
        >
          <img
            src={expandedImage}
            alt="expandida"
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
          <button
            className="absolute top-4 right-4 text-white text-3xl"
            onClick={() => setExpandedImage(null)}
          >
            ✕
          </button>
        </div>
      )}

      <div
        className="absolute top-5 left-5 z-20 rounded-full hover:bg-[#393939]/60 hover:backdrop-blur-md transition-all cursor-pointer py-3 px-3"
        onClick={() => navigate("/dashboard")}
      >
        <FaArrowLeft className="text-3xl text-white" />
      </div>

      {/* Portada */}
      <div className="relative h-64 bg-gradient-to-r from-purple-500 to-pink-500">
        {profile.coverPhoto && (
          <img
            src={profile.coverPhoto}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
        {isOwnProfile && (
          <label className="absolute bottom-4 right-4 bg-black/60 p-2 rounded-full cursor-pointer hover:bg-black/80 transition disabled:opacity-50">
            {uploadingCover ? (
              <LoadingSpinner size="small" />
            ) : (
              <FaCamera className="text-white" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverPhotoUpload}
              className="hidden"
              disabled={uploadingCover}
            />
          </label>
        )}
        <div className="absolute -bottom-12 left-8">
          <img
            src={profile.photo}
            alt={profile.name}
            className="w-24 h-24 rounded-full border-4 border-[#18191A] object-cover"
          />
        </div>
      </div>

      {/* Información del perfil */}
      <div className="pt-16 px-8 pb-8">
        <div className="flex flex-col justify-between items-start mb-4">
          <>
            {/* Nombre con edición */}
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
            </div>
            <p className="text-gray-400">{profile.email}</p>
          </>
          <div
            className={`${role.color} px-4 self-end-safe py-2 mt-3 rounded-full flex items-center gap-2`}
          >
            <span>{role.icon}</span>
            <span className="font-semibold">{role.name}</span>
          </div>
        </div>

        {/* Biografía */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-white">Biografía</h3>
            {isOwnProfile && !editingBio && (
              <button
                onClick={() => setEditingBio(true)}
                className="text-sm text-[#2e9b4f] hover:underline"
              >
                <FaEdit className="inline mr-1" /> Editar
              </button>
            )}
          </div>
          {editingBio ? (
            <div className="flex gap-2">
              <textarea
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                className="flex-1 bg-[#3A3B3C] text-white p-2 rounded-lg"
                rows="3"
              />
              <button
                onClick={handleUpdateBio}
                disabled={updating}
                className="bg-[#2e9b4f] px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                {updating ? <LoadingSpinner size="small" /> : null}
                {updating ? "Guardando..." : "Guardar"}
              </button>
              <button
                onClick={() => setEditingBio(false)}
                className="bg-gray-600 px-4 py-2 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <p className="text-gray-300">
              {profile.bio || "Este usuario aún no ha escrito una biografía."}
            </p>
          )}
        </div>

        {/* INFORMACIÓN PERSONAL - NUEVA SECCIÓN */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-white">
              Información Personal
            </h3>
            {isOwnProfile && !editingPersonalInfo && (
              <button
                onClick={() => setEditingPersonalInfo(true)}
                className="text-sm text-[#2e9b4f] hover:underline"
              >
                <FaEdit className="inline mr-1" /> Editar
              </button>
            )}
          </div>

          {editingPersonalInfo ? (
            <div className="bg-[#242526] rounded-lg p-4 space-y-3">
              {/* Fecha de nacimiento */}
              <div>
                <label className="text-gray-400 text-sm block mb-1">
                  Fecha de nacimiento
                </label>
                <input
                  type="date"
                  value={personalInfo.birthDate}
                  onChange={(e) =>
                    setPersonalInfo({
                      ...personalInfo,
                      birthDate: e.target.value,
                    })
                  }
                  className="w-full bg-[#3A3B3C] text-white p-2 rounded-lg"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="text-gray-400 text-sm block mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={personalInfo.phone}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, phone: e.target.value })
                  }
                  placeholder="+505 1234 5678"
                  className="w-full bg-[#3A3B3C] text-white p-2 rounded-lg"
                />
              </div>

              {/* Departamento y Municipio */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-sm block mb-1">
                    Departamento
                  </label>
                  <input
                    type="text"
                    value={personalInfo.department}
                    onChange={(e) =>
                      setPersonalInfo({
                        ...personalInfo,
                        department: e.target.value,
                      })
                    }
                    placeholder="Ej: Managua"
                    className="w-full bg-[#3A3B3C] text-white p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">
                    Municipio
                  </label>
                  <input
                    type="text"
                    value={personalInfo.municipality}
                    onChange={(e) =>
                      setPersonalInfo({
                        ...personalInfo,
                        municipality: e.target.value,
                      })
                    }
                    placeholder="Ej: Managua"
                    className="w-full bg-[#3A3B3C] text-white p-2 rounded-lg"
                  />
                </div>
              </div>

              {/* Universidad y Carrera */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-sm block mb-1">
                    Universidad
                  </label>
                  <input
                    type="text"
                    value={personalInfo.university}
                    onChange={(e) =>
                      setPersonalInfo({
                        ...personalInfo,
                        university: e.target.value,
                      })
                    }
                    placeholder="Ej: UNAN-Managua"
                    className="w-full bg-[#3A3B3C] text-white p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">
                    Carrera
                  </label>
                  <input
                    type="text"
                    value={personalInfo.career}
                    onChange={(e) =>
                      setPersonalInfo({
                        ...personalInfo,
                        career: e.target.value,
                      })
                    }
                    placeholder="Ej: Ingeniería en Sistemas"
                    className="w-full bg-[#3A3B3C] text-white p-2 rounded-lg"
                  />
                </div>
              </div>

              {/* Estado sentimental */}
              <div>
                <label className="text-gray-400 text-sm block mb-1">
                  Estado sentimental
                </label>
                <select
                  value={personalInfo.relationshipStatus}
                  onChange={(e) =>
                    setPersonalInfo({
                      ...personalInfo,
                      relationshipStatus: e.target.value,
                    })
                  }
                  className="w-full bg-[#3A3B3C] text-white p-2 rounded-lg"
                >
                  {relationshipOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleUpdatePersonalInfo}
                  disabled={updating}
                  className="bg-[#2e9b4f] px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {updating ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  onClick={() => setEditingPersonalInfo(false)}
                  className="bg-gray-600 px-4 py-2 rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#242526] rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Fecha de nacimiento</p>
                  <p className="text-white">
                    {personalInfo.birthDate || "No especificado"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Teléfono</p>
                  <p className="text-white">
                    {personalInfo.phone || "No especificado"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Ubicación</p>
                  <p className="text-white">
                    {personalInfo.department || "No especificado"}
                    {personalInfo.department &&
                      personalInfo.municipality &&
                      ", "}
                    {personalInfo.municipality || ""}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Universidad</p>
                  <p className="text-white">
                    {personalInfo.university || "No especificado"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Carrera</p>
                  <p className="text-white">
                    {personalInfo.career || "No especificado"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Estado sentimental</p>
                  <p className="text-white">
                    {personalInfo.relationshipStatus || "No definido"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Proyectos */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <FaProjectDiagram className="text-[#2e9b4f]" />
              <h3 className="text-lg font-semibold text-white">Proyectos</h3>
            </div>
            {isOwnProfile && (
              <button
                onClick={() => setShowProjectForm(!showProjectForm)}
                className="text-sm text-[#2e9b4f]"
              >
                + Agregar proyecto
              </button>
            )}
          </div>

          {showProjectForm && (
            <form
              onSubmit={handleCreateProject}
              className="bg-[#242526] p-4 rounded-lg mb-4"
            >
              <input
                type="text"
                placeholder="Título del proyecto"
                value={newProject.title}
                onChange={(e) =>
                  setNewProject({ ...newProject, title: e.target.value })
                }
                className="w-full bg-[#3A3B3C] text-white p-2 rounded-lg mb-2"
                required
              />
              <textarea
                placeholder="Descripción"
                value={newProject.description}
                onChange={(e) =>
                  setNewProject({ ...newProject, description: e.target.value })
                }
                className="w-full bg-[#3A3B3C] text-white p-2 rounded-lg mb-2"
                rows="2"
                required
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setNewProject({ ...newProject, image: e.target.files[0] })
                }
                className="mb-2 text-gray-400"
              />
              <input
                type="url"
                placeholder="Enlace del proyecto (opcional)"
                value={newProject.link}
                onChange={(e) =>
                  setNewProject({ ...newProject, link: e.target.value })
                }
                className="w-full bg-[#3A3B3C] text-white p-2 rounded-lg mb-2"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={creatingProject}
                  className="bg-[#2e9b4f] px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {creatingProject ? <LoadingSpinner size="small" /> : null}
                  {creatingProject ? "Creando..." : "Crear"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProjectForm(false)}
                  className="bg-gray-600 px-4 py-2 rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {profile.projects?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.projects.map((project) => (
                <div key={project.id} className="bg-[#242526] rounded-lg p-4">
                  {project.image && (
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-40 object-cover rounded-lg mb-3"
                    />
                  )}
                  <h4 className="font-semibold text-white">{project.title}</h4>
                  <p className="text-gray-400 text-sm mt-1">
                    {project.description}
                  </p>
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2e9b4f] text-sm mt-2 inline-flex items-center gap-1"
                    >
                      Ver proyecto <FaGlobe className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No hay proyectos para mostrar.</p>
          )}
        </div>

        {/* Sección de Publicaciones */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            Publicaciones
          </h3>
          <div className="space-y-6">
            {posts.length === 0 ? (
              <div className="bg-[#242526] rounded-lg p-6 text-center text-gray-400">
                <p>No hay publicaciones aún</p>
                {isOwnProfile && (
                  <p className="text-sm mt-2">Comparte algo con la comunidad</p>
                )}
              </div>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-[#242526] rounded-xl overflow-hidden shadow"
                >
                  {/* Header del post */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={post.userPhoto}
                        alt={post.userName}
                        className="w-10 h-10 rounded-full cursor-pointer"
                        onClick={() => navigate(`/profile/${post.userId}`)}
                      />
                      <div>
                        <p
                          className="font-semibold text-white cursor-pointer hover:underline"
                          onClick={() => navigate(`/profile/${post.userId}`)}
                        >
                          {post.userName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDistanceToNow(post.timestamp, {
                            addSuffix: true,
                            locale: es,
                          })}
                        </p>
                      </div>
                    </div>
                    {(isOwnProfile || post.userId === currentUserData?.uid) && (
                      <button
                        onClick={() => deletePost(post.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>

                  {/* Contenido */}
                  <p className="px-4 pb-2 text-white">{post.content}</p>
                  {post.images?.length > 0 && (
                    <ImageCollage
                      images={post.images}
                      onImageClick={setExpandedImage}
                    />
                  )}

                  {/* Botones de acción */}
                  <div className="flex items-center justify-around p-2 border-t border-[#3E4042] mt-2">
                    <button
                      onClick={() => toggleLike(post.id, post.likes)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${post.likes?.[currentUserData?.uid] ? "text-red-500" : "text-gray-400 hover:bg-[#3A3B3C]"}`}
                    >
                      <FaHeart
                        className={
                          post.likes?.[currentUserData?.uid]
                            ? "fill-red-500"
                            : ""
                        }
                      />
                      <span>{Object.keys(post.likes || {}).length}</span>
                    </button>
                    <button
                      onClick={() =>
                        setShowCommentInput(
                          showCommentInput === post.id ? null : post.id,
                        )
                      }
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:bg-[#3A3B3C]"
                    >
                      <FaComment />
                      <span>{Object.keys(post.comments || {}).length}</span>
                    </button>
                  </div>

                  {/* Comentarios */}
                  {showCommentInput === post.id && (
                    <div className="p-4 border-t border-[#3E4042]">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Escribe un comentario..."
                          className="flex-1 bg-[#3A3B3C] text-white p-2 rounded-full outline-none"
                        />
                        <button
                          onClick={() => addComment(post.id)}
                          className="bg-[#2e9b4f] px-4 py-2 rounded-full text-sm"
                        >
                          Enviar
                        </button>
                      </div>
                      <div className="mt-4 space-y-3 max-h-60 overflow-y-auto">
                        {post.comments &&
                          Object.entries(post.comments)
                            .sort((a, b) => b[1].timestamp - a[1].timestamp)
                            .map(([cid, comment]) => (
                              <div key={cid} className="flex gap-2">
                                <img
                                  src={comment.userPhoto}
                                  alt={comment.userName}
                                  className="w-8 h-8 rounded-full cursor-pointer"
                                  onClick={() =>
                                    navigate(`/profile/${comment.userId}`)
                                  }
                                />
                                <div className="flex-1 bg-[#3A3B3C] rounded-lg p-2">
                                  <p
                                    className="font-semibold text-white text-sm cursor-pointer hover:underline"
                                    onClick={() =>
                                      navigate(`/profile/${comment.userId}`)
                                    }
                                  >
                                    {comment.userName}
                                  </p>
                                  <p className="text-gray-300 text-sm">
                                    {comment.text}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {formatDistanceToNow(comment.timestamp, {
                                      addSuffix: true,
                                      locale: es,
                                    })}
                                  </p>
                                </div>
                              </div>
                            ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
