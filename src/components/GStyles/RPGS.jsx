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
import { Button } from "../ui/button";
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
} from "../ui/accordion";
import { BiSolidHide } from "react-icons/bi";
import useStore from "../../store/store";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import useElement from "../../store/useElement";
import FullColorPicker from "../FullColorPicker";
const RGS = ({ selectedGS, setSelectedGS, gs, setGs }) => {
  if (!selectedGS) {
    return (
      <div className="w-full h-full col-span-1 bg-[#2B2B44] p-4">
        <h2 className="text-[#F5F5F5] text-xl font-medium">Estilos Globales</h2>
        <p className="text-white mt-4">
          En este panel puedes cambiar los estilos globales de los elementos.
        </p>
      </div>
    );
  }

  const handleStyleChange = (styleName, value) => {
    const updateStylesRecursively = (elements) =>
      elements.map((el) => {
        if (el.name === selectedGS.name) {
          let newStyles = { ...el.styles };

          if (styleName === "margin") {
            newStyles = {
              ...newStyles,
              margin: value,
            };
            // Eliminamos las propiedades de margen individuales
            delete newStyles.marginTop;
            delete newStyles.marginBottom;
            delete newStyles.marginLeft;
            delete newStyles.marginRight;
          } else if (styleName === "padding") {
            newStyles = {
              ...newStyles,
              padding: value,
            };
            // Eliminamos las propiedades de padding individuales
            delete newStyles.paddingTop;
            delete newStyles.paddingBottom;
            delete newStyles.paddingLeft;
            delete newStyles.paddingRight;
          } else if (styleName === "borderRadius") {
            newStyles = {
              ...newStyles,
              borderRadius: value, // Establecemos el nuevo valor para "borderRadius"
            };
            // Eliminamos las propiedades de borderRadius individuales
            delete newStyles.borderTopLeftRadius;
            delete newStyles.borderTopRightRadius;
            delete newStyles.borderBottomLeftRadius;
            delete newStyles.borderBottomRightRadius;
          } else {
            // Para otros estilos, solo actualizamos el estilo correspondiente
            newStyles[styleName] = value;
          }

          return {
            ...el,
            styles: newStyles,
          };
        }
        return el;
      });
    // Actualizamos los elementos con los nuevos estilos
    const updatedElements = updateStylesRecursively(gs);

    // Actualizamos el estado global con los elementos modificados
    setGs(updatedElements);

    // Actualizamos también el estado del selectedElement
    setSelectedGS({
      ...selectedGS, // Copia las propiedades anteriores del selectedElement
      styles: {
        ...selectedGS.styles, // Mantén los estilos anteriores
        [styleName]: value, // Agrega o actualiza el estilo específico
      },
    });
  };

    const handleGradientChange = useCallback(
      (gradient) => {
        console.log(gradient);
        handleStyleChange("background", gradient);
      },
      [handleStyleChange]
    );

  const handleDeleteStyle = () => {
    if (selectedGS) {
      // Filtramos el array gs para eliminar el estilo de selectedGS
      const updatedGs = gs.filter((el) => el.name !== selectedGS.name);

      // Actualizamos el estado gs con el nuevo array sin el estilo eliminado
      setGs(updatedGs);

      // Opcional: También puedes resetear el estado de selectedGS si es necesario
      setSelectedGs(null);
    }
  };

  return (
    <div className="w-full h-full col-span-1 bg-[#2B2B44] p-1.5 lg:p-4 no-scroll overflow-y-auto">
      <h2 className="text-[#F5F5F5] text-xl font-medium">Estios Globales</h2>

      <div className="w-full h-auto flex flex-col gap-3 mt-5">
        {selectedGS && (
          <>
            <div className="w-full h-auto gap-3 border border-l-0 border-r-0 border-b-0 pt-3 border-[#4F4F4F]">
              <Button
                className="bg-red-500 hover:bg-red-600 cursor-pointer text-white border-none"
                onClick={handleDeleteStyle} // Llamamos a la función handleDeleteStyle
              >
                Eliminar
              </Button>
            </div>
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
                  value={selectedGS.styles.fontFamily}
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
                  value={selectedGS.styles.fontWeight}
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
                  value={selectedGS.styles.fontSize}
                  onChange={(e) =>
                    handleStyleChange("fontSize", e.target.value)
                  }
                />
              </div>
              <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] col-span-2 mt-2">
                <RxText className="text-base text-[#BDBDBD]" />
                <input
                  className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                  value={selectedGS.text}
                  onChange={(e) => handleTextChange(e.target.value)}
                />
              </div>
              <div className="mt-2 grid row-start-4 grid-cols-3 h-8 bg-[#555555] rounded-md">
                <div
                  className={`h-8 flex items-center justify-center rounded-md cursor-pointer ${
                    selectedGS.styles.textAlign === "left"
                      ? "bg-[#2C2C2C] border-[2px] border-[#444444]"
                      : ""
                  }`}
                  onClick={() => handleStyleChange("textAlign", "left")}
                >
                  <LuAlignLeft className="text-xl text-[#C3C3C3]" />
                </div>
                <div
                  className={`h-8 flex items-center justify-center rounded-md cursor-pointer ${
                    selectedGS.styles.textAlign === "center"
                      ? "bg-[#2C2C2C] border-[2px] border-[#444444]"
                      : ""
                  }`}
                  onClick={() => handleStyleChange("textAlign", "center")}
                >
                  <LuAlignJustify className="text-xl text-[#C3C3C3]" />
                </div>
                <div
                  className={`h-8 flex items-center justify-center rounded-md cursor-pointer ${
                    selectedGS.styles.textAlign === "right"
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
                  value={selectedGS.styles.color}
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

            <div className="w-full h-auto grid grid-cols-2 grid-rows-4 gap-2">
              <div className="mt-2 flex flex-col gap-2 col-span-2">
                <select
                  className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] pl-2 outline-none"
                  value={selectedGS.styles.display}
                  onChange={(e) => handleStyleChange("display", e.target.value)}
                >
                  <option value="block">Bloque</option>
                  <option value="inline-block">Enlinea-Bloque</option>
                  <option value="flex">Flexible</option>
                  <option value="list-item">Elemento de Lista</option>
                  <option value="grid">Grilla</option>
                </select>
              </div>
              <div className="mt-2 grid row-start-2 grid-cols-3 h-8 bg-[#555555] rounded-md">
                <div
                  className={`h-8 flex items-center justify-center rounded-md cursor-pointer ${
                    selectedGS.styles.alignItems === "start"
                      ? "bg-[#2C2C2C] border-[2px] border-[#444444]"
                      : ""
                  }`}
                  onClick={() => handleStyleChange("alignItems", "start")}
                >
                  <LuAlignStartHorizontal className="text-xl text-[#C3C3C3]" />
                </div>
                <div
                  className={`h-8 flex items-center justify-center rounded-md cursor-pointer ${
                    selectedGS.styles.alignItems === "center"
                      ? "bg-[#2C2C2C] border-[2px] border-[#444444]"
                      : ""
                  }`}
                  onClick={() => handleStyleChange("alignItems", "center")}
                >
                  <LuAlignCenterHorizontal className="text-xl text-[#C3C3C3]" />
                </div>
                <div
                  className={`h-8 flex items-center justify-center rounded-md cursor-pointer ${
                    selectedGS.styles.alignItems === "end"
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
                    selectedGS.styles.justifyContent === "start"
                      ? "bg-[#2C2C2C] border-[2px] border-[#444444]"
                      : ""
                  }`}
                  onClick={() => handleStyleChange("justifyContent", "start")}
                >
                  <LuAlignStartVertical className="text-xl text-[#C3C3C3]" />
                </div>
                <div
                  className={`h-8 flex items-center justify-center rounded-md cursor-pointer ${
                    selectedGS.styles.justifyContent === "center"
                      ? "bg-[#2C2C2C] border-[2px] border-[#444444]"
                      : ""
                  }`}
                  onClick={() => handleStyleChange("justifyContent", "center")}
                >
                  <LuAlignCenterVertical className="text-xl text-[#C3C3C3]" />
                </div>
                <div
                  className={`h-8 flex items-center justify-center rounded-md cursor-pointer ${
                    selectedGS.styles.justifyContent === "end"
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
                    selectedGS.styles.justifyContent === "space-around"
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
                    selectedGS.styles.justifyContent === "space-between"
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
                {selectedGS.styles.display === "flex" && (
                  <select
                    className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] text-base pl-2 outline-none"
                    value={selectedGS.styles.flexDirection}
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
                  selectedGS.styles.overflow === "hidden"
                    ? "bg-[#2C2C2C] border-[2px] border-[#444444]"
                    : ""
                }`}
                onClick={() => handleStyleChange("overflow", "hidden")}
              >
                <BiSolidHide className="text-xl text-[#C3C3C3]" />
                Ocultar elementos si se salen
              </div>
            </div>

            <div className="w-full h-auto gap-3 border border-l-0 border-r-0 border-b-0 pt-3 border-[#4F4F4F]">
              <h3
                className="text-[#ffffff] text-sm font-medium mt-1"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Relleno
              </h3>
            </div>
            <div className="w-full h-auto">
              <FullColorPicker
                onChange={handleGradientChange}
                value={selectedGS.styles.background}
              />
            </div>
            <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] col-span-2 mt-2">
              <CgDropOpacity className="text-base text-[#BDBDBD]" />
              <input
                className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                value={selectedGS.styles.backgroundOpacity}
                onChange={(e) =>
                  handleStyleChange("backgroundOpacity", e.target.value)
                }
              />
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
                  value={selectedGS.styles.width}
                  onChange={(e) => handleStyleChange("width", e.target.value)}
                />
              </div>
              <div className="gap-2 border border-[#555555] flex items-center h-10 rounded px-2 bg-[#555555]">
                <h3 className="text-sm text-[#BDBDBD] font-semibold">H</h3>
                <input
                  className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                  value={selectedGS.styles.height}
                  onChange={(e) => handleStyleChange("height", e.target.value)}
                />
              </div>
              <div className="gap-2 border border-[#555555] flex items-center h-10 rounded px-2 bg-[#555555]">
                <h3 className="text-sm text-[#BDBDBD] font-semibold">MXW</h3>
                <input
                  className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                  value={selectedGS.styles.maxWidth}
                  onChange={(e) =>
                    handleStyleChange("maxWidth", e.target.value)
                  }
                />
              </div>
              <div className="gap-2 border border-[#555555] flex items-center h-10 rounded px-2 bg-[#555555]">
                <h3 className="text-sm text-[#BDBDBD] font-semibold">MXH</h3>
                <input
                  className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                  value={selectedGS.styles.maxHeight}
                  onChange={(e) =>
                    handleStyleChange("maxHeight", e.target.value)
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-sm text-[#BDBDBD] font-semibold">Gap</h3>
                <input
                  className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] pl-2"
                  value={selectedGS.styles.gap || ""}
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
                selectedGS.styles.position === "absolute"
                  ? "grid-rows-4"
                  : "grid-rows-1"
              }  gap-2`}
            >
              <div className="flex flex-col col-span-2">
                <select
                  className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] pl-2 outline-none"
                  value={selectedGS.styles.position}
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
              {selectedGS.styles.position === "absolute" && (
                <>
                  <div className="w-full grid grid-cols-2 gap-2 col-span-2 row-start-2 h-8">
                    <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] mt-2">
                      <MdBorderTop className="text-xl text-[#BDBDBD]" />
                      <input
                        className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                        value={selectedGS.styles.top}
                        onChange={(e) =>
                          handleStyleChange("top", e.target.value)
                        }
                      />
                    </div>
                    <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] mt-2">
                      <MdOutlineBorderBottom className="text-xl text-[#BDBDBD]" />
                      <input
                        className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                        value={selectedGS.styles.bottom}
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
                        value={selectedGS.styles.left}
                        onChange={(e) =>
                          handleStyleChange("left", e.target.value)
                        }
                      />
                    </div>
                    <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] mt-2">
                      <MdBorderRight className="text-xl text-[#BDBDBD]" />
                      <input
                        className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                        value={selectedGS.styles.right}
                        onChange={(e) =>
                          handleStyleChange("right", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div
                    className={`mt-2 text-base gap-2 text-[#C3C3C3] h-8 flex items-center justify-center rounded-md col-span-2 row-start-4 cursor-pointer bg-[#555555] ${
                      selectedGS.styles.transform === "translate(-50%, -50%)"
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
              )}
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
                  value={selectedGS?.styles?.margin || ""}
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
                  value={selectedGS.styles.marginTop}
                  onChange={(e) => {
                    handleStyleChange("marginTop", e.target.value);
                  }}
                />
              </div>
              <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] mt-2">
                <TbBoxAlignBottomFilled className="text-xl text-[#BDBDBD]" />
                <input
                  className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                  value={selectedGS.styles.marginBottom}
                  onChange={(e) => {
                    handleStyleChange("marginBottom", e.target.value);
                  }}
                />
              </div>
              <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] mt-2">
                <TbBoxAlignLeftFilled className="text-xl text-[#BDBDBD]" />
                <input
                  className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                  value={selectedGS.styles.marginLeft}
                  onChange={(e) => {
                    handleStyleChange("marginLeft", e.target.value);
                  }}
                />
              </div>
              <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] mt-2">
                <TbBoxAlignRightFilled className="text-xl text-[#BDBDBD]" />
                <input
                  className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                  value={selectedGS.styles.marginRight}
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
                  value={selectedGS?.styles?.padding || ""}
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
                  value={selectedGS.styles.paddingTop}
                  onChange={(e) =>
                    handleStyleChange("paddingTop", e.target.value)
                  }
                />
              </div>
              <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] mt-2">
                <TbBoxAlignBottomFilled className="text-xl text-[#BDBDBD]" />
                <input
                  className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                  value={selectedGS.styles.paddingBottom}
                  onChange={(e) =>
                    handleStyleChange("paddingBottom", e.target.value)
                  }
                />
              </div>
              <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] mt-2">
                <TbBoxAlignLeftFilled className="text-xl text-[#BDBDBD]" />
                <input
                  className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                  value={selectedGS.styles.paddingLeft}
                  onChange={(e) =>
                    handleStyleChange("paddingLeft", e.target.value)
                  }
                />
              </div>
              <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] mt-2">
                <TbBoxAlignRightFilled className="text-xl text-[#BDBDBD]" />
                <input
                  className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                  value={selectedGS.styles.paddingRight}
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
                  value={selectedGS.styles.borderWidth}
                  onChange={(e) =>
                    handleStyleChange("borderWidth", e.target.value)
                  }
                />
              </div>
              <div className="gap-2 h-8 rounded mt-2 col-span-2 row-start-2">
                <input
                  type="color"
                  className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] outline-none"
                  value={selectedGS.styles.borderColor}
                  onChange={(e) =>
                    handleStyleChange("borderColor", e.target.value)
                  }
                />
              </div>
              <div className="mt-2 flex flex-col gap-2 col-span-2 h-8 row-start-3">
                <select
                  className="w-full h-8 rounded border border-[#828282] bg-transparent text-[#E0E0E0] pl-2 outline-none"
                  value={selectedGS.styles.borderStyle}
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
                  value={selectedGS?.styles?.borderRadius || ""}
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
                    value={selectedGS.styles.borderTopLeftRadius}
                    onChange={(e) =>
                      handleStyleChange("borderTopLeftRadius", e.target.value)
                    }
                  />
                </div>
                <div className="gap-2 border border-[#555555] flex items-center h-8 rounded px-2 bg-[#555555] mt-2">
                  <TbBoxAlignTopRightFilled className="text-xl text-[#BDBDBD]" />
                  <input
                    className="w-full h-8 rounded bg-transparent text-[#E0E0E0] pl-1 outline-none"
                    value={selectedGS.styles.borderTopRightRadius}
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
                    value={selectedGS.styles.borderBottomLeftRadius}
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
                    value={selectedGS.styles.borderBottomRightRadius}
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
                  value={selectedGS.styles.boxShadow}
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
          </>
        )}
      </div>
    </div>
  );
};

export default RGS;
