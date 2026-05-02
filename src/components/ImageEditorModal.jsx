// components/ImageEditorModal.jsx - Versión SIMPLIFICADA (solo recorte)
import { useState, useRef, useEffect } from "react";
import Cropper from "react-cropper";
import "./cropper.css";
import { FaTimes, FaCheck } from "react-icons/fa";

export default function ImageEditorModal({ imageFile, onSave, onClose }) {
  const [imageUrl, setImageUrl] = useState(null);
  const cropperRef = useRef(null);

  useEffect(() => {
    const url = URL.createObjectURL(imageFile);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const handleCropAndSave = () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) {
      console.error("Cropper no disponible");
      return;
    }

    // Obtener el canvas recortado
    const croppedCanvas = cropper.getCroppedCanvas({
      imageSmoothingEnabled: true,
      imageSmoothingQuality: "high",
    });

    if (!croppedCanvas) {
      console.error("No se pudo obtener el canvas recortado");
      return;
    }

    // Convertir a blob y luego a file
    croppedCanvas.toBlob(
      (blob) => {
        if (!blob) {
          console.error("No se pudo crear el blob");
          return;
        }
        const file = new File([blob], "cropped_image.jpg", {
          type: "image/jpeg",
        });
        onSave(file);
      },
      "image/jpeg",
      0.9,
    );
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center animate-fadeIn">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-black/50 p-4 flex justify-between items-center z-10">
        <h3 className="text-white font-semibold">Recortar imagen</h3>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-red-500 hover:bg-red-600 transition"
          >
            <FaTimes className="text-white" />
          </button>
          <button
            onClick={handleCropAndSave}
            className="p-2 rounded-lg bg-[#2e9b4f] hover:bg-[#268e46] transition"
          >
            <FaCheck className="text-white" />
          </button>
        </div>
      </div>

      {/* Contenedor del Cropper */}
      <div className="flex items-center justify-center w-full h-full">
        {imageUrl && (
          <div className="max-w-[90vw] max-h-[80vh]">
            <Cropper
              ref={cropperRef}
              src={imageUrl}
              style={{ height: "70vh", width: "auto", maxWidth: "90vw" }}
              initialAspectRatio={NaN}
              aspectRatio={NaN}
              viewMode={1}
              guides={true}
              dragMode="move"
              cropBoxMovable={true}
              cropBoxResizable={true}
              toggleDragModeOnDblclick={false}
              background={false}
              autoCropArea={0.8}
            />
            <p className="text-center text-gray-400 text-sm mt-4">
              Arrastra los bordes para recortar la imagen
            </p>
          </div>
        )}
      </div>

      {/* Botón de aplicar recorte (flotante) */}
      <div className="absolute bottom-20 left-0 right-0 flex justify-center z-10">
        <button
          onClick={handleCropAndSave}
          className="px-6 py-2 bg-[#2e9b4f] text-white rounded-full font-semibold hover:bg-[#268e46] transition"
        >
          Aplicar recorte y enviar
        </button>
      </div>

      {/* Instrucciones */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs bg-black/50 rounded-full px-3 py-1">
        🖱️ Arrastra los bordes para recortar | ✓ Click en "Aplicar recorte y
        enviar"
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
