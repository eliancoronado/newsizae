// components/ImagePreviewModal.jsx
import { useState } from "react";
import { FaTimes } from "react-icons/fa";

export default function ImagePreviewModal({ imageUrl, onClose }) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.min(Math.max(zoomLevel + delta, 1), 4);
    setZoomLevel(newZoom);
    if (newZoom === 1) {
      setTranslate({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - translate.x,
      y: e.clientY - translate.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoomLevel <= 1) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    const maxTranslate = (zoomLevel - 1) * 250;
    setTranslate({
      x: Math.min(Math.max(newX, -maxTranslate), maxTranslate),
      y: Math.min(Math.max(newY, -maxTranslate), maxTranslate),
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center animate-fadeIn"
      onClick={onClose}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsDragging(false)}
    >
      <button
        className="absolute top-4 right-4 text-white text-3xl z-10 hover:scale-110 transition"
        onClick={onClose}
      >
        ✕
      </button>
      
      <img
        src={imageUrl}
        alt="preview"
        className="max-w-[90vw] max-h-[90vh] object-contain select-none"
        style={{
          transform: `scale(${zoomLevel}) translate(${translate.x / zoomLevel}px, ${translate.y / zoomLevel}px)`,
          transition: isDragging ? "none" : "transform 0.2s ease-out",
          cursor: zoomLevel > 1 ? "grab" : "zoom-in",
        }}
        onMouseDown={handleMouseDown}
      />
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs bg-black/50 rounded-full px-3 py-1">
        🖱️ Rueda para zoom | Click derecho para salir
      </div>
    </div>
  );
}