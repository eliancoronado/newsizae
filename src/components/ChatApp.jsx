import { useState, useRef, useEffect } from "react";
import useStore from "../store/store";

class EnhancedCommandProcessor {
  processCommand(command) {
    const componentType = this.extractComponentType(command);
    const componentData = this.createBaseElement(componentType);

    // Aplicar modificaciones según el comando
    this.applyText(command, componentData);
    this.applyStyles(command, componentData);
    this.applySpecialProps(command, componentData);

    return componentData;
  }

  extractComponentType(command) {
    const componentMap = {
      "botón|boton|button": "Button",
      "input|campo de texto|texto": "Input",
      "contenedor|container|div": "Container",
      "lista|ul|u-list": "U-List",
      "lista ordenada|ol|o-list": "O-List",
      "ítem|elemento|li|list-item": "List-Item",
      "enlace|link|a": "Link",
      "imagen|img|image": "Image",
      "icono|icon|i": "Icon",
      "selector|select|dropdown": "Select",
      "opción|option": "Option",
      "texto|h1|h2|h3|p": "Text",
    };

    for (const [keywords, component] of Object.entries(componentMap)) {
      if (new RegExp(keywords.split("|").join("|"), "i").test(command)) {
        return component;
      }
    }

    return "Button"; // Default
  }

  createBaseElement(type) {
    // Definimos estilos base específicos para cada tipo de componente
    const componentStyles = {
      Button: {
        backgroundColor: "#3b82f6",
        color: "#ffffff",
        borderColor: "#2563eb",
        borderRadius: "6px",
        padding: "8px 16px",
        fontSize: "16px",
        fontWeight: "500",
        cursor: "pointer",
      },
      Input: {
        border: "1px solid #d1d5db",
        borderRadius: "4px",
        padding: "8px 12px",
        fontSize: "14px",
        width: "200px",
        backgroundColor: "#ffffff",
        color: "#111827",
      },
      Container: {
        border: "1px solid #e5e7eb",
        borderRadius: "4px",
        padding: "16px",
        margin: "8px 0",
        backgroundColor: "#ffffff",
      },
      Text: {
        fontSize: "16px",
        color: "#111827",
        margin: "8px 0",
        lineHeight: "1.5",
      },
      Link: {
        color: "#3b82f6",
        textDecoration: "underline",
        cursor: "pointer",
      },
      // ... otros componentes
    };
    // Estructura base compatible con tu sistema
    const baseElement = {
      id: Date.now(),
      name: type,
      text: this.getDefaultText(type),
      children: [],
      animation: "",
      retrasoanim: "",
      duracionanim: "",
      iconClass: type === "Icon" ? "bx bx-left-arrow-alt" : "",
      styles: {
        color: "#000000",
        cursor: "",
        backgroundColor: "",
        border: "",
        borderWidth: "1px",
        borderColor: "",
        borderStyle: "solid",
        fontSize: "16px",
        fontFamily: "Poppins, sans-serif",
        fontWeight: "400",
        lineHeight: "1",
        textAlign: "left",
        width: type === "Input" ? "200px" : "auto",
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
        padding: "",
        borderRadius: "",
        ...(componentStyles[type] || {}),
      },
    };

    // Propiedades especiales por tipo
    if (type === "Input") {
      baseElement.placeholder = "Placeholder";
      baseElement.type = "text";
    } else if (type === "Image") {
      baseElement.src = "https://via.placeholder.com/150";
    } else if (type === "Link") {
      baseElement.href = "#";
    } else if (type === "Option") {
      baseElement.value = "texto";
    }

    return baseElement;
  }

  getDefaultText(type) {
    const defaultTexts = {
      Container: "Div",
      Input: "",
      Icon: "",
      Select: "",
      Link: "Link",
      "List-Item": "Item de la lista",
      "O-List": "",
      "U-List": "",
      Button: "Texto",
      Text: "Texto",
    };
    return defaultTexts[type] || "texto";
  }

