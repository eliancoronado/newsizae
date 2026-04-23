import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import imageCompression from 'browser-image-compression';

// Configuración directa (reemplaza con tus credenciales)
const s3Client = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'AKIARJ6KTZUASLK3DD7Q',
    secretAccessKey: '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',
  },
});

const S3_BUCKET = 'mis-proyectos-sizae-app';

export const uploadToS3 = async (file) => {
  try {
    console.log('Iniciando subida a S3...', file.name);

    // Comprimir imagen si es necesario
    let fileToUpload = file;
    if (file.size > 1024 * 1024) { // Mayor a 1MB
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'blob', // Forzar salida como Blob
      };
      const compressedBlob = await imageCompression(file, options);
      // Convertir Blob a File (pero mantener compatibilidad)
      fileToUpload = new File([compressedBlob], file.name, { type: compressedBlob.type });
    }

    // Generar nombre único
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `posts/${timestamp}-${randomString}.${fileExtension}`;

    // Convertir a ArrayBuffer para S3 (solución al error)
    const arrayBuffer = await fileToUpload.arrayBuffer();
    
    // Subir a S3 usando ArrayBuffer
    const uploadParams = {
      Bucket: S3_BUCKET,
      Key: fileName,
      Body: arrayBuffer,
      ContentType: fileToUpload.type,
      ACL: 'public-read',
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);
    
    const publicUrl = `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`;
    console.log('Subida exitosa:', publicUrl);
    
    return publicUrl;
  } catch (error) {
    console.error('Error detallado:', error);
    throw new Error(`Error al subir la imagen: ${error.message}`);
  }
};

export const deleteFromS3 = async (imageUrl) => {
  try {
    if (!imageUrl) {
      console.log('No hay URL para eliminar');
      return;
    }

    // Extraer la key de diferentes formatos de URL
    let key;
    
    // Formato 1: https://bucket.s3.amazonaws.com/posts/imagen.jpg
    if (imageUrl.includes('.s3.amazonaws.com/')) {
      key = imageUrl.split('.s3.amazonaws.com/')[1];
    }
    // Formato 2: https://s3.amazonaws.com/bucket/posts/imagen.jpg
    else if (imageUrl.includes('s3.amazonaws.com/')) {
      const parts = imageUrl.split('s3.amazonaws.com/');
      key = parts[1].split('/').slice(1).join('/');
    }
    // Formato 3: https://bucket.s3.region.amazonaws.com/posts/imagen.jpg
    else if (imageUrl.includes('.s3.')) {
      key = imageUrl.split('.amazonaws.com/')[1];
    }
    else {
      console.error('Formato de URL no reconocido:', imageUrl);
      return;
    }
    
    console.log('🗑️ Eliminando archivo:', key);
    
    const deleteParams = {
      Bucket: "mis-proyectos-sizae-app",
      Key: key,
    };
    
    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);
    console.log('✅ Imagen eliminada:', key);
    
    return true;
  } catch (error) {
    console.error('❌ Error al eliminar de S3:', error);
    throw error;
  }
};

// Agrega esta función antes del return
// ELIMINA la función uploadVideoToS3 que tienes y REEMPLAZA con esta:

export const uploadVideoToS3 = async (file, onProgress) => {
  try {
    console.log('Iniciando subida de video:', file.name);
    
    // Validar que sea video
    if (!file.type.startsWith('video/')) {
      throw new Error('El archivo debe ser un video');
    }
    
    // Generar nombre único
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `videos/${timestamp}-${randomString}.${fileExtension}`;
    
    // Para videos, NO comprimimos con imageCompression, usamos el archivo original
    // Pero necesitamos convertirlo a ArrayBuffer igual que las imágenes
    const arrayBuffer = await file.arrayBuffer();
    
    const uploadParams = {
      Bucket: "mis-proyectos-sizae-app",
      Key: fileName,
      Body: arrayBuffer,  // Usar ArrayBuffer en lugar del File directamente
      ContentType: file.type,
      ACL: 'public-read',
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
    console.log('Video subido exitosamente:', videoUrl);
    
    return videoUrl;
  } catch (error) {
    console.error('Error detallado al subir video:', error);
    throw new Error(`Error al subir el video: ${error.message}`);
  }
};