// components/StoryUploader.jsx
import { useState } from "react";
import { FaTimes, FaImage, FaTextHeight } from "react-icons/fa";
import { addStory } from "../utils/stories";

export default function StoryUploader({ userId, onClose, onSuccess }) {
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file); // ✅ Guardar el archivo, no la URL
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile && !text.trim()) {
      alert("Agrega una imagen o texto para tu historia");
      return;
    }
    setUploading(true);
    try {
      // ✅ Pasar el archivo directamente a addStory
      await addStory(userId, imageFile, text);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error uploading story:", error);
      alert("Error al subir la historia: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
      <div className="bg-[#242526] rounded-xl p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Agregar historia</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FaTimes />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {/* Campo de texto */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <FaTextHeight className="text-gray-400" />
              <span className="text-white text-sm">Texto (opcional)</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribe algo para tu historia..."
              className="w-full bg-[#3A3B3C] text-white p-3 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#2e9b4f]"
              rows="3"
              maxLength="200"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {text.length}/200
            </p>
          </div>

          {/* Subida de imagen */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <FaImage className="text-gray-400" />
              <span className="text-white text-sm">Imagen (opcional)</span>
            </div>
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setPreview(null);
                  }}
                  className="absolute top-2 right-2 bg-red-500 rounded-full p-1 hover:bg-red-600 transition"
                >
                  <FaTimes className="w-3 h-3 text-white" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-[#3A3B3C] transition">
                <FaImage className="text-3xl text-gray-400 mb-2" />
                <p className="text-sm text-gray-400">
                  Haz clic para subir una imagen
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={uploading || (!imageFile && !text.trim())}
            className="w-full bg-[#2e9b4f] text-white py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#268e46] transition"
          >
            {uploading ? "Publicando..." : "Publicar historia"}
          </button>
        </form>
      </div>
    </div>
  );
}
