// components/ImagePicker.jsx
import { useRef, useState } from "react";
import { FaImage, FaTimes, FaCamera } from "react-icons/fa";
import ImageEditorModal from "./ImageEditorModal";

export default function ImagePicker({ onSelectImage, onClose }) {
  const fileInputRef = useRef(null);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      setShowEditor(true);
    }
    e.target.value = "";
  };

  const handleSaveEditedImage = (editedFile) => {
    onSelectImage(editedFile);
    setShowEditor(false);
    onClose();
  };

  return (
    <>
      <div className="absolute bottom-20 left-0 right-0 bg-[#242526] rounded-t-2xl shadow-2xl z-50 animate-slide-up">
        <div className="p-3 border-b border-[#3E4042] flex justify-between items-center">
          <h3 className="text-white font-semibold">Enviar imagen</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FaTimes />
          </button>
        </div>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full p-4 flex items-center gap-3 hover:bg-[#3A3B3C] transition"
        >
          <FaImage className="text-[#2e9b4f] text-xl" />
          <span className="text-white">Subir imagen</span>
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {showEditor && selectedFile && (
        <ImageEditorModal
          imageFile={selectedFile}
          onSave={handleSaveEditedImage}
          onClose={() => {
            setShowEditor(false);
            setSelectedFile(null);
          }}
        />
      )}
    </>
  );
}