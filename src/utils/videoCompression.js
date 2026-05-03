// utils/videoCompressor.js
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpeg = null;

// Inicializar FFmpeg (solo una vez)
export const initFFmpeg = async () => {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();

  // Cargar los archivos de FFmpeg desde CDN
  await ffmpeg.load({
    coreURL: await toBlobURL(
      "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js",
      "text/javascript",
    ),
    wasmURL: await toBlobURL(
      "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm",
      "application/wasm",
    ),
  });

  return ffmpeg;
};

// Comprimir y convertir video a H.264
export const compressVideo = async (file, onProgress) => {
  try {
    console.log("🎬 Iniciando compresión de video:", file.name);

    // Inicializar FFmpeg
    const ffmpegInstance = await initFFmpeg();

    // Escribir el archivo original
    const inputName = "input.mp4";
    const outputName = "output.mp4";

    await ffmpegInstance.writeFile(inputName, await fetchFile(file));

    // Configurar progreso
    ffmpegInstance.on("progress", ({ progress, time }) => {
      if (onProgress) {
        onProgress(Math.floor(progress * 100));
      }
      console.log(`🔄 Comprimiendo: ${Math.floor(progress * 100)}%`);
    });

    // 🔥 Comandos de FFmpeg para comprimir y estandarizar
    // -c:v libx264: codec H.264 (universal)
    // -preset medium: balance entre velocidad y tamaño
    // -crf 28: calidad (18=alta, 28=media, 35=baja)
    // -c:a aac: audio AAC
    // -b:a 128k: bitrate de audio
    // -movflags +faststart: optimiza para streaming
    // -vf scale: redimensiona si es muy grande (max 720p)

    await ffmpegInstance.exec([
      "-i",
      inputName,
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "32", // Calidad más baja
      "-c:a",
      "aac",
      "-b:a",
      "96k",
      "-movflags",
      "+faststart",
      "-vf",
      "scale=640:-2", // 360p
      outputName,
    ]);

    // Leer el archivo comprimido
    const data = await ffmpegInstance.readFile(outputName);
    const compressedBlob = new Blob([data.buffer], { type: "video/mp4" });
    const compressedFile = new File([compressedBlob], file.name, {
      type: "video/mp4",
    });

    console.log("✅ Video comprimido exitosamente");
    console.log(
      `📊 Tamaño original: ${(file.size / 1024 / 1024).toFixed(2)} MB`,
    );
    console.log(
      `📊 Tamaño comprimido: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`,
    );

    return compressedFile;
  } catch (error) {
    console.error("❌ Error comprimiendo video:", error);
    // Si falla la compresión, devolver el archivo original
    console.warn("⚠️ Usando video original sin comprimir");
    return file;
  }
};
