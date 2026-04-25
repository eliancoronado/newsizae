import React, { useEffect } from "react";
import logo from "/Subtract.png";
import { IoMdAddCircleOutline } from "react-icons/io";
import { IoHelpCircleOutline, IoSettingsOutline } from "react-icons/io5";
import { LuLayers } from "react-icons/lu";
import { FaCode } from "react-icons/fa6";
import { FaRegImages } from "react-icons/fa";
import { GoCopilot } from "react-icons/go";
import { MdOutlineStyle } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import useStore from "../store/store";
import { TbBlocks } from "react-icons/tb";

const SidebarB = () => {
  const { setMode } = useStore();
  const { projectData } = useStore();
  const navigate = useNavigate();

  return (
    <div className="w-[80px] h-full bg-[#1C1B2F] overflow-y-auto max-h-full hidden md:flex md:flex-col md:items-center md:py-2 lg:py-4 md:justify-between scrollbar-hide">
      <div className="w-full flex flex-col items-center">
        <img
          src={logo}
          className="w-10 h-auto cursor-pointer"
          onClick={() => navigate("/dashboard")}
        />
        <div
          className="w-full py-4 cursor-pointer hover:bg-[rgba(255,255,255,0.3)] flex items-center justify-center mt-8"
          onClick={() => setMode("elements")}
        >
          <IoMdAddCircleOutline className="text-3xl text-[#FFD966]" />
        </div>
        <div
          className="w-full py-4 cursor-pointer hover:bg-[rgba(255,255,255,0.3)] flex items-center justify-center"
          onClick={() => setMode("capas")}
        >
          <LuLayers className="text-2xl text-[#FFD966]" />
        </div>
        <div
          className="w-full py-4 cursor-pointer hover:bg-[rgba(255,255,255,0.3)] flex items-center justify-center"
          onClick={() => setMode("ia")}
        >
          <GoCopilot className="text-2xl text-[#FFD966]" />
        </div>
        <div
          className="w-full py-4 cursor-pointer hover:bg-[rgba(255,255,255,0.3)] flex items-center justify-center"
          onClick={() => setMode("files")}
        >
          <FaRegImages className="text-2xl text-[#FFD966]" />
        </div>
        <div
          className="w-full py-4 cursor-pointer hover:bg-[rgba(255,255,255,0.3)] flex items-center justify-center"
          onClick={() => setMode("GStyles")}
        >
          <MdOutlineStyle className="text-2xl text-[#FFD966]" />
        </div>

        {projectData?.lan === "waskart" ? (
          <div
            className="w-full py-4 cursor-pointer hover:bg-[rgba(255,255,255,0.3)] flex items-center justify-center"
            onClick={() => setMode("code")}
          >
            <FaCode className="text-2xl text-[#FFD966]" />
          </div>
        ) : (
          <div
            className="w-full py-4 cursor-pointer hover:bg-[rgba(255,255,255,0.3)] flex items-center justify-center"
            onClick={() => setMode("codeb")}
          >
            <TbBlocks className="text-2xl text-[#FFD966]" />
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarB;
