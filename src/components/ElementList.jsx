import React, { useState, useRef, useEffect } from "react";
import { FaBox, FaImage, FaCode, FaRegSquare } from "react-icons/fa";
import { MdOutlineTextFields, MdOutlineInsertEmoticon } from "react-icons/md";
import { RxInput } from "react-icons/rx";

const getElementIcon = (name) => {
  switch (name) {
    case "Text":
      return <MdOutlineTextFields className="text-xl text-[#FFD966]" />;
    case "Container":
      return <FaBox className="text-xl text-[#FFD966]" />;
    case "Image":
      return <FaImage className="text-xl text-[#FFD966]" />;
    case "Input":
      return <RxInput className="text-xl text-[#FFD966]" />;
    case "Button":
      return <FaRegSquare className="text-xl text-[#FFD966]" />;
    case "Icon":
      return <MdOutlineInsertEmoticon className="text-xl text-[#FFD966]" />;
    default:
      return <FaCode className="text-xl text-[#FFD966]" />;
  }
};

const ElementTree = ({
  element,
  selectedElement,
  setSelectedElement,
  handleDrop,
  handleCopyElement,
  handlePasteElement,
  copiedElement,
  level = 0,
}) => {
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
  });

  const elementRef = useRef(null);

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedElement(element);
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  useEffect(() => {
    document.addEventListener("click", closeContextMenu);
    return () => {
      document.removeEventListener("click", closeContextMenu);
    };
  }, []);

  const isSelected = selectedElement?.id === element.id;

  return (
    <>
      {/* Zona de drop ARRIBA */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.stopPropagation();
          const dropped = JSON.parse(
            e.dataTransfer.getData("application/json")
          );
          handleDrop(dropped, element, "above");
        }}
        className="h-1 bg-transparent hover:bg-yellow-400 transition-all"
      />

      {/* Nodo visual */}
      <div
        ref={elementRef}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("application/json", JSON.stringify(element));
          e.stopPropagation();
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.stopPropagation();
          const dropped = JSON.parse(
            e.dataTransfer.getData("application/json")
          );
          handleDrop(dropped, element, "inside");
        }}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedElement(element);
        }}
        onContextMenu={handleContextMenu}
        className={`flex items-center gap-2 mt-1 ml-${
          level * 4
        } py-2 px-4 rounded hover:bg-white hover:bg-opacity-50 cursor-pointer ${
          isSelected ? "bg-white bg-opacity-30" : ""
        }`}
      >
        {getElementIcon(element.name)}
        <span className="text-sm font-semibold text-[#FFD966]">
          {element.name}
        </span>
      </div>

      {/* Context Menu */}
      {contextMenu.visible && contextMenu.x && contextMenu.y && (
        <div
          className="fixed bg-gray-800 border border-gray-600 rounded shadow-lg py-1 z-50"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="block w-full text-left px-4 py-1 text-white hover:bg-gray-700"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyElement(element);
              closeContextMenu();
            }}
          >
            Copiar
          </button>
          <button
            className={`block w-full text-left px-4 py-1 text-white hover:bg-gray-700 ${
              !copiedElement ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={!copiedElement}
            onClick={(e) => {
              e.stopPropagation();
              if (copiedElement) {
                handlePasteElement(element);
              }
              closeContextMenu();
            }}
          >
            Pegar
          </button>
        </div>
      )}

      {/* Zona de drop ABAJO */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.stopPropagation();
          const dropped = JSON.parse(
            e.dataTransfer.getData("application/json")
          );
          handleDrop(dropped, element, "below");
        }}
        className="h-1 bg-transparent hover:bg-yellow-400 transition-all"
      />

      {element.children && element.children.length > 0 && (
        <div className="pl-4">
          {element.children.map((child) => (
            <ElementTree
              key={child.id}
              element={child}
              selectedElement={selectedElement}
              setSelectedElement={setSelectedElement}
              handleDrop={handleDrop}
              handleCopyElement={handleCopyElement}
              handlePasteElement={handlePasteElement}
              copiedElement={copiedElement}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </>
  );
};

const ElementList = ({
  elements,
  selectedElement,
  setSelectedElement,
  handleDrop,
  setDroppedElements,
  updatedOElements,
  setUpdatedOElements
}) => {
  const [copiedElement, setCopiedElement] = useState(null);

  const handleCopyElement = (element) => {
    // Deep copy the element including children
    const copied = JSON.parse(JSON.stringify(element));
    setCopiedElement(copied);
  };

  const handlePasteElement = (parentElement) => {
    if (!copiedElement) return;

    // Generate new IDs for the copied element and all its children
    const generateNewIds = (element) => {
      const newElement = { ...element, id: `${Date.now()}` };
      if (newElement.children && newElement.children.length > 0) {
        newElement.children = newElement.children.map(generateNewIds);
      }
      return newElement;
    };

    const newElement = generateNewIds(copiedElement);

    // Update the elements in the store
    const updatedElements =
      parentElement?.name === "Container"
        ? addChildToParent(elements, parentElement.id, newElement)
        : [...elements, newElement];

    setDroppedElements(updatedElements);
    setUpdatedOElements(updatedElements)
  };

  const addChildToParent = (elements, parentId, child) => {
    return elements.map((el) => {
      if (el.id === parentId) {
        return { ...el, children: [...el.children, child] };
      }
      if (el.children.length > 0) {
        return {
          ...el,
          children: addChildToParent(el.children, parentId, child),
        };
      }
      return el;
    });
  };

  return (
    <div className="w-full h-full max-w-full">
      <h2 className="text-[#FFC700] text-xl mb-3 font-medium">Elementos</h2>
      {elements.map((element) => (
        <ElementTree
          key={element.id}
          element={element}
          selectedElement={selectedElement}
          setSelectedElement={setSelectedElement}
          handleDrop={handleDrop}
          handleCopyElement={handleCopyElement}
          handlePasteElement={handlePasteElement}
          copiedElement={copiedElement}
        />
      ))}
    </div>
  );
};

export default ElementList;
