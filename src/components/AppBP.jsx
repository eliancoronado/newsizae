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

// ========== DROPPED ELEMENTS BASE PARA MEMORIZAR ==========
const BASE_DROPPED_ELEMENTS = [
  {
    id: 1001,
    name: "Container",
    text: "SIZAE",
    children: [],
    iconClass: "",
    animation: "",
    retrasoanim: "",
    duracionanim: "",
    styles: {
        color: "#1b1b1b",
        cursor: "",
        backgroundColor: "",
        background: "",
        border: "",
        borderWidth: "1px",
        borderColor: "",
        borderStyle: "solid",
        fontSize: "16px",
        fontFamily: "Oswald, sans-serif",
        fontWeight: "400",
        lineHeight: "1",
        textAlign: "left",
        width: "auto",
        maxWidth: "",
        height: "10%",
        maxHeight: "",
        display: "flex",
        flexDirection: "",
        alignItems: "center", // Valor predeterminado
        justifyContent: "start", // Valor predeterminado
        gridTemplateColumns: "",
        gridTemplateRows: "",
        gap: "",
        outline: "",
        position: "static",
        overflow: "",
        boxShadow: "",
        top: "0px",
        bottom: "0px",
        left: "0px",
        right: "0px",
        transform: "",
        transition: "",
        zIndex: "",
        backdropFilter: "",
        margin: "",
        marginTop: "0px",
        marginBottom: "16px",
        marginLeft: "0px",
        marginRight: "0px",
        padding: "",
        paddingTop: "8px",
        paddingBottom: "8px",
        paddingLeft: "8px",
        paddingRight: "8px",
        borderRadius: "",
        borderTopLeftRadius: "4px",
        borderTopRightRadius: "4px",
        borderBottomLeftRadius: "4px",
        borderBottomRightRadius: "4px",
      }, // Estilos iniciales
  },
];

// ========== FUNCIÓN PARA COMPARAR ELEMENTOS SIN IDS ==========
// Colocar esto ANTES del componente AppBContent, después de BASE_DROPPED_ELEMENTS
const compareElementsWithoutIds = (elements1, elements2) => {
  // Función recursiva para eliminar IDs de los elementos
  const removeIds = (elements) => {
    if (!elements || !Array.isArray(elements)) return elements;
    return elements.map(({ id, ...rest }) => {
      if (rest.children && Array.isArray(rest.children)) {
        return { ...rest, children: removeIds(rest.children) };
      }
      return rest;
    });
  };

  const clean1 = removeIds(elements1);
  const clean2 = removeIds(elements2);

  return JSON.stringify(clean1) === JSON.stringify(clean2);
};

