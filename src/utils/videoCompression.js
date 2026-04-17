// utils/videoCompression.js
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg = null;

export const initFFmpeg = async () => {
  if (ffmpeg) return ffmpeg;
  
  ffmpeg = new FFmpeg();
  
  // Cargar FFmpeg desde CDN
  await ffmpeg.load({
    coreURL: await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js', 'text/javascript'),
    wasmURL: await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm', 'application/wasm'),
  });
  
  return ffmpeg;
};

export const compressVideo = async (file, onProgress) => {
  try {
    const ffmpegInstance = await initFFmpeg();
    
    // Escribir archivo en memoria
    const inputName = 'input.mp4';
    const outputName = 'output.mp4';
    
    await ffmpegInstance.writeFile(inputName, await fetchFile(file));
    
    // Configurar progreso
    ffmpegInstance.on('progress', ({ progress, time }) => {
      const percent = Math.round(progress * 100);
      onProgress?.(percent);
    });
    
    // Comprimir video (resolución 720p, bitrate reducido)
    await ffmpegInstance.exec([
      '-i', inputName,
      '-vf', 'scale=720:-2',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '28',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      outputName
    ]);
    
    // Leer archivo comprimido
    const data = await ffmpegInstance.readFile(outputName);
    const compressedBlob = new Blob([data.buffer], { type: 'video/mp4' });
    const compressedFile = new File([compressedBlob], file.name, { type: 'video/mp4' });
    
    return compressedFile;
  } catch (error) {
    console.error('Error compressing video:', error);
    return file; // Retornar original si falla
  }
};

export const generateThumbnail = async (file, onProgress) => {
  try {
    const ffmpegInstance = await initFFmpeg();
    
    const inputName = 'input.mp4';
    const outputName = 'thumbnail.jpg';
    
    await ffmpegInstance.writeFile(inputName, await fetchFile(file));
    
    // Generar thumbnail en el segundo 1
    await ffmpegInstance.exec([
      '-i', inputName,
      '-ss', '00:00:01',
      '-vframes', '1',
      '-vf', 'scale=360:-2',
      '-q:v', '2',
      outputName
    ]);
    
    const data = await ffmpegInstance.readFile(outputName);
    const thumbnailBlob = new Blob([data.buffer], { type: 'image/jpeg' });
    return thumbnailBlob;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return null;
  }
};