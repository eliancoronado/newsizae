import SidebarB from "./SidebarB";
import LeftPanel from "./LeftPanel";
import RightPanel from "./RightPanel";
import CentralPanel from "./CentralPanel";
import useAppManager from "../hooks/useAppManager";
import React, { useEffect, useState, Suspense, useRef } from "react";
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
import DeviceWindow from "./DeviceWindow";
import { addProjectHistory } from "../utils/projectsService";
import ChatGPT from "./Creador";
import CustomCodeEditorr from "./JSEditor";
import VSCode from "./VSCode";
import { RoomProvider, useMyPresence, useOthers } from "@liveblocks/react";
import { client } from "../../liveblocks.config";
import { GiArrowCursor } from "react-icons/gi";
import useRealtimeSync from "../useRealtimeSync";
import useRealtimeUIState from "../hooks/useRealtimeUIStateW";
import { LiveObject } from "@liveblocks/client";

const CustomCodeEditor = React.lazy(() => import("./CodeEditor"));

// ============================================================
// COMPONENTE INTERNO - Contiene toda la lógica y hooks de Liveblocks
// ============================================================
const AppBContent = ({ projectId }) => {
  const [loading, setLoading] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  // ========== HOOKS DE LIVEBLOCKS (AHORA DENTRO DEL ROOMPROVIDER) ==========
  const [myPresence, updateMyPresence] = useMyPresence();
  const others = useOthers();
  const appRef = useRef(null);

  // ========== ESTADO PARA EL USUARIO ==========
  const [userName, setUserName] = useState("Usuario");
  const [userColor] = useState(() => {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
      "#F7DC6F",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  });

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUserName(currentUser.displayName || currentUser.email || "Usuario");
    }
  }, []);

  // ========== MANEJO DEL MOUSE PARA PRESENCIA ==========
  const handleGlobalMouseMove = (e) => {
    if (!appRef.current) return;
    const rect = appRef.current.getBoundingClientRect();
    updateMyPresence({
      cursor: {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      },
      name: userName,
      color: userColor,
    });
  };

  const handleMouseLeave = () => {
    updateMyPresence({ cursor: null });
  };

  // ========== RENDERIZAR CURSORES DE OTROS USUARIOS ==========
  const renderGlobalCursors = () => {
    return others.map(({ id, presence }) => {
      if (!presence?.cursor) return null;
      return (
        <div
          key={`${id}-elian-${presence.color}`}
          className="pointer-events-none fixed z-[9999]"
          style={{
            left: presence.cursor.x,
            top: presence.cursor.y,
            transform: "translate(-4px, -4px)",
          }}
        >
          <GiArrowCursor className={`text-[${presence.color} || "#FF6B6B"}]`} />
          <div
            className="absolute left-6 top-0 px-2 py-0.5 rounded text-xs whitespace-nowrap"
            style={{
              backgroundColor: presence.color || "#FF6B6B",
              color: "white",
              fontFamily: "sans-serif",
            }}
          >
            {presence.name || "Usuario"}
          </div>
        </div>
      );
    });
  };

  // ========== HOOKS DE LA APLICACIÓN ==========
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
    selectedElement,
    setSelectedElement,
  } = useStore();

  const [selectedGS, setSelectedGS] = useState(null);
  const [gs, setGs] = useState([]);
  const { enterFullscreen } = useFullscreen();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [deviceShow, setDeviceShow] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [projectAuthorId, setProjectAuthorId] = useState(null);

  // ========== VERIFICAR AUTENTICACIÓN ==========
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("✅ Usuario autenticado:", user.uid);
        setIsAuthenticated(true);
      } else {
        console.log("❌ No hay usuario autenticado");
        navigate("/");
        setIsAuthenticated(false);
        toast.error("Debes iniciar sesión para acceder a este proyecto");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // ========== CARGAR PROYECTO DESDE FIREBASE ==========
  useEffect(() => {
    const fetchProject = async () => {
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
          toast.error("Proyecto no encontrado");
          navigate("/dashboard");
          return;
        }

        const project = snapshot.val();
        let hasAccess = false;
        let role = null;

        // Verificar permisos
        if (project.authorId === currentUser.uid) {
          hasAccess = true;
          role = "owner";
        } else if (project.share && project.share[currentUser.uid]) {
          const sharedData = project.share[currentUser.uid];
          if (sharedData.role === "editor") {
            hasAccess = true;
            role = "editor";
          } else if (sharedData.role === "reader") {
            hasAccess = true;
            role = "reader";
            toast.info("Tienes acceso de solo lectura a este proyecto");
          }
        } else {
          const sharedRef = ref(db, `sharedProjects/${currentUser.uid}/${id}`);
          const sharedSnapshot = await get(sharedRef);
          if (sharedSnapshot.exists()) {
            const sharedData = sharedSnapshot.val();
            if (sharedData.role === "editor") {
              hasAccess = true;
              role = "editor";
            }
          }
        }

        if (!hasAccess) {
          toast.error("No tienes permiso para acceder a este proyecto");
          navigate("/dashboard");
          return;
        }

        console.log("✅ Proyecto cargado con rol:", role);
        setUserRole(role);
        setProjectAuthorId(project.authorId);

        const projectWithRole = { ...project, userRole: role };
        setProjectData(projectWithRole);

        if (
          (role === "editor" || role === "owner") &&
          project.authorId !== currentUser.uid
        ) {
          await addProjectHistory(
            id,
            currentUser.uid,
            currentUser.displayName || "Usuario",
            `Abrió el proyecto "${project.name}"`,
            project.name,
          );
        }

        const currentPageName = selectedPage || "index";
        const ownerId = project.authorId;
        const previewKey = `users/${ownerId}/projects/${id}/pages/${currentPageName}.html`;
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
          setDroppedElements(restoredElements);
          setUpdatedOElements(restoredElements);
          setGs(selectedPageData.stylesGlobal || []);
          setBlockyCode(selectedPageData.code || null);
          setWorkspaceState(selectedPageData.state || "");
        } else {
          setDroppedElements([]);
          setGs([]);
          setBlockyCode(null);
          setWorkspaceState("");
        }
      } catch (error) {
        console.error("❌ Error al cargar el proyecto:", error);
        toast.error(`Error al cargar el proyecto: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [
    id,
    selectedPage,
    isAuthenticated,
    navigate,
    setProjectData,
    setDroppedElements,
    setUpdatedOElements,
    setBlockyCode,
    setWorkspaceState,
    setSelectedPage,
  ]);

  // ========== ACTUALIZAR PREVIEW URL ==========
  useEffect(() => {
    if (!isAuthenticated || !id || !projectAuthorId) return;
    if (selectedPage) {
      const previewKey = `users/${projectAuthorId}/projects/${id}/pages/${selectedPage}.html`;
      const newPreviewUrl = `https://mis-proyectos-sizae-app.s3.amazonaws.com/${previewKey}`;
      setPreviewUrl(newPreviewUrl);
    }
  }, [selectedPage, id, isAuthenticated, projectAuthorId]);

  useRealtimeSync({
    roomId: id,
    selectedPage: selectedPage,

    path: "droppedElements",

    value: droppedElements,

    onRemoteChange: setDroppedElements,

    delay: 700,
  });

  useRealtimeUIState({
    mode,
    setMode,
    selectedPage,
    setSelectedPage,
    selectedElement,
    setSelectedElement,
  });

  // ========== REMOVER ESTILOS GLOBALES ==========
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

  // ========== GUARDAR PROYECTO ==========
  const handleUpdateProject = async () => {
    if (!id) return;

    if (userRole === "reader") {
      toast.error(
        "No tienes permiso para guardar cambios en este proyecto (solo lectura)",
      );
      return;
    }

    setLoading(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("Debes iniciar sesión para guardar");
        setLoading(false);
        return;
      }

      let updatedProject = { ...projectData };
      if (!updatedProject.pages) updatedProject.pages = [];

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
        elements: sanitizeElements(droppedElements),
        code: blocklyCode,
        state: workspaceState || {},
        stylesGlobal: gs,
      };

      if (pageIndex !== -1) {
        updatedProject.pages[pageIndex] = currentPageData;
      } else {
        updatedProject.pages.push(currentPageData);
      }

      updatedProject.updatedAt = Date.now();
      updatedProject.authorId = updatedProject.authorId || currentUser.uid;

      const projectRef = ref(db, `projects/${id}`);
      await set(projectRef, updatedProject);

      if (updatedProject.authorId === currentUser.uid) {
        const userProjectRef = ref(db, `userProjects/${currentUser.uid}/${id}`);
        await set(userProjectRef, true);
      }

      if (updatedProject.authorId !== currentUser.uid) {
        await addProjectHistory(
          id,
          currentUser.uid,
          currentUser.displayName || "Usuario",
          `Guardó cambios en el proyecto "${updatedProject.name}"`,
          updatedProject.name,
        );
      }

      setProjectData(updatedProject);
      toast.success("Proyecto guardado correctamente");
    } catch (error) {
      console.error("Error al guardar el proyecto:", error);
      toast.error("Error al guardar el proyecto");
    } finally {
      setLoading(false);
    }
  };

  // ========== PREVIEW ==========
  const handlePreview = async () => {
    if (!selectedPage) {
      toast.error("Selecciona una página para previsualizar");
      return;
    }

    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No autenticado");

      const copyDroppedElements = JSON.parse(JSON.stringify(droppedElements));
      const cleanedElements = removeGlobalStylesRecursively(
        copyDroppedElements,
        gs,
      );

      const ownerId = projectAuthorId;

      const result = await generateAndSaveProject(
        ownerId,
        id,
        selectedPage,
        cleanedElements,
        gs,
        blocklyCode || "",
        (progress) => {
          console.log(`📤 Generando HTML: ${progress}%`);
        },
      );

      setPreviewUrl(result.url);
      toast.success("Vista previa generada correctamente");
    } catch (error) {
      console.error("Error en preview:", error);
      toast.error("Error al generar la vista previa");
    } finally {
      setLoading(false);
    }
  };

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
    console.log("Código generado desde Blockly/JSEditor:", code);
    setBlockyCode(code);
    setWorkspaceState(state);
  };

  const canEdit = userRole === "owner" || userRole === "editor";
  const isReader = userRole === "reader";

  // ========== RENDER ==========
  return (
    <div
      ref={appRef}
      className="w-full h-screen touch-none select-none flex items-center relative bg-white"
      onMouseMove={handleGlobalMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {loading && (
        <div className="z-10 w-full h-full top-0 left-0 absolute flex items-center justify-center bg-opacity-10 backdrop-blur-sm bg-black">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {renderGlobalCursors()}

      {userRole && userRole !== "owner" && (
        <div className="fixed top-4 right-4 z-50 bg-yellow-500/10 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-yellow-300">
          {userRole === "editor" ? "Modo Editor" : "Solo Lectura"}
        </div>
      )}

      {projectData?.engine === "html" ? (
        <VSCode
          projectName={projectData?.name || "Proyecto HTML"}
          projectId={id}
          files={
            projectData?.pages?.map((p) => ({
              name: `${p.name}.html`,
              content:
                p.htmlCode ||
                `<!DOCTYPE html>\n<html>\n<head>\n  <title>${p.name}</title>\n</head>\n<body>\n  <h1>${p.name}</h1>\n</body>\n</html>`,
            })) || [{ name: "index.html", content: "" }]
          }
          onSave={async (updatedFiles) => {
            const projectRef = ref(db, `projects/${id}`);
            const snapshot = await get(projectRef);
            const projectData = snapshot.val() || {};

            const pages = updatedFiles.map((file) => ({
              name: file.name.replace(".html", ""),
              htmlCode: file.content,
              elements: [],
              code: null,
              state: {},
              stylesGlobal: [],
            }));

            await set(projectRef, {
              ...projectData,
              pages,
              updatedAt: Date.now(),
            });

            toast.success(
              `${updatedFiles.length} archivos guardados correctamente`,
            );
          }}
          onPublish={async (updatedFiles) => {
            const projectRef = ref(db, `projects/${id}`);
            const snapshot = await get(projectRef);
            const projectData = snapshot.val() || {};

            const pages = updatedFiles.map((file) => ({
              name: file.name.replace(".html", ""),
              htmlCode: file.content,
              elements: [],
              code: null,
              state: {},
              stylesGlobal: [],
            }));

            await set(projectRef, {
              ...projectData,
              pages,
              updatedAt: Date.now(),
            });

            toast.success(
              `¡Proyecto publicado! ${updatedFiles.length} archivos`,
            );
          }}
          isReadOnly={userRole === "reader"}
          canEdit={canEdit}
          logoUrl="/logo2.png"
        />
      ) : (
        <>
          <SidebarB setMode={setMode} />

          {mode === "codeb" ? (
            <BlocklyComponent onGenerateCode={handleGenerateCode} />
          ) : mode === "codeJS" ? (
            <Suspense
              fallback={
                <div className="text-black p-4">Cargando editor...</div>
              }
            >
              <CustomCodeEditorr
                onChange={() => {}}
                language="javascript"
                onSave={handleGenerateCode}
              />
            </Suspense>
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
          ) : mode === "convertio" ? (
            <ChatGPT />
          ) : mode === "code" ? (
            <Suspense
              fallback={
                <div className="text-black p-4">Cargando editor...</div>
              }
            >
              <CustomCodeEditor
                onChange={() => {}}
                language="javascript"
                onSave={handleGenerateCode}
              />
            </Suspense>
          ) : (
            <div
              className={`w-full h-full ${canEdit ? "grid grid-cols-4" : "flex justify-center items-center"}`}
            >
              {canEdit && <LeftPanel prid={id} />}

              <CentralPanel
                onUpdate={canEdit ? handlePreviewAndUpdate : undefined}
                id={id}
                renderElement={renderElement}
                contextMenu={contextMenu}
                setContextMenu={setContextMenu}
                setDeviceShow={setDeviceShow}
                urlqr={previewUrl}
                isReadOnly={isReader}
                canEdit={canEdit}
              />

              {canEdit && (
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
              )}

              {deviceShow && (
                <DeviceWindow
                  url={previewUrl}
                  width={430}
                  height={932}
                  dpi={0.4}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ============================================================
// COMPONENTE PRINCIPAL - Envuelve todo con RoomProvider
// ============================================================
const AppB = () => {
  const { id } = useParams();

  // Estado para el usuario (para initialPresence)
  const [userName, setUserName] = useState("Usuario");
  const [userColor] = useState(() => {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
      "#F7DC6F",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  });

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUserName(currentUser.displayName || currentUser.email || "Usuario");
    }
  }, []);

  // Si no hay ID, mostramos un mensaje o redirigimos
  if (!id) {
    return (
      <div className="flex items-center justify-center h-screen">
        Cargando proyecto...
      </div>
    );
  }

  return (
    <RoomProvider
      id={id}
      initialPresence={{
        cursor: null,
        name: userName,
        color: userColor,
      }}
      initialStorage={{
        uiState: new LiveObject({
          mode: "design",
          selectedPage: "index",
          selectedElement: null,
        }),
      }}
    >
      <AppBContent projectId={id} />
    </RoomProvider>
  );
};

export default AppB;
