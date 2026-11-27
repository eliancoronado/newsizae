import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoMdAddCircleOutline } from "react-icons/io";
import { LuLayers } from "react-icons/lu";
import { GoCopilot } from "react-icons/go";
import { FaRegImages } from "react-icons/fa";
import { MdOutlineStyle } from "react-icons/md";
import { FaCode } from "react-icons/fa6";
import { TbBlocks } from "react-icons/tb";
import { SiJavascript } from "react-icons/si";
import useStore from "../store/store";
import { motion, AnimatePresence } from "framer-motion";
import { Hand, MousePointer2,SlidersHorizontal, Grid } from "lucide-react";

const DockButton = ({ id, icon: Icon, label, active, onClick, showDot = true }) => {
  const [hover, setHover] = useState(false);

  return (
    <div className="relative flex flex-col items-center">
      {/* Tooltip */}
      <AnimatePresence>
        {hover && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-9 px-2.5 py-1 rounded-md
                       bg-[#0F0E1A] text-white text-[11px] font-medium
                       whitespace-nowrap pointer-events-none
                       border border-white/10 shadow-lg"
          >
            {label}
            <span
              className="absolute -bottom-1 left-1/2 -translate-x-1/2
                             w-2 h-2 bg-[#0F0E1A] rotate-45 border-r border-b border-white/10"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        whileTap={{ scale: 0.92 }}
        animate={{
          scale: hover ? 1.12 : 1,
          y: hover ? -3 : 0,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className={`
          relative flex items-center justify-center
          w-11 h-11 rounded-xl transition-colors duration-150
          ${
            active
              ? "bg-[#FFD966] text-[#1C1B2F] shadow-lg shadow-[#FFD966]/30"
              : "text-[#FFD966]/80 hover:bg-white/[0.06] hover:text-[#FFD966]"
          }
        `}
        title="" // usamos tooltip custom
      >
        <Icon className="text-xl" />
        {active && (
          <motion.span
            layoutId="active-dot"
            className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-[#FFD966]"
          />
        )}
      </motion.button>
    </div>
  );
};

const DockDivider = () => <div className="w-px h-7 bg-white/10 mx-1" />;

const SidebarB = () => {
  const { mode, setMode, rightPanelMode, setRightPanelMode, projectData, activeCanvasTool, setCanvasTool } =
    useStore();
  const navigate = useNavigate();

   // Helper: activa un panel lateral Y asegura que estemos en la vista "canvas"
  const openRightPanel = (panel) => {
    if (mode !== "design") setMode("design"); // sale de codeb/GStyles/etc.
    setRightPanelMode(panel);
  };

  const tools = [
    { id: "elements", icon: IoMdAddCircleOutline, label: "Elementos" },
    { id: "capas", icon: LuLayers, label: "Capas" },
    { id: "ia", icon: GoCopilot, label: "Asistente IA" },
    { id: "files", icon: FaRegImages, label: "Imágenes" },
    { id: "GStyles", icon: MdOutlineStyle, label: "Estilos globales" },
    { id: "props", icon: SlidersHorizontal, label: "Propiedades" }
  ];

  // Lógica del botón de código según lenguaje
  const codeTool =
    projectData?.language === "javascript"
      ? [{ id: "codeJS", icon: SiJavascript, label: "Código JS" },{id: "desing", icon: Grid, label: "Diseño",}]
        
      : projectData?.language === "waskart"
      ? [{ id: "code",  icon: FaCode,   label: "Código Waskart" },{id: "desing", icon: Grid, label: "Diseño",}]
      : [{ id: "codeb", icon: TbBlocks, label: "Bloques" },{id: "desing", icon: Grid, label: "Diseño",}];

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
      {/* Glow decorativo detrás del dock */}
      <div className="absolute inset-0 blur-2xl bg-[#FFD966]/10 rounded-2xl -z-10" />

      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="
          flex items-center gap-1 px-2 py-2
          rounded-2xl
          bg-[#1C1B2F]/80 backdrop-blur-xl
          border border-white/10
          shadow-[0_8px_32px_rgba(0,0,0,0.4)]
        "
      >
        {/* Logo / Home */}
        <DockButton
          id="home"
          icon={() => (
            <img src="/Subtract.png" alt="home" className="w-6 h-6" />
          )}
          label="Inicio"
          onClick={() => navigate("/dashboard")}
        />

        <DockDivider />

        {/* Herramientas de canvas: puntero + mano */}
        <DockButton
          icon={MousePointer2}
          label="Puntero · V"
          active={activeCanvasTool === "pointer"}
          onClick={() => setCanvasTool("pointer")}
        />
        <DockButton
          icon={Hand}
          label="Mano · H"
          active={activeCanvasTool === "hand"}
          onClick={() => setCanvasTool("hand")}
        />

        <DockDivider />

        {/* Herramientas de diseño */}
        {tools.map((t) => (
          <DockButton
            key={t.id}
            id={t.id}
            icon={t.icon}
            label={t.label}
            active={rightPanelMode === t.id}
            onClick={() => setRightPanelMode(t.id)}
          />
        ))}

        <DockDivider />

        {/* Herramienta de código (condicional) */}
        {codeTool.map((tool) => (
          <DockButton
            key={tool.id}
            id={tool.id}
            icon={tool.icon}
            label={tool.label}
            active={mode === tool.id}
          onClick={() => setMode(tool.id)}
        />))}
      </motion.div>
    </div>
  );
};

export default SidebarB;
