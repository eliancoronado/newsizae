// utils/uploadImage.js
import imageCompression from 'browser-image-compression';

const IMGBB_API_KEY = 'c18be72a3353447ab8137cc8489b5cd1';
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

export const uploadToImgBB = async (file) => {
  try {
    // Opcional: comprimir la imagen antes de subir
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };
    const compressedFile = await imageCompression(file, options);

    const formData = new FormData();
    formData.append('image', compressedFile);

    const response = await fetch(`${IMGBB_UPLOAD_URL}?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    if (result.success) {
      return result.data.url; // URL directa de la imagen
    } else {
      throw new Error('Error al subir la imagen');
    }
  } catch (error) {
    console.error('Error uploading to imgBB:', error);
    throw error;
  }
};