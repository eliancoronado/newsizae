// components/VSCode.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { emmetHTML, emmetCSS, emmetJSX } from "emmet-monaco-es";
import {
  FiSave,
  FiPlus,
  FiTrash2,
  FiFile,
  FiEye,
  FiEyeOff,
  FiUpload,
  FiCode,
  FiFolder,
  FiArrowLeft,
  FiRefreshCw,
} from "react-icons/fi";

const VSCode = ({
  projectName = "Proyecto HTML",
  projectId,
  files = [{ name: "index.html", content: "" }],
  onSave,
  onPublish,
  isReadOnly = false,
  canEdit = true,
  onClose,
  logoUrl = "/logo2.png",
}) => {
  const [fileTree, setFileTree] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [editorContent, setEditorContent] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [newFileName, setNewFileName] = useState("");
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const emmetDisposers = useRef([]);

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Inicializar árbol de archivos
  useEffect(() => {
    const tree = files.map((file, index) => ({
      id: `file-${index}`,
      name: file.name,
      content: file.content,
      isFolder: false,
    }));
    setFileTree(tree);
    if (tree.length > 0) {
      setActiveFile(tree[0]);
      setEditorContent(tree[0].content);
    }
  }, [files]);

  // Manejar cambio de contenido en el editor
  const handleEditorChange = (value) => {
    setEditorContent(value || "");
    if (activeFile) {
      setFileTree((prev) =>
        prev.map((f) =>
          f.id === activeFile.id ? { ...f, content: value || "" } : f,
        ),
      );
    }
  };

  // Guardar archivos
  const handleSave = async () => {
    if (isReadOnly || !canEdit) {
      alert("No tienes permiso para guardar cambios");
      return;
    }
    setIsSaving(true);
    try {
      const updatedFiles = fileTree.map((f) => ({
        name: f.name,
        content: f.content,
      }));
      if (onSave) {
        await onSave(updatedFiles);
        alert("¡Archivos guardados correctamente!");
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al guardar los archivos");
    } finally {
      setIsSaving(false);
    }
  };

  // Publicar proyecto
  const handlePublish = async () => {
    if (isReadOnly || !canEdit) {
      alert("No tienes permiso para publicar");
      return;
    }
    setIsSaving(true);
    try {
      const updatedFiles = fileTree.map((f) => ({
        name: f.name,
        content: f.content,
      }));
      if (onPublish) {
        await onPublish(updatedFiles);
      } else if (onSave) {
        await onSave(updatedFiles);
      }
      alert("¡Proyecto publicado correctamente!");
    } catch (error) {
      console.error("Error al publicar:", error);
      alert("Error al publicar el proyecto");
    } finally {
      setIsSaving(false);
    }
  };

  // Crear nuevo archivo
  const handleCreateNewFile = () => {
    if (isReadOnly || !canEdit) {
      alert("No tienes permiso para crear archivos");
      return;
    }
    if (!newFileName.trim()) {
      alert("Ingresa un nombre de archivo");
      return;
    }
    let name = newFileName.trim();
    if (!name.includes(".")) {
      name = `${name}.html`;
    }
    if (fileTree.some((f) => f.name === name)) {
      alert(`Ya existe un archivo llamado "${name}"`);
      return;
    }
    const newFile = {
      id: `file-${Date.now()}`,
      name: name,
      content: "",
      isFolder: false,
    };
    setFileTree((prev) => [...prev, newFile]);
    setActiveFile(newFile);
    setEditorContent("");
    setNewFileName("");
    setShowNewFileInput(false);
  };

  // Eliminar archivo
  const handleDeleteFile = (fileId) => {
    if (isReadOnly || !canEdit) {
      alert("No tienes permiso para eliminar archivos");
      return;
    }
    if (fileTree.length <= 1) {
      alert("No puedes eliminar el único archivo");
      return;
    }
    if (
      window.confirm(
        `¿Eliminar "${fileTree.find((f) => f.id === fileId)?.name}"?`,
      )
    ) {
      const newTree = fileTree.filter((f) => f.id !== fileId);
      setFileTree(newTree);
      if (activeFile?.id === fileId) {
        setActiveFile(newTree[0] || null);
        setEditorContent(newTree[0]?.content || "");
      }
    }
  };

  // Seleccionar archivo
  const handleSelectFile = (file) => {
    setActiveFile(file);
    setEditorContent(file.content);
    if (isMobile) setShowSidebar(false);
  };

  // Toggle preview
  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  // Refrescar preview
  const refreshPreview = () => {
    setPreviewKey((prev) => prev + 1);
  };

  // Determinar lenguaje según extensión
  const getLanguage = (fileName) => {
    if (!fileName) return "html";
    const ext = fileName.split(".").pop().toLowerCase();
    const map = {
      html: "html",
      css: "css",
      js: "javascript",
      json: "json",
      md: "markdown",
      jsx: "javascriptreact",
      ts: "typescript",
      tsx: "typescriptreact",
    };
    return map[ext] || "plaintext";
  };

  // Obtener ícono según extensión
  const getFileIcon = (fileName) => {
    const ext = fileName.split(".").pop().toLowerCase();
    const icons = {
      html: "🌐",
      css: "🎨",
      js: "⚡",
      json: "📦",
      md: "📝",
      jsx: "⚛️",
      ts: "🟦",
      tsx: "🟦",
    };
    return icons[ext] || <FiFile size={14} />;
  };

  // Configuración del editor
  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
    fontLigatures: true,
    automaticLayout: true,
    readOnly: isReadOnly || !canEdit,
    scrollbar: {
      vertical: "auto",
      horizontal: "auto",
      useShadows: false,
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
    },
    tabSize: 2,
    insertSpaces: true,
    bracketPairColorization: { enabled: true },
    renderWhitespace: "selection",
    smoothScrolling: true,
    cursorBlinking: "smooth",
    renderLineHighlight: "all",
    selectionHighlight: true,
    occurrencesHighlight: true,
    matchBrackets: "always",
    autoClosingBrackets: "always",
    autoClosingQuotes: "always",
    autoIndent: "full",
    formatOnPaste: true,
    formatOnType: true,
    suggest: {
      showKeywords: true,
      showSnippets: true,
      showFunctions: true,
      showConstructors: true,
      showDeprecated: true,
      showFields: true,
      showVariables: true,
      showClasses: true,
      showStructs: true,
      showInterfaces: true,
      showModules: true,
      showProperties: true,
      showEvents: true,
      showOperators: true,
      showUnits: true,
      showValues: true,
      showConstants: true,
      showEnums: true,
      showEnumMembers: true,
      showReferences: true,
      showColors: true,
      showFiles: true,
      showFolders: true,
      showTypeParameters: true,
      showSnippets: true,
    },
  };

  // 🔥 INICIALIZAR EMMET CON emmet-monaco-es
  const initEmmet = (monaco) => {
    if (!monaco) return;

    // Limpiar disposers anteriores
    emmetDisposers.current.forEach((dispose) => dispose());
    emmetDisposers.current = [];

    // Configurar Emmet para HTML (con soporte para HTML, PHP, etc.)
    const htmlDispose = emmetHTML(monaco, [
      "html",
      "php",
      "handlebars",
      "hbs",
      "pug",
      "jade",
      "ejs",
      "twig",
    ]);
    emmetDisposers.current.push(htmlDispose);

    // Configurar Emmet para CSS (con soporte para CSS, SCSS, LESS)
    const cssDispose = emmetCSS(monaco, [
      "css",
      "scss",
      "less",
      "sass",
      "stylus",
    ]);
    emmetDisposers.current.push(cssDispose);

    // Configurar Emmet para JSX (con soporte para JavaScript, TypeScript)
    const jsxDispose = emmetJSX(monaco, [
      "javascript",
      "typescript",
      "javascriptreact",
      "typescriptreact",
    ]);
    emmetDisposers.current.push(jsxDispose);

    console.log("🔥 Emmet inicializado correctamente");
  };

  // Función para manejar atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "P") {
        e.preventDefault();
        togglePreview();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [fileTree, activeFile]);

  // Limpiar Emmet al desmontar
  useEffect(() => {
    return () => {
      emmetDisposers.current.forEach((dispose) => dispose());
      emmetDisposers.current = [];
    };
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-br from-[#0d0d0d] to-[#1a1a1a] text-[#d4d4d4] relative overflow-hidden">
      {/* Barra superior con logo y nombre */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-3 bg-[#1e1e1e]/90 backdrop-blur-sm border-b border-[#2a2a2a] shadow-lg">
        <div className="flex items-center gap-2 md:gap-4">
          <img
            src={logoUrl}
            alt="Sizae"
            className="h-6 md:h-8 w-auto object-contain"
          />
          <div className="h-5 md:h-6 w-px bg-[#3c3c3c]" />
          <div className="flex items-center gap-2">
            <FiFolder className="text-[#007acc] hidden sm:block" size={18} />
            <span className="text-xs md:text-sm font-medium text-[#cccccc] truncate max-w-[100px] md:max-w-[200px]">
              {projectName || "Proyecto HTML"}
            </span>
            {isReadOnly && (
              <span className="text-[8px] md:text-[10px] bg-yellow-500/20 text-yellow-300 px-1 md:px-2 py-0.5 rounded-full border border-yellow-500/30">
                Solo lectura
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          {isMobile && (
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="text-[#8e8e8e] hover:text-white transition-colors p-1 rounded hover:bg-[#2a2a2a]"
              title="Archivos"
            >
              <FiFolder size={18} />
            </button>
          )}

          {canEdit && !isReadOnly && (
            <>
              <button
                onClick={() => setShowNewFileInput(!showNewFileInput)}
                className="flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 text-xs bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg transition-all duration-200 border border-[#3a3a3a] hover:border-[#4a4a4a]"
                title="Nuevo archivo"
              >
                <FiPlus size={14} />{" "}
                <span className="hidden sm:inline">Archivo</span>
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 text-xs bg-gradient-to-r from-[#007acc] to-[#005a9e] hover:from-[#0088dd] hover:to-[#0066b3] rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
              >
                <FiSave size={14} />{" "}
                <span className="hidden sm:inline">
                  {isSaving ? "Guardando..." : "Guardar"}
                </span>
              </button>
              <button
                onClick={handlePublish}
                disabled={isSaving}
                className="hidden md:flex items-center gap-1 px-3 py-1.5 text-xs bg-gradient-to-r from-[#2b8a3e] to-[#1f6d2f] hover:from-[#3a9a4e] hover:to-[#2a7d3f] rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
              >
                <FiUpload size={14} /> Publicar
              </button>
            </>
          )}
          <button
            onClick={togglePreview}
            className={`flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 text-xs rounded-lg transition-all duration-200 shadow-sm ${
              showPreview
                ? "bg-[#2a2a2a] border border-[#4a4a4a]"
                : "bg-[#1a1a1a] border border-[#3a3a3a] hover:bg-[#2a2a2a]"
            }`}
          >
            {showPreview ? <FiEyeOff size={14} /> : <FiEye size={14} />}
            <span className="hidden sm:inline">
              {showPreview ? "Ocultar" : "Vista previa"}
            </span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-[#8e8e8e] hover:text-white transition-colors p-1 rounded hover:bg-[#2a2a2a]"
              title="Cerrar"
            >
              <FiArrowLeft size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Input para nuevo archivo */}
      {showNewFileInput && canEdit && !isReadOnly && (
        <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-[#1a1a1a] border-b border-[#2a2a2a]">
          <input
            type="text"
            placeholder="Nombre del archivo (ej: style.css)"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            className="flex-1 bg-[#2a2a2a] text-white text-sm px-3 py-1.5 rounded-lg border border-[#3a3a3a] focus:border-[#007acc] focus:outline-none transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateNewFile();
              if (e.key === "Escape") {
                setShowNewFileInput(false);
                setNewFileName("");
              }
            }}
            autoFocus
          />
          <button
            onClick={handleCreateNewFile}
            className="px-3 py-1.5 text-xs bg-[#007acc] hover:bg-[#0088dd] rounded-lg transition-colors"
          >
            Crear
          </button>
          <button
            onClick={() => {
              setShowNewFileInput(false);
              setNewFileName("");
            }}
            className="px-3 py-1.5 text-xs bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Cuerpo principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar de archivos */}
        <div
          className={`${
            isMobile && !showSidebar ? "hidden" : "w-48 md:w-56"
          } bg-[#1a1a1a] border-r border-[#2a2a2a] flex flex-col overflow-hidden shadow-xl flex-shrink-0`}
        >
          <div className="p-2 md:p-3 text-xs font-medium text-[#8e8e8e] border-b border-[#2a2a2a] flex items-center justify-between bg-[#1e1e1e]">
            <span className="uppercase tracking-wider text-[10px] md:text-xs">
              Archivos
            </span>
            {canEdit && !isReadOnly && !isMobile && (
              <button
                onClick={() => setShowNewFileInput(!showNewFileInput)}
                className="text-[#8e8e8e] hover:text-white transition-colors p-1 rounded hover:bg-[#2a2a2a]"
                title="Nuevo archivo"
              >
                <FiPlus size={16} />
              </button>
            )}
          </div>
          <div className="flex-1 overflow-auto p-1 md:p-2 space-y-0.5">
            {fileTree.map((file) => (
              <div
                key={file.id}
                className={`flex items-center justify-between px-2 md:px-3 py-1.5 md:py-2 rounded-lg cursor-pointer transition-all duration-150 ${
                  activeFile?.id === file.id
                    ? "bg-[#2a2a2a] shadow-inner border-l-2 border-[#007acc]"
                    : "hover:bg-[#252525]"
                }`}
                onClick={() => handleSelectFile(file)}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-[#8e8e8e] text-xs md:text-sm">
                    {getFileIcon(file.name)}
                  </span>
                  <span className="text-xs md:text-sm truncate text-[#cccccc]">
                    {file.name}
                  </span>
                </div>
                {canEdit && !isReadOnly && fileTree.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(file.id);
                    }}
                    className="text-[#8e8e8e] hover:text-[#e74c3c] transition-colors p-1 rounded hover:bg-[#2a2a2a]"
                  >
                    <FiTrash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="p-2 md:p-3 border-t border-[#2a2a2a] bg-[#1a1a1a]">
            <div className="flex items-center justify-between text-[10px] md:text-xs text-[#6e6e6e]">
              <span>{fileTree.length} archivos</span>
              <span>
                {fileTree.reduce(
                  (acc, f) =>
                    acc + (f.content ? f.content.split("\n").length : 0),
                  0,
                )}{" "}
                líneas
              </span>
            </div>
          </div>
        </div>

        {/* Editor / Vista previa */}
        <div className="flex-1 flex flex-col bg-[#0d0d0d] min-w-0">
          {showPreview && activeFile?.name.endsWith(".html") ? (
            <div className="flex-1 bg-white relative flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 bg-[#1a1a1a] border-b border-[#2a2a2a]">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8e8e8e]">
                    🖥️ Vista previa - {activeFile.name}
                  </span>
                </div>
                <button
                  onClick={refreshPreview}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg transition-colors"
                  title="Refrescar vista previa"
                >
                  <FiRefreshCw size={14} />{" "}
                  <span className="hidden sm:inline">Refrescar</span>
                </button>
              </div>
              <iframe
                key={previewKey}
                srcDoc={activeFile.content}
                title="Preview"
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-modals allow-same-origin"
              />
            </div>
          ) : (
            <div className="flex-1 relative">
              <Editor
                height="100%"
                language={getLanguage(activeFile?.name)}
                theme="vs-dark"
                value={editorContent}
                onChange={handleEditorChange}
                options={editorOptions}
                onMount={(editor, monaco) => {
                  editorRef.current = editor;
                  monacoRef.current = monaco;
                  editor.focus();
                  // 🔥 INICIALIZAR EMMET
                  initEmmet(monaco);
                }}
              />
              <div className="absolute top-2 right-2 md:top-3 md:right-4 bg-[#1a1a1a]/80 backdrop-blur-sm px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs text-[#6e6e6e] border border-[#2a2a2a] shadow-lg flex items-center gap-1 md:gap-2">
                <FiCode size={12} />
                {getLanguage(activeFile?.name).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Barra de estado */}
      <div className="flex items-center justify-between px-2 md:px-4 py-1 bg-[#1e1e1e] border-t border-[#2a2a2a] text-[10px] md:text-xs text-[#8e8e8e]">
        <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
          <span className="flex items-center gap-1 whitespace-nowrap">
            <FiFile size={12} />
            <span className="hidden xs:inline">
              {activeFile?.name || "Sin archivo"}
            </span>
          </span>
          <span className="text-[#4a4a4a]">|</span>
          <span className="whitespace-nowrap">
            Ln {editorContent.split("\n").length}
          </span>
          <span className="text-[#4a4a4a] hidden md:inline">|</span>
          <span className="hidden md:inline">
            Col {editorContent.split("\n").pop()?.length || 0}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isReadOnly && (
            <span className="bg-yellow-500/20 px-1 md:px-2 py-0.5 rounded-full text-yellow-300 text-[8px] md:text-[10px] border border-yellow-500/30">
              Solo lectura
            </span>
          )}
          <span className="text-[#5a5a5a] hidden sm:inline">
            {new Date().toLocaleTimeString()}
          </span>
          <span className="text-[#5a5a5a] sm:hidden">
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VSCode;
