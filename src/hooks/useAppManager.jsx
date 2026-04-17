import React, { useState, useEffect } from "react";
import useStore from "../store/store";

const useAppManager = () => {
  const [contextMenu, setContextMenu] = useState(null); // Estado para el menú contextual

  const {
    selectedElement,
    imgSelected,
    setImgSelected,
    setSelectedElement,
    droppedElements,
    setDroppedElements,
    setUpdatedOElements,
    draggingElement,
    setDraggingElement,
  } = useStore(); // Usamos los métodos del store para actualizar el estado

  const handleStyleChange = (styleName, value) => {
    const updateStylesRecursively = (elements) =>
      elements.map((el) => {
        if (el.id === selectedElement.id) {
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
          } else if (styleName === "background") {
            newStyles = {
              ...newStyles,
              background: value, // Establecemos el nuevo valor para "background"
            };
            // Eliminamos las propiedades de background individuales
            delete newStyles.backgroundColor;
          } else {
            // Para otros estilos, solo actualizamos el estilo correspondiente
            newStyles[styleName] = value;
          }

          return {
            ...el,
            styles: newStyles,
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
    // Actualizamos los elementos con los nuevos estilos
    const updatedElements = updateStylesRecursively(droppedElements);

    // Actualizamos el estado global con los elementos modificados
    setDroppedElements(updatedElements);

    // Actualizamos también el estado del selectedElement
    setSelectedElement({
      ...selectedElement, // Copia las propiedades anteriores del selectedElement
      styles: {
        ...selectedElement.styles, // Mantén los estilos anteriores
        [styleName]: value, // Agrega o actualiza el estilo específico
      },
    });
  };

  const handleTextChange = (newText) => {
    const updateTextRecursively = (elements) =>
      elements.map((el) => {
        if (el.id === selectedElement.id) {
          return {
            ...el,
            text: newText,
          };
        }
        if (el.children) {
          return {
            ...el,
            children: updateTextRecursively(el.children),
          };
        }
        return el;
      });
    const updateTextElement = updateTextRecursively(droppedElements);
    setDroppedElements(updateTextElement);
    setSelectedElement({
      ...selectedElement,
      text: newText,
    });
  };

  const handlePlaceholderChange = (newPlace) => {
    const updatePlaceholderRecursively = (elements) =>
      elements.map((el) => {
        if (el.id === selectedElement.id) {
          return {
            ...el,
            placeholder: newPlace,
          };
        }
        if (el.children) {
          return {
            ...el,
            children: updatePlaceholderRecursively(el.children),
          };
        }
        return el;
      });
    const updatePlaceholderElement =
      updatePlaceholderRecursively(droppedElements);
    setDroppedElements(updatePlaceholderElement);
    setSelectedElement({
      ...selectedElement,
      placeholder: newPlace,
    });
  };

  const handleValOptChange = (newVal) => {
    const updateValOptRecursively = (elements) =>
      elements.map((el) => {
        if (el.id === selectedElement.id) {
          return {
            ...el,
            value: newVal,
          };
        }
        if (el.children) {
          return {
            ...el,
            children: updateValOptRecursively(el.children),
          };
        }
        return el;
      });
    const updateValOptElement = updateValOptRecursively(droppedElements);
    setDroppedElements(updateValOptElement);
    setSelectedElement({
      ...selectedElement,
      value: newVal,
    });
  };

  const handleHrefChange = (newHref) => {
    const updateHrefRecursively = (elements) =>
      elements.map((el) => {
        if (el.id === selectedElement.id) {
          return {
            ...el,
            href: newHref,
          };
        }
        if (el.children) {
          return {
            ...el,
            children: updateHrefRecursively(el.children),
          };
        }
        return el;
      });
    const updateHrefElement = updateHrefRecursively(droppedElements);
    setDroppedElements(updateHrefElement);
    setSelectedElement({
      ...selectedElement,
      href: newHref,
    });
  };

  const handleTypeInputChange = (newType) => {
    const updateTypeInputRecursively = (elements) =>
      elements.map((el) => {
        if (el.id === selectedElement.id) {
          return {
            ...el,
            type: newType,
          };
        }
        if (el.children) {
          return {
            ...el,
            children: updateTypeInputRecursively(el.children),
          };
        }
        return el;
      });
    const updateTypeInputElement = updateTypeInputRecursively(droppedElements);
    setDroppedElements(updateTypeInputElement);
    setSelectedElement({
      ...selectedElement,
      type: newType,
    });
  };

  const handleAnimationChange = (newAnim) => {
    const updateAnimationRecursively = (elements) =>
      elements.map((el) => {
        if (el.id === selectedElement.id) {
          return {
            ...el,
            animation: newAnim,
          };
        }
        if (el.children) {
          return {
            ...el,
            children: updateAnimationRecursively(el.children),
          };
        }
        return el;
      });
    const updateAnimationElement = updateAnimationRecursively(droppedElements);
    setDroppedElements(updateAnimationElement);
    setSelectedElement({
      ...selectedElement,
      animation: newAnim,
    });
  };

  const handleDurAnimationChange = (newDurAnim) => {
    const updateDurAnimationRecursively = (elements) =>
      elements.map((el) => {
        if (el.id === selectedElement.id) {
          return {
            ...el,
            duracionanim: newDurAnim,
          };
        }
        if (el.children) {
          return {
            ...el,
            children: updateDurAnimationRecursively(el.children),
          };
        }
        return el;
      });
    const updateDurAnimationElement =
      updateDurAnimationRecursively(droppedElements);
    setDroppedElements(updateDurAnimationElement);
    setSelectedElement({
      ...selectedElement,
      duracionanim: newDurAnim,
    });
  };

  const handleRetAnimationChange = (newRetAnim) => {
    const updateRetAnimationRecursively = (elements) =>
      elements.map((el) => {
        if (el.id === selectedElement.id) {
          return {
            ...el,
            retrasoanim: newRetAnim,
          };
        }
        if (el.children) {
          return {
            ...el,
            children: updateRetAnimationRecursively(el.children),
          };
        }
        return el;
      });
    const updateRetAnimationElement =
      updateRetAnimationRecursively(droppedElements);
    setDroppedElements(updateRetAnimationElement);
    setSelectedElement({
      ...selectedElement,
      retrasoanim: newRetAnim,
    });
  };

  const handleSrcImgChange = (newSrc) => {
    const updateSrcImgRecursively = (elements) =>
      elements.map((el) => {
        if (el.id === selectedElement.id) {
          return {
            ...el,
            src: newSrc,
          };
        }
        if (el.children) {
          return {
            ...el,
            children: updateSrcImgRecursively(el.children),
          };
        }
        return el;
      });
    const updateSrcImgElement = updateSrcImgRecursively(droppedElements);
    setDroppedElements(updateSrcImgElement);
    setSelectedElement({
      ...selectedElement,
      src: newSrc,
    });
  };

  const handleClassChange = (newClass) => {
    console.log("Changing the class to: " + newClass);
    const updateClassRecursively = (elements) =>
      elements.map((el) => {
        if (el.id === selectedElement.id) {
          return {
            ...el,
            iconClass: newClass,
          };
        }
        if (el.children) {
          return {
            ...el,
            children: updateClassRecursively(el.children),
          };
        }
        return el;
      });
    const updateClassElement = updateClassRecursively(droppedElements);
    setDroppedElements(updateClassElement);
    setSelectedElement({
      ...selectedElement,
      iconClass: newClass,
    });
  };

  // Permitir arrastrar sobre el contenedor
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

    // Nuevo elemento a agregar
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
      ...(data.name === "Input" && { placeholder: "Placeholder" }), // Agregar el campo placeholder si es Input
      ...(data.name === "Image" && { src: imgSelected }), // Agregar el campo placeholder si es Input
      ...(data.name === "Icon"
        ? { iconClass: "bx bx-left-arrow-alt" }
        : { iconClass: "" }), // Si no es un ícono, iconClass será ""),
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
        alignItems: "start", // Valor predeterminado
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
    };

    // Asegurarse de que droppedElements sea un array
    // Accede al estado global de droppedElements

    console.log("Estado antes de actualizar:", droppedElements);

    // Verifica si el estado anterior es un arreglo
    if (!Array.isArray(droppedElements)) {
      console.error("El estado anterior no es un array", droppedElements);
      return;
    }

    const updatedElements =
      parentId === null
        ? [...droppedElements, newElement]
        : addChildToParent(droppedElements, parentId, newElement);

    console.log("Elementos antes de actualizar:", droppedElements);
    console.log("Elementos actualizados:", updatedElements);

    // Actualiza el estado global con el nuevo valor
    if (Array.isArray(updatedElements)) {
      setDroppedElements(updatedElements);
      setUpdatedOElements(updatedElements);
    } else {
      console.error("droppedElements no es un array:", updatedElements);
    }

    setDraggingElement(null); // Restablecer el estado
  };

  const addChildToParent = (elements, parentId, child) => {
    return elements.map((el) => {
      if (el.id === parentId) {
        // Agregar el hijo solo al contenedor correspondiente
        return { ...el, children: [...el.children, child] };
      }
      if (el.children.length > 0) {
        // Recursivamente buscar el contenedor correcto en los hijos
        return {
          ...el,
          children: addChildToParent(el.children, parentId, child),
        };
      }
      return el; // Si no coincide, devolver el elemento sin cambios
    });
  };

  const handleElementClick = (element) => {
    setSelectedElement(element); // Seleccionar el elemento
  };

  const handleContextMenu = (e, element) => {
    e.preventDefault();
    setContextMenu({ x: e.pageX, y: e.pageY, id: element.id });
  };

  const handleTouchMove = (e) => {
    e.preventDefault(); // Evita el comportamiento predeterminado
    const touch = e.touches[0]; // Obtener la posición del primer toque

    // Detectar el elemento bajo el toque
    const targetElement = document.elementFromPoint(
      touch.clientX,
      touch.clientY
    );

    if (
      targetElement &&
      targetElement.getAttribute("data-drop-target") === "true"
    ) {
      // Aquí puedes realizar acciones para indicar que el área es válida
      console.log("Toque sobre un área válida para soltar");
    }
  };

  const renderElement = (element) => {
    switch (element.name) {
      case "Container":
        return (
          <div
            key={element.id}
            className={`${
              selectedElement?.id === element.id ? "border border-blue-500" : ""
            }`}
            onDrop={(e) => handleDrop(e, element.id)}
            onTouchEnd={(e) => {
              e.stopPropagation();
              if (draggingElement === null) {
                handleElementClick(element);
              } else {
                handleDrop(e, element.id);
              }
            }} // Maneja el soltar o el clic en táctiles
            onDragOver={handleDragOver}
            onTouchMove={handleTouchMove}
            onClick={(e) => {
              e.stopPropagation();
              if (draggingElement === null) {
                handleElementClick(element);
              }
            }} // Ejecuta clic solo si no está arrastrando
            onContextMenu={(e) => {
              e.stopPropagation();
              handleContextMenu(e, element);
            }}
            style={element.styles}
          >
            {element.text}
            {element.children.map((child) => renderElement(child))}
          </div>
        );
      case "Button":
        return (
          <button
            key={element.id}
            type="button"
            className={`${
              selectedElement?.id === element.id ? "border border-blue-500" : ""
            }`}
            onDrop={(e) => handleDrop(e, element.id)}
            onTouchEnd={(e) => {
              e.stopPropagation();
              if (draggingElement === null) {
                handleElementClick(element);
              } else {
                handleDrop(e, element.id);
              }
            }} // Maneja el soltar o el clic en táctiles
            onDragOver={handleDragOver}
            onTouchMove={handleTouchMove}
            onClick={(e) => {
              e.stopPropagation();
              handleElementClick(element);
            }}
            onContextMenu={(e) => {
              e.stopPropagation();
              handleContextMenu(e, element);
            }}
            style={element.styles}
          >
            {element.text}
            {element.children.map((child) => renderElement(child))}
          </button>
        );
      case "Input":
        return (
          <input
            type={element.type}
            className={`text-base text-black mb-2${
              selectedElement?.id === element.id ? "border border-blue-500" : ""
            }`}
            placeholder={element.placeholder}
            key={element.id}
            onTouchEnd={(e) => {
              e.stopPropagation();
              handleElementClick(element);
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleElementClick(element);
            }}
            onContextMenu={(e) => {
              e.stopPropagation();
              handleContextMenu(e, element);
            }}
            style={element.styles}
          />
        );
      case "Text":
        return (
          <h3
            key={element.id}
            className={`text-base text-black border border-black leading-none ${
              selectedElement?.id === element.id ? "border border-blue-500" : ""
            }`}
            onDrop={(e) => handleDrop(e, element.id)}
            onTouchEnd={(e) => {
              e.stopPropagation();
              if (draggingElement === null) {
                handleElementClick(element);
              } else {
                handleDrop(e, element.id);
              }
            }} // Maneja el soltar o el clic en táctiles
            onDragOver={handleDragOver}
            onTouchMove={handleTouchMove}
            onClick={(e) => {
              e.stopPropagation();
              handleElementClick(element);
            }}
            onContextMenu={(e) => {
              e.stopPropagation();
              handleContextMenu(e, element);
            }}
            style={element.styles}
          >
            {element.text}
            {element.children.map((child) => renderElement(child))}
          </h3>
        );
      case "List-Item":
        return (
          <li
            key={element.id}
            className={`text-base text-black border border-black ${
              selectedElement?.id === element.id ? "border border-blue-500" : ""
            }`}
            onTouchEnd={(e) => {
              e.stopPropagation();
              handleElementClick(element);
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleElementClick(element);
            }}
            onContextMenu={(e) => {
              e.stopPropagation();
              handleContextMenu(e, element);
            }}
            style={element.styles}
          >
            {element.text}
          </li>
        );
      case "Select":
        return (
          <select
            key={element.id}
            className={`text-base text-black border border-black ${
              selectedElement?.id === element.id ? "border border-blue-500" : ""
            }`}
            onDrop={(e) => handleDrop(e, element.id)}
            onTouchEnd={(e) => {
              e.stopPropagation();
              if (draggingElement === null) {
                handleElementClick(element);
              } else {
                handleDrop(e, element.id);
              }
            }} // Maneja el soltar o el clic en táctiles
            onDragOver={handleDragOver}
            onTouchMove={handleTouchMove}
            onClick={(e) => {
              e.stopPropagation();
              if (draggingElement === null) {
                handleElementClick(element);
              }
            }} // Ejecuta clic solo si no está arrastrando
            onContextMenu={(e) => {
              e.stopPropagation();
              handleContextMenu(e, element);
            }}
            style={element.styles}
          >
            {element.children.map((child) => renderElement(child))}
          </select>
        );
      case "O-List":
        return (
          <ol
            key={element.id}
            className={`text-base text-black border border-black ${
              selectedElement?.id === element.id ? "border border-blue-500" : ""
            }`}
            onDrop={(e) => handleDrop(e, element.id)}
            onTouchEnd={(e) => {
              e.stopPropagation();
              if (draggingElement === null) {
                handleElementClick(element);
              } else {
                handleDrop(e, element.id);
              }
            }} // Maneja el soltar o el clic en táctiles
            onDragOver={handleDragOver}
            onTouchMove={handleTouchMove}
            onClick={(e) => {
              e.stopPropagation();
              if (draggingElement === null) {
                handleElementClick(element);
              }
            }} // Ejecuta clic solo si no está arrastrando
            onContextMenu={(e) => {
              e.stopPropagation();
              handleContextMenu(e, element);
            }}
            style={element.styles}
          >
            {element.text}
            {element.children.map((child) => renderElement(child))}
          </ol>
        );
      case "U-List":
        return (
          <ul
            key={element.id}
            className={`text-base text-black border border-black ${
              selectedElement?.id === element.id ? "border border-blue-500" : ""
            }`}
            onDrop={(e) => handleDrop(e, element.id)}
            onTouchEnd={(e) => {
              e.stopPropagation();
              if (draggingElement === null) {
                handleElementClick(element);
              } else {
                handleDrop(e, element.id);
              }
            }} // Maneja el soltar o el clic en táctiles
            onDragOver={handleDragOver}
            onTouchMove={handleTouchMove}
            onClick={(e) => {
              e.stopPropagation();
              if (draggingElement === null) {
                handleElementClick(element);
              }
            }} // Ejecuta clic solo si no está arrastrando
            onContextMenu={(e) => {
              e.stopPropagation();
              handleContextMenu(e, element);
            }}
            style={element.styles}
          >
            {element.text}
            {element.children.map((child) => renderElement(child))}
          </ul>
        );
      case "Option":
        return (
          <option
            key={element.id}
            className={`text-base text-black border border-black ${
              selectedElement?.id === element.id ? "border border-blue-500" : ""
            }`}
            onTouchEnd={(e) => {
              e.stopPropagation();
              handleElementClick(element);
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleElementClick(element);
            }}
            onContextMenu={(e) => {
              e.stopPropagation();
              handleContextMenu(e, element);
            }}
            style={element.styles}
          >
            {element.text}
          </option>
        );
      case "Icon":
        return (
          <i
            key={element.id}
            className={`${element.iconClass} ${
              selectedElement?.id === element.id ? "border border-blue-500" : ""
            }`}
            onTouchEnd={(e) => {
              e.stopPropagation();
              handleElementClick(element);
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleElementClick(element);
            }}
            onContextMenu={(e) => {
              e.stopPropagation();
              handleContextMenu(e, element);
            }}
            style={element.styles}
          ></i>
        );
      case "Image":
        return (
          <img
            key={element.id}
            src={element.src}
            alt="Placeholder"
            style={element.styles}
            className={`w-32 h-32 mb-4 ${
              selectedElement?.id === element.id ? "border border-blue-500" : ""
            }`}
            onTouchEnd={(e) => {
              e.stopPropagation();
              handleElementClick(element);
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleElementClick(element);
            }}
            onContextMenu={(e) => {
              e.stopPropagation();
              handleContextMenu(e, element);
            }}
          />
        );
      case "Link":
        return (
          <a
            key={element.id}
            href={element.href}
            className={`${
              selectedElement?.id === element.id ? "border border-blue-500" : ""
            }`}
            onDrop={(e) => handleDrop(e, element.id)}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (draggingElement === null) {
                handleElementClick(element);
              } else {
                handleDrop(e, element.id);
              }
            }} // Maneja el soltar o el clic en táctiles
            onDragOver={handleDragOver}
            onTouchMove={handleTouchMove}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (draggingElement === null) {
                handleElementClick(element);
              }
            }} // Ejecuta clic solo si no está arrastrando
            onContextMenu={(e) => {
              e.stopPropagation();
              handleContextMenu(e, element);
            }}
            style={element.styles}
          >
            {element.text}
            {element.children.map((child) => renderElement(child))}
          </a>
        );
      default:
        return null;
    }
  };

  return {
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
    selectedElement,
    setSelectedElement,
    setDroppedElements,
    droppedElements,
    imgSelected,
    contextMenu,
    setContextMenu,
    renderElement,
    setImgSelected,
  };
};

export default useAppManager;
