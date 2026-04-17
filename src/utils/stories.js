// utils/stories.js
import { ref, push, set, update, remove, onValue, get } from "firebase/database";
import { db } from "../firebase";
import { uploadToImgBB } from "./uploadImage";

// Obtener datos de un usuario desde Firebase (sin backend)
export const getUserInfo = async (userId) => {
  const userRef = ref(db, `users/${userId}`);
  const snapshot = await get(userRef);
  if (snapshot.exists()) {
    return snapshot.val();
  }
  // Si no existe, devolver datos por defecto (puedes intentar obtener del backend pasando token)
  console.warn(`User data not found in Firebase for ${userId}`);
  return { name: "Usuario", photo: null };
};


// Dar/quitar like a una historia
export const toggleStoryLike = async (userId, storyId, likerId) => {
  const likeRef = ref(db, `stories/${userId}/${storyId}/likes/${likerId}`);
  const snapshot = await get(likeRef);
  if (snapshot.exists()) {
    await set(likeRef, null); // eliminar like
  } else {
    await set(likeRef, Date.now());
  }
};

// Obtener historia específica con todos los datos (opcional)
export const getStory = async (userId, storyId) => {
  const storyRef = ref(db, `stories/${userId}/${storyId}`);
  const snapshot = await get(storyRef);
  return snapshot.val();
};

// Agregar una nueva historia (con texto opcional)
export const addStory = async (userId, imageFile, text = "") => {
  try {
    let imageUrl = null;
    if (imageFile) {
      // 🔥 Asegurar que sea un archivo válido
      if (imageFile instanceof File || imageFile instanceof Blob) {
        imageUrl = await uploadToImgBB(imageFile);
      } else {
        console.error("Invalid file type:", imageFile);
        throw new Error("El archivo no es válido");
      }
    }
    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1000; // 24 horas en ms
    const storyId = push(ref(db, `stories/${userId}`)).key;
    const storyData = {
      imageUrl: imageUrl || null,
      text: text || null,
      createdAt: now,
      expiresAt,
      viewers: {},
    };
    await set(ref(db, `stories/${userId}/${storyId}`), storyData);
    return storyId;
  } catch (error) {
    console.error("Error adding story:", error);
    throw error;
  }
};

// Obtener historias de un usuario (solo activas)
export const getUserStories = (userId, callback) => {
  const storiesRef = ref(db, `stories/${userId}`);
  return onValue(storiesRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const now = Date.now();
    const activeStories = Object.entries(data)
      .filter(([_, story]) => story.expiresAt > now)
      .map(([id, story]) => ({ id, ...story }))
      .sort((a, b) => a.createdAt - b.createdAt);
    callback(activeStories);
  });
};

// utils/stories.js - markStoryViewed
// utils/stories.js
export const markStoryViewed = async (userId, storyId, viewerId) => {
  const viewerRef = ref(db, `stories/${userId}/${storyId}/viewers/${viewerId}`);
  // Guardar timestamp numérico, no booleano
  await set(viewerRef, Date.now());
};