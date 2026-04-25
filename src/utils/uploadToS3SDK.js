import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import imageCompression from "browser-image-compression";

// Configuración directa (reemplaza con tus credenciales)
const s3Client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: "AKIARJ6KTZUASLK3DD7Q",
    secretAccessKey: "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",
  },
});
import { db } from "../firebase";
import { ref, set, get, remove, push, query, orderByChild, equalTo } from "firebase/database";

const S3_BUCKET = "mis-proyectos-sizae-app";

export const uploadToS3 = async (file) => {
  try {
    console.log("Iniciando subida a S3...", file.name);

    // Comprimir imagen si es necesario
    let fileToUpload = file;
    if (file.size > 1024 * 1024) {
      // Mayor a 1MB
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: "blob", // Forzar salida como Blob
      };
      const compressedBlob = await imageCompression(file, options);
      // Convertir Blob a File (pero mantener compatibilidad)
      fileToUpload = new File([compressedBlob], file.name, {
        type: compressedBlob.type,
      });
    }

    // Generar nombre único
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split(".").pop();
    const fileName = `posts/${timestamp}-${randomString}.${fileExtension}`;

    // Convertir a ArrayBuffer para S3 (solución al error)
    const arrayBuffer = await fileToUpload.arrayBuffer();

    // Subir a S3 usando ArrayBuffer
    const uploadParams = {
      Bucket: S3_BUCKET,
      Key: fileName,
      Body: arrayBuffer,
      ContentType: fileToUpload.type,
      ACL: "public-read",
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    const publicUrl = `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`;
    console.log("Subida exitosa:", publicUrl);

    return publicUrl;
  } catch (error) {
    console.error("Error detallado:", error);
    throw new Error(`Error al subir la imagen: ${error.message}`);
  }
};

// Subir imagen de proyecto y guardar referencia en Firebase
export const uploadProjectImage = async (
  userId,
  projectId,
  file,
  onProgress,
) => {
  try {
    let fileToUpload = file;

    // Comprimir si es imagen grande
    if (file.type.startsWith("image/") && file.size > 1024 * 1024) {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressedBlob = await imageCompression(file, options);
      fileToUpload = new File([compressedBlob], file.name, {
        type: compressedBlob.type,
      });
    }

    const imageId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    const fileExtension = file.name.split(".").pop();
    const key = `users/${userId}/projects/${projectId}/images/${imageId}.${fileExtension}`;
    const url = await uploadToS3(
      fileToUpload,
      key,
      fileToUpload.type,
      onProgress,
    );

    // 🔥 Guardar referencia en Firebase Realtime Database
    const imageRef = ref(db, `projectImages/${userId}/${projectId}/${imageId}`);
    await set(imageRef, {
      url: url,
      key: key,
      uploadedAt: Date.now(),
      name: file.name,
      size: file.size,
      type: file.type,
    });

    console.log("✅ Imagen subida y registrada en Firebase:", {
      url,
      key,
      id: imageId,
    });

    return { url, key, id: imageId };
  } catch (error) {
    console.error("Error uploading project image:", error);
    throw error;
  }
};

// Obtener imágenes desde Firebase (no desde S3)
export const getProjectImages = async (userId, projectId) => {
  try {
    if (!userId || !projectId) {
      console.log("❌ userId o projectId faltantes:", { userId, projectId });
      return [];
    }

    console.log("📡 Buscando imágenes en Firebase para:", {
      userId,
      projectId,
    });

    const imagesRef = ref(db, `projectImages/${userId}/${projectId}`);
    const snapshot = await get(imagesRef);

    if (!snapshot.exists()) {
      console.log("📷 No hay imágenes en este proyecto");
      return [];
    }

    const imagesData = snapshot.val();
    const images = Object.entries(imagesData).map(([id, data]) => ({
      id: id,
      url: data.url,
      key: data.key,
      uploadedAt: data.uploadedAt,
      name: data.name,
      size: data.size,
      type: data.type,
    }));

    // Ordenar por fecha de subida (más reciente primero)
    images.sort((a, b) => b.uploadedAt - a.uploadedAt);

    console.log(`✅ Encontradas ${images.length} imágenes en Firebase`);
    return images;
  } catch (error) {
    console.error("❌ Error getting project images from Firebase:", error);
    return [];
  }
};

