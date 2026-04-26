// utils/htmlGenerator.js
import { uploadGeneratedFileToS3 } from "./uploadToS3SDK";

// Convierte camelCase a kebab-case para CSS
const camelToKebab = (str) => {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
};

// Convierte objeto de estilos a string CSS
const styleDictToString = (styles) => {
  if (!styles) return "";
  return Object.entries(styles)
    .filter(([_, value]) => value && value !== "" && value !== "undefined")
    .map(([key, value]) => `${camelToKebab(key)}: ${value};`)
    .join(" ");
};

// Renderiza un solo elemento a HTML
const renderElement = (element) => {
  if (!element || typeof element !== "object") return "";

  const {
    id = "",
    name = "",
    text = "",
    children = [],
    styles = {},
    iconClass = "",
    placeholder = "",
    type = "",
    value = "",
    href = "",
    src = "",
    animation = "",
    duracionanim = "",
    retrasoanim = "",
  } = element;

  // Mapeo de nombres a etiquetas HTML
  const tagMap = {
    Container: "div",
    Text: "h3",
    Icon: "i",
    Image: "img",
    Link: "a",
    "O-List": "ol",
    "U-List": "ul",
    "List-Item": "li",
    Input: "input",
    Button: "button",
    Select: "select",
    Option: "option",
  };

  const tag = tagMap[name] || name?.toLowerCase() || "div";

  // Atributos comunes
  const attributes = {
    id: id ? `id="${id}"` : "",
    class: iconClass ? `class="${iconClass}"` : "",
    placeholder: placeholder ? `placeholder="${placeholder}"` : "",
    type: type ? `type="${type}"` : "",
    value: value ? `value="${value}"` : "",
    href: href ? `href="${href}"` : "",
    src: src ? `src="${src}"` : "",
    "data-aos": animation ? `data-aos="${animation}"` : "",
    "data-aos-duration": duracionanim ? `data-aos-duration="${duracionanim}"` : "",
    "data-aos-delay": retrasoanim ? `data-aos-delay="${retrasoanim}"` : "",
  };

  const styleString = styleDictToString(styles);
  const styleAttr = styleString ? `style="${styleString}"` : "";

  // Etiquetas auto-cerradas
  const selfClosingTags = ["input", "img", "br", "hr", "meta", "link"];
  const isSelfClosing = selfClosingTags.includes(tag);

  // Renderizar hijos recursivamente
  const childrenHtml = children.map(renderElement).join("");

  if (isSelfClosing) {
    return `<${tag} ${attributes.id} ${attributes.class} ${styleAttr} ${attributes.placeholder} ${attributes.type} ${attributes.value} ${attributes.href} ${attributes.src} ${attributes["data-aos"]} ${attributes["data-aos-duration"]} ${attributes["data-aos-delay"]} />`;
  }

  // Para elementos con apertura y cierre
  const content = text || childrenHtml || "";
  return `<${tag} ${attributes.id} ${attributes.class} ${styleAttr} ${attributes.href} ${attributes.src}>${content}</${tag}>`;
};

// Genera el HTML completo a partir de los elementos
export const generateHTML = (droppedElements) => {
  if (!droppedElements || droppedElements.length === 0) return "";
  return droppedElements.map(renderElement).join("");
};

// Genera el CSS a partir de los estilos globales
export const generateCSS = (globalStyles) => {
  if (!globalStyles || globalStyles.length === 0) return "";
  
  const cssRules = [];
  for (const style of globalStyles) {
    const className = style.name;
    const styles = style.styles || {};
    
    const validStyles = Object.entries(styles)
      .filter(([_, value]) => value && value !== "" && value !== "undefined")
      .map(([key, value]) => `${camelToKebab(key)}: ${value};`)
      .join(" ");
    
    if (validStyles) {
      cssRules.push(`.${className} { ${validStyles} }`);
    }
  }
  
  return cssRules.join("\n");
};

// Genera el HTML completo con plantilla
export const generateFullHTML = (bodyContent, cssContent, pageName, jsCode = "") => {
  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageName}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/boxicons@latest/css/boxicons.min.css">
    <link rel="stylesheet" href="https://unpkg.com/aos@next/dist/aos.css" />
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Oswald:wght@200..700&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap');
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body, html {
            width: 100%;
            height: 100vh;
            position: relative;
            scroll-behavior: smooth;
        }
        ${cssContent}
    </style>
</head>
<body data-aos-easing="ease" data-aos-duration="400" data-aos-delay="0">
    ${bodyContent}
    <script src="https://unpkg.com/aos@next/dist/aos.js"></script>
    <script>
        AOS.init();
    </script>
    <script>
        ${jsCode}
    </script>
</body>
</html>`;
};

// Función principal para guardar el proyecto generado
export const generateAndSaveProject = async (
  userId,
  projectId,
  pageName,
  droppedElements,
  globalStyles,
  jsCode,
  onProgress
) => {
  try {
    // 1. Generar HTML y CSS
    const bodyContent = generateHTML(droppedElements);
    const cssContent = generateCSS(globalStyles);
    const fullHtml = generateFullHTML(bodyContent, cssContent, pageName, jsCode);
    
    // 2. Guardar en S3
    const key = `users/${userId}/projects/${projectId}/pages/${pageName}.html`;
    const blob = new Blob([fullHtml], { type: "text/html" });
    const file = new File([blob], `${pageName}.html`, { type: "text/html" });
    
    const url = await uploadGeneratedFileToS3(file, key, onProgress);
    
    console.log("✅ Archivo HTML generado y subido:", url);
    return { url, key };
  } catch (error) {
    console.error("❌ Error generando proyecto:", error);
    throw error;
  }
};