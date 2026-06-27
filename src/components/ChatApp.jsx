import React, { useState, useRef, useEffect } from "react";
import useStore from "../store/store";
import { IoIosSend } from "react-icons/io";

// ============================================================
//  CONSTANTES
// ============================================================
const API_KEY = "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";

// ============================================================
//  UTILIDADES DE MARKDOWN (versión web)
// ============================================================
const processMarkdown = (text) => {
  if (!text) return [];

  const parts = text.split(/(```[\s\S]*?```)/g);
  const result = [];

  parts.forEach((part, index) => {
    if (part.startsWith("```")) {
      const lines = part.split("\n");
      const lang = lines[0].replace("```", "").trim() || "text";
      const code = lines.slice(1, -1).join("\n");
      result.push({ type: "code", lang, code, key: `code-${index}` });
    } else {
      const lines = part.split("\n");
      lines.forEach((line, lineIndex) => {
        if (!line.trim()) {
          result.push({ type: "empty", key: `empty-${index}-${lineIndex}` });
          return;
        }

        const headerMatch = line.match(/^(#{1,3})\s+(.+)/);
        if (headerMatch) {
          const level = headerMatch[1].length;
          const content = headerMatch[2];
          result.push({
            type: "header",
            level,
            content,
            key: `header-${index}-${lineIndex}`,
          });
          return;
        }

        const listMatch = line.match(/^-\s+(.+)/);
        if (listMatch) {
          result.push({
            type: "list",
            content: listMatch[1],
            key: `list-${index}-${lineIndex}`,
          });
          return;
        }

        // Texto con formato inline (negritas y cursivas)
        let processed = line;
        const boldParts = processed.split(/\*\*(.+?)\*\*/g);
        if (boldParts.length > 1) {
          const formatted = [];
          boldParts.forEach((p, i) => {
            if (i % 2 === 1) {
              formatted.push({ type: "bold", content: p });
            } else if (p) {
              formatted.push({ type: "text", content: p });
            }
          });
          result.push({
            type: "formatted",
            parts: formatted,
            key: `formatted-${index}-${lineIndex}`,
          });
        } else {
          const italicParts = processed.split(/\*(.+?)\*/g);
          if (italicParts.length > 1) {
            const formatted = [];
            italicParts.forEach((p, i) => {
              if (i % 2 === 1) {
                formatted.push({ type: "italic", content: p });
              } else if (p) {
                formatted.push({ type: "text", content: p });
              }
            });
            result.push({
              type: "formatted",
              parts: formatted,
              key: `formatted-${index}-${lineIndex}`,
            });
          } else {
            result.push({
              type: "text",
              content: processed,
              key: `text-${index}-${lineIndex}`,
            });
          }
        }
      });
    }
  });

  return result;
};

// ============================================================
//  CONVERSIÓN HTML + CSS → OBJETO (adaptado del componente ChatGPT)
// ============================================================
const convertHtmlToObject = (htmlString) => {
  if (!htmlString || !htmlString.trim()) return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");

  // Extraer todo el CSS de las etiquetas <style>
  let allCSS = "";
  const styleTags = doc.querySelectorAll("style");
  styleTags.forEach((styleTag) => {
    allCSS += styleTag.innerHTML;
    styleTag.remove();
  });

  // Parsear reglas CSS (ordenadas)
  const parseCSSRules = (cssText) => {
    const rules = [];
    const cleanCSS = cssText.replace(/\/\*[\s\S]*?\*\//g, "");
    const ruleRegex = /([^{]+)\{([^}]*)\}/g;
    let match;
    while ((match = ruleRegex.exec(cleanCSS)) !== null) {
      const selector = match[1].trim();
      const declarationsStr = match[2].trim();
      if (!declarationsStr || selector === "*") continue;
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

  const cssRules = parseCSSRules(allCSS);

  // Aplicar estilos desde reglas CSS
  const applyStylesFromRules = (element, rules) => {
    const applied = {};
    for (const rule of rules) {
      try {
        if (element.matches && element.matches(rule.selector)) {
          Object.assign(applied, rule.declarations);
        }
      } catch (_) {
        /* ignorar selectores inválidos */
      }
    }
    return applied;
  };

  // Convertir a camelCase
  const toCamelCase = (prop) =>
    prop.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

  // Fusionar estilos: CSS + inline
  const mergeStyles = (element, rules, inlineStyleStr = "") => {
    let finalStyles = applyStylesFromRules(element, rules);
    if (inlineStyleStr) {
      inlineStyleStr.split(";").forEach((rule) => {
        const [prop, val] = rule.split(":").map((s) => s.trim());
        if (prop && val) finalStyles[prop] = val;
      });
    }
    const camelCaseStyles = {};
    for (const [prop, val] of Object.entries(finalStyles)) {
      camelCaseStyles[toCamelCase(prop)] = val;
    }
    return camelCaseStyles;
  };

  // Limpiar nodos no deseados
  const removeUnwantedNodes = (element) => {
    const unwantedTags = ["script", "link", "meta", "title", "style"];
    for (let i = element.childNodes.length - 1; i >= 0; i--) {
      const node = element.childNodes[i];
      if (node.nodeType === Node.COMMENT_NODE) {
        element.removeChild(node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        if (
          unwantedTags.includes(tagName) ||
          tagName === "hr" ||
          tagName === "br"
        ) {
          element.removeChild(node);
        } else {
          removeUnwantedNodes(node);
        }
      }
    }
  };

  // Mapeo de etiquetas a nombres
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

  // Crear objeto del elemento
  const createElementObject = (element, rules) => {
    const tagName = element.tagName.toLowerCase();
    const name = convertTagToName(tagName);
    const directText = Array.from(element.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent.trim())
      .join(" ");
    const inlineStyleStr = element.getAttribute("style") || "";
    const mergedStyles = mergeStyles(element, rules, inlineStyleStr);

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
    // Otros atributos (id, class, etc.)
    Array.from(element.attributes).forEach((attr) => {
      if (attr.name !== "style" && !newElement.hasOwnProperty(attr.name)) {
        newElement[attr.name] = attr.value;
      }
    });

    // Procesar hijos (solo elementos)
    Array.from(element.children).forEach((child) => {
      newElement.children.push(createElementObject(child, rules));
    });

    return newElement;
  };

  // Obtener el contenedor raíz (body o un wrapper)
  let sourceContainer = doc.body;
  if (!sourceContainer || !sourceContainer.children.length) {
    const tempDiv = doc.createElement("div");
    tempDiv.innerHTML = doc.documentElement
      ? doc.documentElement.innerHTML
      : htmlString;
    tempDiv.querySelectorAll("style").forEach((s) => s.remove());
    sourceContainer = tempDiv;
  }

  // Wrapper para mantener atributos del body
  const wrapper = document.createElement("div");
  Array.from(sourceContainer.attributes || []).forEach((attr) => {
    wrapper.setAttribute(attr.name, attr.value);
  });
  wrapper.innerHTML = sourceContainer.innerHTML;
  removeUnwantedNodes(wrapper);

  if (!wrapper.children.length) return null;

  // Objeto raíz
  const rootObject = {
    id: generateId(),
    name: "Container",
    text: "",
    children: Array.from(wrapper.children).map((child) =>
      createElementObject(child, cssRules),
    ),
    styles: mergeStyles(wrapper, cssRules, wrapper.getAttribute("style") || ""),
  };
  Array.from(wrapper.attributes).forEach((attr) => {
    if (attr.name !== "style") {
      rootObject[attr.name] = attr.value;
    }
  });

  return rootObject;
};

// ============================================================
//  COMPONENTE DE CARGA (puntos animados con CSS)
// ============================================================
const LoadingDots = () => (
  <div className="flex items-center space-x-1.5 py-1">
    <span
      className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-pulse"
      style={{ animationDelay: "0ms" }}
    />
    <span
      className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-pulse"
      style={{ animationDelay: "200ms" }}
    />
    <span
      className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-pulse"
      style={{ animationDelay: "400ms" }}
    />
  </div>
);

// ============================================================
//  COMPONENTE DE BLOQUE DE CÓDIGO
// ============================================================
const CodeBlock = ({ code, lang }) => (
  <div className="my-2 rounded-lg overflow-hidden border border-gray-700 bg-[#0d1117] max-h-[500px] flex flex-col">
    <div className="px-3 py-1 bg-[#161b22] border-b border-gray-700">
      <span className="text-xs text-gray-400 uppercase font-medium">
        {lang}
      </span>
    </div>
    <div className="overflow-auto p-3">
      <pre className="text-sm text-gray-200 font-mono whitespace-pre-wrap break-words">
        {code}
      </pre>
    </div>
  </div>
);

// ============================================================
//  COMPONENTE DE MENSAJE
// ============================================================
const MessageItem = ({ message }) => {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const isSystem = message.role === "system";
  const isSuccess = message.role === "success";

  let bgClass = "bg-[#21262d] border border-gray-700 text-white";
  let align = "self-start";
  let rounded = "rounded-bl-none";

  if (isUser) {
    bgClass = "bg-indigo-600 text-white";
    align = "self-end";
    rounded = "rounded-br-none";
  } else if (isSystem || isSuccess) {
    bgClass = "bg-gray-800 text-gray-300 border border-gray-700";
    align = "self-start";
    rounded = "rounded-bl-none";
  }

  const parsedContent = processMarkdown(message.content);

  const renderContent = () => {
    return parsedContent.map((part) => {
      switch (part.type) {
        case "code":
          return <CodeBlock key={part.key} code={part.code} lang={part.lang} />;

        case "header":
          const headerSize =
            part.level === 1
              ? "text-xl"
              : part.level === 2
                ? "text-lg"
                : "text-base";
          return (
            <div
              key={part.key}
              className={`font-bold ${headerSize} mt-2 mb-1 text-white`}
            >
              {part.content}
            </div>
          );

        case "list":
          return (
            <div key={part.key} className="flex items-start gap-2 my-1">
              <span className="text-indigo-400">•</span>
              <span className="text-white">{part.content}</span>
            </div>
          );

        case "formatted":
          return (
            <span key={part.key} className="text-white">
              {part.parts.map((sub, idx) => {
                if (sub.type === "bold")
                  return <strong key={idx}>{sub.content}</strong>;
                if (sub.type === "italic")
                  return <em key={idx}>{sub.content}</em>;
                return <span key={idx}>{sub.content}</span>;
              })}
            </span>
          );

        case "text":
          return (
            <span key={part.key} className="text-white">
              {part.content}
            </span>
          );

        case "empty":
          return <div key={part.key} className="h-2" />;

        default:
          return null;
      }
    });
  };

  return (
    <div
      className={`max-w-[85%] p-3 rounded-xl shadow-md mb-3 ${bgClass} ${align} ${rounded}`}
    >
      {isSuccess && (
        <div className="flex items-center gap-2 text-green-400 font-medium">
          <span>✅</span> {message.content}
        </div>
      )}
      {isSystem && (
        <div className="text-sm text-gray-400">{message.content}</div>
      )}
      {(isUser || isAssistant) && renderContent()}
    </div>
  );
};

// ============================================================
//  COMPONENTE PRINCIPAL ChatUI
// ============================================================
const ChatUI = () => {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content:
        "¡Hola! Soy **SIZAE AI**. Descríbeme qué interfaz necesitas y la generaré.\n\nEjemplo: *'Crea un formulario de login moderno con validación'*",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { setDroppedElements } = useStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Extraer el código HTML de la respuesta (dentro de bloques ```html ... ```)
  const extractHtmlCode = (text) => {
    const regex = /```(?:html|HTML)?\s*([\s\S]*?)```/g;
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1].trim());
    }
    // Si no hay bloque con html, buscar cualquier bloque de código
    if (matches.length === 0) {
      const fallbackRegex = /```([\s\S]*?)```/g;
      while ((match = fallbackRegex.exec(text)) !== null) {
        matches.push(match[1].trim());
      }
    }
    return matches;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const loadingId = "loading-" + Date.now();
    setMessages((prev) => [
      ...prev,
      { id: loadingId, role: "loading", content: "" },
    ]);

    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content: `
Eres un experto desarrollador frontend.
Genera código HTML, CSS y JavaScript para la interfaz que el usuario te pida.
Siempre proporciona el código completo en un solo bloque de código HTML que incluya CSS dentro de etiquetas <style> y JavaScript si es necesario.
Usa formato Markdown para mejorar la presentación:
- **negritas** para énfasis
- *cursivas* para términos técnicos
- ## títulos para secciones
- - listas para enumerar pasos
`,
              },
              {
                role: "user",
                content: input.trim(),
              },
            ],
          }),
        },
      );

      const data = await response.json();

      // Eliminar mensaje de loading
      setMessages((prev) => prev.filter((m) => m.id !== loadingId));

      if (data.choices && data.choices.length > 0) {
        const content = data.choices[0].message.content;

        // Intentar extraer código HTML de la respuesta
        const htmlBlocks = extractHtmlCode(content);

        if (htmlBlocks.length > 0) {
          // Tomar el primer bloque (asumimos que es el HTML completo)
          const htmlCode = htmlBlocks[0];
          const obj = convertHtmlToObject(htmlCode);

          if (obj) {
            // Setear en el store
            setDroppedElements([obj]);

            // Mensaje de éxito
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                role: "success",
                content:
                  "✅ Vista generada exitosamente. El diseño se ha actualizado.",
              },
            ]);
          } else {
            // Fallo al convertir
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                role: "assistant",
                content:
                  "Pude extraer el código HTML, pero no pude convertirlo a un objeto válido. Intenta con una descripción más clara.",
              },
            ]);
          }
        } else {
          // No se encontró bloque de código, mostrar la respuesta tal cual
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "assistant",
              content,
            },
          ]);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: "No se recibió una respuesta válida de la IA.",
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== loadingId));
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `❌ Error: ${error.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-white rounded-md">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#161b22] border-b border-gray-700 rounded-t-md">
        <h1 className="text-xl font-semibold">✦ Baboo AI</h1>
        <div className="bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-300">
          ⚡ SIZAE 1.1
        </div>
      </div>

      {/* Lista de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          if (msg.role === "loading") {
            return (
              <div
                key={msg.id}
                className="self-start max-w-[85%] p-3 rounded-xl bg-[#21262d] border border-gray-700"
              >
                <LoadingDots />
              </div>
            );
          }
          return <MessageItem key={msg.id} message={msg} />;
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-700 p-3 bg-[#161b22] rounded-b-md">
        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            className="flex-1 bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Describe tu interfaz…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={loading}
            style={{ minHeight: "48px", maxHeight: "120px" }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className={`px-5 py-2 rounded-lg font-medium transition ${
              loading || !input.trim()
                ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            <IoIosSend />
          </button>
        </div>  
      </div>
    </div>
  );
};

export default ChatUI;
