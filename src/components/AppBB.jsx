// AppB.jsx - Versión modificada para aceptar token por URL
import SidebarB from "./SidebarB";
import LeftPanel from "./LeftPanel";
import RightPanel from "./RightPanel";
import CentralPanel from "./CentralPanel";
import useAppManager from "../hooks/useAppManager";
import React, { useEffect, useState, Suspense } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import BlocklyComponent from "./blockly/BlocklyComponent";
import useStore from "../store/store";
import RGS from "./GStyles/RPGS";
import GSPanel from "./GStyles/GSPanel";
import { toast } from "sonner";
import { ref, get, set } from "firebase/database";
import { db } from "../firebase";
import { auth } from "../firebase";
import { useFullscreen } from "../hooks/useFullscreen";
import { onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { generateAndSaveProject } from "../utils/htmlGenerator";
import DeviceWindow from "./DeviceWindow";
import { addProjectHistory } from "../utils/projectsService";
import { generateCustomToken } from "../utils/generateCustomToken";
import ChatGPT from "./Creador";

const CustomCodeEditor = React.lazy(() => import("./CodeEditor"));

const AppBB = () => {
  const [loading, setLoading] = useState(false);
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token");
  const uidFromUrl = searchParams.get("uid");

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
  const [previewUrl, setPreviewUrl] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [projectAuthorId, setProjectAuthorId] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  const navigate = useNavigate();

  // Nueva función para autenticar con token de URL
  // Nueva función para autenticar con uid de URL
  const authenticateWithUid = async (uid) => {
    if (!uid) return false;

    try {
      console.log("🔐 Generando Custom Token para uid:", uid);
      const customToken = await generateCustomToken(uid);

      if (!customToken) {
        console.error("❌ No se pudo generar el token");
        return false;
      }

      console.log("✅ Token generado, autenticando...");
      await signInWithCustomToken(auth, customToken);
      console.log("✅ Autenticación exitosa con token generado");
      return true;
    } catch (error) {
      console.error("❌ Error autenticando:", error);
      return false;
    }
  };

  // Verificar autenticación al cargar (modificada)
  useEffect(() => {
    const initAuth = async () => {
      // 1. Si hay uid en URL, generar token y autenticar
      if (uidFromUrl) {
        console.log("🔄 Autenticando con uid de URL:", uidFromUrl);
        const authSuccess = await authenticateWithUid(uidFromUrl);
        if (authSuccess) {
          setIsAuthenticated(true);
          setAuthInitialized(true);
          toast.success("Sesión iniciada correctamente");
          return;
        }
      }

      // 2. Si hay token en URL, usarlo directamente
      if (tokenFromUrl) {
        const authSuccess = await authenticateWithToken();
        if (authSuccess) {
          setIsAuthenticated(true);
          setAuthInitialized(true);
          toast.success("Sesión iniciada correctamente");
          return;
        }
      }

      // 3. Fallback a autenticación normal
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          console.log("✅ Usuario autenticado por Firebase:", user.uid);
          setIsAuthenticated(true);
        } else {
          console.log("❌ No hay usuario autenticado");
          if (uidFromUrl) {
            // Último intento: sesión temporal
            console.log("🔄 Creando sesión temporal para uid:", uidFromUrl);
            localStorage.setItem("tempUid", uidFromUrl);
            localStorage.setItem("tempSession", "true");
            setIsAuthenticated(true);
          } else {
            navigate("/");
            toast.error("Debes iniciar sesión para acceder a este proyecto");
          }
        }
        setAuthInitialized(true);
      });

      return () => unsubscribe();
    };

    initAuth();
  }, [tokenFromUrl, uidFromUrl]);

  // Función para obtener el uid actual (de auth o de URL)
  const getCurrentUid = () => {
    const user = auth.currentUser;
    if (user) return user.uid;
    if (uidFromUrl) return uidFromUrl;
    return localStorage.getItem("tempUid");
  };

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
      if (!authInitialized) {
        console.log("⏳ Esperando autenticación...");
        return;
      }

      if (!isAuthenticated) {
        console.log("❌ No autenticado");
        return;
      }

      if (!id) {
        console.log("❌ No hay ID de proyecto");
        return;
      }

      setLoading(true);
      try {
        const currentUid = getCurrentUid();
        console.log("📡 Cargando proyecto:", id, "para usuario:", currentUid);

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

        // Verificar permisos (con el uid actual)
        if (project.authorId === currentUid) {
          hasAccess = true;
          role = "owner";
        } else if (project.share && project.share[currentUid]) {
          const sharedData = project.share[currentUid];
          if (sharedData.role === "editor") {
            hasAccess = true;
            role = "editor";
          } else if (sharedData.role === "reader") {
            hasAccess = true;
            role = "reader";
            toast.info("Tienes acceso de solo lectura a este proyecto");
          }
        } else {
          // Verificar en sharedProjects (para compatibilidad)
          const sharedRef = ref(db, `sharedProjects/${currentUid}/${id}`);
          const sharedSnapshot = await get(sharedRef);
          if (sharedSnapshot.exists()) {
            const sharedData = sharedSnapshot.val();
            if (sharedData.role === "editor") {
              hasAccess = true;
              role = "editor";
            }
          }
        }

        // Si hay token en URL pero no tiene permisos, dar acceso de lectura
        if (!hasAccess && tokenFromUrl) {
          console.log("⚠️ Acceso con token - modo lectura");
          hasAccess = true;
          role = "reader";
          toast.info("Acceso de solo lectura mediante token");
        }

        if (!hasAccess) {
          toast.error("No tienes permiso para acceder a este proyecto");
          navigate("/dashboard");
          return;
        }

        console.log("✅ Proyecto cargado con rol:", role);
        setUserRole(role);
        setProjectAuthorId(project.authorId);

        // Guardar el proyecto con el rol
        const projectWithRole = { ...project, userRole: role };
        setProjectData(projectWithRole);

        // Generar URL de preview
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
  }, [id, selectedPage, isAuthenticated, authInitialized, tokenFromUrl]);

  // Actualizar preview URL cuando cambia la página seleccionada
  useEffect(() => {
    if (!isAuthenticated || !id || !projectAuthorId) return;
    const currentUid = getCurrentUid();
    if (currentUid && selectedPage) {
      const previewKey = `users/${projectAuthorId}/projects/${id}/pages/${selectedPage}.html`;
      const newPreviewUrl = `https://mis-proyectos-sizae-app.s3.amazonaws.com/${previewKey}`;
      setPreviewUrl(newPreviewUrl);
    }
  }, [selectedPage, id, isAuthenticated, projectAuthorId]);

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

    // Usar userRole del estado, no de projectData
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

      // Construir objeto actualizado del proyecto
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

      // Registrar el cambio en el historial SOLO si el usuario NO es el autor original
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
    setBlockyCode(code);
    setWorkspaceState(state);
  };

  // Determinar si el usuario puede editar (owner o editor)
  const canEdit = userRole === "owner" || userRole === "editor";
  const isReader = userRole === "reader";

  return (
    <div className="w-full h-screen touch-none select-none flex items-center relative bg-white">
      {loading && (
        <div className="z-10 w-full h-full top-0 left-0 absolute flex items-center justify-center bg-opacity-10 backdrop-blur-sm bg-black">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Badge de rol */}
      {userRole && userRole !== "owner" && (
        <div className="fixed top-4 right-4 z-50 bg-yellow-500/10 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-yellow-300">
          {userRole === "editor" ? "Modo Editor" : "Solo Lectura"}
          {tokenFromUrl && " (Token)"}
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
      ) : mode === "convertio" ? (
        <ChatGPT />
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
            <DeviceWindow url={previewUrl} width={430} height={932} dpi={0.4} />
          )}
        </div>
      )}
    </div>
  );
};

export default AppBB;
