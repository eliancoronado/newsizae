// utils/reelsService.js
import { ref, push, set, get, update, onValue, query, orderByChild, limitToLast } from "firebase/database";
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { compressVideo, generateThumbnail } from "./videoCompression";

// Subir reel
export const uploadReel = async (userId, videoFile, data, onProgress) => {
  try {
    // Comprimir video
    const compressedVideo = await compressVideo(videoFile, (percent) => {
      onProgress?.('compress', percent);
    });
    
    // Generar thumbnail
    const thumbnailBlob = await generateThumbnail(videoFile);
    
    // Subir video a Storage
    const videoRef = storageRef(storage, `reels/${userId}/${Date.now()}_video.mp4`);
    const uploadTask = uploadBytesResumable(videoRef, compressedVideo);
    
    const videoUrl = await new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.('upload', percent);
        },
        reject,
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        }
      );
    });
    
    // Subir thumbnail a Storage
    let thumbnailUrl = null;
    if (thumbnailBlob) {
      const thumbRef = storageRef(storage, `reels/${userId}/${Date.now()}_thumb.jpg`);
      const thumbUpload = uploadBytesResumable(thumbRef, thumbnailBlob);
      thumbnailUrl = await new Promise((resolve, reject) => {
        thumbUpload.on('state_changed', null, reject, async () => {
          const url = await getDownloadURL(thumbUpload.snapshot.ref);
          resolve(url);
        });
      });
    }
    
    // Guardar metadatos en Realtime Database
    const reelRef = push(ref(db, 'reels'));
    const reelData = {
      userId,
      userName: data.userName,
      userPhoto: data.userPhoto,
      videoUrl,
      thumbnail: thumbnailUrl,
      title: data.title,
      description: data.description,
      hashtags: data.hashtags || [],
      likes: {},
      comments: {},
      createdAt: Date.now(),
      views: 0
    };
    
    await set(reelRef, reelData);
    
    return { id: reelRef.key, ...reelData };
  } catch (error) {
    console.error('Error uploading reel:', error);
    throw error;
  }
};

// Obtener reels (últimos 20)
export const getReels = (callback) => {
  const reelsRef = query(ref(db, 'reels'), orderByChild('createdAt'), limitToLast(20));
  return onValue(reelsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const reelsList = Object.entries(data)
        .map(([id, reel]) => ({ id, ...reel }))
        .sort((a, b) => b.createdAt - a.createdAt);
      callback(reelsList);
    } else {
      callback([]);
    }
  });
};

// Dar like
export const toggleReelLike = async (reelId, userId) => {
  const likeRef = ref(db, `reels/${reelId}/likes/${userId}`);
  const snapshot = await get(likeRef);
  if (snapshot.exists()) {
    await set(likeRef, null);
  } else {
    await set(likeRef, true);
  }
};

// Agregar comentario
export const addReelComment = async (reelId, userId, userName, userPhoto, text) => {
  const commentsRef = ref(db, `reels/${reelId}/comments`);
  const newCommentRef = push(commentsRef);
  await set(newCommentRef, {
    userId,
    userName,
    userPhoto,
    text,
    timestamp: Date.now()
  });
};