  applyText(command, component) {
    // Intenta primero encontrar texto entre comillas
    const quotedTextMatch =
      command.match(/"([^"]+)"/) || command.match(/'([^']+)'/);

    if (quotedTextMatch && quotedTextMatch[1]) {
      component.text = quotedTextMatch[1].trim();
      return;
    }

    // Si no hay comillas, busca el patrón "que diga [todo hasta el final]"
    const unquotedMatch = command.match(
      /(?:que diga|texto|con el texto)\s+(.+)/i
    );

    if (unquotedMatch && unquotedMatch[1]) {
      // Elimina posibles comandos adicionales después del texto
      const textParts = unquotedMatch[1].split(
        /(?=\s(?:azul|rojo|grande|pequeño|redondeado|centrado|sombra|con))/i
      );
      component.text = textParts[0].trim();
    }

    // Si el comando es solo texto entre comillas
    if (
      !component.text &&
      (command.startsWith('"') || command.startsWith("'"))
    ) {
      const cleanText = command.slice(1, -1).trim();
      if (cleanText) component.text = cleanText;
    }
  }

  applyStyles(command, component) {
    const styles = component.styles;

    // Colores
    const colorMap = {
      azul: {
        backgroundColor: "#2563eb",
        color: "#ffffff",
        borderColor: "#2563eb",
      },
      rojo: {
        backgroundColor: "#ef4444",
        color: "#ffffff",
        borderColor: "#dc2626",
      },
      verde: {
        backgroundColor: "#10b981",
        color: "#ffffff",
        borderColor: "#059669",
      },
      amarillo: {
        backgroundColor: "#f59e0b",
        color: "#ffffff",
        borderColor: "#d97706",
      },
      gris: {
        backgroundColor: "#6b7280",
        color: "#ffffff",
        borderColor: "#4b5563",
      },
      blanco: {
        backgroundColor: "#ffffff",
        color: "#000000",
        borderColor: "#e5e7eb",
      },
      negro: {
        backgroundColor: "#000000",
        color: "#ffffff",
        borderColor: "#000000",
      },
    };

    for (const [keywords, colorStyles] of Object.entries(colorMap)) {
      if (new RegExp(keywords.split("|").join("|"), "i").test(command)) {
        Object.assign(styles, colorStyles);
      }
    }

    // Tamaños
    if (command.match(/pequeño|small/i)) {
      styles.padding = "0.25rem 0.5rem";
      styles.fontSize = "0.8rem";
    } else if (command.match(/grande|large/i)) {
      styles.padding = "0.8rem 1.5rem";
      styles.fontSize = "1.2rem";
    } else if (command.match(/extra grande|x-large|enorme/i)) {
      styles.padding = "1rem 2rem";
      styles.fontSize = "1.5rem";
    }

    // Bordes
    if (command.match(/redondeado|rounded/i)) {
      styles.borderRadius = "8px";
    } else if (command.match(/círculo|circle/i)) {
      styles.borderRadius = "50%";
      if (component.name === "Button" || component.name === "Image") {
        styles.width = styles.height = "50px";
      }
    }

    // Efectos
    if (command.match(/sombra|shadow/i)) {
      styles.boxShadow =
        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
    }

    // Posición
    if (command.match(/centrado|center/i)) {
      styles.textAlign = "center";
      styles.marginLeft = "auto";
      styles.marginRight = "auto";
      if (component.name === "Button") {
        styles.display = "block";
      }
    }
  }

  applySpecialProps(command, component) {
    // Para inputs
    if (component.name === "Input") {
      // Manejo de tipos de input
      if (command.match(/contraseña|password/i)) {
        component.type = "password";
      } else if (command.match(/email|correo/i)) {
        component.type = "email";
      } else if (command.match(/número|number/i)) {
        component.type = "number";
      }

      // Manejo mejorado de placeholder
      const placeholderMatch =
        command.match(/con placeholder "([^"]+)"/i) ||
        command.match(/con placeholder '([^']+)'/i) ||
        command.match(/con placeholder ([^"'\s]+)/i);

      if (placeholderMatch && placeholderMatch[1]) {
        component.placeholder = placeholderMatch[1].trim();
      }

      // Alternativa: "placeholder de [texto]"
      const placeholderAltMatch =
        command.match(/placeholder de "([^"]+)"/i) ||
        command.match(/placeholder de '([^']+)'/i) ||
        command.match(/placeholder de ([^"'\s]+)/i);

      if (
        placeholderAltMatch &&
        placeholderAltMatch[1] &&
        !component.placeholder
      ) {
        component.placeholder = placeholderAltMatch[1].trim();
      }
    }

    // Para enlaces (mejorado para manejar comillas)
    if (component.name === "Link") {
      const hrefMatch =
        command.match(/enlace a "([^"]+)"/i) ||
        command.match(/enlace a '([^']+)'/i) ||
        command.match(/enlace a ([^"'\s]+)/i);

      if (hrefMatch && hrefMatch[1]) {
        component.href = hrefMatch[1].trim();

        // Asegurar que las URLs comiencen con http:// o https://
        if (!component.href.match(/^https?:\/\//i)) {
          component.href = `https://${component.href}`;
        }
      }

      // Alternativa: "href de [url]"
      const hrefAltMatch =
        command.match(/href de "([^"]+)"/i) ||
        command.match(/href de '([^']+)'/i) ||
        command.match(/href de ([^"'\s]+)/i);

      if (hrefAltMatch && hrefAltMatch[1] && !component.href) {
        component.href = hrefAltMatch[1].trim();
        if (!component.href.match(/^https?:\/\//i)) {
          component.href = `https://${component.href}`;
        }
      }
    }

    // Para imágenes (mejorado para manejar comillas)
    if (component.name === "Image") {
      const imageMatch =
        command.match(/imagen de "([^"]+)"/i) ||
        command.match(/imagen de '([^']+)'/i) ||
        command.match(/imagen de ([^"'\s]+)/i);

      if (imageMatch && imageMatch[1]) {
        const searchTerm = encodeURIComponent(imageMatch[1].trim());
        component.src = `https://source.unsplash.com/random/300x200/?${searchTerm}`;
      }

      // Alternativa para especificar tamaño
      const sizedImageMatch =
        command.match(/imagen (\d+)x(\d+) de "([^"]+)"/i) ||
        command.match(/imagen (\d+)x(\d+) de '([^']+)'/i) ||
        command.match(/imagen (\d+)x(\d+) de ([^"'\s]+)/i);

      if (sizedImageMatch && sizedImageMatch[3]) {
        const width = sizedImageMatch[1];
        const height = sizedImageMatch[2];
        const searchTerm = encodeURIComponent(sizedImageMatch[3].trim());
        component.src = `https://source.unsplash.com/random/${width}x${height}/?${searchTerm}`;
      }
    }

    // Para íconos (mantenemos la versión anterior que ya funciona bien)
    if (component.name === "Icon") {
      const iconMap = {
        "flecha|arrow": "bx bx-arrow-back",
        "buscar|search": "bx bx-search",
        "usuario|user": "bx bx-user",
        "corazón|heart": "bx bx-heart",
        "estrellas|star": "bx bx-star",
      };

      for (const [keywords, iconClass] of Object.entries(iconMap)) {
        if (new RegExp(keywords.split("|").join("|"), "i").test(command)) {
          component.iconClass = iconClass;
          break;
        }
      }
    }
  }
}

const ChatUI = () => {
  const [messages, setMessages] = useState([
    {
      text: "¡Hola! Soy tu asistente de diseño avanzado. Puedes pedirme que cree cualquier elemento de UI.",
      sender: "ai",
      examples: [
        "Añade un botón azul redondeado que diga 'Comenzar'",
        "Crea un input para contraseñas con placeholder 'Ingresa tu clave'",
        "Inserta una imagen de paisajes",
        "Necesito un enlace a Google que diga 'Buscar'",
        "Quiero una lista con 3 ítems",
      ],
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);
  const processor = new EnhancedCommandProcessor();

  // Obtener estados y acciones del store
  const {
    selectedElement,
    droppedElements,
    setDroppedElements,
    setSelectedElement
  } = useStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Añadir mensaje del usuario
    const userMessage = { text: inputValue, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);

    // Procesar comando
    const componentData = processor.processCommand(inputValue);

    // Crear nuevo elemento compatible con el formato de handleDrop
    const newElement = {
      id: Date.now(),
      name: componentData.name,
      text: componentData.text || 
           (componentData.name === "Container" ? "Div" : 
            componentData.name === "Input" ? "" : 
            componentData.name === "Icon" ? "" : 
            componentData.name === "Select" ? "" : 
            componentData.name === "Link" ? "Link" : 
            componentData.name === "List-Item" ? "Item de la lista" : 
            componentData.name === "O-List" ? "" : 
            componentData.name === "U-List" ? "" : "texto"),
      children: [],
      ...(componentData.name === "Input" && { 
        placeholder: componentData.placeholder || "Placeholder",
        type: componentData.type || "text"
      }),
      ...(componentData.name === "Image" && { src: componentData.src }),
      ...(componentData.name === "Icon" && { iconClass: componentData.iconClass }),
      ...(componentData.name === "Link" && { href: componentData.href || "#" }),
      ...(componentData.name === "Option" && { value: "texto" }),
      animation: "",
      retrasoanim: "",
      duracionanim: "",
      styles: {
        color: "#000000",
        cursor: "",
        backgroundColor: "",
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
        padding: "",
        borderRadius: "",
        ...componentData.styles
      }
    };

    // Actualizar droppedElements en el store
    const updatedElements = selectedElement?.name === "Container"
      ? addChildToParent(droppedElements, selectedElement.id, newElement)
      : [...droppedElements, newElement];

    setDroppedElements(updatedElements);

    // Añadir respuesta de la IA
    setMessages((prev) => [
      ...prev,
      {
        text: `He creado un ${componentData.name}: ${
          componentData.text || "(sin texto)"
        }`,
        sender: "ai",
        componentData: newElement
      },
    ]);

    setInputValue("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 text-black rounded-md">
      {/* Panel del chat */}
      <div className="flex-1 flex flex-col rounded-md bg-[#2B2B44]">
        <div className="p-4 bg-indigo-600 text-white rounded-md">
          <h1 className="text-xl font-bold">SIZAE Asistente IA</h1>
        </div>

        <div className="flex-1 p-4 overflow-y-auto bg-[#2B2B44]">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 ${
                    message.sender === "user"
                      ? "bg-indigo-500 text-white rounded-br-none"
                      : "bg-white border border-gray-200 rounded-bl-none"
                  }`}
                >
                  <p>{message.text}</p>

                  {message.examples && (
                    <div className="mt-2 text-sm">
                      <p className="font-semibold">Ejemplos:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {message.examples.map((example, i) => (
                          <li key={i} className="text-black">
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {message.componentData && (
                    <div className="mt-2 text-xs p-2 bg-gray-100 rounded text-gray-700">
                      <pre>
                        {JSON.stringify(message.componentData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="bg-[#2B2B44]">
          <div className="flex w-full">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu comando (ej. 'Añade un botón azul que diga Comenzar')"
              className="flex-1 px-2 py-2 border border-gray-300 rounded-l-lg focus:outline-none text-xs focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleSendMessage}
              className="px-2 py-2 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Enviar
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500 text-center">
            Tip: Prueba comandos como "lista con 3 ítems" o "input para email"
          </p>
          {selectedElement && (
            <p className="mt-2 text-xs text-indigo-600">
              Elemento seleccionado: {selectedElement.name} (ID: {selectedElement.id})
              {selectedElement.name === "Container" && " - Los nuevos elementos se añadirán dentro de este contenedor"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatUI;