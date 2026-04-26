// CentralPanel.jsx - Versión Firebase
import React, { useState, useRef, useEffect } from "react";
import useStore from "../store/store";
import { Hand, MousePointer2 } from "lucide-react";
import { RxDotsVertical } from "react-icons/rx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "./ui/card";
import { ref, set, get } from "firebase/database";
import { QRCodeCanvas } from "qrcode.react";
import { db } from "../firebase";
import { auth } from "../firebase";
import { toast } from "sonner";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";

const CentralPanel = ({
  onUpdate,
  id,
  renderElement,
  contextMenu,
  setContextMenu,
  setDeviceShow,
  urlqr
}) => {
  const [color, setColor] = useState("dfdfdf");
  const [backgroundColor, setBackgroundColor] = useState("#dfdfdf");
  const [isModalOpen, setModalOpen] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const [importCode, setImportCode] = useState([]);

  // Estados para escala y posición
  const [widthDevice, setWithDevice] = useState("1366px");
  const [heightDevice, setHeightDevice] = useState("768px");
  const [dpi, setDpi] = useState("0.7");
  const [scale, setScale] = useState(0.6);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: -383, y: -72 });
  const [isHandTool, setIsHandTool] = useState(false);
  const [qrcode, setQrCode] = useState(false);
  const containerRef = useRef(null);

  const {
    projectData: project,
    setProjectData: setProject,
    imgSelected,
    setSelectedPage,
    droppedElements,
    setDroppedElements,
    draggingElement,
    setDraggingElement,
    workspaceState,
    setWorkspaceState,
    blocklyCode,
    setBlockyCode,
    gs,
    setGs,
  } = useStore();

  // Color de fondo
  useEffect(() => {
    if (/^[0-9A-Fa-f]{6}$/.test(color)) {
      setBackgroundColor(`#${color}`);
    } else {
      setBackgroundColor("#ffffff");
    }
  }, [color]);

  const handleColorChange = (e) => setColor(e.target.value);

  // 🔥 Función para guardar el proyecto completo en Firebase
  const saveProjectToFirebase = async (updatedProject) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error("Debes iniciar sesión para guardar");
      return false;
    }

    try {
      const projectRef = ref(db, `projects/${id}`);
      await set(projectRef, updatedProject);

      const userProjectRef = ref(db, `userProjects/${currentUser.uid}/${id}`);
      await set(userProjectRef, true);

      return true;
    } catch (error) {
      console.error("Error guardando proyecto:", error);
      toast.error("Error al guardar el proyecto");
      return false;
    }
  };

  // 🔥 NUEVA PÁGINA - Versión Firebase
  const addNewPage = async () => {
    if (!newPageName.trim()) {
      toast.error("El nombre de la página no puede estar vacío");
      return;
    }

    // Verificar si la página ya existe
    if (project?.pages?.some((p) => p.name === newPageName)) {
      toast.error("Ya existe una página con ese nombre");
      return;
    }

    // Crear nueva página
    const newPage = {
      name: newPageName,
      elements: [],
      code: null,
      state: "",
      stylesGlobal: [],
    };

    // Actualizar proyecto
    const updatedProject = { ...project };
    if (!updatedProject.pages) updatedProject.pages = [];
    updatedProject.pages.push(newPage);
    updatedProject.updatedAt = Date.now();

    // Guardar en Firebase
    const saved = await saveProjectToFirebase(updatedProject);

    if (saved) {
      // Actualizar estado local
      setProject(updatedProject);
      setSelectedPage(newPageName);

      // Limpiar el área de trabajo para la nueva página
      setDroppedElements([]);
      setBlockyCode(null);
      setWorkspaceState("");

      toast.success(`Página "${newPageName}" creada correctamente`);
    }

    setModalOpen(false);
    setNewPageName("");
  };

  // Arrastrar y soltar
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e, parentId = null) => {
    e.preventDefault();
    e.stopPropagation();
    const data = draggingElement
      ? draggingElement
      : JSON.parse(e.dataTransfer.getData("application/reactflow"));

    const newElement = {
      id: Date.now(),
      name: data.name,
      text:
        data.name === "Container"
          ? "Div"
          : data.name === "Input"
            ? ""
            : data.name === "Icon"
              ? ""
              : data.name === "Select"
                ? ""
                : data.name === "Link"
                  ? "Link"
                  : data.name === "List-Item"
                    ? "Item de la lista"
                    : data.name === "O-List"
                      ? ""
                      : data.name === "U-List"
                        ? ""
                        : "texto",
      children: [],
      ...(data.name === "Input" && { placeholder: "Placeholder" }),
      ...(data.name === "Image" && { src: imgSelected }),
      ...(data.name === "Icon"
        ? { iconClass: "bx bx-left-arrow-alt" }
        : { iconClass: "" }),
      ...(data.name === "Input" && { type: "text" }),
      ...(data.name === "Option" && { value: "texto" }),
      ...(data.name === "Link" && { href: "#" }),
      animation: "",
      retrasoanim: "",
      duracionanim: "",
      styles: {
        color: "#000000",
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
        height: "auto",
        maxHeight: "",
        display: "block",
        flexDirection: "",
        alignItems: "start",
        justifyContent: "start",
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
      },
    };

    if (!Array.isArray(droppedElements)) return;

    const updatedElements =
      parentId === null
        ? [...droppedElements, newElement]
        : addChildToParent(droppedElements, parentId, newElement);

    if (Array.isArray(updatedElements)) setDroppedElements(updatedElements);
    setDraggingElement(null);
  };

  const addChildToParent = (elements, parentId, child) => {
    return elements.map((el) => {
      if (el.id === parentId) {
        return { ...el, children: [...el.children, child] };
      }
      if (el.children && el.children.length > 0) {
        return {
          ...el,
          children: addChildToParent(el.children, parentId, child),
        };
      }
      return el;
    });
  };

  const handleDeleteElement = (id) => {
    const deleteElementRecursive = (elements) => {
      return elements
        .map((element) => {
          if (element.id === id) return null;
          if (element.children && element.children.length > 0) {
            return {
              ...element,
              children: deleteElementRecursive(element.children),
            };
          }
          return element;
        })
        .filter((el) => el !== null);
    };
    const updatedElements = deleteElementRecursive(droppedElements);
    setDroppedElements(updatedElements);
    setContextMenu(null);
  };

  function handleSave() {
    onUpdate(); // Esto llama a handleUpdateProject en AppB
  }

  // Copiar / Pegar
  const handleCopy = () => {
    localStorage.setItem("clipboard", JSON.stringify(droppedElements));
    localStorage.setItem("clipboardCode", JSON.stringify(workspaceState));
    toast.success("Elementos copiados");
    navigator.clipboard.writeText(JSON.stringify(droppedElements));
  };

  const handlePaste = () => {
    try {
      const clip = localStorage.getItem("clipboard");
      const parsedData = JSON.parse(clip);
      const clipCode = localStorage.getItem("clipboardCode");
      const parseCode = JSON.parse(clipCode);
      if (Array.isArray(parsedData) && parseCode) {
        setDroppedElements(parsedData);
        setWorkspaceState(parseCode);
      } else {
        toast.error("Formato inválido");
      }
    } catch (error) {
      toast.error("No hay elementos para pegar");
    }
  };

  // Escala
  const increaseScale = () => setScale((prev) => prev + 0.1);
  const decreaseScale = () =>
    setScale((prev) => (prev > 0.1 ? prev - 0.1 : prev));

  // Arrastre con herramienta mano
  const handleMouseDown = (e) => {
    if (!isHandTool) return;
    setIsDragging(true);
    containerRef.current.style.cursor = "grabbing";
    containerRef.current.startX = e.clientX - position.x;
    containerRef.current.startY = e.clientY - position.y;
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = e.clientX - containerRef.current.startX;
    const newY = e.clientY - containerRef.current.startY;
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (containerRef.current) containerRef.current.style.cursor = "default";
  };

  const handleStart = (e) => {
    if (!isHandTool) return;
    setIsDragging(true);
    containerRef.current.style.cursor = "grabbing";
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    containerRef.current.startX = clientX - position.x;
    containerRef.current.startY = clientY - position.y;
  };

  const handleMove = (e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const newX = clientX - containerRef.current.startX;
    const newY = clientY - containerRef.current.startY;
    setPosition({ x: newX, y: newY });
  };

  const handleEnd = () => {
    setIsDragging(false);
    if (containerRef.current) containerRef.current.style.cursor = "default";
  };

  const toggleHandTool = () => setIsHandTool(true);
  const toggleMouseTool = () => setIsHandTool(false);

  return (
    <div
      className="w-full h-screen max-h-screen min-h-screen overflow-hidden col-span-2 relative flex items-center justify-center"
      style={{ backgroundColor: backgroundColor }}
      onMouseMove={handleMouseMove}
      onTouchMove={handleMove}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleEnd}
      onMouseLeave={handleMouseUp}
    >
      {/* Selector de color */}
      <div className="absolute z-30 right-1 top-1 px-3 py-2 rounded flex items-center gap-2 bg-[#767676]">
        <div className="w-5 h-5" style={{ backgroundColor: backgroundColor }} />
        <input
          type="text"
          placeholder="Enter color (e.g., ff5733)"
          className="pl-2 outline-none w-20 bg-transparent text-white"
          value={color}
          onChange={handleColorChange}
        />
      </div>

      {qrcode && (
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40 rounded-xl shadow-lg w-full max-w-[900px]">
          {/* Contenedor de carrusel */}
          <div className="relative">
            {/* Botón izquierda */}
            <button
              onClick={() => {
                const container = document.getElementById("qr-cards-container");
                container.scrollBy({ left: -300, behavior: "smooth" });
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-gray-200 text-black hover:bg-gray-300 p-2 rounded-full shadow z-10"
            >
              <FaArrowLeft />
            </button>

            {/* Lista horizontal */}
            <div
              id="qr-cards-container"
              className="flex gap-4 overflow-x-auto scroll-smooth px-10"
              style={{ scrollbarWidth: "none" }}
            >
              {[
                {
                  title: "Escanea el QR",
                  description:
                    "Tendrás una vista previa de tu proyecto para prueba y error",
                  url: urlqr,
                },
              ].map((card, index) => (
                <Card key={index} className="w-72 flex-shrink-0">
                  <CardHeader>
                    <CardTitle>{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <QRCodeCanvas
                      value={card.url}
                      size={100}
                      bgColor={"#ffffff"}
                      fgColor={"#000000"}
                      level={"H"}
                      includeMargin={true}
                    />
                  </CardContent>
                  <CardFooter className="flex items-center justify-end gap-2">
                    <Button
                      onClick={() => {
                        if (
                          navigator.clipboard &&
                          navigator.clipboard.writeText
                        ) {
                          navigator.clipboard
                            .writeText(card.url)
                            .then(() =>
                              console.log("URL copiada al portapapeles"),
                            )
                            .catch((err) =>
                              alert("Error al copiar la URL: " + err),
                            );
                        } else {
                          const tempInput = document.createElement("input");
                          tempInput.value = card.url;
                          document.body.appendChild(tempInput);
                          tempInput.select();
                          document.execCommand("copy");
                          document.body.removeChild(tempInput);
                          console.log("URL copiada con método alternativo");
                        }
                      }}
                    >
                      Copiar URL
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Botón derecha */}
            <button
              onClick={() => {
                const container = document.getElementById("qr-cards-container");
                container.scrollBy({ left: 300, behavior: "smooth" });
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-gray-200 text-black hover:bg-gray-300 p-2 rounded-full shadow z-10"
            >
              <FaArrowRight />
            </button>
          </div>

          {/* Botón cerrar */}
          <div className="w-full flex justify-center mt-4">
            <Button variant="destructive" onClick={() => setQrCode(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      )}

      {/* Controles de escala y menú */}
      <div className="absolute z-30 top-1 left-1 h-8 flex gap-1">
        <button
          onClick={decreaseScale}
          className="bg-[#5A4A78] w-8 flex items-center justify-center text-[#FFD966] rounded shadow font-semibold"
        >
          -
        </button>
        <button
          onClick={increaseScale}
          className="bg-[#5A4A78] w-8 flex items-center justify-center text-[#FFD966] rounded shadow font-semibold"
        >
          +
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="bg-[#5A4A78] w-8 flex items-center justify-center text-[#FFD966] rounded shadow font-semibold">
              <RxDotsVertical className="text-sm" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setModalOpen(true)}>
                Nueva Página
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (widthDevice === "1366px") {
                    setWithDevice("430px");
                    setPosition({ x: 83, y: -183 });
                    setScale(0.8);
                  } else {
                    setWithDevice("1366px");
                    setScale(0.6);
                    setPosition({ x: -383, y: -72 });
                  }
                  if (heightDevice === "768px") {
                    setHeightDevice("932px");
                  } else {
                    setHeightDevice("768px");
                  }
                  if (dpi === "0.6") {
                    setDpi("0.33");
                  } else {
                    setDpi("0.7");
                  }
                }}
              >
                Modo {widthDevice === "1366px" ? "Telefono" : "Computadora"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSave}>Guardar</DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopy}>Copiar</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setQrCode(true)}>
                Abrir link dev
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDeviceShow(prev => !prev)}>
                Abrir emulador
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePaste}>Pegar</DropdownMenuItem>
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    Importar
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Importar código</DialogTitle>
                    <DialogDescription>
                      Puedes importar código Obj para trabajar
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="import-code" className="text-right">
                        Código en lenguaje Obj
                      </Label>
                      <Textarea
                        id="import-code"
                        value={importCode}
                        className="col-span-3"
                        placeholder="Ingresa el código Obj"
                        onChange={(e) => setImportCode(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => {
                        try {
                          const parsedData = JSON.parse(importCode);
                          if (Array.isArray(parsedData)) {
                            setDroppedElements(parsedData);
                          } else {
                            setDroppedElements([parsedData]);
                          }
                          toast.success("Código importado correctamente");
                        } catch (error) {
                          toast.error("El JSON ingresado es inválido");
                        }
                      }}
                    >
                      Importar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Herramientas mano / puntero */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        <button
          onClick={toggleHandTool}
          className={`p-1 ${isHandTool ? "bg-blue-500" : "bg-gray-500"} text-white rounded shadow hover:bg-blue-600 w-8 h-8`}
        >
          <Hand />
        </button>
        <button
          onClick={toggleMouseTool}
          className={`p-1 w-8 h-8 ${!isHandTool ? "bg-blue-500" : "bg-gray-500"} text-white rounded shadow hover:bg-blue-600`}
        >
          <MousePointer2 />
        </button>
      </div>

      {/* Área de edición */}
      <div
        id="central"
        ref={containerRef}
        className="absolute flex items-center justify-center w-auto h-auto"
        style={{
          width: `${widthDevice}`,
          height: `${heightDevice}`,
          transform: `scale(${scale})`,
          transformOrigin: "center",
          transition: isDragging ? "none" : "transform 0.2s ease-in-out",
          cursor: isHandTool ? "grab" : "auto",
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleStart}
      >
        <div
          className="relative overflow-y-auto thin-scroll h-full w-full"
          onDrop={(e) => handleDrop(e)}
          onTouchEnd={(e) => handleDrop(e)}
          onDragOver={handleDragOver}
          style={{
            width: `${widthDevice}`,
            height: `${heightDevice}`,
            transform: `scale(${dpi})`,
            borderRadius: "20px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
            backgroundColor: "#fff",
            boxSizing: "border-box",
            pointerEvents: isHandTool ? "none" : "auto",
          }}
        >
          {droppedElements.map((element) => renderElement(element))}
        </div>
      </div>

      {/* Menú contextual */}
      {contextMenu && (
        <div
          className="fixed bg-white shadow-md rounded flex flex-col items-center gap-2 p-2"
          style={{ top: `${contextMenu.y + 25}px`, left: `${contextMenu.x}px` }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <button
            onClick={() => handleDeleteElement(contextMenu.id)}
            className="text-red-500 hover:bg-red-100 w-full px-4 py-2 rounded"
          >
            Borrar
          </button>
        </div>
      )}

      {/* Modal nueva página */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-200 rounded-lg p-6 shadow-lg w-80">
            <h2 className="text-xl font-semibold mb-4 text-black">
              Nueva Página
            </h2>
            <input
              type="text"
              value={newPageName}
              onChange={(e) => setNewPageName(e.target.value)}
              className="w-full px-3 py-2 border rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Escribe el nombre de la nueva página"
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 mr-2"
              >
                Cancelar
              </button>
              <button
                onClick={addNewPage}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CentralPanel;
