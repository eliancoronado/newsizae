import SidebarB from "./SidebarB";
import LeftPanel from "./LeftPanel";
import RightPanel from "./RightPanel";
import CentralPanel from "./CentralPanel";
import useAppManager from "../hooks/useAppManager";
import React, { useEffect, useState, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BlocklyComponent from "./blockly/BlocklyComponent";
import useStore from "../store/store";
import RGS from "./GStyles/RPGS";
import GSPanel from "./GStyles/GSPanel";
import { toast } from "sonner";
import { ref, get, set } from "firebase/database";
import { db } from "../firebase";
import { auth } from "../firebase";
import { useFullscreen } from "../hooks/useFullscreen";
import { onAuthStateChanged } from "firebase/auth";

const CustomCodeEditor = React.lazy(() => import("./CodeEditor"));

const AppB = () => {
  const [loading, setLoading] = useState(false);
  const { id } = useParams();

  const {
    handleStyleChange,
    handleTextChange,
    handlePlaceholderChange,
    handleClassChange,
    handleTypeInputChange,
    handleSrcImgChange,
    handleValOptChange,
    handleHrefChange,
    handleAnimationChange,
    handleDurAnimationChange,
    handleRetAnimationChange,
    renderElement,
    contextMenu,
    setContextMenu,
  } = useAppManager();

  const {
    projectData,
    setProjectData,
    droppedElements,
    setDroppedElements,
    setUpdatedOElements,
    blocklyCode,
    setBlockyCode,
    workspaceState,
    setWorkspaceState,
    selectedPage,
    setSelectedPage,
    mode,
    setMode,
  } = useStore();

  const [selectedGS, setSelectedGS] = useState(null);
  const [gs, setGs] = useState([]);
  const { enterFullscreen } = useFullscreen();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // 🔥 Verificar autenticación al cargar
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("✅ Usuario autenticado:", user.uid);
        setIsAuthenticated(true);
      } else {
        console.log("❌ No hay usuario autenticado");
        navigate("/")
        setIsAuthenticated(false);
        toast({
          description: "Debes iniciar sesión para acceder a este proyecto",
          variant: "destructive",
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Agregar un listener para activar pantalla completa con el primer clic
  useEffect(() => {
    const handleFirstClick = () => {
      enterFullscreen();
      document.removeEventListener("click", handleFirstClick);
    };

    document.addEventListener("click", handleFirstClick);
    document.addEventListener("touchstart", handleFirstClick);
    return () => {
      document.removeEventListener("click", handleFirstClick);
      document.removeEventListener("touchstart", handleFirstClick);
    };
  }, [enterFullscreen]);

  // ========== Cargar proyecto desde Firebase ==========
  useEffect(() => {
    const fetchProject = async () => {
      // 🔥 Esperar a que el usuario esté autenticado
      if (!isAuthenticated) {
        console.log("⏳ Esperando autenticación...");
        return;
      }

      if (!id) {
        console.log("❌ No hay ID de proyecto");
        return;
      }

      setLoading(true);
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error("No hay usuario autenticado");
        }

        console.log(
          "📡 Cargando proyecto:",
          id,
          "para usuario:",
          currentUser.uid,
        );

        const projectRef = ref(db, `projects/${id}`);
        const snapshot = await get(projectRef);

        if (!snapshot.exists()) {
          toast({
            description: "Proyecto no encontrado",
            variant: "destructive",
          });
          return;
        }

        const project = snapshot.val();

        // 🔥 Verificar si el usuario tiene permiso para ver este proyecto
        if (project.authorId !== currentUser.uid) {
          // Verificar si el usuario está en userProjects
          const userProjectRef = ref(
            db,
            `userProjects/${currentUser.uid}/${id}`,
          );
          const userProjectSnapshot = await get(userProjectRef);

          if (!userProjectSnapshot.exists()) {
            toast({
              description: "No tienes permiso para ver este proyecto",
              variant: "destructive",
            });
            return;
          }
        }

        console.log("✅ Proyecto cargado:", project);
        setProjectData(project);

        // Seleccionar la página actual (selectedPage o la primera)
        const currentPageName = selectedPage || "index";
        let selectedPageData = project.pages?.find(
          (p) => p.name === currentPageName,
        );
        if (!selectedPageData && project.pages?.length) {
          selectedPageData = project.pages[0];
          setSelectedPage(selectedPageData.name);
        }

        const restoreElements = (elements) => {
          if (!elements || !Array.isArray(elements)) return [];
          return elements.map((el) => ({
            ...el,
            children:
              el.children && Array.isArray(el.children)
                ? restoreElements(el.children)
                : [],
          }));
        };

        if (selectedPageData) {
          const restoredElements = restoreElements(
            selectedPageData.elements || [],
          );
          console.log(
            "📦 Elementos cargados:",
            JSON.parse(JSON.stringify(restoredElements)),
          );
          setDroppedElements(restoredElements);
          setUpdatedOElements(restoredElements);
          setGs(selectedPageData.stylesGlobal || []);
          setBlockyCode(selectedPageData.code || null);
          setWorkspaceState(selectedPageData.state || "");
        } else {
          // Si no hay páginas, inicializar vacío
          setDroppedElements([]);
          setGs([]);
          setBlockyCode(null);
          setWorkspaceState("");
        }
      } catch (error) {
        console.error("❌ Error al cargar el proyecto:", error);
        toast({
          description: `Error al cargar el proyecto: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, selectedPage, isAuthenticated]);

  // ========== Guardar proyecto en Firebase ==========
  const handleUpdateProject = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast({
          description: "Debes iniciar sesión para guardar",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Construir objeto actualizado del proyecto
      let updatedProject = { ...projectData };
      if (!updatedProject.pages) updatedProject.pages = [];

      // 🔥 Función para asegurar que los elementos tengan la estructura correcta
      const sanitizeElements = (elements) => {
        if (!elements || !Array.isArray(elements)) return [];
        return elements.map((el) => ({
          ...el,
          children:
            el.children && Array.isArray(el.children)
              ? sanitizeElements(el.children)
              : [],
        }));
      };

      const pageIndex = updatedProject.pages.findIndex(
        (p) => p.name === selectedPage,
      );
      const currentPageData = {
        name: selectedPage,
        elements: sanitizeElements(droppedElements), // 🔥 Asegurar que children se guarde
        code: blocklyCode,
        state: workspaceState || {},
        stylesGlobal: gs,
      };

      console.log("📦 Guardando página:", selectedPage);
      console.log(
        "📦 Elementos a guardar:",
        JSON.parse(JSON.stringify(currentPageData.elements)),
      ); // Debug

      if (pageIndex !== -1) {
        updatedProject.pages[pageIndex] = currentPageData;
      } else {
        updatedProject.pages.push(currentPageData);
      }

      // Actualizar metadatos
      updatedProject.updatedAt = Date.now();
      updatedProject.authorId = updatedProject.authorId || currentUser.uid;

      // Guardar en Firebase
      const projectRef = ref(db, `projects/${id}`);
      await set(projectRef, updatedProject);

      // Actualizar referencia en userProjects (opcional, para tener lista de proyectos del usuario)
      const userProjectRef = ref(db, `userProjects/${currentUser.uid}/${id}`);
      await set(userProjectRef, true);

      setProjectData(updatedProject);
      toast({ description: "Proyecto guardado correctamente" });
    } catch (error) {
      console.error("Error al guardar el proyecto:", error);
      toast({
        description: "Error al guardar el proyecto",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewAndUpdate = async () => {
    await handleUpdateProject();
  };

  const handleGenerateCode = (code, state) => {
    setBlockyCode(code);
    setWorkspaceState(state);
  };

  return (
    <div className="w-full h-screen touch-none select-none flex items-center relative bg-white">
      {loading && (
        <div className="z-10 w-full h-full top-0 left-0 absolute flex items-center justify-center bg-opacity-10 backdrop-blur-sm bg-black">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <SidebarB setMode={setMode} />

      {mode === "codeb" ? (
        <BlocklyComponent onGenerateCode={handleGenerateCode} />
      ) : mode === "GStyles" ? (
        <div className="w-full h-full grid grid-cols-4 text-black">
          <GSPanel
            selectedGS={selectedGS}
            setSelectedGS={setSelectedGS}
            gs={gs}
            setGs={setGs}
          />
          <RGS
            selectedGS={selectedGS}
            setSelectedGS={setSelectedGS}
            gs={gs}
            setGs={setGs}
          />
        </div>
      ) : mode === "code" ? (
        <Suspense
          fallback={<div className="text-black p-4">Cargando editor...</div>}
        >
          <CustomCodeEditor
            onChange={() => {}}
            language="javascript"
            onSave={handleGenerateCode}
          />
        </Suspense>
      ) : (
        <div className="w-full h-full grid grid-cols-4">
          <LeftPanel prid={id} />
          <CentralPanel
            onUpdate={handlePreviewAndUpdate}
            id={id}
            renderElement={renderElement}
            contextMenu={contextMenu}
            setContextMenu={setContextMenu}
          />
          <RightPanel
            handleStyleChange={handleStyleChange}
            handleTextChange={handleTextChange}
            handlePlaceholderChange={handlePlaceholderChange}
            handleClassChange={handleClassChange}
            handleTypeInputChange={handleTypeInputChange}
            handleSrcImgChange={handleSrcImgChange}
            handleValOptChange={handleValOptChange}
            handleHrefChange={handleHrefChange}
            handleAnimationChange={handleAnimationChange}
            handleDurAnimationChange={handleDurAnimationChange}
            handleRetAnimationChange={handleRetAnimationChange}
            prid={id}
            gs={gs}
          />
        </div>
      )}
    </div>
  );
};

export default AppB;