// Eliminar imagen de proyecto
export const deleteProjectImage = async (
  imageKey,
  userId,
  projectId,
  imageId,
) => {
  try {
    if (!imageKey) {
      console.log("❌ No hay key para eliminar");
      return false;
    }

    console.log("🗑️ Eliminando imagen de S3:", imageKey);

    // Eliminar de S3
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: imageKey,
    });
    await s3Client.send(command);

    // Eliminar referencia de Firebase
    if (userId && projectId && imageId) {
      const imageRef = ref(
        db,
        `projectImages/${userId}/${projectId}/${imageId}`,
      );
      await remove(imageRef);
      console.log("✅ Referencia eliminada de Firebase");
    }

    console.log("✅ Imagen eliminada correctamente");
    return true;
  } catch (error) {
    console.error("❌ Error deleting project image:", error);
    throw error;
  }
};

// ==================== FUNCIONES LEGACY ====================

export const uploadToS3Legacy = async (file) => {
  try {
    let fileToUpload = file;
    if (file.size > 1024 * 1024) {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: "blob",
      };
      const compressedBlob = await imageCompression(file, options);
      fileToUpload = new File([compressedBlob], file.name, {
        type: compressedBlob.type,
      });
    }

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split(".").pop();
    const fileName = `posts/${timestamp}-${randomString}.${fileExtension}`;
    const arrayBuffer = await fileToUpload.arrayBuffer();

    const uploadParams = {
      Bucket: S3_BUCKET,
      Key: fileName,
      Body: arrayBuffer,
      ContentType: fileToUpload.type,
      ACL: "public-read",
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);
    return getPublicUrl(fileName);
  } catch (error) {
    console.error("Error:", error);
    throw new Error(`Error al subir la imagen: ${error.message}`);
  }
};

export const deleteFromS3 = async (imageUrl) => {
  try {
    if (!imageUrl) {
      console.log("No hay URL para eliminar");
      return;
    }

    // Extraer la key de diferentes formatos de URL
    let key;

    // Formato 1: https://bucket.s3.amazonaws.com/posts/imagen.jpg
    if (imageUrl.includes(".s3.amazonaws.com/")) {
      key = imageUrl.split(".s3.amazonaws.com/")[1];
    }
    // Formato 2: https://s3.amazonaws.com/bucket/posts/imagen.jpg
    else if (imageUrl.includes("s3.amazonaws.com/")) {
      const parts = imageUrl.split("s3.amazonaws.com/");
      key = parts[1].split("/").slice(1).join("/");
    }
    // Formato 3: https://bucket.s3.region.amazonaws.com/posts/imagen.jpg
    else if (imageUrl.includes(".s3.")) {
      key = imageUrl.split(".amazonaws.com/")[1];
    } else {
      console.error("Formato de URL no reconocido:", imageUrl);
      return;
    }

    console.log("🗑️ Eliminando archivo:", key);

    const deleteParams = {
      Bucket: "mis-proyectos-sizae-app",
      Key: key,
    };

    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);
    console.log("✅ Imagen eliminada:", key);

    return true;
  } catch (error) {
    console.error("❌ Error al eliminar de S3:", error);
    throw error;
  }
};

// Agrega esta función antes del return
// ELIMINA la función uploadVideoToS3 que tienes y REEMPLAZA con esta:

export const uploadVideoToS3 = async (file, onProgress) => {
  try {
    console.log("Iniciando subida de video:", file.name);

    // Validar que sea video
    if (!file.type.startsWith("video/")) {
      throw new Error("El archivo debe ser un video");
    }

    // Generar nombre único
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split(".").pop();
    const fileName = `videos/${timestamp}-${randomString}.${fileExtension}`;

    // Para videos, NO comprimimos con imageCompression, usamos el archivo original
    // Pero necesitamos convertirlo a ArrayBuffer igual que las imágenes
    const arrayBuffer = await file.arrayBuffer();

    const uploadParams = {
      Bucket: "mis-proyectos-sizae-app",
      Key: fileName,
      Body: arrayBuffer, // Usar ArrayBuffer en lugar del File directamente
      ContentType: file.type,
      ACL: "public-read",
    };

    const command = new PutObjectCommand(uploadParams);

    // Simular progreso (S3 no tiene progreso nativo en el SDK web)
    if (onProgress) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        onProgress(Math.min(progress, 90));
        if (progress >= 90) clearInterval(interval);
      }, 500);

      await s3Client.send(command);
      clearInterval(interval);
      onProgress(100);
    } else {
      await s3Client.send(command);
    }

    const videoUrl = `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`;
    console.log("Video subido exitosamente:", videoUrl);

    return videoUrl;
  } catch (error) {
    console.error("Error detallado al subir video:", error);
    throw new Error(`Error al subir el video: ${error.message}`);
  }
};
