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
import { generateAndSaveProject } from "../utils/htmlGenerator";
import { uploadGeneratedFileToS3 } from "../utils/uploadToS3SDK";
import DeviceWindow from "./DeviceWindow";

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
  const [deviceShow, setDeviceShow] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(""); // 🔥 Estado para la URL de preview
  
  const navigate = useNavigate();

  // 🔥 Verificar autenticación al cargar
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("✅ Usuario autenticado:", user.uid);
        setIsAuthenticated(true);
      } else {
        console.log("❌ No hay usuario autenticado");
        navigate("/");
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

        // 🔥 Generar URL de preview para la página actual (si existe)
        const currentPageName = selectedPage || "index";
        const previewKey = `users/${currentUser.uid}/projects/${id}/pages/${currentPageName}.html`;
        const previewUrlGenerated = `https://mis-proyectos-sizae-app.s3.amazonaws.com/${previewKey}`;
        setPreviewUrl(previewUrlGenerated);

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

  // 🔥 Actualizar preview URL cuando cambia la página seleccionada
  useEffect(() => {
    if (!isAuthenticated || !id) return;
    const currentUser = auth.currentUser;
    if (currentUser && selectedPage) {
      const previewKey = `users/${currentUser.uid}/projects/${id}/pages/${selectedPage}.html`;
      const newPreviewUrl = `https://mis-proyectos-sizae-app.s3.amazonaws.com/${previewKey}`;
      setPreviewUrl(newPreviewUrl);
    }
  }, [selectedPage, id, isAuthenticated]);

  // Función para remover estilos globales recursivamente (para preview)
  const removeGlobalStylesRecursively = (elements, globalStyles) => {
    if (!elements || !Array.isArray(elements)) return [];

    return elements.map((element) => {
      const newElement = { ...element };

      if (newElement.iconClass) {
        const globalStyle = globalStyles.find(
          (style) => style.name === newElement.iconClass,
        );

        if (globalStyle && globalStyle.styles) {
          const updatedStyles = { ...newElement.styles };
          Object.keys(globalStyle.styles).forEach((key) => {
            if (updatedStyles[key] === globalStyle.styles[key]) {
              delete updatedStyles[key];
            }
          });
          newElement.styles = updatedStyles;
        }
      }

      if (newElement.children && newElement.children.length > 0) {
        newElement.children = removeGlobalStylesRecursively(
          newElement.children,
          globalStyles,
        );
      }

      return newElement;
    });
  };

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

  // Función de preview (genera y abre el HTML en una nueva pestaña)
  const handlePreview = async () => {
    if (!selectedPage) {
      toast.error("Selecciona una página para previsualizar");
      return;
    }

    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No autenticado");

      // Remover estilos globales de los elementos (para preview sin duplicados)
      const copyDroppedElements = JSON.parse(JSON.stringify(droppedElements));
      const cleanedElements = removeGlobalStylesRecursively(
        copyDroppedElements,
        gs,
      );

      // Generar y guardar en S3
      const result = await generateAndSaveProject(
        currentUser.uid,
        id,
        selectedPage,
        cleanedElements,
        gs,
        blocklyCode || "",
        (progress) => {
          console.log(`📤 Generando HTML: ${progress}%`);
        },
      );

      // 🔥 Actualizar la URL de preview con el nuevo archivo generado
      setPreviewUrl(result.url);

      // Abrir en nueva pestaña
      //window.open(result.url, "_blank");
      toast.success("Vista previa generada correctamente");
    } catch (error) {
      console.error("Error en preview:", error);
      toast.error("Error al generar la vista previa");
    } finally {
      setLoading(false);
    }
  };

  // Actualizar handlePreviewAndUpdate
  const handlePreviewAndUpdate = async () => {
    try {
      await handleUpdateProject();
      await handlePreview();
    } catch (error) {
      console.error("Error durante el proceso:", error);
      toast.error("Error al guardar el proyecto");
    }
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
            setDeviceShow={setDeviceShow}
            urlqr={previewUrl}
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
          {deviceShow && (
            <DeviceWindow url={previewUrl} width={430} height={932} dpi={0.4} />
          )}
        </div>
      )}
    </div>
  );
};

export default AppB;
