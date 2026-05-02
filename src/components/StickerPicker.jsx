// components/StickerPicker.jsx
import { useState, useEffect } from 'react';
import { FaSmile, FaTimes, FaPlus } from 'react-icons/fa';
import { ref, push, set, get, onValue } from 'firebase/database';
import { db } from '../firebase';
import { uploadToS3 } from '../utils/uploadToS3SDK';

// Stickers predefinidos (imágenes pequeñas en base64 para no depender de red)
const DEFAULT_STICKERS = [
  { id: '1', emoji: '😂', name: 'Risa' },
  { id: '2', emoji: '😍', name: 'Amor' },
  { id: '3', emoji: '😭', name: 'Llanto' },
  { id: '4', emoji: '🔥', name: 'Fuego' },
  { id: '5', emoji: '🎉', name: 'Fiesta' },
  { id: '6', emoji: '💀', name: 'Muerte' },
  { id: '7', emoji: '👀', name: 'Mirando' },
  { id: '8', emoji: '🙏', name: 'Gracias' },
  { id: '9', emoji: '💪', name: 'Fuerza' },
  { id: '10', emoji: '✨', name: 'Magia' },
];

export default function StickerPicker({ currentUser, onSelectSticker, onClose }) {
  const [stickers, setStickers] = useState(DEFAULT_STICKERS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStickerText, setNewStickerText] = useState('');
  const [newStickerImage, setNewStickerImage] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    // Cargar stickers personalizados del usuario
    const stickersRef = ref(db, `stickers/${currentUser.uid}`);
    const unsubscribe = onValue(stickersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const customStickers = Object.entries(data).map(([id, sticker]) => ({
          id,
          ...sticker,
          isCustom: true
        }));
        setStickers([...DEFAULT_STICKERS, ...customStickers]);
      } else {
        setStickers(DEFAULT_STICKERS);
      }
    });
    return () => unsubscribe();
  }, [currentUser.uid]);

  const handleCreateSticker = async () => {
    if (!newStickerText.trim() && !newStickerImage) return;
    
    setCreating(true);
    try {
      let imageUrl = null;
      if (newStickerImage) {
        imageUrl = await uploadToS3(newStickerImage);
      }
      
      const stickerData = {
        text: newStickerText,
        image: imageUrl,
        createdAt: Date.now(),
        creatorId: currentUser.uid
      };
      
      const stickersRef = ref(db, `stickers/${currentUser.uid}`);
      const newStickerRef = push(stickersRef);
      await set(newStickerRef, stickerData);
      
      setNewStickerText('');
      setNewStickerImage(null);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating sticker:', error);
      alert('Error al crear sticker');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="absolute bottom-20 left-0 right-0 bg-[#242526] rounded-t-2xl shadow-2xl z-50 animate-slide-up max-h-80 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-[#242526] p-3 border-b border-[#3E4042] flex justify-between items-center">
        <h3 className="text-white font-semibold">Stickers</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <FaTimes />
        </button>
      </div>
      
      {/* Grid de stickers */}
      <div className="grid grid-cols-4 gap-3 p-3">
        {/* Botón para crear sticker */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="aspect-square bg-[#3A3B3C] rounded-xl flex flex-col items-center justify-center hover:bg-[#4A4B4C] transition"
        >
          <FaPlus className="text-[#2e9b4f] text-2xl" />
          <span className="text-xs text-gray-400 mt-1">Crear</span>
        </button>
        
        {stickers.map((sticker) => (
          <button
            key={sticker.id}
            onClick={() => onSelectSticker(sticker)}
            className="aspect-square bg-[#3A3B3C] rounded-xl flex items-center justify-center hover:bg-[#4A4B4C] transition transform hover:scale-105"
          >
            {sticker.image ? (
              <img src={sticker.image} alt="sticker" className="w-12 h-12 object-contain" />
            ) : (
              <span className="text-4xl">{sticker.emoji || sticker.text}</span>
            )}
          </button>
        ))}
      </div>
      
      {/* Modal para crear sticker */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center">
          <div className="bg-[#242526] rounded-2xl w-80 p-4">
            <h3 className="text-white font-semibold mb-3">Crear Sticker</h3>
            
            <input
              type="text"
              value={newStickerText}
              onChange={(e) => setNewStickerText(e.target.value)}
              placeholder="Texto del sticker (ej: 😂)"
              className="w-full bg-[#3A3B3C] text-white p-2 rounded-lg mb-3"
              maxLength={10}
            />
            
            <label className="block bg-[#3A3B3C] p-2 rounded-lg text-center cursor-pointer mb-3">
              <span className="text-gray-300">O subir imagen</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewStickerImage(e.target.files[0])}
                className="hidden"
              />
            </label>
            
            {newStickerImage && (
              <img src={URL.createObjectURL(newStickerImage)} alt="preview" className="w-16 h-16 mx-auto mb-3 rounded" />
            )}
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2 bg-gray-700 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateSticker}
                disabled={creating || (!newStickerText.trim() && !newStickerImage)}
                className="flex-1 py-2 bg-[#2e9b4f] rounded-lg disabled:opacity-50"
              >
                {creating ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}