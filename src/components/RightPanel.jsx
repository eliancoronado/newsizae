import {
  RxText,
  RxSpaceEvenlyHorizontally,
  RxBorderWidth,
  RxBoxModel,
} from "react-icons/rx";
import { CgDropOpacity } from "react-icons/cg";
import {
  LuAlignLeft,
  LuAlignJustify,
  LuAlignRight,
  LuAlignStartHorizontal,
  LuAlignCenterHorizontal,
  LuAlignEndHorizontal,
  LuAlignStartVertical,
  LuAlignCenterVertical,
  LuAlignEndVertical,
  LuAlignHorizontalSpaceAround,
  LuAlignHorizontalSpaceBetween,
} from "react-icons/lu";
import {
  TbBoxAlignTopFilled,
  TbBoxAlignBottomFilled,
  TbBoxAlignLeftFilled,
  TbBoxAlignRightFilled,
  TbBoxAlignTopLeftFilled,
  TbBoxAlignTopRightFilled,
  TbBoxAlignBottomLeftFilled,
  TbBoxAlignBottomRightFilled,
} from "react-icons/tb";
import {
  MdBorderTop,
  MdOutlineBorderBottom,
  MdBorderLeft,
  MdBorderRight,
  MdOutlineStyle,
} from "react-icons/md";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { BiSolidHide, BiLayer } from "react-icons/bi";
import useStore from "../store/store";
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import useElement from "../store/useElement";
import GradientEditor from "./GradientEditor";
import FullColorPicker from "./FullColorPicker";

