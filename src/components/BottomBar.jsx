// BottomBar.jsx
import React from "react";
import { BiMessageDetail } from "react-icons/bi";
import { FaDiagramProject } from "react-icons/fa6";
import { GoHomeFill } from "react-icons/go";
import { IoSettingsSharp } from "react-icons/io5";
import { RiUserCommunityFill } from "react-icons/ri";
import { FaVideo } from "react-icons/fa";


const BottomBar = ({ activeTab, setActiveTab, totalUnread = 0 }) => {
  const navItems = [
    { id: "home", icon: GoHomeFill, label: "Inicio" },
    { id: "reels", icon: FaDiagramProject , label: "Proyectos" },
    { id: "messages", icon: BiMessageDetail, label: "Mensajes" },
    { id: "community", icon: RiUserCommunityFill, label: "Comunidad" },
  ];

  return (
    <>
      {/* Bottom Bar para móvil */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#201f1f]/90 backdrop-blur-xl border-t border-gray-800 z-50 md:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all relative ${
                  isActive 
                    ? "text-[#00E5FF]" 
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                <Icon className="text-2xl" />
                {item.id === "messages" && totalUnread > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
                <span className="text-[12px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Espaciador para móvil (evita que el contenido quede debajo del bottom bar) */}
    </>
  );
};

export default BottomBar;