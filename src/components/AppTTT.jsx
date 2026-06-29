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
import { auth } from "../firebase";
import { useFullscreen } from "../hooks/useFullscreen";
import { onAuthStateChanged } from "firebase/auth";
import DeviceWindow from "./DeviceWindow";
import ChatGPT from "./Creador";
import CustomCodeEditorr from "./JSEditor";
import VSCode from "./VSCode";

const CustomCodeEditor = React.lazy(() => import("./CodeEditor"));

// ========== IMPORTAR SISTEMA DE TUTORIALES ==========
import { 
  TutorialProvider, 
  useTutorial, 
  FakeCursor, 
  Overlay, 
  Tooltip,
  playgroundTutorial,
} from '../tutorial';

// ========== PROYECTO BASE PARA PLAYGROUND ==========
const BASE_PROJECT = {
  id: null,
  name: "Playground Project",
  authorId: null,
  engine: "design",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  pages: [
    {
      name: "index",
      elements: [],
      code: null,
      state: {},
      stylesGlobal: [],
      htmlCode: `<!DOCTYPE html>
<html>
<head>
  <title>Playground</title>
</head>
<body>
  <h1>Playground Project</h1>
  <p>Welcome to your testing environment</p>
</body>
</html>`,
    },
  ],
  share: {},
  userRole: "owner",
};

