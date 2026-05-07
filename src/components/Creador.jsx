import React, { useState } from "react";
import { MdArrowBackIosNew, MdContentCopy } from "react-icons/md";
import { useNavigate } from "react-router-dom";

const ChatGPT = () => {
  const [htmlInput, setHtmlInput] = useState("");
  const [generatedObject, setGeneratedObject] = useState(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  // --------------------------------------------------------------
  // 1. Parseo completo de CSS (todas las reglas, en orden)
  // --------------------------------------------------------------
  const parseCSSRules = (cssText) => {
    const rules = []; // { selector, declarations: { prop: value } }
    const cleanCSS = cssText.replace(/\/\*[\s\S]*?\*\//g, "");
    const ruleRegex = /([^{]+)\{([^}]*)\}/g;
    let match;
    while ((match = ruleRegex.exec(cleanCSS)) !== null) {
      let selector = match[1].trim();
      const declarationsStr = match[2].trim();
      if (!declarationsStr) continue;
      // Saltar reglas globales * { ... }
      if (selector === "*") continue;
      const declarations = {};
      declarationsStr.split(";").forEach((rule) => {
        const [prop, val] = rule.split(":").map((s) => s.trim());
        if (prop && val) declarations[prop] = val;
      });
      if (Object.keys(declarations).length > 0) {
        rules.push({ selector, declarations });
      }
    }
    return rules;
  };

  // --------------------------------------------------------------
  // 2. Aplicar estilos a un elemento según las reglas CSS (orden)
  // --------------------------------------------------------------
  const applyStylesFromRules = (element, cssRules) => {
    const appliedStyles = {};
    for (const rule of cssRules) {
      try {
        // Verificar si el elemento cumple con el selector
        if (element.matches && element.matches(rule.selector)) {
          Object.assign(appliedStyles, rule.declarations);
        }
      } catch (e) {
        // Si el selector no es válido, ignorar
        console.warn(`Selector inválido: ${rule.selector}`, e);
      }
    }
    return appliedStyles;
  };

  // --------------------------------------------------------------
  // 3. Convertir propiedades CSS a camelCase
  // --------------------------------------------------------------
  const toCamelCase = (prop) =>
    prop.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

  // --------------------------------------------------------------
  // 4. Fusionar estilos: CSS (de reglas) + inline (mayor prioridad)
  // --------------------------------------------------------------
  const mergeStyles = (element, cssRules, inlineStyleStr = "") => {
    // Estilos desde CSS (todas las reglas que coinciden)
    let finalStyles = applyStylesFromRules(element, cssRules);
    // Estilos inline (sobrescriben)
    if (inlineStyleStr) {
      inlineStyleStr.split(";").forEach((rule) => {
        const [prop, val] = rule.split(":").map((s) => s.trim());
        if (prop && val) finalStyles[prop] = val;
      });
    }
    // Convertir a camelCase
    const camelCaseStyles = {};
    for (const [prop, val] of Object.entries(finalStyles)) {
      camelCaseStyles[toCamelCase(prop)] = val;
    }
    return camelCaseStyles;
  };

  // --------------------------------------------------------------
  // 5. Limpiar comentarios, hr, br y etiquetas no deseadas
  // --------------------------------------------------------------
  const removeUnwantedNodes = (element) => {
    // Lista de etiquetas a eliminar completamente
    const unwantedTags = ["script", "link", "meta", "title", "style"];
    for (let i = element.childNodes.length - 1; i >= 0; i--) {
      const node = element.childNodes[i];
      if (node.nodeType === Node.COMMENT_NODE) {
        element.removeChild(node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        if (unwantedTags.includes(tagName)) {
          element.removeChild(node);
        } else {
          // Eliminar hr y br
          if (tagName === "hr" || tagName === "br") {
            element.removeChild(node);
          } else {
            removeUnwantedNodes(node);
          }
        }
      }
    }
  };

  // --------------------------------------------------------------
  // 6. Mapeo de etiquetas a nombres (igual que original)
  // --------------------------------------------------------------
  const convertTagToName = (tag) => {
    const map = {
      body: "Container",
      div: "Container",
      section: "Container",
      header: "Container",
      nav: "Container",
      footer: "Container",
      form: "Container",
      article: "Container",
      aside: "Container",
      main: "Container",
      span: "Text",
      strong: "Text",
      b: "Text",
      em: "Text",
      h1: "Text",
      h2: "Text",
      h3: "Text",
      h4: "Text",
      h5: "Text",
      h6: "Text",
      label: "Text",
      p: "Text",
      i: "Icon",
      img: "Image",
      button: "Button",
      input: "Input",
      textarea: "Input",
      select: "Select",
      option: "Option",
      a: "Link",
      ol: "O-List",
      ul: "U-List",
      li: "List-Item",
    };
    const lower = tag.toLowerCase();
    return map[lower] || tag.charAt(0).toUpperCase() + tag.slice(1);
  };

  const generateId = () => Date.now() + Math.random().toString(16).slice(2);

  // --------------------------------------------------------------
  // 7. Crear objeto del elemento (con estilos ya fusionados)
  // --------------------------------------------------------------
  const createElementObject = (element, cssRules) => {
    const tagName = element.tagName.toLowerCase();
    const name = convertTagToName(tagName);
    const directText = Array.from(element.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent.trim())
      .join(" ");
    const inlineStyleStr = element.getAttribute("style") || "";
    const mergedStyles = mergeStyles(element, cssRules, inlineStyleStr);
    const newElement = {
      id: generateId(),
      name,
      text: directText || "",
      children: [],
      styles: mergedStyles,
    };
    // Atributos específicos
    if (name === "Input") {
      if (element.placeholder) newElement.placeholder = element.placeholder;
      if (element.type) newElement.type = element.type;
    }
    if (name === "Image" && element.src) newElement.src = element.src;
    if (name === "Icon" && element.className)
      newElement.iconClass = element.className;
    if (name === "Option" && element.value) newElement.value = element.value;
    if (name === "Link" && element.href) newElement.href = element.href;
    // Otros atributos comunes (id, class, etc.) se añaden automáticamente
    Array.from(element.attributes).forEach((attr) => {
      if (attr.name !== "style" && !newElement.hasOwnProperty(attr.name)) {
        newElement[attr.name] = attr.value;
      }
    });
    // Procesar hijos (solo elementos, los textos ya se capturaron)
    Array.from(element.children).forEach((child) => {
      newElement.children.push(createElementObject(child, cssRules));
    });
    return newElement;
  };

  // --------------------------------------------------------------
  // 8. Función principal: extraer HTML + CSS, limpiar, convertir
  // --------------------------------------------------------------
  const convertHtmlCssToObject = () => {
    if (!htmlInput.trim()) {
      setGeneratedObject(null);
      return;
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlInput, "text/html");

    // Extraer todas las etiquetas <style> (tanto en head como en body)
    let allCSS = "";
    const styleTags = doc.querySelectorAll("style");
    styleTags.forEach((styleTag) => {
      allCSS += styleTag.innerHTML;
      styleTag.remove(); // Eliminar del DOM para que no aparezcan en el resultado
    });

    // Eliminar reglas globales * (ya se hará en parseCSSRules, pero también aquí por si acaso)
    // allCSS = allCSS.replace(/\*[^{]*\{[^}]*\}/g, ""); // Ya lo hace parseCSSRules

    // Parsear las reglas CSS (ordenadas)
    const cssRules = parseCSSRules(allCSS);

    // Obtener el contenido a procesar: el <body> o un fragmento si no existe
    let sourceContainer = doc.body;
    if (!sourceContainer || !sourceContainer.children.length) {
      // Si no hay body, usar el contenido del documento completo (sin style porque ya los quitamos)
      const tempDiv = doc.createElement("div");
      tempDiv.innerHTML = doc.documentElement
        ? doc.documentElement.innerHTML
        : htmlInput;
      // Volver a eliminar style por si acaso
      tempDiv.querySelectorAll("style").forEach((s) => s.remove());
      sourceContainer = tempDiv;
    }

    // Crear un wrapper para mantener atributos del body (como class, id, etc.)
    const wrapper = document.createElement("div");
    Array.from(sourceContainer.attributes || []).forEach((attr) => {
      wrapper.setAttribute(attr.name, attr.value);
    });
    wrapper.innerHTML = sourceContainer.innerHTML;

    // Limpiar comentarios, hr, br y etiquetas no deseadas (script, link, meta, title, etc.)
    removeUnwantedNodes(wrapper);

    if (!wrapper.children.length) {
      setGeneratedObject(null);
      return;
    }

    // Construir el objeto raíz (el wrapper que reemplaza al body)
    const rootObject = {
      id: generateId(),
      name: "Container",
      text: "",
      children: Array.from(wrapper.children).map((child) =>
        createElementObject(child, cssRules),
      ),
      styles: mergeStyles(
        wrapper,
        cssRules,
        wrapper.getAttribute("style") || "",
      ),
    };
    // Añadir otros atributos del wrapper (class, id, etc.)
    Array.from(wrapper.attributes).forEach((attr) => {
      if (attr.name !== "style") {
        rootObject[attr.name] = attr.value;
      }
    });

    setGeneratedObject(rootObject);
  };

  // --------------------------------------------------------------
  // 9. Copiar al portapapeles
  // --------------------------------------------------------------
  const handleCopy = () => {
    if (!generatedObject) return;
    const jsonStr = JSON.stringify(generatedObject, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(jsonStr)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => alert("Error al copiar: " + err));
    } else {
      const tempInput = document.createElement("input");
      tempInput.value = jsonStr;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInputChange = (e) => setHtmlInput(e.target.value);

  // --------------------------------------------------------------
  // Render
  // --------------------------------------------------------------
  return (
    <div className="w-full h-screen max-h-screen overflow-y-auto overflow-x-hidden p-[20px] flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-4">
        <div
          className="hover:bg-[rgba(255,255,255,0.3)] p-2 rounded-full cursor-pointer flex items-center justify-center"
          onClick={() => navigate("/")}
        >
          <MdArrowBackIosNew className="text-xl" />
        </div>
        <h1 className="font-semibold text-lg">
          HTML + CSS → Objeto (soporte selectores complejos)
        </h1>
      </div>
      <div className="w-full flex gap-4">
        <div className="w-1/2 flex flex-col gap-4">
          <textarea
            placeholder="Ingresa tu código HTML (puede incluir &lt;style&gt; con selectores como .card p, .card > p, etc.)..."
            value={htmlInput}
            onChange={handleInputChange}
            rows="14"
            className="text-black w-full p-2 border border-gray-300 rounded-md font-mono"
          />
          <button
            onClick={convertHtmlCssToObject}
            className="bg-blue-500 text-white px-4 py-2 rounded-md mt-4 hover:bg-blue-600"
          >
            Convertir a Objeto
          </button>
        </div>
        <div className="w-1/2 relative">
          {generatedObject && (
            <div className="p-4 bg-gray-900 rounded-lg text-white relative">
              <h2 className="text-lg font-semibold">Objeto Generado:</h2>
              <pre className="whitespace-pre-wrap break-words">
                {JSON.stringify(generatedObject, null, 2)}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition flex items-center gap-1"
              >
                <MdContentCopy />
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatGPT;
