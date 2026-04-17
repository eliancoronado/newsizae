// components/StoryRing.jsx
import React from "react";

export default function StoryRing({
  hasStories,
  hasUnseenStory,
  onClick,
  children,
}) {
  // Solo mostrar el anillo si el usuario tiene historias
  if (!hasStories) {
    return (
      <div onClick={onClick} className="cursor-pointer">
        {children}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="relative cursor-pointer"
      style={{ display: "inline-block" }}
    >
      {/* Anillo exterior con gradiente o gris según si está vista */}
      <div
        className={`absolute inset-0 rounded-full ${
          hasUnseenStory
            ? "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600"
            : "bg-gray-500"
        }`}
        style={{
          padding: "3px",
          width: "calc(100% + 6px)",
          height: "calc(100% + 6px)",
          top: "-3px",
          left: "-3px",
          borderRadius: "50%",
          boxSizing: "border-box",
        }}
      />
      {/* Contenedor interno para la imagen */}
      <div
        className="relative rounded-full overflow-hidden p-0.5 bg-black"
        style={{ width: "100%", height: "100%" }}
      >
        {children}
      </div>

      {/* Animación de pulso solo para historias no vistas */}
      {hasUnseenStory && (
        <div
          className="absolute inset-0 rounded-full animate-ping-slow pointer-events-none"
          style={{
            border: "3px solid transparent",
            borderImage: "linear-gradient(135deg, #f9ce34, #ee2a7b, #6228d7)",
            borderImageSlice: 1,
            borderRadius: "50%",
            boxSizing: "border-box",
          }}
        />
      )}
    </div>
  );
}
