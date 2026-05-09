// components/ProfilePage.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import Cropper from "react-cropper";
import "./cropper.css";
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
  FaTimes,
  FaCheck,
} from "react-icons/fa";
import { uploadToImgBB } from "../utils/uploadImage";
import { uploadToS3 } from "../utils/uploadToS3SDK";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { sendFriendRequest, acceptFriendRequest } from "../firebaseService";
import {
  ref,
  onValue,
  push,
  set,
  remove,
  update,
  get,
} from "firebase/database";
import { db } from "../firebase";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  getProfile,
  updateProfile,
  createProject,
  getMyFriends,
  getCurrentUser,
  getUserById,
  updateUserNameInPosts,
  updateUserPhotoInPosts,
  updateUserNameInChats,
} from "../firebaseService";
import { generateCustomToken } from "../utils/generateCustomToken";

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
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImageFile, setTempImageFile] = useState(null);
  const [tempImagePreview, setTempImagePreview] = useState(null);
  const [cropProgress, setCropProgress] = useState(false);
  const cropperRef = useRef(null);
  const [friendRequestStatus, setFriendRequestStatus] = useState(null);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [pendingRequests, setPendingRequests] = useState({});
  const [receivedRequests, setReceivedRequests] = useState({});
  const [editingName, setEditingName] = useState(false);
  const [nameText, setNameText] = useState("");
  // Flag para indicar que todos los datos están listos
  const [currentUser, setCurrentUser] = useState(null);

  const relationshipOptions = [
    "No definido",
    "Soltero/a",
    "Comprometido/a",
    "En una relación",
    "Casado/a",
    "En busca (de cacerìa)",
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

  // ==================== LOG 1: Cargar usuario actual ====================
  // ==================== OBTENER USUARIO ACTUAL ====================
  useEffect(() => {
    console.log("🔄 [ProfilePage] Obteniendo usuario actual...");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("✅ [ProfilePage] Usuario autenticado:", user.uid);
        setCurrentUser({
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          photo: user.photoURL,
        });
      } else {
        console.warn("⚠️ [ProfilePage] No hay usuario autenticado");
        navigate("/");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // ==================== CARGAR AMIGOS (como en Video.jsx) ====================
  useEffect(() => {
    if (!currentUser?.uid) return;

    const fetchFriends = async () => {
      try {
        const friendsRef = ref(db, `users/${currentUser.uid}/friends`);
        const friendsSnapshot = await get(friendsRef);
        const friendsObj = friendsSnapshot.val() || {};
        const friendIds = Object.keys(friendsObj);
        console.log("✅ Amigos cargados:", friendIds);
        setFriendsIds(friendIds);
      } catch (error) {
        console.error("Error cargando amigos:", error);
      }
    };

    fetchFriends();
  }, [currentUser?.uid]);

  // ==================== CARGAR SOLICITUDES (como en Video.jsx) ====================
  useEffect(() => {
    if (!currentUser?.uid) return;

    const fetchRequests = async () => {
      try {
        // Obtener solicitudes enviadas
        const sentRequestsRef = ref(
          db,
          `users/${currentUser.uid}/sentRequests`,
        );
        const sentSnapshot = await get(sentRequestsRef);
        const sentObj = sentSnapshot.val() || {};
        setPendingRequests(sentObj);

        // Obtener solicitudes recibidas
        const receivedRequestsRef = ref(
          db,
          `users/${currentUser.uid}/receivedRequests`,
        );
        const receivedSnapshot = await get(receivedRequestsRef);
        const receivedObj = receivedSnapshot.val() || {};
        setReceivedRequests(receivedObj);

        console.log(
          "✅ Solicitudes cargadas - Enviadas:",
          Object.keys(sentObj),
          "Recibidas:",
          Object.keys(receivedObj),
        );
      } catch (error) {
        console.error("Error cargando solicitudes:", error);
      }
    };

    fetchRequests();
  }, [currentUser?.uid]);

  // Modifica el useEffect de carga de perfil
  // ==================== CARGAR PERFIL ====================
  useEffect(() => {
    if (!currentUser?.uid) return;
    if (!uid) return;

    console.log("🔄 [ProfilePage] Cargando perfil para uid:", uid);
    setLoading(true);

    const loadProfile = async () => {
      try {
        // Intentar obtener el perfil completo
        const profileData = await getProfile(currentUser.uid, uid);
        console.log("✅ Perfil recibido:", profileData);
        setProfile(profileData);
        setIsOwnProfile(currentUser.uid === uid);
        setBioText(profileData.bio || "");
        setError(null);
      } catch (err) {
        console.error("❌ Error cargando perfil:", err);

        // Si hay error de permisos, cargar datos básicos
        if (
          err.message.includes("permiso") ||
          err.message.includes("No tienes permiso")
        ) {
          try {
            const basicUserData = await getUserById(uid);
            if (basicUserData) {
              setProfile({
                uid: uid,
                name: basicUserData.name,
                email: basicUserData.email,
                photo: basicUserData.photo,
                bio: "",
                coverPhoto: null,
              });
              setIsOwnProfile(currentUser.uid === uid);
            } else {
              throw new Error("Usuario no encontrado");
            }
          } catch (basicErr) {
            setError("No se pudo cargar el perfil");
          }
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [currentUser?.uid, uid]);

  // Cargar solicitudes pendientes (enviadas y recibidas)
  // ==================== VERIFICAR ESTADO DE AMISTAD ====================
  useEffect(() => {
    // Esperar a que todo esté listo
    if (!currentUser?.uid) {
      console.log("⏳ Esperando currentUser...");
      return;
    }

    if (!profile) {
      console.log("⏳ Esperando profile...");
      return;
    }

    console.log("🔍 Verificando estado de amistad...");
    console.log("Usuario actual:", currentUser.uid);
    console.log("Perfil objetivo:", uid);
    console.log("Es propio perfil?", isOwnProfile);
    console.log("Amigos IDs:", friendsIds);
    console.log("Solicitudes enviadas:", pendingRequests);
    console.log("Solicitudes recibidas:", receivedRequests);

    if (isOwnProfile) {
      console.log("📌 Es propio perfil");
      setFriendRequestStatus("friends");
      return;
    }

    // Verificar si son amigos
    if (friendsIds.includes(uid)) {
      console.log("✅ Son amigos!");
      setFriendRequestStatus("friends");
      return;
    }

    // Verificar solicitud enviada
    if (pendingRequests[uid]) {
      console.log("📤 Solicitud enviada");
      setFriendRequestStatus("sent");
      return;
    }

    // Verificar solicitud recibida
    if (receivedRequests[uid]) {
      console.log("📥 Solicitud recibida");
      setFriendRequestStatus("pending");
      return;
    }

    console.log("❌ Sin relación");
    setFriendRequestStatus("none");
  }, [
    currentUser,
    profile,
    uid,
    isOwnProfile,
    friendsIds,
    pendingRequests,
    receivedRequests,
  ]);

  // Enviar solicitud de amistad
  const sendFriendRequestToUser = async () => {
    if (!currentUser?.uid || !profile) return;

    setSendingRequest(true);
    try {
      // Crear solicitud en receivedRequests del destinatario
      await set(ref(db, `users/${uid}/receivedRequests/${currentUser.uid}`), {
        from_uid: currentUser.uid,
        from_name: currentUser.name,
        from_photo: currentUser.photo,
        timestamp: Date.now(),
        status: "pending",
      });

      // Crear solicitud en sentRequests del remitente
      await set(ref(db, `users/${currentUser.uid}/sentRequests/${uid}`), {
        to_uid: uid,
        to_name: profile.name,
        timestamp: Date.now(),
        status: "pending",
      });

      setFriendRequestStatus("sent");
      alert("Solicitud de amistad enviada");
    } catch (error) {
      console.error("Error sending request:", error);
      alert(error.message || "Error al enviar solicitud");
    } finally {
      setSendingRequest(false);
    }
  };

  // Aceptar solicitud de amistad
  const acceptFriendRequestFromUser = async () => {
    if (!currentUser?.uid || !profile) return;

    setSendingRequest(true);
    try {
      // Agregar a amigos mutuamente
      await set(ref(db, `users/${currentUser.uid}/friends/${uid}`), {
        uid: uid,
        name: profile.name,
        photo: profile.photo,
        timestamp: Date.now(),
      });

      await set(ref(db, `users/${uid}/friends/${currentUser.uid}`), {
        uid: currentUser.uid,
        name: currentUser.name,
        photo: currentUser.photo,
        timestamp: Date.now(),
      });

      // Eliminar solicitudes pendientes
      await remove(ref(db, `users/${currentUser.uid}/receivedRequests/${uid}`));
      await remove(ref(db, `users/${uid}/sentRequests/${currentUser.uid}`));

      setFriendRequestStatus("friends");
      setFriendsIds((prev) => [...prev, uid]);

      alert("¡Ahora son amigos!");
      window.location.reload();
    } catch (error) {
      console.error("Error accepting request:", error);
      alert(error.message || "Error al aceptar solicitud");
    } finally {
      setSendingRequest(false);
    }
  };

  // Rechazar solicitud
  const rejectFriendRequestFromUser = async () => {
    if (!currentUser?.uid || !profile) return;

    setSendingRequest(true);
    try {
      await remove(ref(db, `users/${currentUser.uid}/receivedRequests/${uid}`));
      await remove(ref(db, `users/${uid}/sentRequests/${currentUser.uid}`));
      setFriendRequestStatus("none");
      alert("Solicitud rechazada");
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Error al rechazar solicitud");
    } finally {
      setSendingRequest(false);
    }
  };

  // Modificar handleUpdateName
  const handleUpdateName = async () => {
    if (!nameText.trim()) return;
    setUpdating(true);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) throw new Error("No autenticado");

      const newName = nameText.trim();

      // 1. Actualizar perfil del usuario
      await updateProfile(currentUser.uid, { name: newName });

      // 2. Actualizar nombre en todos los posts y comentarios
      await updateUserNameInPosts(currentUser.uid, newName);

      // 3. Intentar actualizar nombre en los chats (sin importar si falla)
      try {
        await updateUserNameInChats(currentUser.uid, newName, profile.photo);
      } catch (chatError) {
        console.warn("No se pudieron actualizar los chats:", chatError);
        // No mostramos error al usuario porque ya se actualizó lo importante
      }

      // 4. Actualizar localStorage
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      storedUser.name = newName;
      localStorage.setItem("user", JSON.stringify(storedUser));

      // 5. Actualizar el estado del perfil
      setProfile({ ...profile, name: newName });
      setEditingName(false);
    } catch (err) {
      console.error(err);
      alert("Error al actualizar nombre: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const onSelectImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona una imagen válida");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen no debe pesar más de 5MB");
      return;
    }

    setTempImageFile(file);
    setTempImagePreview(URL.createObjectURL(file));
    setShowCropModal(true);
    setEditingPhoto(false);
  };

  const getCroppedImage = () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return null;

    const canvas = cropper.getCroppedCanvas({
      width: 400,
      height: 400,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: "high",
    });

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        "image/jpeg",
        0.9,
      );
    });
  };

  const handleCropAndUpload = async () => {
    setCropProgress(true);
    try {
      const croppedBlob = await getCroppedImage();
      if (!croppedBlob) throw new Error("No se pudo recortar la imagen");

      const croppedFile = new File([croppedBlob], "profile.jpg", {
        type: "image/jpeg",
      });

      const imageUrl = await uploadToS3(croppedFile);
      const currentUser = getCurrentUser();
      if (!currentUser) throw new Error("No autenticado");

      await updateProfile(currentUser.uid, { photo: imageUrl });
      await updateUserPhotoInPosts(currentUser.uid, imageUrl);
      await updateUserNameInChats(currentUser.uid, profile.name, imageUrl);

      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      storedUser.picture = imageUrl;
      localStorage.setItem("user", JSON.stringify(storedUser));

      setProfile({ ...profile, photo: imageUrl });
      setShowCropModal(false);
      setTempImageFile(null);
      setTempImagePreview(null);
    } catch (err) {
      console.error(err);
      alert("Error al actualizar foto: " + err.message);
    } finally {
      setCropProgress(false);
    }
  };

  const closeCropModal = () => {
    setShowCropModal(false);
    setTempImageFile(null);
    setTempImagePreview(null);
    setEditingPhoto(false);
  };

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

  useEffect(() => {
    if (profile) {
      setNameText(profile.name || "");
    }
  }, [profile]);

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
      userPhoto: currentUser.photo,
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
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a]">
      {/* Modal de imagen expandida */}
      {expandedImage && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn"
          onClick={() => setExpandedImage(null)}
        >
          <img
            src={expandedImage}
            alt="expandida"
            className="max-w-[90vw] max-h-[90vh] object-contain animate-scaleIn"
          />
          <button
            className="absolute top-6 right-6 text-white/80 hover:text-white text-2xl transition-all duration-300 hover:scale-110"
            onClick={() => setExpandedImage(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Botón de retroceso */}
      <button
        onClick={() => navigate("/dashboard")}
        className="fixed top-6 left-6 z-20 p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all duration-300 hover:scale-110 group"
      >
        <FaArrowLeft className="text-white text-xl group-hover:-translate-x-0.5 transition-transform" />
      </button>

      {/* Contenido principal */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Sección de portada y avatar */}
        <div className="relative mb-8">
          {/* Portada */}
          <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden shadow-2xl">
            {profile.coverPhoto ? (
              <img
                src={profile.coverPhoto}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-[#2d1b4e] to-[#1e3a5f]" />
            )}
            {isOwnProfile && (
              <label className="absolute bottom-4 right-4 p-2 rounded-full bg-black/50 backdrop-blur-sm cursor-pointer hover:bg-black/70 transition-all duration-300 hover:scale-110">
                {uploadingCover ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <FaCamera className="text-white text-sm" />
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
          </div>

          {/* Avatar */}
          <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 md:left-8 md:translate-x-0">
            <div className="relative group">
              <img
                src={profile.photo}
                alt={profile.name}
                className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-[#1a1a1a] object-cover shadow-xl transition-all duration-300 group-hover:scale-105"
              />
              {isOwnProfile && (
                <>
                  <label className="absolute bottom-1 right-1 p-1.5 rounded-full bg-gradient-to-r from-[#2e9b4f] to-[#1a6b3a] cursor-pointer hover:scale-110 transition-all duration-300 shadow-lg">
                    <FaCamera className="text-white text-xs" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onSelectImage}
                      className="hidden"
                      disabled={uploadingPhoto}
                    />
                  </label>
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                      <LoadingSpinner size="small" />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Información del perfil */}
        <div className="text-center md:text-left mt-16 md:mt-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
            <div>
              {/* Nombre */}
              <div className="flex items-center justify-center md:justify-start gap-2">
                {editingName ? (
                  <div className="grid grid-cols-2 grid-rows-2 gap-4">
                    <input
                      type="text"
                      value={nameText}
                      onChange={(e) => setNameText(e.target.value)}
                      className="bg-[#2a2a2a] text-white px-4 py-2 rounded-xl text-2xl font-bold outline-none focus:ring-2 focus:ring-[#2e9b4f] transition-all col-span-2"
                      autoFocus
                    />
                    <button
                      onClick={handleUpdateName}
                      disabled={updating}
                      className="px-4 py-2 bg-gradient-to-r from-[#2e9b4f] to-[#1a6b3a] text-white rounded-xl text-sm font-medium hover:scale-105 transition-all duration-300 row-start-2"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingName(false)}
                      className="px-4 py-2 bg-[#2a2a2a] text-white rounded-xl text-sm font-medium hover:bg-[#3a3a3a] transition-all row-start-2"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl md:text-4xl font-bold text-white">
                      {profile.name}
                    </h1>
                    {isOwnProfile && (
                      <button
                        onClick={() => setEditingName(true)}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-110"
                      >
                        <FaEdit className="text-white text-sm" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <p className="text-gray-400 text-sm mt-1">{profile.email}</p>
            </div>
          </div>

          {isOwnProfile || friendRequestStatus === "friends" ? (
            <>
              {/* Biografía */}
              <div className="mb-8 p-4 bg-white/5 rounded-xl backdrop-blur-sm">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-white font-semibold">Biografía</h3>
                  {isOwnProfile && !editingBio && (
                    <button
                      onClick={() => setEditingBio(true)}
                      className="text-sm text-[#2e9b4f] hover:underline transition-all"
                    >
                      <FaEdit className="inline mr-1 text-xs" /> Editar
                    </button>
                  )}
                </div>
                {editingBio ? (
                  <div className="flex gap-2">
                    <textarea
                      value={bioText}
                      onChange={(e) => setBioText(e.target.value)}
                      className="flex-1 bg-[#2a2a2a] text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-[#2e9b4f] transition-all"
                      rows="3"
                    />
                    <button
                      onClick={handleUpdateBio}
                      disabled={updating}
                      className="px-4 py-2 bg-gradient-to-r from-[#2e9b4f] to-[#1a6b3a] text-white rounded-xl text-sm font-medium hover:scale-105 transition-all"
                    >
                      {updating ? <LoadingSpinner size="small" /> : "Guardar"}
                    </button>
                    <button
                      onClick={() => setEditingBio(false)}
                      className="px-4 py-2 bg-[#2a2a2a] text-white rounded-xl text-sm font-medium hover:bg-[#3a3a3a] transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-300 leading-relaxed">
                    {profile.bio ||
                      "✨ Este usuario aún no ha escrito una biografía."}
                  </p>
                )}
              </div>

              {/* Información Personal */}
              <div className="mb-8 p-4 bg-white/5 rounded-xl backdrop-blur-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-semibold">
                    Información Personal
                  </h3>
                  {isOwnProfile && !editingPersonalInfo && (
                    <button
                      onClick={() => setEditingPersonalInfo(true)}
                      className="text-sm text-[#2e9b4f] hover:underline transition-all"
                    >
                      <FaEdit className="inline mr-1 text-xs" /> Editar
                    </button>
                  )}
                </div>

                {editingPersonalInfo ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="date"
                        value={personalInfo.birthDate}
                        onChange={(e) =>
                          setPersonalInfo({
                            ...personalInfo,
                            birthDate: e.target.value,
                          })
                        }
                        placeholder="Fecha de nacimiento"
                        className="bg-[#2a2a2a] text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-[#2e9b4f] transition-all"
                      />
                      <input
                        type="tel"
                        value={personalInfo.phone}
                        onChange={(e) =>
                          setPersonalInfo({
                            ...personalInfo,
                            phone: e.target.value,
                          })
                        }
                        placeholder="Teléfono"
                        className="bg-[#2a2a2a] text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-[#2e9b4f] transition-all"
                      />
                      <input
                        type="text"
                        value={personalInfo.department}
                        onChange={(e) =>
                          setPersonalInfo({
                            ...personalInfo,
                            department: e.target.value,
                          })
                        }
                        placeholder="Departamento"
                        className="bg-[#2a2a2a] text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-[#2e9b4f] transition-all"
                      />
                      <input
                        type="text"
                        value={personalInfo.municipality}
                        onChange={(e) =>
                          setPersonalInfo({
                            ...personalInfo,
                            municipality: e.target.value,
                          })
                        }
                        placeholder="Municipio"
                        className="bg-[#2a2a2a] text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-[#2e9b4f] transition-all"
                      />
                      <input
                        type="text"
                        value={personalInfo.university}
                        onChange={(e) =>
                          setPersonalInfo({
                            ...personalInfo,
                            university: e.target.value,
                          })
                        }
                        placeholder="Universidad"
                        className="bg-[#2a2a2a] text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-[#2e9b4f] transition-all"
                      />
                      <input
                        type="text"
                        value={personalInfo.career}
                        onChange={(e) =>
                          setPersonalInfo({
                            ...personalInfo,
                            career: e.target.value,
                          })
                        }
                        placeholder="Carrera"
                        className="bg-[#2a2a2a] text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-[#2e9b4f] transition-all"
                      />
                      <select
                        value={personalInfo.relationshipStatus}
                        onChange={(e) =>
                          setPersonalInfo({
                            ...personalInfo,
                            relationshipStatus: e.target.value,
                          })
                        }
                        className="bg-[#2a2a2a] text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-[#2e9b4f] transition-all"
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
                        className="px-4 py-2 bg-gradient-to-r from-[#2e9b4f] to-[#1a6b3a] text-white rounded-xl text-sm font-medium hover:scale-105 transition-all"
                      >
                        {updating ? "Guardando..." : "Guardar cambios"}
                      </button>
                      <button
                        onClick={() => setEditingPersonalInfo(false)}
                        className="px-4 py-2 bg-[#2a2a2a] text-white rounded-xl text-sm font-medium hover:bg-[#3a3a3a] transition-all"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoItem
                      label="Fecha de nacimiento"
                      value={personalInfo.birthDate}
                    />
                    <InfoItem label="Teléfono" value={personalInfo.phone} />
                    <InfoItem
                      label="Ubicación"
                      value={`${personalInfo.department || ""} ${personalInfo.municipality ? `, ${personalInfo.municipality}` : ""}`}
                    />
                    <InfoItem
                      label="Universidad"
                      value={personalInfo.university}
                    />
                    <InfoItem label="Carrera" value={personalInfo.career} />
                    <InfoItem
                      label="Estado sentimental"
                      value={personalInfo.relationshipStatus}
                    />
                  </div>
                )}
                {/* Botón para obtener SecretKey - dentro del bloque isOwnProfile */}
                <div className="mb-6">
                  <button
                    onClick={() => {
                      const user = JSON.parse(
                        localStorage.getItem("user") || "{}",
                      );
                      const token = localStorage.getItem("token") || "";
                      const secretData = {
                        user: user,
                        token: token,
                      };
                      const jsonString = JSON.stringify(secretData, null, 2);

                      // Crear modal para copiar
                      const modal = document.createElement("div");
                      modal.className =
                        "fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn";
                      modal.innerHTML = `
        <div class="bg-[#1a1a1a] rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl">
          <div class="p-6">
            <div class="text-center mb-4">
              <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                </svg>
              </div>
              <h2 class="text-xl font-bold text-white">Tu SecretKey</h2>
              <p class="text-gray-400 text-sm mt-1">Copia este JSON para iniciar sesión en otro dispositivo</p>
            </div>
            <div class="relative">
              <pre class="bg-gray-800 p-3 rounded-lg overflow-x-auto text-xs text-green-400 font-mono">${jsonString}</pre>
              <button id="copyBtn" class="absolute top-2 right-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition">Copiar</button>
            </div>
            <div class="flex gap-3 mt-4">
              <button id="closeBtn" class="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition">Cerrar</button>
            </div>
          </div>
        </div>
      `;
                      document.body.appendChild(modal);

                      const copyBtn = modal.querySelector("#copyBtn");
                      const closeBtn = modal.querySelector("#closeBtn");

                      copyBtn.onclick = () => {
                        navigator.clipboard.writeText(jsonString);
                        copyBtn.textContent = "¡Copiado!";
                        setTimeout(() => {
                          copyBtn.textContent = "Copiar";
                        }, 2000);
                      };

                      closeBtn.onclick = () => {
                        modal.remove();
                      };
                    }}
                    className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                      />
                    </svg>
                    Obtener SecretKey
                  </button>
                  <button
                    type="button"
                    className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 flex items-center justify-center gap-2"
                    onClick={async () => {
                                            const user = JSON.parse(
                        localStorage.getItem("user") || "{}",
                      );
              const customToken =
                await generateCustomToken(
                  user.uid
                );

              window.location.href =
                `babooapp://auth?token=${customToken}`;
                    }}
                  >
                    Abrir en la App movil
                  </button>
                  <button
                    type="button"
                    className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 flex items-center justify-center gap-2"
                    onClick={async () => {
                      localStorage.removeItem("user");
                      localStorage.removeItem("token");
                      navigate("/login");
                    }}
                  >
                    Cerrar sesion
                  </button>
                </div>
              </div>

              {/* Sección de Publicaciones */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span>📱</span> Publicaciones
                </h3>
                <div className="space-y-4">
                  {posts.length === 0 ? (
                    <div className="bg-white/5 rounded-xl p-8 text-center">
                      <p className="text-gray-400">
                        ✨ No hay publicaciones aún
                      </p>
                      {isOwnProfile && (
                        <p className="text-sm text-gray-500 mt-2">
                          Comparte algo con la comunidad
                        </p>
                      )}
                    </div>
                  ) : (
                    posts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUser={currentUser}
                        isOwnProfile={isOwnProfile}
                        onDelete={deletePost}
                        onLike={toggleLike}
                        onComment={addComment}
                        onNavigate={navigate}
                        setExpandedImage={setExpandedImage}
                        showCommentInput={showCommentInput}
                        setShowCommentInput={setShowCommentInput}
                        commentText={commentText}
                        setCommentText={setCommentText}
                      />
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            /* 🔥 VISTA LIMITADA PARA NO AMIGOS */
            <div className="text-center py-8">
              <div className="flex flex-col items-center gap-4">
                {friendRequestStatus === "none" && (
                  <button
                    onClick={sendFriendRequestToUser}
                    disabled={sendingRequest}
                    className="bg-[#2e9b4f] hover:bg-[#268e46] text-white px-6 py-2 rounded-full font-semibold transition disabled:opacity-50"
                  >
                    {sendingRequest ? "Enviando..." : "Agregar como amigo"}
                  </button>
                )}

                {friendRequestStatus === "sent" && (
                  <div className="text-center">
                    <p className="text-gray-400 mb-2">
                      Solicitud de amistad enviada
                    </p>
                    <button
                      onClick={async () => {
                        await set(
                          ref(
                            db,
                            `users/${currentUser?.uid}/sentRequests/${uid}`,
                          ),
                          null,
                        );
                        await set(
                          ref(
                            db,
                            `users/${uid}/receivedRequests/${currentUser?.uid}`,
                          ),
                          null,
                        );
                        setFriendRequestStatus("none");
                        setPendingRequests((prev) => {
                          const newState = { ...prev };
                          delete newState[uid];
                          return newState;
                        });
                      }}
                      className="text-red-400 hover:text-red-500 text-sm"
                    >
                      Cancelar solicitud
                    </button>
                  </div>
                )}

                {friendRequestStatus === "pending" && (
                  <div className="flex gap-3">
                    <button
                      onClick={acceptFriendRequestFromUser}
                      disabled={sendingRequest}
                      className="bg-[#2e9b4f] hover:bg-[#268e46] text-white px-6 py-2 rounded-full font-semibold transition"
                    >
                      Aceptar solicitud
                    </button>
                    <button
                      onClick={rejectFriendRequestFromUser}
                      className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full font-semibold transition"
                    >
                      Rechazar
                    </button>
                  </div>
                )}

                <p className="text-gray-500 text-sm mt-4">
                  Para ver más información de este perfil, primero deben ser
                  amigos.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal de recorte */}
        {showCropModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fadeIn">
            <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-lg mx-4 overflow-hidden shadow-2xl">
              <div className="flex justify-between items-center p-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">
                  Editar foto de perfil
                </h3>
                <button
                  onClick={closeCropModal}
                  className="text-gray-400 hover:text-white transition-all duration-300 hover:rotate-90"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="p-4">
                <Cropper
                  ref={cropperRef}
                  src={tempImagePreview}
                  style={{ height: 400, width: "100%" }}
                  initialAspectRatio={1}
                  aspectRatio={1}
                  viewMode={1}
                  guides={false}
                  dragMode="move"
                  cropBoxMovable={true}
                  cropBoxResizable={true}
                  toggleDragModeOnDblclick={false}
                  background={false}
                />
                <p className="text-center text-gray-400 text-sm mt-4">
                  Arrastra y ajusta el recuadro para centrar tu foto
                </p>
              </div>

              <div className="flex gap-3 p-4 border-t border-white/10">
                <button
                  onClick={closeCropModal}
                  className="flex-1 px-4 py-2 bg-[#2a2a2a] text-white rounded-xl font-medium hover:bg-[#3a3a3a] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCropAndUpload}
                  disabled={cropProgress}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#2e9b4f] to-[#1a6b3a] text-white rounded-xl font-medium hover:scale-105 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cropProgress ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>Subiendo...</span>
                    </>
                  ) : (
                    <>
                      <FaCheck />
                      <span>Guardar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

// Componente auxiliar fuera del componente principal
const InfoItem = ({ label, value }) => (
  <div className="bg-white/5 rounded-lg p-3">
    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
      {label}
    </p>
    <p className="text-white text-sm font-medium">
      {value && value.trim() ? value : "No especificado"}
    </p>
  </div>
);

// Componente para posts (opcional, para mantener limpio el código)
const PostCard = ({
  post,
  currentUser,
  isOwnProfile,
  onDelete,
  onLike,
  onComment,
  onNavigate,
  setExpandedImage,
  showCommentInput,
  setShowCommentInput,
  commentText,
  setCommentText,
}) => (
  <div className="bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-300">
    {/* Header */}
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <img
          src={post.userPhoto}
          alt={post.userName}
          className="w-10 h-10 rounded-full cursor-pointer hover:scale-105 transition-transform"
          onClick={() => onNavigate(`/profile/${post.userId}`)}
        />
        <div>
          <p
            className="font-semibold text-white cursor-pointer hover:underline"
            onClick={() => onNavigate(`/profile/${post.userId}`)}
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
      {(isOwnProfile || post.userId === currentUser?.uid) && (
        <button
          onClick={() => onDelete(post.id)}
          className="text-gray-400 hover:text-red-500 transition-all duration-300"
        >
          <FaTrash />
        </button>
      )}
    </div>

    {/* Contenido */}
    <p className="px-4 pb-2 text-white">{post.content}</p>
    {post.images?.length > 0 && (
      <ImageCollage images={post.images} onImageClick={setExpandedImage} />
    )}

    {/* Botones de acción */}
    <div className="flex items-center justify-around p-2 border-t border-white/10 mt-2">
      <button
        onClick={() => onLike(post.id, post.likes)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 ${
          post.likes?.[currentUser?.uid]
            ? "text-red-500"
            : "text-gray-400 hover:text-white"
        }`}
      >
        <FaHeart
          className={post.likes?.[currentUser?.uid] ? "fill-red-500" : ""}
        />
        <span>{Object.keys(post.likes || {}).length}</span>
      </button>
      <button
        onClick={() =>
          setShowCommentInput(showCommentInput === post.id ? null : post.id)
        }
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-all duration-300 hover:scale-105"
      >
        <FaComment />
        <span>{Object.keys(post.comments || {}).length}</span>
      </button>
    </div>

    {/* Comentarios */}
    {showCommentInput === post.id && (
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Escribe un comentario..."
            className="flex-1 bg-[#2a2a2a] text-white p-2 rounded-lg outline-none focus:ring-2 focus:ring-[#2e9b4f]"
          />
          <button
            onClick={() => onComment(post.id)}
            className="px-4 py-2 bg-gradient-to-r from-[#2e9b4f] to-[#1a6b3a] text-white rounded-lg font-medium hover:scale-105 transition-all"
          >
            Publicar
          </button>
        </div>
      </div>
    )}

    {/* Lista de comentarios */}
    {/* Lista de comentarios - SOLO se muestra cuando se hace clic en el botón de comentarios */}
    {showCommentInput === post.id &&
      post.comments &&
      Object.keys(post.comments).length > 0 && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/10 mt-2">
          <h4 className="text-white text-sm font-semibold pt-3"></h4>
          {Object.entries(post.comments)
            .sort((a, b) => b[1].timestamp - a[1].timestamp)
            .slice(0, 5)
            .map(([commentId, comment]) => (
              <div key={commentId} className="flex gap-3">
                <img
                  src={comment.userPhoto}
                  alt={comment.userName}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1 bg-[#2a2a2a] rounded-lg p-2">
                  <p className="font-semibold text-white text-sm">
                    {comment.userName}
                  </p>
                  <p className="text-gray-300 text-sm">{comment.text}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {formatDistanceToNow(comment.timestamp, {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </div>
              </div>
            ))}
          {Object.keys(post.comments).length > 5 && (
            <button className="text-[#2e9b4f] text-sm hover:underline">
              Ver más comentarios
            </button>
          )}
        </div>
      )}
  </div>
);
