// components/CustomCodeEditor.jsx
import React, { useRef, useEffect, useState, useCallback } from "react";
const Editor = React.lazy(() => import("@monaco-editor/react"));
import useStore from "../store/store";

const CustomCodeEditorr = ({
  value: propValue = "",
  onChange,
  language = "javascript",
  readOnly = false,
  onSave,
}) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const {
    selectedPage,
    blocklyCode,
    workspaceState,
    droppedElements: elements,
  } = useStore();

  const [editorValue, setEditorValue] = useState("");

  // Registrar lenguaje JavaScript con español
  const registerJavaScriptLang = (monaco) => {
    monaco.languages.register({ id: "javascript-es" });

    monaco.languages.setMonarchTokensProvider("javascript-es", {
      keywords: [
        "function",
        "class",
        "if",
        "else",
        "while",
        "return",
        "console",
        "true",
        "false",
        "null",
        "undefined",
        "const",
        "let",
        "var",
        "for",
        "do",
        "switch",
        "case",
        "break",
        "continue",
        "try",
        "catch",
        "finally",
        "throw",
        "new",
        "this",
        "typeof",
        "instanceof",
        "async",
        "await",
        "import",
        "export",
        "default",
      ],

      operators: [
        "=",
        "+",
        "-",
        "*",
        "/",
        "%",
        "==",
        "!=",
        "===",
        "!==",
        "<",
        ">",
        "<=",
        ">=",
        "&&",
        "||",
        "!",
        "++",
        "--",
        "+=",
        "-=",
        "*=",
        "/=",
        "%=",
      ],

      builtins: [
        "document",
        "window",
        "console",
        "alert",
        "confirm",
        "prompt",
        "setTimeout",
        "setInterval",
        "clearTimeout",
        "clearInterval",
        "fetch",
        "localStorage",
        "sessionStorage",
        "JSON",
        "Math",
        "Date",
        "Array",
        "Object",
        "String",
        "Number",
        "Boolean",
        "parseInt",
        "parseFloat",
        "isNaN",
        "isFinite",
        "encodeURI",
        "decodeURI",
        "encodeURIComponent",
        "decodeURIComponent",
      ],

      domMethods: [
        "getElementById",
        "getElementsByClassName",
        "getElementsByTagName",
        "querySelector",
        "querySelectorAll",
        "createElement",
        "createTextNode",
        "appendChild",
        "removeChild",
        "replaceChild",
        "insertBefore",
        "addEventListener",
        "removeEventListener",
        "setAttribute",
        "getAttribute",
        "classList",
        "style",
        "innerHTML",
        "innerText",
        "textContent",
        "value",
      ],

      tokenizer: {
        root: [
          [
            /\b(?:function|class|if|else|while|return|const|let|var)\b/,
            "keyword",
          ],
          [/\b(?:true|false|null|undefined)\b/, "constant"],
          [
            /\b(?:console|document|window|localStorage|sessionStorage)\b/,
            "type",
          ],
          [/\b(?:Math|Date|JSON|Array|Object|String|Number)\b/, "class"],
          [
            /\b(?:getElementById|querySelector|addEventListener|fetch)\b/,
            "function",
          ],
          [/[{}()[\]]/, "@brackets"],
          [/\/\/.*$/, "comment"],
          [/\/\*/, "comment", "@comment"],
          [/".*?"|'.*?'|`.*?`/, "string"],
          [/\d+/, "number"],
          [/[+\-*/%=<>!&|]+/, "operator"],
          [/[a-zA-Z_$][\w$]*/, "identifier"],
        ],
        comment: [
          [/[^/*]+/, "comment"],
          [/\*\//, "comment", "@pop"],
          [/[/*]/, "comment"],
        ],
      },
    });
  };

  // Tema oscuro para JavaScript
  const defineJavaScriptTheme = (monaco) => {
    monaco.editor.defineTheme("javascript-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6c7086", fontStyle: "italic" },
        { token: "keyword", foreground: "cba6f7", fontStyle: "bold" },
        { token: "constant", foreground: "fab387" },
        { token: "string", foreground: "a6e3a1" },
        { token: "number", foreground: "fab387" },
        { token: "operator", foreground: "89b4fa" },
        { token: "type", foreground: "f9e2af" },
        { token: "function", foreground: "89dceb" },
        { token: "class", foreground: "f9e2af" },
        { token: "identifier", foreground: "cdd6f4" },
      ],
      colors: {
        "editor.background": "#1e1e2e",
        "editor.foreground": "#cdd6f4",
        "editor.lineHighlightBackground": "#313244",
        "editor.selectionBackground": "#45475a",
        "editorCursor.foreground": "#f5e0dc",
        "editorLineNumber.foreground": "#6c7086",
        "editorLineNumber.activeForeground": "#cdd6f4",
      },
    });
  };

  // Intellisense para JavaScript
  const registerJavaScriptIntellisense = (monaco, elementsList) => {
    const elementIds = elementsList.map((el) => el.id.toString());

    return monaco.languages.registerCompletionItemProvider("javascript-es", {
      triggerCharacters: [".", '"', "'", "(", " ", "\n", "[", "`"],

      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.word ? word.startColumn : position.column,
          endColumn: word.word ? word.endColumn : position.column,
        };

        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        let suggestions = [];

        // 1. IDS en getElementById("")
        const idPattern = /\.getElementById\s*\(\s*["']([^"']*)$/;
        const queryPattern = /\.querySelector\s*\(\s*["']([^"']*)$/;

        if (idPattern.test(textUntilPosition)) {
          suggestions = elementIds.map((id) => ({
            label: id,
            kind: monaco.languages.CompletionItemKind.Value,
            insertText: id,
            range,
            detail: "🔹 ID de elemento",
            documentation: `Elemento con ID: ${id}`,
          }));
          return { suggestions };
        }

        if (queryPattern.test(textUntilPosition)) {
          suggestions = [
            ...elementIds.map((id) => ({
              label: `#${id}`,
              kind: monaco.languages.CompletionItemKind.Value,
              insertText: `#${id}`,
              range,
              detail: "🔹 Selector por ID",
            })),
            ...elementIds.map((id) => ({
              label: `.${id}`,
              kind: monaco.languages.CompletionItemKind.Value,
              insertText: `.${id}`,
              range,
              detail: "🔹 Selector por clase",
            })),
          ];
          return { suggestions };
        }

        // 2. Propiedades y métodos después de .
        const dotMatch = textUntilPosition.match(/([a-zA-Z_$][\w$]*)\.$/);

        if (dotMatch) {
          const objectName = dotMatch[1];
          const completions = {
            document: [
              {
                label: "getElementById",
                kind: "Method",
                snippet: "getElementById(${1:'id'})",
              },
              {
                label: "querySelector",
                kind: "Method",
                snippet: "querySelector(${1:'selector'})",
              },
              {
                label: "querySelectorAll",
                kind: "Method",
                snippet: "querySelectorAll(${1:'selector'})",
              },
              {
                label: "createElement",
                kind: "Method",
                snippet: "createElement(${1:'div'})",
              },
              { label: "body", kind: "Property" },
              { label: "head", kind: "Property" },
              { label: "title", kind: "Property" },
            ],
            console: [
              { label: "log", kind: "Method", snippet: "log(${1:message})" },
              { label: "error", kind: "Method", snippet: "error(${1:error})" },
              { label: "warn", kind: "Method", snippet: "warn(${1:warning})" },
              { label: "info", kind: "Method", snippet: "info(${1:info})" },
            ],
            localStorage: [
              {
                label: "setItem",
                kind: "Method",
                snippet: "setItem(${1:'key'}, ${2:value})",
              },
              {
                label: "getItem",
                kind: "Method",
                snippet: "getItem(${1:'key'})",
              },
              {
                label: "removeItem",
                kind: "Method",
                snippet: "removeItem(${1:'key'})",
              },
              { label: "clear", kind: "Method", snippet: "clear()" },
            ],
            Math: [
              { label: "random", kind: "Method", snippet: "random()" },
              { label: "floor", kind: "Method", snippet: "floor(${1:number})" },
              { label: "ceil", kind: "Method", snippet: "ceil(${1:number})" },
              { label: "round", kind: "Method", snippet: "round(${1:number})" },
              { label: "max", kind: "Method", snippet: "max(${1:...numbers})" },
              { label: "min", kind: "Method", snippet: "min(${1:...numbers})" },
            ],
          };

          if (completions[objectName]) {
            suggestions = completions[objectName].map((item) => ({
              label: item.label,
              kind: monaco.languages.CompletionItemKind[
                item.kind === "Method" ? "Method" : "Property"
              ],
              insertText: item.snippet || item.label,
              insertTextRules: item.snippet
                ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                : undefined,
              range,
              detail: `🔹 ${objectName}.${item.label}`,
            }));
            return { suggestions };
          }
        }

        // 3. Palabras clave generales
        const keywords = [
          {
            label: "function",
            snippet: "function ${1:name}(${2:params}) {\n\t${3:// code}\n}",
          },
          { label: "const", snippet: "const ${1:name} = ${2:value}" },
          { label: "let", snippet: "let ${1:name} = ${2:value}" },
          { label: "var", snippet: "var ${1:name} = ${2:value}" },
          { label: "if", snippet: "if (${1:condition}) {\n\t${2:// code}\n}" },
          { label: "else", snippet: "else {\n\t${1:// code}\n}" },
          {
            label: "for",
            snippet:
              "for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n\t${3:// code}\n}",
          },
          {
            label: "while",
            snippet: "while (${1:condition}) {\n\t${2:// code}\n}",
          },
          {
            label: "try",
            snippet:
              "try {\n\t${1:// code}\n} catch(${2:error}) {\n\t${3:// handle error}\n}",
          },
          {
            label: "arrow function",
            snippet: "(${1:params}) => ${2:expression}",
          },
          {
            label: "addEventListener",
            snippet:
              "addEventListener('${1:click}', () => {\n\t${2:// code}\n})",
          },
          {
            label: "fetch",
            snippet:
              "fetch('${1:url}')\n\t.then(response => response.json())\n\t.then(data => {\n\t\t${2:// handle data}\n\t})",
          },
          {
            label: "setTimeout",
            snippet: "setTimeout(() => {\n\t${1:// code}\n}, ${2:1000})",
          },
          {
            label: "setInterval",
            snippet: "setInterval(() => {\n\t${1:// code}\n}, ${2:1000})",
          },
        ];

        suggestions = keywords.map((kw) => ({
          label: kw.label,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: kw.snippet,
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: `🔷 ${kw.label}`,
        }));

        return { suggestions };
      },
    });
  };

  // Manejar el montaje del editor
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    registerJavaScriptLang(monaco);
    defineJavaScriptTheme(monaco);
    const dispose = registerJavaScriptIntellisense(monaco, elements);

    monaco.editor.setTheme("javascript-dark");

    editor.updateOptions({
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      lineNumbers: "on",
      minimap: { enabled: true },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      bracketPairColorization: { enabled: true },
      formatOnPaste: true,
      formatOnType: true,
      suggestOnTriggerCharacters: true,
      quickSuggestions: { other: true, comments: true, strings: true },
      acceptSuggestionOnEnter: "on",
      tabCompletion: "on",
      wordBasedSuggestions: true,
      parameterHints: { enabled: true },
    });

    // Guardar con Ctrl+S
    const saveCode = () => {
      if (editorRef.current && onSave) {
        const code = editorRef.current.getValue();
        setEditorValue(code);
        onSave(code, code); // JavaScript es el código final
      }
    };

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, saveCode);
  };

  const handleChange = (value) => {
    setEditorValue(value || "");
    if (onChange) {
      onChange(value);
    }
  };

  useEffect(() => {
    // Cargar código JavaScript guardado
    if (workspaceState && workspaceState.trim() !== "") {
      setEditorValue(workspaceState);
    } else if (propValue && propValue.trim() !== "") {
      setEditorValue(propValue);
    } else {
      setEditorValue(`// JavaScript Editor - Código directo
// Los IDs de tus elementos aparecerán automáticamente

// Ejemplo de código:
console.log("¡Hola desde JavaScript!");

// Obtener elementos del DOM
const miElemento = document.getElementById("");

// Agregar eventos
document.getElementById("btn").addEventListener("click", () => {
    alert("¡Click detectado!");
});

// Fetch API
fetch('https://api.example.com/data')
    .then(response => response.json())
    .then(data => console.log(data));
`);
    }
  }, [workspaceState, propValue, elements]);

  return (
    <div className="w-full h-full relative flex flex-col">
      <div className="h-[6vh] w-full bg-[#1e1e2e] flex items-center border-b border-[#313244] px-4">
        {selectedPage ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#a6e3a1]">📄</span>
            <span className="text-sm text-[#cdd6f4]">{selectedPage}.js</span>
            <span className="ml-2 text-xs text-[#6c7086] bg-[#313244] px-2 py-0.5 rounded-full">
              JavaScript
            </span>
            <button
              onClick={() => {
                if (editorRef.current && onSave) {
                  const code = editorRef.current.getValue();
                  onSave(code, code);
                }
              }}
              className="ml-4 px-3 py-1 text-xs bg-[#313244] text-[#a6e3a1] rounded hover:bg-[#45475a] transition-colors"
            >
              💾 Guardar
            </button>
          </div>
        ) : (
          <div className="text-sm text-[#6c7086] italic">
            ⚠️ Sin página seleccionada
          </div>
        )}
        <div className="ml-auto text-xs text-[#6c7086]">
          {editorRef.current && (
            <span>
              Ln {editorRef.current.getPosition()?.lineNumber || 1}, Col{" "}
              {editorRef.current.getPosition()?.column || 1}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1">
        <Editor
          height="100%"
          width="100%"
          language="javascript-es"
          theme="javascript-dark"
          value={editorValue}
          onChange={handleChange}
          onMount={handleEditorDidMount}
          path={selectedPage ? `${selectedPage}.js` : "unknown.js"}
          options={{
            readOnly: readOnly,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            minimap: { enabled: true, size: "fit" },
            lineNumbers: "on",
            folding: true,
            fontSize: 14,
            fontFamily: 'Consolas, "Courier New", monospace',
            quickSuggestions: { other: true, comments: true, strings: true },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: "on",
            tabCompletion: "on",
            parameterHints: { enabled: true },
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>
    </div>
  );
};

export default CustomCodeEditorr;
