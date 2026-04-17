import React, { useState, useEffect } from "react";
import axios from "axios";

const ImageUploader = ({ prid, imgSelected, setImgSelected, url }) => {
  const [uploadedImages, setUploadedImages] = useState([]);

  // Cargar imágenes existentes desde el backend
  const fetchImages = async () => {
    try {
      const response = await axios.get(`${url}/imagesuploaded/${prid}`);
      setUploadedImages(response.data.images); // Suponiendo que devuelve un array de rutas
    } catch (error) {
      console.error("Error al cargar imágenes:", error);
    }
  };

  useEffect(() => {
    fetchImages(); // Llamar cuando el componente se monte
  }, []);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await axios.post(`${url}/upload/${prid}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUploadedImages((prev) => [...prev, response.data.filePath]);
    } catch (error) {
      console.error("Error subiendo la imagen:", error);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-[#FFC700] text-xl font-medium">Subir Imágenes</h2>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="mt-4 w-full text-[#FFC700]"
      />
      <div style={{ marginTop: "20px" }}>
        <h3 className="text-[#FFC700] text-lg font-medium">Imágenes Subidas:</h3>
        <div className="w-full grid grid-cols-3 gap-2 p-2 mt-2">
          {uploadedImages.map((image, index) => {
            const imageSrc = `${url}${image}`;
            console.log("Image source:", imageSrc);
            return (
              <img
                key={index}
                src={imageSrc}
                className={`w-full h-20 cursor-pointer object-contain hover:bg-white hover:bg-opacity-35 ${
                  imgSelected === imageSrc ? "bg-blue-500 bg-opacity-35" : ""
                }`}
                onClick={() => setImgSelected(imageSrc)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;
