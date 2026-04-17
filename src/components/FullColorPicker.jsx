import { useCallback, useEffect, useState } from "react";
import GradientEditor from "./GradientEditor";

function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function FullColorPicker({ onChange, value }) {
  const [color, setColor] = useState("#ff0000");
  const [alpha, setAlpha] = useState(1);
  const [useGradient, setUseGradient] = useState(false);
  const [gradient, setGradient] = useState(
    "linear-gradient(90deg, #ff0000, #0000ff)"
  );

  useEffect(() => {
    if (typeof value === "string") {
      if (
        value.startsWith("linear-gradient") ||
        value.startsWith("radial-gradient")
      ) {
        setUseGradient(true);
        setGradient(value);
      } else if (value.startsWith("rgba")) {
        setUseGradient(false);
        // Extraer color hexadecimal y alpha del valor rgba
        const rgbaMatch = value.match(
          /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/
        );
        if (rgbaMatch) {
          const [r, g, b, a] = rgbaMatch.slice(1).map(Number);
          setAlpha(a || 1);
          // Convertir RGB a HEX
          const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b)
            .toString(16)
            .slice(1)}`;
          setColor(hex);
        }
      } else if (value.startsWith("#")) {
        setUseGradient(false);
        setColor(value);
      }
    }
  }, [value]);

  const finalValue = useGradient ? gradient : hexToRgba(color, alpha);

  // Memoizamos la función de cambio para evitar renders innecesarios
  const handleFinalChange = useCallback(
    (value) => {
      onChange?.(value);
    },
    [onChange]
  );

  // Manejador específico para cambios en el degradado
  const handleGradientChange = useCallback(
    (newGradient) => {
      setGradient(newGradient);
      handleFinalChange(newGradient);
    },
    [handleFinalChange]
  );

  return (
    <div className="flex flex-col gap-3 p-4 bg-[#1e1e1e] text-white rounded-xl w-full border border-gray-700 shadow-lg">
      {/* Toggle sólido vs degradado */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Usar degradado</label>
        <input
          type="checkbox"
          checked={useGradient}
          onChange={(e) => {
            setUseGradient(e.target.checked);
            handleFinalChange(
              e.target.checked ? gradient : hexToRgba(color, alpha)
            );
          }}
        />
      </div>

      {!useGradient ? (
        <>
          {/* Selector de color */}
          <div>
            <label className="text-sm font-medium">Color base</label>
            <input
              type="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                handleFinalChange(hexToRgba(e.target.value, alpha));
              }}
              className="w-full h-10 mt-1 border-none bg-transparent"
            />
          </div>

          {/* Selector de opacidad */}
          <div>
            <label className="text-sm font-medium">Opacidad: {alpha}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={alpha}
              onChange={(e) => {
                setAlpha(parseFloat(e.target.value));
                handleFinalChange(hexToRgba(color, parseFloat(e.target.value)));
              }}
              className="w-full"
            />
          </div>
        </>
      ) : (
        <>
          {/* Editor visual de degradado */}
          <div>
            <label className="text-sm font-medium">Editor de degradado</label>
            <div className="mt-2">
              <GradientEditor
                onChange={handleGradientChange}
                initialGradient={gradient}
              />
            </div>
          </div>
        </>
      )}

      {/* Vista previa 
      <div className="mt-4">
        <label className="text-sm font-medium">Vista previa</label>
        <div
          className="h-16 w-full rounded border border-gray-600 mt-2"
          style={{ background: finalValue }}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Valor final</label>
        <div className="mt-1 p-2 bg-[#2a2a2a] rounded text-xs font-mono border border-gray-600 break-all">
          {finalValue}
        </div>
      </div>
      */}
    </div>
  );
}
