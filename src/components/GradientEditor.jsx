import React, { useState, useEffect } from "react";
import { useCallback } from "react";

function GradientEditor({ onChange, initialGradient }) {
  // Parseamos el degradado inicial a colorStops
  const parseGradient = (grad) => {
    if (!grad)
      return [
        { position: 0, color: "#ff0000" },
        { position: 100, color: "#0000ff" },
      ];

    const parts = grad.match(/#[0-9a-f]{6}|rgba?\([^)]+\)|\d+%/gi) || [];
    const colors = parts.filter(
      (p) => p.startsWith("#") || p.startsWith("rgb")
    );
    const positions = parts
      .filter((p) => p.endsWith("%"))
      .map((p) => parseInt(p));

    return colors.map((color, i) => ({
      color,
      position: positions[i] ?? (i === 0 ? 0 : 100),
    }));
  };

  const [colorStops, setColorStops] = useState(parseGradient(initialGradient));
  const [selectedIndex, setSelectedIndex] = useState(null);

  // 👉 Actualiza el gradiente cada vez que cambien los colorStops
  /*
  useEffect(() => {
    if (!onChange) return;
    const sorted = [...colorStops].sort((a, b) => a.position - b.position);
    const gradient = `linear-gradient(90deg, ${sorted
      .map((stop) => `${stop.color} ${stop.position}%`)
      .join(", ")})`;
    onChange(gradient);
  }, [colorStops, onChange]);
  */

  const updateGradient = useCallback(() => {
    if (!onChange) return;
    const sorted = [...colorStops].sort((a, b) => a.position - b.position);
    const gradient = `linear-gradient(90deg, ${sorted
      .map((stop) => `${stop.color} ${stop.position}%`)
      .join(", ")})`;
    onChange(gradient);
  }, [colorStops, onChange]);

  const handleColorChange = (index, newColor) => {
    setColorStops((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], color: newColor };
      return updated;
    });
    updateGradient();
  };

  const handleAddStop = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = ((e.clientX - rect.left) / rect.width) * 100;
    setColorStops((prev) => [
      ...prev,
      { position: Math.round(pos), color: "#ffffff" },
    ]);
    setSelectedIndex(colorStops.length);
    updateGradient();
  };

  const handleRemoveStop = (index) => {
    if (colorStops.length <= 2) return;
    setColorStops((prev) => prev.filter((_, i) => i !== index));
    setSelectedIndex(null);
    updateGradient();
  };

  const handleMoveStop = (e, index) => {
    const rect = e.currentTarget.parentNode.getBoundingClientRect();
    const move = (ev) => {
      const percent = ((ev.clientX - rect.left) / rect.width) * 100;
      setColorStops((prev) => {
        const updated = [...prev];
        updated[index].position = Math.max(
          0,
          Math.min(100, Math.round(percent))
        );
        return [...updated];
      });
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      updateGradient();
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  return (
    <>
      {/* Faja del degradado */}
      <div
        className="relative h-10 rounded cursor-pointer border border-gray-600"
        style={{
          background: `linear-gradient(90deg, ${[...colorStops]
            .sort((a, b) => a.position - b.position)
            .map((stop) => `${stop.color} ${stop.position}%`)
            .join(", ")})`,
        }}
        onClick={handleAddStop}
      >
        {colorStops.map((stop, index) => (
          <div
            key={index}
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white bg-white cursor-pointer"
            style={{
              left: `${stop.position}%`,
              transform: "translate(-50%, -50%)",
              backgroundColor: stop.color,
              zIndex: selectedIndex === index ? 10 : 5,
            }}
            onMouseDown={(e) => handleMoveStop(e, index)}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIndex(index);
            }}
            onDoubleClick={() => handleRemoveStop(index)}
          />
        ))}
      </div>

      {/* Selector de color */}
      {selectedIndex !== null && (
        <input
          type="color"
          value={colorStops[selectedIndex].color}
          onChange={(e) => handleColorChange(selectedIndex, e.target.value)}
          className="w-24 h-10 rounded border border-gray-600 mt-3"
        />
      )}
    </>
  );
}

export default GradientEditor;
