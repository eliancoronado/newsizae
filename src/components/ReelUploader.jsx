// components/ReelUploader.jsx
import { useState } from "react";
import { FaTimes, FaVideo, FaUpload, FaSpinner } from "react-icons/fa";
import { uploadReel } from "../utils/reelsService";

export default function ReelUploader({ currentUser, onClose, onSuccess }) {
  const [videoFile, setVideoFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ compress: 0, upload: 0 });
  const [stage, setStage] = useState(null); // 'compress', 'upload'
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile) return;
    
    setUploading(true);
    try {
      const reelData = {
        userName: currentUser.name,
        userPhoto: currentUser.picture,
        title,
        description,
        hashtags: hashtags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      
      await uploadReel(currentUser.uid, videoFile, reelData, (type, percent) => {
        setStage(type);
        setProgress(prev => ({ ...prev, [type]: percent }));
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error uploading reel:", error);
      alert("Error al subir el reel");
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div className="bg-[#242526] rounded-xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Subir Reel</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {preview ? (
            <div className="relative mb-4">
              <video src={preview} className="w-full h-64 object-cover rounded-lg" controls />
              <button
                type="button"
                onClick={() => {
                  setVideoFile(null);
                  setPreview(null);
                }}
                className="absolute top-2 right-2 bg-red-500 rounded-full p-1"
              >
                <FaTimes className="w-3 h-3 text-white" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-[#3A3B3C]">
              <FaVideo className="text-4xl text-gray-400 mb-2" />
              <p className="text-sm text-gray-400">Selecciona un video</p>
              <input type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
            </label>
          )}
          
          <input
            type="text"
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#3A3B3C] text-white p-2 rounded-lg mb-2"
            required
          />
          
          <textarea
            placeholder="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#3A3B3C] text-white p-2 rounded-lg mb-2"
            rows="2"
          />
          
          <input
            type="text"
            placeholder="Hashtags (separados por comas)"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            className="w-full bg-[#3A3B3C] text-white p-2 rounded-lg mb-4"
          />
          
          {uploading && (
            <div className="mb-4">
              <p className="text-white text-sm mb-1">
                {stage === 'compress' ? 'Comprimiendo video...' : 'Subiendo video...'}
              </p>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all"
                  style={{ width: `${progress[stage] || 0}%` }}
                />
              </div>
              <p className="text-white text-xs mt-1">{Math.round(progress[stage] || 0)}%</p>
            </div>
          )}
          
          <button
            type="submit"
            disabled={!videoFile || uploading}
            className="w-full bg-red-500 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
          >
            {uploading ? <FaSpinner className="animate-spin mx-auto" /> : "Publicar Reel"}
          </button>
        </form>
      </div>
    </div>
  );
}