// components/ImageUploader.jsx
import React, { useState, useEffect } from "react";
import {
  uploadProjectImage,
  getProjectImages,
  deleteProjectImage,
} from "../utils/uploadToS3SDK";
import { FaSpinner, FaTrash, FaCloudUploadAlt } from "react-icons/fa";

const ImageUploader = ({
  userId,
  projectId,
  setImgSelected,
  selectedImage,
}) => {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar imágenes existentes desde S3
  const loadImages = async () => {
    if (!userId || !projectId) {
      console.log("⏳ Esperando userId o projectId...", { userId, projectId });
      setLoading(false);
      return;
    }

    console.log("📡 Cargando imágenes para:", { userId, projectId });
    setLoading(true);
    setError(null);

    try {
      const images = await getProjectImages(userId, projectId);
      console.log("✅ Imágenes cargadas:", images);
      setUploadedImages(images || []);
    } catch (error) {
      console.error("❌ Error al cargar imágenes:", error);
      setError(error.message);
      setUploadedImages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && projectId) {
      loadImages();
    } else {
      console.log("⏳ Esperando userId y projectId para cargar imágenes");
      setLoading(false);
    }
  }, [userId, projectId]);

  const handleDeleteImage = async (image) => {
    if (!confirm("¿Eliminar esta imagen?")) return;

    try {
      console.log("🗑️ Eliminando imagen:", image.key);
      await deleteProjectImage(image.key, userId, projectId, image.id);
      setUploadedImages((prev) => prev.filter((img) => img.id !== image.id));

      // Si la imagen eliminada era la seleccionada, limpiar selección
      if (selectedImage === image.url && setImgSelected) {
        setImgSelected(null);
      }
      console.log("✅ Imagen eliminada");
    } catch (error) {
      console.error("❌ Error al eliminar imagen:", error);
      alert("Error al eliminar la imagen");
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona una imagen válida");
      return;
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen no debe pesar más de 5MB");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      console.log("📤 Subiendo imagen...");
      const { url, key } = await uploadProjectImage(
        userId,
        projectId,
        file,
        (progress) => {
          setUploadProgress(progress);
          console.log(`📤 Progreso: ${progress}%`);
        },
      );

      console.log("✅ Imagen subida:", { url, key });
      setUploadedImages((prev) => [...prev, { url, key }]);

      // Seleccionar automáticamente la nueva imagen
      if (setImgSelected) setImgSelected(url);
    } catch (error) {
      console.error("❌ Error subiendo la imagen:", error);
      alert("Error al subir la imagen: " + error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Limpiar el input
      event.target.value = "";
    }
  };

  // Depuración: Mostrar valores actuales
  console.log("🔍 Estado actual:", {
    userId,
    projectId,
    loading,
    error,
    imagesCount: uploadedImages.length,
  });

  if (!userId || !projectId) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>Esperando información del proyecto...</p>
        <p className="text-xs mt-2">UserId: {userId || "No disponible"}</p>
        <p className="text-xs">ProjectId: {projectId || "No disponible"}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center p-8">
        <FaSpinner className="animate-spin text-[#FFC700] text-3xl mb-3" />
        <p className="text-gray-400 text-sm">Cargando imágenes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-400">
        <p>Error al cargar imágenes: {error}</p>
        <button
          onClick={loadImages}
          className="mt-3 px-4 py-2 bg-[#FFC700] text-black rounded-lg text-sm font-medium hover:scale-105 transition"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[#FFC700] text-sm lg:text-xl font-medium">
          Galería de imágenes
        </h2>
        <label className="cursor-pointer">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg bg-gradient-to-r from-[#FFC700] to-[#FFA500] text-black font-medium hover:scale-105 transition-all duration-300 ${uploading ? "opacity-50" : ""}`}
          >
            {uploading ? (
              <>
                <FaSpinner className="animate-spin text-sm" />
                <span className="text-xs lg:text-sm">{uploadProgress}%</span>
              </>
            ) : (
              <>
                <FaCloudUploadAlt className="text-sm lg:text-base" />
                <span className="text-xs lg:text-sm">Subir</span>
              </>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {/* Barra de progreso */}
      {uploading && (
        <div className="mb-4">
          <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#FFC700] to-[#FFA500] h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Grid de imágenes */}
      <div className="grid grid-cols-3 gap-2 lg:gap-3">
        {uploadedImages.length === 0 ? (
          <div className="col-span-3 text-center py-8 text-gray-400">
            <p className="text-sm">📷 No hay imágenes aún</p>
            <p className="text-xs mt-1">
              Haz clic en "Subir" para agregar imágenes
            </p>
          </div>
        ) : (
          uploadedImages.map((image, index) => (
            <div
              key={image.key || index}
              className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-all duration-300"
              onClick={() => {
                alert("🖱️ Imagen seleccionada:", image.url);
                console.log("setImgSelected existe?", !!setImgSelected);
                if (setImgSelected) {
                  setImgSelected(image.url);
                } else {
                  console.warn("⚠️ setImgSelected no está definido");
                }
              }}
            >
              <img
                src={image.url}
                alt="Project"
                className={`w-full h-full object-cover transition-all duration-300 ${
                  selectedImage === image.url
                    ? "ring-2 ring-[#FFC700] ring-offset-2 ring-offset-[#2B2B44]"
                    : ""
                }`}
              />
              {selectedImage === image.url && (
                <div className="absolute bottom-1 left-1 right-1 bg-gradient-to-r from-[#FFC700] to-[#FFA500] text-black text-[10px] text-center rounded py-0.5">
                  Seleccionada
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