// ============================================================
// COMPONENTE INTERNO CON TUTORIAL
// ============================================================
const AppBContent = ({ projectId }) => {
  const [loading, setLoading] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const appRef = useRef(null);

  // ========== HOOK DEL TUTORIAL ==========
  const { 
    startTutorial, 
    running, 
    stepData, 
    currentStep, 
    totalSteps,
    next,
    previous,
    stopTutorial,
    isLastStep,
  } = useTutorial();

  // ========== ESTADO PARA OVERLAY Y TOOLTIP ==========
  const [targetRect, setTargetRect] = useState(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  // ========== ESTADO PARA EL USUARIO ==========
  const [userName, setUserName] = useState("Usuario");

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUserName(currentUser.displayName || currentUser.email || "Usuario");
    }
  }, []);

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
  } = useStore();

  const [selectedGS, setSelectedGS] = useState(null);
  const [gs, setGs] = useState([]);
  const { enterFullscreen } = useFullscreen();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [deviceShow, setDeviceShow] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [projectAuthorId, setProjectAuthorId] = useState(null);
  const [isPlay, setIsPlay] = useState(true);

  // ========== INICIAR TUTORIAL AUTOMÁTICAMENTE ==========
  useEffect(() => {
    // Esperar a que la UI esté lista y luego iniciar el tutorial
    if (isAuthenticated && !loading && projectData) {
      const timer = setTimeout(() => {
        startTutorial('playground');
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, loading, projectData, startTutorial]);

  // ========== ACTUALIZAR OVERLAY CUANDO CAMBIA EL PASO ==========
  useEffect(() => {
    if (stepData && running && stepData.target) {
      // Si el target es 'body', no hay rectángulo específico
      if (stepData.target === 'body') {
        setTargetRect(null);
        setTooltipVisible(true);
        return;
      }

      const element = document.querySelector(stepData.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        setTooltipVisible(true);
      } else {
        // Si no se encuentra el elemento, intentar de nuevo después de un tiempo
        const retryTimer = setTimeout(() => {
          const retryElement = document.querySelector(stepData.target);
          if (retryElement) {
            const rect = retryElement.getBoundingClientRect();
            setTargetRect(rect);
            setTooltipVisible(true);
          }
        }, 500);
        return () => clearTimeout(retryTimer);
      }
    } else {
      setTargetRect(null);
      setTooltipVisible(false);
    }
  }, [stepData, running]);

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

  // ========== CARGAR PROYECTO ==========
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

        // ✅ CREAR PROYECTO BASE CON LOS DATOS DEL USUARIO
        const baseProject = {
          ...BASE_PROJECT,
          id: id,
          authorId: currentUser.uid,
          name: `Playground - ${id}`,
          pages: [
            {
              name: "index",
              elements: [],
              code: null,
              state: {},
              stylesGlobal: [],
              htmlCode: `<!DOCTYPE html>
<html>
<head>
  <title>Playground - ${id}</title>
</head>
<body>
  <h1>Playground Project</h1>
  <p>ID: ${id}</p>
  <p>Usuario: ${currentUser.displayName || currentUser.email}</p>
</body>
</html>`,
            },
          ],
        };

        // ✅ SETEAR ESTADOS CON PROYECTO BASE
        setProjectData(baseProject);
        setGs([]);
        setBlockyCode(null);
        setWorkspaceState("");
        setSelectedPage("index");
        setUserRole("owner");
        setProjectAuthorId(currentUser.uid);
        setPreviewUrl("");

        // ✅ INICIAR CON DROPPED ELEMENTS VACÍO
        setDroppedElements([]);
        setUpdatedOElements([]);

        toast.success("🚀 Proyecto cargado correctamente");

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
    isAuthenticated,
    navigate,
    setProjectData,
    setDroppedElements,
    setUpdatedOElements,
    setBlockyCode,
    setWorkspaceState,
    setSelectedPage,
  ]);

  // ========== GUARDAR PROYECTO (VACÍO) ==========
  const handleUpdateProject = async () => {
    toast.info("🧪 Modo playground - Guardado deshabilitado");
  };

  // ========== PREVIEW (VACÍO) ==========
  const handlePreview = async () => {
    toast.info("🧪 Modo playground - Vista previa deshabilitada");
  };

  const handlePreviewAndUpdate = async () => {
    toast.info("🧪 Modo playground - Función deshabilitada");
  };

  const handleGenerateCode = (code, state) => {
    console.log("Código generado desde Blockly/JSEditor:", code);
    setBlockyCode(code);
    setWorkspaceState(state);
  };

  const canEdit = true;
  const isReader = false;

  // ========== RENDER ==========
  return (
    <div
      ref={appRef}
      className="w-full h-screen touch-none select-none flex items-center relative bg-white"
    >
      {loading && (
        <div className="z-10 w-full h-full top-0 left-0 absolute flex items-center justify-center bg-opacity-10 backdrop-blur-sm bg-black">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* ========== OVERLAY DEL TUTORIAL ========== */}
      <Overlay 
        visible={running && !!targetRect}
        targetRect={targetRect}
        padding={stepData?.padding || 16}
        radius={stepData?.radius || 8}
      />

      {/* ========== TOOLTIP DEL TUTORIAL ========== */}
      {running && stepData && (
        <Tooltip
          visible={tooltipVisible}
          target={stepData.target === 'body' ? null : stepData.target}
          text={stepData.text}
          title={stepData.title}
          placement={stepData.placement || 'bottom'}
          currentStep={currentStep}
          totalSteps={totalSteps}
          onNext={next}
          onPrevious={previous}
          onFinish={isLastStep ? stopTutorial : null}
          onSkip={stopTutorial}
        />
      )}

      {/* ========== CURSOR FALSO DEL TUTORIAL ========== */}
      <FakeCursor visible={running} />

      {/* ========== BADGE DE MODO ========== */}
      <div className="fixed top-4 right-4 z-50 bg-green-500/10 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-green-400 border border-green-400/20">
        🧪 Modo Playground
      </div>

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
          onSave={async () => {
            toast.info("🧪 Modo playground - Guardado deshabilitado");
          }}
          onPublish={async () => {
            toast.info("🧪 Modo playground - Publicación deshabilitada");
          }}
          isReadOnly={false}
          canEdit={true}
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
            <div className={`w-full h-full grid grid-cols-4`}>
              <LeftPanel prid={id} />

              <CentralPanel
                onUpdate={handlePreviewAndUpdate}
                id={id}
                renderElement={renderElement}
                contextMenu={contextMenu}
                setContextMenu={setContextMenu}
                setDeviceShow={setDeviceShow}
                urlqr={previewUrl}
                isReadOnly={isReader}
                canEdit={canEdit}
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
                isPlay={isPlay}
              />

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
// COMPONENTE PRINCIPAL CON TUTORIAL PROVIDER
// ============================================================
const AppTTT = () => {
  const { id } = useParams();

  if (!id) {
    return (
      <div className="flex items-center justify-center h-screen">
        Cargando proyecto...
      </div>
    );
  }

  return (
    <TutorialProvider tutorials={{ playground: playgroundTutorial }}>
      <AppBContent projectId={id} />
    </TutorialProvider>
  );
};

export default AppTTT;