// ============================================================
// COMPONENTE INTERNO
// ============================================================
const AppBContent = ({ projectId }) => {
  const [loading, setLoading] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const appRef = useRef(null);

  // ========== ESTADO PARA EL JUEGO DE MEMORIA VISUAL ==========
  const [gameState, setGameState] = useState("idle"); // idle | showing | playing | verifying | result
  const [showTimer, setShowTimer] = useState(7);
  const [copyTimer, setCopyTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [baseElements, setBaseElements] = useState([]);

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

  // ========== TIMER PARA MOSTRAR EL DISEÑO ==========
  // ========== TIMER PARA MOSTRAR EL DISEÑO ==========
  useEffect(() => {
    let timer;
    if (gameState === "showing" && showTimer > 0) {
      timer = setTimeout(() => {
        setShowTimer((prev) => prev - 1);
      }, 1000);
    } else if (gameState === "showing" && showTimer === 0) {
      // Limpiar los elementos y pasar a modo juego
      setDroppedElements([]);
      setUpdatedOElements([]);
      setBaseElements([]);
      setGameState("playing");
      setCopyTimer(0);
      setIsTimerRunning(true);
      toast.info("🎯 ¡Ahora replica el diseño que viste!");
    }
    return () => clearTimeout(timer);
  }, [gameState, showTimer, setDroppedElements, setUpdatedOElements]);

  // ========== TIMER DE COPIADO ==========
  useEffect(() => {
    let timer;
    if (isTimerRunning && gameState === "playing") {
      timer = setInterval(() => {
        setCopyTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, gameState]);

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

  // ========== CARGAR PROYECTO Y INICIAR JUEGO ==========
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

        // ✅ INICIAR JUEGO - Mostrar diseño base
        // En fetchProject, dentro del try:
        // ✅ INICIAR JUEGO - Mostrar diseño base
        const baseElementsCopy = JSON.parse(
          JSON.stringify(BASE_DROPPED_ELEMENTS),
        );
        setBaseElements(baseElementsCopy);
        setDroppedElements(baseElementsCopy); // <- Esto muestra el diseño en CentralPanel
        setUpdatedOElements(baseElementsCopy);
        setGameState("showing");
        setShowTimer(7);

        toast.info("🧠 ¡Memoriza este diseño! Tendrás 7 segundos");
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

  // ========== VERIFICAR RESULTADO ==========
  // ========== VERIFICAR RESULTADO ==========
  // ========== VERIFICAR RESULTADO ==========
  const handleVerify = () => {
    // Usar la función de comparación sin IDs
    const isCorrect = compareElementsWithoutIds(
      droppedElements,
      BASE_DROPPED_ELEMENTS,
    );

    setGameResult(isCorrect);
    setShowResultModal(true);
    setIsTimerRunning(false);
    setGameState("result");

    if (isCorrect) {
      toast.success("🎉 ¡Felicidades! Replicaste el diseño perfectamente");
    } else {
      toast.error("😅 No coinciden los elementos, intenta de nuevo");
    }
  };

  // ========== REINICIAR JUEGO ==========
  const handleRestart = () => {
    setShowResultModal(false);
    setGameResult(null);
    setCopyTimer(0);
    setIsTimerRunning(false);

    // Mostrar diseño base nuevamente
    setBaseElements(JSON.parse(JSON.stringify(BASE_DROPPED_ELEMENTS)));
    setDroppedElements(JSON.parse(JSON.stringify(BASE_DROPPED_ELEMENTS)));
    setUpdatedOElements(JSON.parse(JSON.stringify(BASE_DROPPED_ELEMENTS)));
    setGameState("showing");
    setShowTimer(7);

    toast.info("🔄 Reiniciando... Memoriza el diseño nuevamente");
  };

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

  // ========== FORMATO DE TIEMPO ==========
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

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

      {/* ========== OVERLAY DE MEMORIA ========== */}
      {/* ========== OVERLAY DE MEMORIA ========== */}
      {gameState === "showing" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 pointer-events-none">
          <div className="rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl pointer-events-auto">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
              🧠 Memoriza este diseño
            </h2>
            <p className="text-center text-gray-600 mb-6">
              Tendrás {showTimer} segundos para memorizar la estructura
            </p>

            {/* Barra de progreso */}
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${(showTimer / 7) * 100}%` }}
              />
            </div>

            {/* Contador flotante */}
            <div className="text-center text-6xl font-bold text-blue-600 mb-4 animate-pulse">
              {showTimer}
            </div>
          </div>
        </div>
      )}

      {/* ========== TIMER FLOTANTE DE COPIADO ========== */}
      {gameState === "playing" && (
        <div className="fixed top-20 right-4 z-40 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full px-6 py-3 shadow-lg flex items-center gap-3 animate-bounce">
          <span className="text-sm font-medium">⏱️ Tiempo:</span>
          <span className="text-xl font-bold font-mono">
            {formatTime(copyTimer)}
          </span>
        </div>
      )}

      {/* ========== BOTÓN VERIFICAR ========== */}
      {gameState === "playing" && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40">
          <button
            onClick={handleVerify}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-full shadow-2xl hover:shadow-xl transition-all duration-300 hover:scale-105 font-bold text-lg flex items-center gap-3"
          >
            <span>✅ Verificar diseño</span>
          </button>
        </div>
      )}

      {/* ========== MODAL DE RESULTADO ========== */}
      {showResultModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-[scaleIn_0.3s_ease-out]">
            {gameResult ? (
              <>
                <div className="text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-3xl font-bold text-green-600 mb-2">
                    ¡Felicidades!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Lograste replicar el diseño perfectamente en{" "}
                    {formatTime(copyTimer)}
                  </p>
                  <div className="bg-green-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-green-700">
                      ✅ Diseño replicado correctamente
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <div className="text-6xl mb-4">😅</div>
                  <h2 className="text-3xl font-bold text-red-600 mb-2">
                    No coincide
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Los elementos no coinciden con el diseño original
                  </p>
                  <div className="bg-red-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-red-700">
                      ❌ Revisa la estructura y estilos
                    </p>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 font-semibold"
              >
                🔄 Reintentar
              </button>
              {gameResult && (
                <button
                  onClick={() => setShowResultModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition-all duration-300 font-semibold"
                >
                  Continuar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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

      {/* ========== ESTILOS CSS PARA ANIMACIONES ========== */}
      <style jsx>{`
        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        .animate-pulse {
          animation: pulse 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
const AppBP = () => {
  const { id } = useParams();

  if (!id) {
    return (
      <div className="flex items-center justify-center h-screen">
        Cargando proyecto...
      </div>
    );
  }

  return <AppBContent projectId={id} />;
};

export default AppBP;