const RightPanel = ({
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
  prid,
  gs,
}) => {
  const {
    url,
    projectData: project,
    droppedElements,
    setDroppedElements,
    selectedPage,
    setSelectedPage,
    selectedElement,
    setSelectedElement,
  } = useStore(); // Usamos los métodos del store para actualizar el estado
  const { selectedId, targetId, setSelectedId, setTargetId } = useElement();
  const [uploadedImages, setUploadedImages] = useState([]);

  const findElementById = (elements, id) => {
    for (const el of elements) {
      if (String(el.id) === String(id)) {
        return el;
      }
      if (el.children) {
        const found = findElementById(el.children, id);
        if (found) {
          return found;
        }
      }
    }
    return null; // Si no se encuentra el elemento
  };

  const handleGradientChange = useCallback(
    (gradient) => {
      console.log(gradient);
      handleStyleChange("background", gradient);
    },
    [handleStyleChange]
  );

  const applyStyles = () => {
    console.log("selectedId:", selectedId);
    console.log("droppedElements:", droppedElements);

    if (!selectedId || !targetId) {
      console.error("Selecciona ambos elementos antes de aplicar los estilos.");
      return;
    }

    // Verificar si droppedElements está vacío
    if (!Array.isArray(droppedElements) || droppedElements.length === 0) {
      console.error("droppedElements no es un array válido o está vacío.");
      return;
    }

    // Busca el elemento seleccionado recursivamente
    const selectedElement = findElementById(droppedElements, selectedId);

    if (!selectedElement) {
      console.error(
        `El elemento con ID ${selectedId} no existe en droppedElements.`
      );
      return;
    }

    // Actualizar estilos
    const updateStylesRecursively = (elements) =>
      elements.map((el) => {
        if (el.id === Number(targetId)) {
          return {
            ...el,
            styles: { ...selectedElement.styles },
          };
        }
        if (el.children) {
          return {
            ...el,
            children: updateStylesRecursively(el.children),
          };
        }
        return el;
      });

    const updatedElements = updateStylesRecursively(droppedElements);
    setDroppedElements(updatedElements);
  };

  const applyGlobalStyles = (selectedStyleName) => {
    console.log("selectedStyleName:", selectedStyleName);
    console.log("droppedElements:", droppedElements);

    if (!selectedStyleName) {
      console.error("Selecciona un estilo global antes de aplicarlo.");
      return;
    }

    // Verificar si droppedElements está vacío
    if (!Array.isArray(droppedElements) || droppedElements.length === 0) {
      console.error("droppedElements no es un array válido o está vacío.");
      return;
    }

    // Busca el estilo global seleccionado
    const selectedStyle = gs.find((style) => style.name === selectedStyleName);

    if (!selectedStyle) {
      console.error(
        `El estilo global con nombre ${selectedStyleName} no existe.`
      );
      return;
    }

    // Filtramos los estilos vacíos del estilo global
    const cleanStyles = (styles) => {
      return Object.fromEntries(
        Object.entries(styles || {}).filter(
          ([key, val]) => val !== "" && val !== null && val !== undefined
        )
      );
    };

    const cleanedGlobalStyles = cleanStyles(selectedStyle.styles);
    console.log("Estilos Globales Limpiados:", cleanedGlobalStyles);

    const updateStylesRecursively = (elements) =>
      elements.map((el) => {
        if (el.id === selectedElement.id) {
          let newStyles = { ...el.styles };

          for (const [styleName, value] of Object.entries(
            cleanedGlobalStyles
          )) {
            if (value === "" || value === null || value === undefined) continue;

            if (styleName === "margin") {
              newStyles.margin = value;
              delete newStyles.marginTop;
              delete newStyles.marginBottom;
              delete newStyles.marginLeft;
              delete newStyles.marginRight;
            } else if (styleName === "padding") {
              newStyles.padding = value;
              delete newStyles.paddingTop;
              delete newStyles.paddingBottom;
              delete newStyles.paddingLeft;
              delete newStyles.paddingRight;
            } else if (styleName === "borderRadius") {
              newStyles.borderRadius = value;
              delete newStyles.borderTopLeftRadius;
              delete newStyles.borderTopRightRadius;
              delete newStyles.borderBottomLeftRadius;
              delete newStyles.borderBottomRightRadius;
            } else if (styleName === "background") {
              newStyles.background = value;
              delete newStyles.backgroundColor;
            } else {
              newStyles[styleName] = value;
            }
          }

          return {
            ...el,
            styles: newStyles,
          };
        }

        // Aplicar recursivamente si tiene hijos
        if (el.children) {
          return {
            ...el,
            children: updateStylesRecursively(el.children),
          };
        }

        return el;
      });

    const updatedElements = updateStylesRecursively(droppedElements);

    // Actualizamos el estado con los nuevos elementos
    setDroppedElements(updatedElements);

    // También actualizamos el estado del elemento seleccionado
    setSelectedElement({
      ...selectedElement,
      styles: {
        ...selectedElement.styles, // Mantenemos los estilos actuales del elemento
        ...cleanedGlobalStyles, // Aplicamos solo los estilos válidos
      },
    });
  };

  useEffect(() => {
    if (!selectedElement || !selectedElement.iconClass) return;

    // Verificamos si el estilo existe en gs
    const styleExists = gs.some(
      (style) => style.name === selectedElement.iconClass
    );

    console.log(
      "🟠 ¿El estilo existe después de handleClassChange?",
      styleExists
    );

    if (!styleExists) {
      console.warn(
        `⚠️ El estilo global con nombre "${selectedElement.iconClass}" no existe después de la actualización.`
      );
      return;
    }

    // Aplicamos los estilos globales (reemplaza applyGlobalStyles con la lógica que necesites)
    applyGlobalStyles(selectedElement.iconClass);
  }, [selectedElement?.iconClass, gs]); // Dependemos de selectedElement.iconClass y gs

  // Sincronizar `selectedElement` si su ID cambia
  useEffect(() => {
    if (!selectedElement || String(selectedElement.id) !== String(targetId)) {
      const newSelectedElement = droppedElements.find(
        (e) => String(e.id) === String(targetId)
      );
      if (newSelectedElement) {
        setSelectedElement({ ...newSelectedElement });
      }
    }
  }, [droppedElements, targetId]); // Se ejecuta cuando `droppedElements` o `targetId` cambian

  const handlePageSelect = (event) => {
    setSelectedPage(event.target.value);
  };

  // Cargar imágenes existentes desde el backend
  const fetchImages = async () => {
    try {
      const response = await axios.get(`${url}/imagesuploaded/${prid}`);
      setUploadedImages(response.data.images); // Suponiendo que devuelve un array de rutas
    } catch (error) {
      console.error("Error al cargar imágenes:", error);
    }
  };

  useEffect(() => {
    fetchImages(); // Llamar cuando el componente se monte
  }, []);

  const getRowCount = (value) => {
    if (!value) return ""; // si es undefined, null o vacío
    const match = value.match(/repeat\((\d+),\s*1fr\)/);
    return match ? match[1] : "";
  };

  if (!project || !project.pages) {
    return <p>Loading...</p>; // Mostrar mensaje de carga mientras se obtienen los datos
  }

  if (!selectedElement) {
    return (
      <div className="w-full h-full col-span-1 bg-[#2B2B44] p-4">
        <h2 className="text-[#F5F5F5] text-xl font-medium">Propiedades</h2>
        {/* Select dropdown for pages */}
        <h3 className="text-[#F5F5F5] text-base font-medium mt-3">Página</h3>
        <select
          className="w-full h-8 rounded border mt-4 border-[#828282] bg-transparent text-[#E0E0E0] pl-2 outline-none"
          value={selectedPage}
          onChange={handlePageSelect}
        >
          {project.pages.map((page, i) => (
            <option key={i} value={page.name}>
              {page.name}
            </option>
          ))}
        </select>
        <p className="text-white mt-4">
          Selecciona un elemento para editar sus propiedades.
        </p>
      </div>
    );
  }

  const renderOptions = (elements) => {
    return elements.flatMap((el) => [
      <option key={el.id} value={String(el.id)}>
        {el.name} - {el.text}
      </option>,
      ...(el.children ? renderOptions(el.children) : []),
    ]);
  };

  document.addEventListener("click", (event) => {
    const target = event.target;

    if (target.tagName === "A" && isEditing(target)) {
      event.preventDefault();
    }
  });

  const isEditing = (element) => {
    // Verifica si el elemento está seleccionado en tu panel derecho
    return selectedElement?.id === element.getAttribute("id");
  };

  return (
    <div className="w-full h-full col-span-1 bg-[#2B2B44] p-1.5 lg:p-4 no-scroll overflow-y-auto scrollbar-hide">
      <h2 className="text-[#F5F5F5] text-xl font-medium">Propiedades</h2>
      <h3 className="text-[#BDBDBD] text-lg font-medium mt-4">
        Id: {selectedElement.id}
      </h3>
      <div className="w-full h-auto flex flex-col gap-3 mt-5">
        <h3 className="text-[#F5F5F5] text-base font-medium">Página</h3>
        <select
          className="w-full h-8 rounded border mt-2 border-[#828282] bg-transparent text-[#E0E0E0] pl-2 outline-none"
          value={selectedPage}
          onChange={handlePageSelect}
        >
          {project.pages.map((page, i) => (
            <option key={i} value={page.name}>
              {page.name}
            </option>
          ))}
        </select>

        {selectedElement && (
          <>
            {selectedElement.placeholder && (
              <div className="mt-3 flex flex-col gap-2">
                <h3 className="text-sm text-[#BDBDBD] font-semibold">
                  Placeholder
                </h3>
                <input
                  className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] pl-2"
                  value={selectedElement.placeholder}
                  onChange={(e) => handlePlaceholderChange(e.target.value)}
                />
              </div>
            )}
            {selectedElement.iconClass && selectedElement.name === "Icon" && (
              <div className="mt-3 flex flex-col gap-2">
                <h3 className="text-sm text-[#BDBDBD] font-semibold">
                  Icono ID
                </h3>
                <input
                  className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] pl-2"
                  value={selectedElement.iconClass}
                  onChange={(e) => handleClassChange(e.target.value)}
                />
              </div>
            )}
            {selectedElement.value && (
              <div className="mt-3 flex flex-col gap-2">
                <h3 className="text-sm text-[#BDBDBD] font-semibold">Valor</h3>
                <input
                  className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] pl-2"
                  value={selectedElement.value}
                  onChange={(e) => handleValOptChange(e.target.value)}
                />
              </div>
            )}
            {selectedElement.href && (
              <div className="mt-3 flex flex-col gap-2">
                <h3 className="text-sm text-[#BDBDBD] font-semibold">Ir a</h3>
                <input
                  className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] pl-2"
                  value={selectedElement.href}
                  onChange={(e) => handleHrefChange(e.target.value)}
                />
              </div>
            )}
            {selectedElement.type && (
              <div className="w-full">
                <h3 className="text-sm text-[#BDBDBD] font-semibold">
                  Tipo de Input
                </h3>
                <select
                  className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] pl-2 outline-none mt-2"
                  value={selectedElement.type}
                  onChange={(e) => handleTypeInputChange(e.target.value)}
                >
                  <option value="text">Texto</option>
                  <option value="text">Número</option>
                  <option value="password">Contraseña</option>
                  <option value="email">Correo</option>
                  <option value="date">Fecha</option>
                  <option value="time">Hora</option>
                  <option value="checkbox">Casilla</option>
                  <option value="radio">Opcion</option>
                  <option value="range">Rango</option>
                  <option value="file">Archivo</option>
                  <option value="color">Color</option>
                  <option value="submit">Subir</option>
                </select>
              </div>
            )}
            {selectedElement && (
              <div className="w-full">
                <h3 className="text-sm text-[#BDBDBD] font-semibold">
                  Tipo de Animación
                </h3>
                <select
                  className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] pl-2 outline-none mt-2"
                  value={selectedElement.animation}
                  onChange={(e) => handleAnimationChange(e.target.value)}
                >
                  <option value="">Ninguna</option>
                  <option value="fade">Desvanece el elemento</option>
                  <option value="fade-up">Aparece desde abajo</option>
                  <option value="fade-down">Aparece desde arriba</option>
                  <option value="fade-left">Aparece desde la izquierda</option>
                  <option value="fade-right">Aparece desde la derecha</option>
                  <option value="fade-up-right">
                    Aparece desde abajo a la derecha
                  </option>
                  <option value="fade-up-left">
                    Aparece desde abajo a la izquierda
                  </option>
                  <option value="fade-down-right">
                    Aparece desde arriba a la derecha
                  </option>
                  <option value="fade-down-left">
                    Aparece desde arriba a la izquierda
                  </option>
                  <option value="flip-up">Gira hacia arriba</option>
                  <option value="flip-down">Gira hacia abajo</option>
                  <option value="flip-left">Gira hacia la izquierda</option>
                  <option value="flip-right">Gira hacia la derecha</option>
                  <option value="slide-up">Desliza desde abajo</option>
                  <option value="slide-down">Desliza desde arriba</option>
                  <option value="slide-left">Desliza desde la izquierda</option>
                  <option value="slide-right">Desliza desde la derecha</option>
                  <option value="zoom-in">Zoom hacia adentro</option>
                  <option value="zoom-in-up">Zoom + aparece desde abajo</option>
                  <option value="zoom-in-down">
                    Zoom + aparece desde arriba
                  </option>
                  <option value="zoom-in-left">
                    Zoom + aparece desde la izquierda
                  </option>
                  <option value="zoom-in-right">
                    Zoom + aparece desde la derecha
                  </option>
                  <option value="zoom-out">Zoom hacia afuera</option>
                  <option value="zoom-out-up">
                    Zoom + se aleja hacia arriba
                  </option>
                  <option value="zoom-out-down">
                    Zoom + se aleja hacia abajo
                  </option>
                  <option value="zoom-out-left">
                    Zoom + se aleja hacia la izquierda
                  </option>
                  <option value="zoom-out-right">
                    Zoom + se aleja hacia la derecha
                  </option>
                </select>
              </div>
            )}
            {selectedElement.animation && (
              <div className="mt-3 flex flex-col gap-2">
                <h3 className="text-sm text-[#BDBDBD] font-semibold">
                  Duración de la animación
                </h3>
                <input
                  className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] pl-2"
                  value={selectedElement.duracionanim}
                  onChange={(e) => handleDurAnimationChange(e.target.value)}
                />
              </div>
            )}
            {selectedElement.animation && (
              <div className="mt-3 flex flex-col gap-2">
                <h3 className="text-sm text-[#BDBDBD] font-semibold">
                  Retraso de la animación
                </h3>
                <input
                  className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] pl-2"
                  value={selectedElement.retrasoanim}
                  onChange={(e) => handleRetAnimationChange(e.target.value)}
                />
              </div>
            )}
            {selectedElement.src && (
              <div className="w-full">
                <h3 className="text-sm text-[#BDBDBD] font-semibold">Imagen</h3>
                <select
                  className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] pl-2 outline-none mt-2"
                  value={selectedElement.src}
                  onChange={(e) => handleSrcImgChange(e.target.value)}
                >
                  {uploadedImages.map((image, index) => {
                    if (typeof image !== "string") return null; // Evita errores si no es un string
                    const imageName = image.split("/").pop(); // Obtiene '1739066926893.png'
                    return (
                      <option key={index} value={`${url}${image}`}>
                        {imageName}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div className="w-full h-auto gap-3 border border-l-0 border-r-0 border-b-0 pt-3 border-[#4F4F4F]">
              <h3
                className="text-[#ffffff] text-sm font-medium mt-1"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Tipografía
              </h3>
            </div>

            <div className="w-full h-auto grid grid-cols-2 grid-rows-4 gap-2 ">
              <div className="mt-2 flex flex-col gap-2 col-span-2">
                <select
                  className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] pl-2 outline-none"
                  value={selectedElement.styles.fontFamily}
                  onChange={(e) =>
                    handleStyleChange("fontFamily", e.target.value)
                  }
                >
                  <option value="Oswald, serif">Oswald</option>
                  <option value="Space Mono, serif">Space Mono</option>
                  <option value="Poppins, serif">Poppins</option>
                  <option value="Roboto, serif">Roboto</option>
                  <option value="Inter, serif">Inter</option>
                  <option value="Open Sans, serif">Open Sans</option>
                </select>
              </div>
              <div className="mt-2 flex flex-col gap-2 row-start-2">
                <select
                  className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] pl-2 outline-none"
                  value={selectedElement.styles.fontWeight}
                  onChange={(e) =>
                    handleStyleChange("fontWeight", e.target.value)
                  }
                >
                  <option value="100">Light</option>
                  <option value="200">Regular</option>
                  <option value="400">Retina</option>
                  <option value="500">Medium</option>
                  <option value="600">Semibold</option>
                  <option value="800">Bold</option>
                </select>
              </div>
              <div className="mt-2 flex flex-col gap-2 row-start-2 bg-[#555555]">
                <input
                  className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] pl-2 outline-none"
                  value={selectedElement.styles.fontSize}
                  onChange={(e) =>
                    handleStyleChange("fontSize", e.target.value)
                  }
                />
              </div>
              <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] col-span-2 mt-2">
                <RxText className="text-base text-[#BDBDBD]" />
                <input
                  className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                  value={selectedElement.text}
                  onChange={(e) => handleTextChange(e.target.value)}
                />
              </div>
              <div className="mt-2 grid row-start-4 grid-cols-3 h-8 bg-[#555555] rounded-md">
                <div
                  className={`h-8 flex items-center justify-center rounded-md cursor-pointer ${
                    selectedElement.styles.textAlign === "left"
                      ? "bg-[#2C2C2C] border-[2px] border-[#444444]"
                      : ""
                  }`}
                  onClick={() => handleStyleChange("textAlign", "left")}
                >
                  <LuAlignLeft className="text-xl text-[#C3C3C3]" />
                </div>
                <div
                  className={`h-8 flex items-center justify-center rounded-md cursor-pointer ${
                    selectedElement.styles.textAlign === "center"
                      ? "bg-[#2C2C2C] border-[2px] border-[#444444]"
                      : ""
                  }`}
                  onClick={() => handleStyleChange("textAlign", "center")}
                >
                  <LuAlignJustify className="text-xl text-[#C3C3C3]" />
                </div>
                <div
                  className={`h-8 flex items-center justify-center rounded-md cursor-pointer ${
                    selectedElement.styles.textAlign === "right"
                      ? "bg-[#2C2C2C] border-[2px] border-[#444444]"
                      : ""
                  }`}
                  onClick={() => handleStyleChange("textAlign", "right")}
                >
                  <LuAlignRight className="text-xl text-[#C3C3C3]" />
                </div>
              </div>
              <div className="gap-2 col-span-2 row-start-5 h-8">
                <input
                  type="color"
                  className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] outline-none"
                  value={selectedElement.styles.color}
                  onChange={(e) => handleStyleChange("color", e.target.value)}
                />
              </div>
            </div>

            <div className="w-full h-auto gap-3 border border-l-0 border-r-0 border-b-0 pt-3 border-[#4F4F4F]">
              <h3
                className="text-[#ffffff] text-sm font-medium mt-1"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Disposición
              </h3>
            </div>

            <div
              className={`w-full h-auto grid grid-cols-2 gap-2
              ${
                selectedElement.styles.display === "grid"
                  ? "grid-rows-5"
                  : "grid-rows-4"
              }
            `}
            >
              <div className="mt-2 flex flex-col gap-2 col-span-2">
                <select
                  className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] pl-2 outline-none"
                  value={selectedElement.styles.display}
                  onChange={(e) => handleStyleChange("display", e.target.value)}
                >
                  <option value="block">Bloque</option>
                  <option value="inline-block">Enlinea-Bloque</option>
                  <option value="flex">Flexible</option>
                  <option value="list-item">Elemento de Lista</option>
                  <option value="grid">Grilla</option>
                  <option value="none">Esconder</option>
                </select>
              </div>
              <div className="mt-2 grid row-start-2 grid-cols-3 h-8 bg-[#555555] rounded-md">
                <div
                  className={`h-8 flex items-center justify-center rounded-md cursor-pointer ${
                    selectedElement.styles.alignItems === "start"
                      ? "bg-[#2C2C2C] border-[2px] border-[#444444]"
                      : ""
                  }`}
                  onClick={() => handleStyleChange("alignItems", "start")}
                >
                  <LuAlignStartHorizontal className="text-xl text-[#C3C3C3]" />
                </div>
                <div
                  className={`h-8 flex items-center justify-center rounded-md cursor-pointer ${
                    selectedElement.styles.alignItems === "center"
                      ? "bg-[#2C2C2C] border-[2px] border-[#444444]"
                      : ""
                  }`}
                  onClick={() => handleStyleChange("alignItems", "center")}
                >
                  <LuAlignCenterHorizontal className="text-xl text-[#C3C3C3]" />
                </div>
                <div
                  className={`h-8 flex items-center justify-center rounded-md cursor-pointer ${
                    selectedElement.styles.alignItems === "end"
                      ? "bg-[#2C2C2C] border-[2px] border-[#444444]"
                      : ""
                  }`}
                  onClick={() => handleStyleChange("alignItems", "end")}
                >
                  <LuAlignEndHorizontal className="text-xl text-[#C3C3C3]" />
                </div>
              </div>
              <div className="mt-2 grid row-start-2 grid-cols-3 h-8 bg-[#555555] rounded-md">
                <div
                  className={`h-8 flex items-center justify-center rounded-md cursor-pointer ${
                    selectedElement.styles.justifyContent === "start"
                      ? "bg-[#2C2C2C] border-[2px] border-[#444444]"
                      : ""
                  }`}
                  onClick={() => handleStyleChange("justifyContent", "start")}
                >
                  <LuAlignStartVertical className="text-xl text-[#C3C3C3]" />
                </div>
                <div
                  className={`h-8 flex items-center justify-center rounded-md cursor-pointer ${
                    selectedElement.styles.justifyContent === "center"
                      ? "bg-[#2C2C2C] border-[2px] border-[#444444]"
                      : ""
                  }`}
                  onClick={() => handleStyleChange("justifyContent", "center")}
                >
                  <LuAlignCenterVertical className="text-xl text-[#C3C3C3]" />
                </div>
                <div
                  className={`h-8 flex items-center justify-center rounded-md cursor-pointer ${
                    selectedElement.styles.justifyContent === "end"
                      ? "bg-[#2C2C2C] border-[2px] border-[#444444]"
                      : ""
                  }`}
                  onClick={() => handleStyleChange("justifyContent", "end")}
                >
                  <LuAlignEndVertical className="text-xl text-[#C3C3C3]" />
                </div>
              </div>
              <div className="mt-2 grid row-start-3 grid-cols-3 h-8 bg-[#555555] rounded-md">
                <div
                  className={`h-8 flex items-center justify-center rounded-md cursor-pointer ${
                    selectedElement.styles.justifyContent === "space-around"
                      ? "bg-[#2C2C2C] border-[2px] border-[#444444]"
                      : ""
                  }`}
                  onClick={() =>
                    handleStyleChange("justifyContent", "space-around")
                  }
                >
                  <LuAlignHorizontalSpaceAround className="text-xl text-[#C3C3C3]" />
                </div>
                <div className="h-8 flex items-center justify-center rounded-md cursor-pointer">
                  <RxSpaceEvenlyHorizontally className="text-xl text-[#C3C3C3]" />
                </div>
                <div
                  className={`h-8 flex items-center justify-center rounded-md cursor-pointer ${
                    selectedElement.styles.justifyContent === "space-between"
                      ? "bg-[#2C2C2C] border-[2px] border-[#444444]"
                      : ""
                  }`}
                  onClick={() =>
                    handleStyleChange("justifyContent", "space-between")
                  }
                >
                  <LuAlignHorizontalSpaceBetween className="text-xl text-[#C3C3C3]" />
                </div>
              </div>
              <div className="mt-2 row-start-3">
                {selectedElement.styles.display === "flex" && (
                  <select
                    className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] text-base pl-2 outline-none"
                    value={selectedElement.styles.flexDirection}
                    onChange={(e) =>
                      handleStyleChange("flexDirection", e.target.value)
                    }
                  >
                    <option value="">Dirección</option>
                    <option value="row">Fila</option>
                    <option value="column">Columna</option>
                    <option value="column-reverse">Columna invertida</option>
                    <option value="row-reverse">Fila invertida</option>
                  </select>
                )}
              </div>
              <div
                className={`mt-2 row-start-4 text-sm gap-2 text-[#C3C3C3] h-8 flex items-center justify-center rounded-md col-span-2 cursor-pointer bg-[#555555] ${
                  selectedElement.styles.overflow === "hidden"
                    ? "bg-[#2C2C2C] border-[2px] border-[#444444]"
                    : ""
                }`}
                onClick={() => handleStyleChange("overflow", "hidden")}
              >
                <BiSolidHide className="text-xl text-[#C3C3C3]" />
                Ocultar elementos si se salen
              </div>
              {selectedElement.styles.display === "grid" && (
                <>
                  <div className="mt-2 flex flex-col gap-2 row-start-5 bg-[#555555]">
                    <input
                      className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] pl-2 outline-none"
                      value={getRowCount(
                        selectedElement.styles.gridTemplateColumns
                      )}
                      placeholder="Columnas"
                      onChange={(e) =>
                        handleStyleChange(
                          "gridTemplateColumns",
                          `repeat(${e.target.value}, 1fr)`
                        )
                      }
                    />
                  </div>
                  <div className="mt-2 flex flex-col gap-2 row-start-5 bg-[#555555]">
                    <input
                      className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] pl-2 outline-none"
                      value={getRowCount(
                        selectedElement.styles.gridTemplateRows
                      )}
                      placeholder="Filas"
                      onChange={(e) =>
                        handleStyleChange(
                          "gridTemplateRows",
                          `repeat(${e.target.value}, 1fr)`
                        )
                      }
                    />
                  </div>
                </>
              )}
            </div>

            <div className="w-full h-auto gap-3 border border-l-0 border-r-0 border-b-0 pt-3 border-[#4F4F4F]">
              <h3
                className="text-[#ffffff] text-sm font-medium mt-1"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Relleno
              </h3>
            </div>
            {/*
            <div className="w-full h-8">
              <input
                type="color"
                className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] outline-none"
                value={selectedElement.styles.background}
                onChange={(e) =>
                  handleStyleChange("background", e.target.value)
                }
              />
            </div>
            <div className="w-full h-auto">
              <GradientEditor onChange={handleGradientChange} />
            </div>
            */}
            <div className="w-full h-auto">
              <FullColorPicker
                onChange={handleGradientChange}
                value={selectedElement.styles.background}
              />
            </div>
            <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] col-span-2 mt-2">
              <CgDropOpacity className="text-base text-[#BDBDBD]" />
              <input
                className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                value={selectedElement.backgroundOpacity}
                onChange={(e) =>
                  handleStyleChange("backgroundOpacity", e.target.value)
                }
              />
            </div>
            <div className="mt-2 flex flex-col gap-2 col-span-2">
              <select
                className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] pl-2 outline-none"
                value={selectedElement?.styles?.backdropFilter || ""}
                onChange={(e) =>
                  handleStyleChange("backdropFilter", e.target.value)
                }
              >
                <option value="">Blur (Ninguno)</option>
                <option value="blur(4px)">Pequeño</option>
                <option value="blur(8px)">Poco</option>
                <option value="blur(12px)">Mediano</option>
                <option value="blur(24px)">Grande</option>
              </select>
            </div>

            <div className="w-full h-auto gap-3 border border-l-0 border-r-0 border-b-0 pt-3 border-[#4F4F4F]">
              <h3
                className="text-[#ffffff] text-sm font-medium mt-1"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Tamaños
              </h3>
            </div>

            <div className="w-full h-auto grid grid-cols-2 gap-3">
              <div className="gap-2 border border-[#555555] flex items-center h-10 rounded px-2 bg-[#555555]">
                <h3 className="text-sm text-[#BDBDBD] font-semibold">W</h3>
                <input
                  className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                  value={selectedElement.styles.width}
                  onChange={(e) => handleStyleChange("width", e.target.value)}
                />
              </div>
              <div className="gap-2 border border-[#555555] flex items-center h-10 rounded px-2 bg-[#555555]">
                <h3 className="text-sm text-[#BDBDBD] font-semibold">H</h3>
                <input
                  className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                  value={selectedElement.styles.height}
                  onChange={(e) => handleStyleChange("height", e.target.value)}
                />
              </div>
              <div className="gap-2 border border-[#555555] flex items-center h-10 rounded px-2 bg-[#555555]">
                <h3 className="text-sm text-[#BDBDBD] font-semibold">MXW</h3>
                <input
                  className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                  value={selectedElement.styles.maxWidth}
                  onChange={(e) =>
                    handleStyleChange("maxWidth", e.target.value)
                  }
                />
              </div>
              <div className="gap-2 border border-[#555555] flex items-center h-10 rounded px-2 bg-[#555555]">
                <h3 className="text-sm text-[#BDBDBD] font-semibold">MXH</h3>
                <input
                  className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                  value={selectedElement.styles.maxHeight}
                  onChange={(e) =>
                    handleStyleChange("maxHeight", e.target.value)
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-sm text-[#BDBDBD] font-semibold">Gap</h3>
                <input
                  className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] pl-2"
                  value={selectedElement.styles.gap || ""}
                  onChange={(e) => handleStyleChange("gap", e.target.value)}
                />
              </div>
            </div>

            <div className="w-full h-auto gap-3 border border-l-0 border-r-0 border-b-0 pt-3 border-[#4F4F4F]">
              <h3
                className="text-[#ffffff] text-sm font-medium mt-1"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Posición
              </h3>
            </div>

            <div
              className={`w-full h-auto grid grid-cols-2 ${
                selectedElement.styles.position === "absolute"
                  ? "grid-rows-5"
                  : "grid-rows-1"
              }  gap-2`}
            >
              <div className="flex flex-col col-span-2">
                <select
                  className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] pl-2 outline-none"
                  value={selectedElement.styles.position}
                  onChange={(e) =>
                    handleStyleChange("position", e.target.value)
                  }
                >
                  <option value="">Ninguna</option>
                  <option value="static">Estatica</option>
                  <option value="absolute">Absoluta</option>
                  <option value="relative">Relativa</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>
              {selectedElement.styles.position === "absolute" ||
                (selectedElement.styles.position === "fixed" && (
                  <>
                    <div className="w-full grid grid-cols-2 gap-2 col-span-2 row-start-2 h-8">
                      <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] mt-2">
                        <MdBorderTop className="text-xl text-[#BDBDBD]" />
                        <input
                          className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                          value={selectedElement.styles.top}
                          onChange={(e) =>
                            handleStyleChange("top", e.target.value)
                          }
                        />
                      </div>
                      <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] mt-2">
                        <MdOutlineBorderBottom className="text-xl text-[#BDBDBD]" />
                        <input
                          className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                          value={selectedElement.styles.bottom}
                          onChange={(e) =>
                            handleStyleChange("bottom", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="w-full grid grid-cols-2 gap-2 col-span-2 row-start-3 h-8">
                      <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] mt-2">
                        <MdBorderLeft className="text-xl text-[#BDBDBD]" />
                        <input
                          className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                          value={selectedElement.styles.left}
                          onChange={(e) =>
                            handleStyleChange("left", e.target.value)
                          }
                        />
                      </div>
                      <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] mt-2">
                        <MdBorderRight className="text-xl text-[#BDBDBD]" />
                        <input
                          className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                          value={selectedElement.styles.right}
                          onChange={(e) =>
                            handleStyleChange("right", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] mt-2 col-span-2 row-start-4">
                      <BiLayer className="text-xl text-[#BDBDBD]" />
                      <input
                        className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                        value={selectedElement?.styles?.zIndex || ""}
                        placeholder="Capa"
                        onChange={(e) => {
                          handleStyleChange("zIndex", e.target.value);
                        }}
                      />
                    </div>
                    <div
                      className={`mt-2 text-base gap-2 text-[#C3C3C3] h-8 flex items-center justify-center rounded-md col-span-2 row-start-5 cursor-pointer bg-[#555555] ${
                        selectedElement.styles.transform ===
                        "translate(-50%, -50%)"
                          ? "bg-[#2C2C2C] border-[2px] border-[#444444]"
                          : ""
                      }`}
                      onClick={() =>
                        handleStyleChange("transform", "translate(-50%, -50%)")
                      }
                    >
                      <LuAlignCenterVertical className="text-xl text-[#C3C3C3]" />{" "}
                      Centrar
                    </div>
                  </>
                ))}
            </div>

            <div className="w-full h-auto gap-3 border border-l-0 border-r-0 border-b-0 pt-3 border-[#4F4F4F]">
              <h3
                className="text-[#ffffff] text-sm font-medium mt-1"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Margenes
              </h3>
            </div>

            <div className="w-full h-auto grid grid-cols-2 grid-rows-3 gap-2">
              <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] mt-2 col-span-2">
                <RxBoxModel className="text-xl text-[#BDBDBD]" />
                <input
                  className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                  value={selectedElement?.styles?.margin || ""}
                  placeholder="Margen global"
                  onChange={(e) => {
                    handleStyleChange("margin", e.target.value);
                  }}
                />
              </div>
              <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] mt-2">
                <TbBoxAlignTopFilled className="text-xl text-[#BDBDBD]" />
                <input
                  className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                  value={selectedElement.styles.marginTop}
                  onChange={(e) => {
                    handleStyleChange("marginTop", e.target.value);
                  }}
                />
              </div>
              <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] mt-2">
                <TbBoxAlignBottomFilled className="text-xl text-[#BDBDBD]" />
                <input
                  className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                  value={selectedElement.styles.marginBottom}
                  onChange={(e) => {
                    handleStyleChange("marginBottom", e.target.value);
                  }}
                />
              </div>
              <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] mt-2">
                <TbBoxAlignLeftFilled className="text-xl text-[#BDBDBD]" />
                <input
                  className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                  value={selectedElement.styles.marginLeft}
                  onChange={(e) => {
                    handleStyleChange("marginLeft", e.target.value);
                  }}
                />
              </div>
              <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] mt-2">
                <TbBoxAlignRightFilled className="text-xl text-[#BDBDBD]" />
                <input
                  className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                  value={selectedElement.styles.marginRight}
                  onChange={(e) => {
                    handleStyleChange("marginRight", e.target.value);
                  }}
                />
              </div>
            </div>

            <div className="w-full h-auto gap-3 border border-l-0 border-r-0 border-b-0 pt-3 border-[#4F4F4F]">
              <h3
                className="text-[#ffffff] text-sm font-medium mt-1"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Paddings
              </h3>
            </div>
            <div className="w-full h-auto grid grid-cols-2 grid-rows-3 gap-2">
              <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] mt-2 col-span-2">
                <RxBoxModel className="text-xl text-[#BDBDBD]" />
                <input
                  className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                  value={selectedElement?.styles?.padding || ""}
                  placeholder="Padding global"
                  onChange={(e) => {
                    handleStyleChange("padding", e.target.value);
                  }}
                />
              </div>
              <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] mt-2">
                <TbBoxAlignTopFilled className="text-xl text-[#BDBDBD]" />
                <input
                  className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                  value={selectedElement.styles.paddingTop}
                  onChange={(e) =>
                    handleStyleChange("paddingTop", e.target.value)
                  }
                />
              </div>
              <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] mt-2">
                <TbBoxAlignBottomFilled className="text-xl text-[#BDBDBD]" />
                <input
                  className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                  value={selectedElement.styles.paddingBottom}
                  onChange={(e) =>
                    handleStyleChange("paddingBottom", e.target.value)
                  }
                />
              </div>
              <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] mt-2">
                <TbBoxAlignLeftFilled className="text-xl text-[#BDBDBD]" />
                <input
                  className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                  value={selectedElement.styles.paddingLeft}
                  onChange={(e) =>
                    handleStyleChange("paddingLeft", e.target.value)
                  }
                />
              </div>
              <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] mt-2">
                <TbBoxAlignRightFilled className="text-xl text-[#BDBDBD]" />
                <input
                  className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                  value={selectedElement.styles.paddingRight}
                  onChange={(e) =>
                    handleStyleChange("paddingRight", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="w-full h-auto gap-3 border border-l-0 border-r-0 border-b-0 pt-3 border-[#4F4F4F]">
              <h3
                className="text-[#ffffff] text-sm font-medium mt-1"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Bordes
              </h3>
            </div>
            <div className="w-full h-auto grid grid-cols-2 grid-rows-7 gap-2 ">
              <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] mt-2 col-span-2">
                <RxBorderWidth className="text-xl text-[#BDBDBD]" />
                <input
                  type="text"
                  className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                  value={selectedElement.styles.borderWidth}
                  onChange={(e) =>
                    handleStyleChange("borderWidth", e.target.value)
                  }
                />
              </div>
              <div className="gap-2 h-8 rounded mt-2 col-span-2 row-start-2">
                <input
                  type="color"
                  className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] outline-none"
                  value={selectedElement.styles.borderColor}
                  onChange={(e) =>
                    handleStyleChange("borderColor", e.target.value)
                  }
                />
              </div>
              <div className="mt-2 flex flex-col gap-2 col-span-2 h-8 row-start-3">
                <select
                  className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] pl-2 outline-none"
                  value={selectedElement.styles.borderStyle}
                  onChange={(e) =>
                    handleStyleChange("borderStyle", e.target.value)
                  }
                >
                  <option value="solid">Sólida</option>
                  <option value="dashed">Rayas</option>
                  <option value="dotted">Puntos</option>
                  <option value="none">Ninguno</option>
                </select>
              </div>
              <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 row-start-4 bg-[#555555] mt-2 col-span-2">
                <RxBoxModel className="text-xl text-[#BDBDBD]" />
                <input
                  className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                  value={selectedElement?.styles?.borderRadius || ""}
                  placeholder="Borde redondo global"
                  onChange={(e) => {
                    handleStyleChange("borderRadius", e.target.value);
                  }}
                />
              </div>
              <div className="w-full grid grid-cols-2 gap-2 col-span-2 row-start-5 h-8">
                <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] mt-2">
                  <TbBoxAlignTopLeftFilled className="text-xl text-[#BDBDBD]" />
                  <input
                    className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                    value={selectedElement.styles.borderTopLeftRadius}
                    onChange={(e) =>
                      handleStyleChange("borderTopLeftRadius", e.target.value)
                    }
                  />
                </div>
                <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] mt-2">
                  <TbBoxAlignTopRightFilled className="text-xl text-[#BDBDBD]" />
                  <input
                    className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                    value={selectedElement.styles.borderTopRightRadius}
                    onChange={(e) =>
                      handleStyleChange("borderTopRightRadius", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="w-full grid grid-cols-2 gap-2 col-span-2 row-start-6 h-8">
                <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] mt-2">
                  <TbBoxAlignBottomLeftFilled className="text-xl text-[#BDBDBD]" />
                  <input
                    className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                    value={selectedElement.styles.borderBottomLeftRadius}
                    onChange={(e) =>
                      handleStyleChange(
                        "borderBottomLeftRadius",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] mt-2">
                  <TbBoxAlignBottomRightFilled className="text-xl text-[#BDBDBD]" />
                  <input
                    className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                    value={selectedElement.styles.borderBottomRightRadius}
                    onChange={(e) =>
                      handleStyleChange(
                        "borderBottomRightRadius",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
              <div className="mt-2 flex flex-col gap-2 col-span-2 h-8 row-start-7">
                <select
                  className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] pl-2 outline-none"
                  value={selectedElement.styles.boxShadow}
                  onChange={(e) =>
                    handleStyleChange("boxShadow", e.target.value)
                  }
                >
                  <option value="">Sombra</option>
                  <option value="none">Ninguna</option>
                  <option value="0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)">
                    Sombra pequeña
                  </option>
                  <option value="0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)">
                    Sombra mediana
                  </option>
                  <option value="0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)">
                    Sombra grande
                  </option>
                  <option value="0 15px 25px rgba(0, 0, 0, 0.22), 0 10px 10px rgba(0, 0, 0, 0.2)">
                    Sombra extra-grande
                  </option>
                </select>
              </div>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Herramientas</AccordionTrigger>
                <AccordionContent>
                  <div className="w-full h-auto gap-3 border border-l-0 border-r-0 border-t-0 pb-3 border-[#4F4F4F]">
                    <h3
                      className="text-[#ffffff] text-sm font-medium mt-3"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      Copiar estilos
                    </h3>
                  </div>
                  <div className="w-full h-auto">
                    <h3
                      className="text-[#ffffff] text-sm font-medium mt-1"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      Copiar estilos de
                    </h3>
                    <select
                      value={selectedId || ""}
                      onChange={(e) => {
                        const sId = e.target.value || ""; // Si es undefined, poner ""
                        console.log("Selected ID:", sId);
                        setSelectedId(sId);
                      }}
                      className="text-[#E0E0E0] w-full h-8 rounded bg-[#555555] mt-2"
                    >
                      <option value="" disabled>
                        Selecciona un elemento
                      </option>
                      {Array.isArray(droppedElements)
                        ? renderOptions(droppedElements)
                        : null}
                    </select>

                    <h3
                      className="text-[#ffffff] text-sm font-medium mt-2"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      Aplicar estilos a
                    </h3>
                    <select
                      value={targetId || ""}
                      onChange={(e) => {
                        const tId = e.target.value || ""; // Si es undefined, poner ""
                        console.log("Target ID:", tId);
                        setTargetId(tId);
                      }}
                      className="text-[#E0E0E0] w-full h-8 rounded bg-[#555555] mt-2"
                    >
                      <option value="" disabled>
                        Selecciona un elemento
                      </option>
                      {Array.isArray(droppedElements)
                        ? renderOptions(droppedElements)
                        : null}
                    </select>

                    {/* Botón para aplicar estilos */}
                    <button
                      onClick={applyStyles}
                      className="w-full h-8 rounded text-[#E0E0E0] bg-[#555555] mt-3 flex items-center justify-center gap-2"
                    >
                      <MdOutlineStyle className="text-xl text-[#C3C3C3]" />
                      Aplicar Estilos
                    </button>
                  </div>
                  <div className="mt-2 flex flex-col gap-2 col-span-2 h-8 row-start-3">
                    <select
                      className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] pl-2 outline-none"
                      onChange={(e) => {
                        const selectedStyleName = e.target.value;
                        console.log(
                          "🟢 Nombre del estilo seleccionado:",
                          selectedStyleName
                        );

                        handleClassChange(selectedStyleName); // Actualizamos la clase en el estado

                        console.log(
                          "🔵 Lista de estilos después de handleClassChange:",
                          gs
                        );

                        // Verificamos si el estilo está en gs antes de intentar aplicarlo
                        const styleExists = gs.some(
                          (style) => style.name === selectedStyleName
                        );
                        console.log(
                          "🟠 ¿El estilo existe después de handleClassChange?",
                          styleExists
                        );

                        if (!styleExists) {
                          console.warn(
                            `⚠️ El estilo global con nombre "${selectedStyleName}" no existe después de la actualización.`
                          );
                          return;
                        }

                        // Aplicamos los estilos globales solo si existe el estilo
                        //applyGlobalStyles(selectedStyleName);
                      }}
                      value={selectedElement.iconClass || ""}
                    >
                      <option value="">Selecciona un estilo global</option>
                      {gs.map((style) => (
                        <option key={style.name} value={style.name}>
                          {style.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Estilos avanzados</AccordionTrigger>
                <AccordionContent>
                  <div className="mt-2 flex flex-col gap-2 col-span-2 h-8">
                    <select
                      className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] pl-2 outline-none"
                      value={selectedElement.styles.cursor}
                      onChange={(e) =>
                        handleStyleChange("cursor", e.target.value)
                      }
                    >
                      <option value="">Cursor</option>
                      <option value="pointer">Puntero</option>
                    </select>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Is it animated?</AccordionTrigger>
                <AccordionContent>
                  Yes. It's animated by default, but you can disable it if you
                  prefer.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        )}
      </div>
    </div>
  );
};

export default RightPanel;
