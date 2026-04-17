import React from "react";
import { BiMessageDetail } from "react-icons/bi";
import { FaDiagramProject } from "react-icons/fa6";
import { GoHomeFill } from "react-icons/go";
import { IoSettingsSharp } from "react-icons/io5";
import { RiUserCommunityFill } from "react-icons/ri";

const Sidebar = ({ activeTab, setActiveTab, onLogout }) => {
  return (
    <div className="w-[250px] h-screen bg-[#201f1f]/80 backdrop-blur-xl py-4 max-md:hidden">
      <img src="/logo2.png" className="w-2/3 mx-auto block" alt="" />
      <div className="mt-5 p-3">
        <div 
          className={`flex items-center gap-3 px-4 py-3  hover:text-primary hover:bg-[#393939]/60 hover:backdrop-blur-md transition-all rounded-xl cursor-pointer text-lg ${activeTab === "home" ? "text-[#00E5FF] bg-[#393939]/60" : "text-gray-400"}`}
          onClick={() => setActiveTab("home")}
        >
            <GoHomeFill className="text-2xl"/>
            Inicio
        </div>
        <div 
          className={`flex items-center gap-3 px-4 py-3 hover:text-primary hover:bg-[#393939]/60 hover:backdrop-blur-md transition-all rounded-xl cursor-pointer text-lg ${activeTab === "projects" ? "text-[#00E5FF] bg-[#393939]/60" : "text-gray-400"}`}
          onClick={() => setActiveTab("projects")}
        >
            <FaDiagramProject className="text-2xl" />
            Proyectos
        </div>
        <div className={`flex items-center gap-3 px-4 py-3 hover:text-primary hover:bg-[#393939]/60 hover:backdrop-blur-md transition-all rounded-xl cursor-pointer text-lg ${activeTab === "messages" ? "text-[#00E5FF] bg-[#393939]/60" : "text-gray-400"}`}
          onClick={() => setActiveTab("messages")}
        >
            <BiMessageDetail className="text-2xl"/>
            Mensajes
        </div>
        <div className={`flex items-center gap-3 px-4 py-3 hover:text-primary hover:bg-[#393939]/60 hover:backdrop-blur-md transition-all rounded-xl cursor-pointer text-lg ${activeTab === "community" ? "text-[#00E5FF] bg-[#393939]/60" : "text-gray-400"}`}
          onClick={() => setActiveTab("community")}
        >
            <RiUserCommunityFill className="text-2xl"/>
            Comunidad
        </div>
        <div className={`flex items-center gap-3 px-4 py-3 hover:text-primary hover:bg-[#393939]/60 hover:backdrop-blur-md transition-all rounded-xl cursor-pointer text-lg ${activeTab === "settings" ? "text-[#00E5FF] bg-[#393939]/60" : "text-gray-400"}`}
          onClick={() => setActiveTab("settings")}
        >
            <IoSettingsSharp className="text-2xl"/>
            Configuración
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
