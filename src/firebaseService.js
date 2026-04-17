// firebaseService.js
import { ref, get, set, update, push, query, orderByChild, equalTo } from "firebase/database";
import { db, auth } from "./firebase";

// ==================== USUARIOS ====================

// Obtener usuario actual desde Firebase (ya autenticado)
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Obtener datos de un usuario por UID
export const getUserById = async (uid) => {
  const userRef = ref(db, `users/${uid}`);
  const snapshot = await get(userRef);
  return snapshot.exists() ? snapshot.val() : null;
};

// Crear/actualizar usuario en Firebase después del login
export const saveUserToFirebase = async (userData) => {
  const userRef = ref(db, `users/${userData.uid}`);
  const snapshot = await get(userRef);
  if (!snapshot.exists()) {
    // Nuevo usuario
    await set(userRef, {
      name: userData.name,
      email: userData.email,
      photo: userData.picture,
      bio: "Desarrollador full-stack...",
      role: "bronze",
      coverPhoto: null,
      projects: [],
      posts: [],
      friends: {},
      sentRequests: {},
      receivedRequests: {},
      createdAt: Date.now(),
      lastSeen: Date.now(),
      // Nuevos campos
      birthDate: "",
      phone: "",
      department: "",
      municipality: "",
      university: "",
      career: "",
      relationshipStatus: "No definido",
      createdAt: Date.now(),
      lastSeen: Date.now(),
    });
  } else {
    // Actualizar información
    await update(userRef, {
      name: userData.name,
      email: userData.email,
      photo: userData.picture,
      lastSeen: Date.now(),
    });
  }
  return getUserById(userData.uid);
};

// ==================== AMIGOS ====================

// Obtener lista de amigos del usuario actual
export const getMyFriends = async (userId) => {
  const userRef = ref(db, `users/${userId}/friends`);
  const snapshot = await get(userRef);
  const friendsIds = snapshot.val() || {};
  const friends = [];
  for (const friendId of Object.keys(friendsIds)) {
    const friend = await getUserById(friendId);
    if (friend) {
      friends.push({ uid: friendId, ...friend });
    }
  }
  return friends;
};

// Enviar solicitud de amistad
export const sendFriendRequest = async (fromUserId, toUserId) => {
  // Verificar que no sean la misma persona
  if (fromUserId === toUserId) {
    throw new Error("No puedes enviarte solicitud a ti mismo");
  }
  // Verificar que no exista ya una solicitud pendiente
  const toUser = await getUserById(toUserId);
  if (toUser.receivedRequests && toUser.receivedRequests[fromUserId]) {
    return { message: "Solicitud ya enviada" };
  }
  // Crear la solicitud en el receptor
  const requestRef = ref(db, `users/${toUserId}/receivedRequests/${fromUserId}`);
  await set(requestRef, {
    fromUserId,
    timestamp: Date.now(),
    status: "pending"
  });
  // Registrar en el emisor
  const sentRef = ref(db, `users/${fromUserId}/sentRequests/${toUserId}`);
  await set(sentRef, {
    toUserId,
    timestamp: Date.now(),
    status: "pending"
  });
  return { message: "Solicitud enviada" };
};

// Aceptar solicitud de amistad
export const acceptFriendRequest = async (userId, fromUserId) => {
  await update(ref(db, `users/${userId}/friends`), { [fromUserId]: true });
  await update(ref(db, `users/${fromUserId}/friends`), { [userId]: true });
  await set(ref(db, `users/${userId}/receivedRequests/${fromUserId}`), null);
  await set(ref(db, `users/${fromUserId}/sentRequests/${userId}`), null);
  return { message: "Solicitud aceptada" };
};

// Obtener solicitudes recibidas
export const getReceivedRequests = async (userId) => {
  const userRef = ref(db, `users/${userId}/receivedRequests`);
  const snapshot = await get(userRef);
  const requests = snapshot.val() || {};
  const result = [];
  for (const [fromUid, data] of Object.entries(requests)) {
    const user = await getUserById(fromUid);
    if (user) {
      result.push({ uid: fromUid, name: user.name, picture: user.photo });
    }
  }
  return result;
};

// ==================== BÚSQUEDA ====================

// Buscar usuarios por nombre (excluyendo al actual, amigos y solicitudes pendientes)
export const searchUsers = async (currentUserId, queryText) => {
  if (!queryText.trim()) return [];
  const usersRef = ref(db, "users");
  const snapshot = await get(usersRef);
  const allUsers = snapshot.val() || {};
  const currentUser = await getUserById(currentUserId);
  const friends = currentUser.friends || {};
  const sentRequests = currentUser.sentRequests || {};
  const receivedRequests = currentUser.receivedRequests || {};
  const results = [];
  for (const [uid, userData] of Object.entries(allUsers)) {
    if (uid === currentUserId) continue;
    if (friends[uid]) continue;
    if (sentRequests[uid]) continue;
    if (receivedRequests[uid]) continue;
    if (userData.name && userData.name.toLowerCase().includes(queryText.toLowerCase())) {
      results.push({
        uid,
        name: userData.name,
        email: userData.email,
        picture: userData.photo,
      });
    }
  }
  return results.slice(0, 20);
};

// ==================== PERFIL ====================

// Obtener perfil de otro usuario (solo si son amigos o es el mismo)
export const getProfile = async (currentUserId, targetUserId) => {
  if (currentUserId === targetUserId) {
    // Si es su propio perfil, devuelve todo excepto campos privados (si los hubiera)
    const user = await getUserById(targetUserId);
    const { friends, sentRequests, receivedRequests, ...publicData } = user;
    return publicData;
  }
  // Verificar si son amigos
  const currentUser = await getUserById(currentUserId);
  const areFriends = currentUser.friends && currentUser.friends[targetUserId];
  if (!areFriends) {
    throw new Error("No tienes permiso para ver este perfil");
  }
  const profile = await getUserById(targetUserId);
  const { friends: _, sentRequests: __, receivedRequests: ___, ...publicProfile } = profile;
  return publicProfile;
};

// Actualizar perfil (bio, role, coverPhoto)
export const updateProfile = async (userId, updates) => {
  const userRef = ref(db, `users/${userId}`);
  await update(userRef, updates);
  return { message: "Perfil actualizado correctamente" };
};

// ==================== PROYECTOS ====================

// Crear un nuevo proyecto
export const createProject = async (userId, projectData) => {
  const newProject = {
    id: Date.now().toString() + Math.random().toString(36),
    ...projectData,
    createdAt: new Date().toISOString(),
  };
  const projectsRef = ref(db, `users/${userId}/projects`);
  const snapshot = await get(projectsRef);
  const currentProjects = snapshot.val() || [];
  await set(projectsRef, [...currentProjects, newProject]);
  return newProject;
};

// ==================== POSTS (para futuro) ====================
// Aquí podrías agregar funciones para manejar posts, pero ya tienes el componente Feed que usa Firebase directamente.
// Solo asegúrate de que las reglas de Firebase permitan leer/escribir según privacidad.