// components/CustomCodeEditor.jsx
import React, { useRef, useEffect, useState, useCallback } from "react";
const Editor = React.lazy(() => import("@monaco-editor/react"));
import useStore from "../store/store";
import { Lexer, Parser, JSGenerator, Interpreter } from "./blockly/compiler";

// Función recursiva para recolectar IDs (igual que en Blockly)
const collectElementIds = (elements) => {
  let ids = [];
  elements.forEach((el) => {
    ids.push(el.id.toString());
    if (el.children && el.children.length > 0) {
      ids = ids.concat(collectElementIds(el.children));
    }
  });
  return ids;
};

const LANGUAGE_TYPES = {
  documento: {
    methods: ["elemento", "crearElemento", "seleccionar"],
    type: "Documento",
  },

  Elemento: {
    methods: ["evento", "agregarClase", "quitarClase", "alternarClase"],
    properties: ["texto", "html", "valor", "clase"],
  },
};

const CustomCodeEditor = ({
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

  // Función para detectar si estamos en un contexto donde sugerir IDs
  const isInIdContext = useCallback((model, position) => {
    const textUntilPosition = model.getValueInRange({
      startLineNumber: position.lineNumber,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    });

    // Detectar documento.elemento("...
    const patternElemento = /documento\.elemento\s*\(\s*["'][^"']*$/;

    // Detectar también cuando ya estamos dentro de cualquier string
    const patternInsideString = /["'][^"']*$/;

    return (
      patternElemento.test(textUntilPosition) ||
      patternInsideString.test(textUntilPosition)
    );
  }, []);

  // Función para obtener el rango de la palabra actual
  const getCurrentWordRange = useCallback((model, position) => {
    // Encontrar el inicio de las comillas
    const textUntilPosition = model.getValueInRange({
      startLineNumber: position.lineNumber,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    });

    // Buscar la última comilla
    const lastQuoteIndex = Math.max(
      textUntilPosition.lastIndexOf('"'),
      textUntilPosition.lastIndexOf("'"),
    );

    if (lastQuoteIndex !== -1) {
      // Estamos dentro de comillas, el rango comienza después de la comilla
      return {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: lastQuoteIndex + 2, // +2 porque los índices en Monaco empiezan en 1
        endColumn: position.column,
      };
    }

    // Si no encontramos comillas, usar el método por defecto
    const word = model.getWordUntilPosition(position);

    if (word.word) {
      return {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };
    }

    return {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: position.column,
      endColumn: position.column,
    };
  }, []);

  const registerEspanolLang = (monaco) => {
    monaco.languages.register({ id: "espanol-lang" });

    monaco.languages.setMonarchTokensProvider("espanol-lang", {
      keywords: [
        "funcion",
        "clase",
        "si",
        "sino",
        "mientras",
        "retornar",
        "imprimir",
        "intentar",
        "atrapar",
        "verdadero",
        "falso",
        "nulo",
        "y",
        "o",
        "no",
        "este",
      ],

      builtins: [
        "documento",
        "alerta",
        "navegar",
        "confirmar",
        "preguntar",
        "temporizador",
        "intervalo",
        "limpiarIntervalo",
        "limpiarTemporizador",
        "recargar",
        "atras",
        "adelante",
        "anchoPantalla",
        "altoPantalla",
        "imprimirConsola",
        "errorConsola",
        "advertenciaConsola",
      ],

      domMethods: [
        "elemento",
        "crearElemento",
        "seleccionar",
        "evento",
        "agregarClase",
        "quitarClase",
        "alternarClase",
      ],

      domProps: ["texto", "html", "valor", "clase"],

      operators: ["=", "+", "-", "*", "/", "==", "!=", "<", ">", "<=", ">="],

      tokenizer: {
        root: [
          [
            /[a-zA-Z_]\w*/,
            {
              cases: {
                "@keywords": "keyword",
                "@builtins": "type",
                "@domMethods": "function",
                "@domProps": "property",
                "@default": "variable",
              },
            },
          ],

          { include: "@whitespace" },

          [/\d+/, "number"],
          [/".*?"/, "string"],
          [/==|!=|<=|>=|[+\-*/=<>]/, "operator"],
          [/[{}()\[\]]/, "@brackets"],
          [/:/, "delimiter"],
          [/,/, "delimiter"],
        ],

        whitespace: [
          [/[ \t\r\n]+/, ""],
          [/\/\/.*$/, "comment"],
        ],
      },
    });
  };

  const defineEspanolDarkTheme = (monaco) => {
    monaco.editor.defineTheme("espanol-dark-pro", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", background: "1e1e2e" },

        { token: "comment", foreground: "6c7086", fontStyle: "italic" },

        { token: "keyword", foreground: "cba6f7", fontStyle: "bold" },

        { token: "number", foreground: "fab387" },

        { token: "string", foreground: "a6e3a1" },

        { token: "operator", foreground: "89b4fa" },

        { token: "type", foreground: "f9e2af" },

        { token: "function", foreground: "89dceb" },

        { token: "property", foreground: "f38ba8" },

        { token: "variable", foreground: "cdd6f4" },
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

  const registerFullIntellisense = (monaco, elementsList) => {
    const elementIds = collectElementIds(elementsList);

    return monaco.languages.registerCompletionItemProvider("espanol-lang", {
      triggerCharacters: [".", '"', "'", "("],

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

        /* =========================================
         1️⃣ DESPUÉS DE .
      ========================================== */

        const dotMatch = textUntilPosition.match(/([a-zA-Z_]\w*)\.$/);

        if (dotMatch) {
          const objectName = dotMatch[1];

          if (objectName === "documento") {
            suggestions = LANGUAGE_TYPES.documento.methods.map((method) => ({
              label: method,
              kind: monaco.languages.CompletionItemKind.Method,
              insertText: method,
              range,
              detail: "📄 Método de documento",
            }));
          } else {
            const methods = LANGUAGE_TYPES.Elemento.methods.map((method) => ({
              label: method,
              kind: monaco.languages.CompletionItemKind.Method,
              insertText: method,
              range,
              detail: "🔹 Método de Elemento",
            }));

            const props = LANGUAGE_TYPES.Elemento.properties.map((prop) => ({
              label: prop,
              kind: monaco.languages.CompletionItemKind.Property,
              insertText: prop,
              range,
              detail: "🔸 Propiedad de Elemento",
            }));

            suggestions = [...methods, ...props];
          }

          return { suggestions };
        }

        /* =========================================
         2️⃣ IDS EN documento.elemento("")
      ========================================== */

        const idPattern = /documento\.elemento\s*\(\s*["'][^"']*$/;

        if (idPattern.test(textUntilPosition)) {
          suggestions = elementIds.map((id) => ({
            label: id,
            kind: monaco.languages.CompletionItemKind.Value,
            insertText: id,
            range,
            detail: "🔹 ID de elemento",
          }));

          return { suggestions };
        }

        /* =========================================
         3️⃣ KEYWORDS
      ========================================== */

        const keywords = [
          "funcion",
          "si",
          "sino",
          "mientras",
          "retornar",
          "imprimir",
          "verdadero",
          "falso",
        ];

        suggestions = keywords.map((kw) => ({
          label: kw,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: kw,
          range,
        }));

        return { suggestions };
      },
    });
  };

  // Efecto para manejar el autocompletado
  useEffect(() => {
    if (monacoRef.current) {
      const monaco = monacoRef.current;

      // Forzar actualización de sugerencias
      if (editorRef.current) {
        editorRef.current.trigger(
          "keyboard",
          "editor.action.triggerSuggest",
          {},
        );
      }
    }
  }, [elements]);

  // Efecto para actualizar el valor del editor
  useEffect(() => {
    if (workspaceState && workspaceState.trim() !== "") {
      setEditorValue(workspaceState);
    } else if (propValue && propValue.trim() !== "") {
      setEditorValue(propValue);
    } else {
      setEditorValue(`// Bienvenido a Sizae Code Zone
// Los IDs de tus elementos aparecerán automáticamente
// cuando escribas dentro de las comillas:

// ✅ CORRECTO - Así funciona:
const elemento = document.elemento("")
// Ahora escribe dentro de las comillas → ""

// ❌ INCORRECTO - No uses # dentro de getElementById:
// document.elemento("#") // Esto NO funciona
`);
    }
  }, [workspaceState, propValue, elements]);

  const defineOneDarkTheme = (monaco) => {
    monaco.editor.defineTheme("one-dark-pro-darker", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", background: "1e222a" },
        { token: "comment", foreground: "7f848e", fontStyle: "italic" },
        { token: "string", foreground: "98c379" },
        { token: "keyword", foreground: "c678dd" },
        { token: "number", foreground: "d19a66" },
        { token: "regexp", foreground: "56b6c2" },
        { token: "operator", foreground: "56b6c2" },
        { token: "namespace", foreground: "e5c07b" },
        { token: "type", foreground: "e5c07b" },
        { token: "struct", foreground: "e5c07b" },
        { token: "class", foreground: "e5c07b" },
        { token: "function", foreground: "61afef" },
        { token: "variable", foreground: "e06c75" },
        { token: "variable.predefined", foreground: "d19a66" },
        { token: "property", foreground: "e06c75" },
      ],
      colors: {
        "editor.background": "#1e222a",
        "editor.foreground": "#abb2bf",
        "editor.lineHighlightBackground": "#2c313a",
        "editor.selectionBackground": "#3e4452",
        "editor.inactiveSelectionBackground": "#2c313a",
        "editorCursor.foreground": "#528bff",
        "editorWhitespace.foreground": "#3b4048",
        "editorIndentGuide.background": "#3b4048",
        "editorIndentGuide.activeBackground": "#636b7b",
        "editorLineNumber.foreground": "#636d83",
        "editorLineNumber.activeForeground": "#abb2bf",
        "editorGutter.background": "#1e222a",
        "editorOverviewRuler.border": "#1e222a",
        "editorOverviewRuler.background": "#1e222a",
        "scrollbarSlider.background": "#4b5263",
        "scrollbarSlider.hoverBackground": "#5a6378",
        "scrollbarSlider.activeBackground": "#6a748d",
        "scrollbar.shadow": "#1e222a",
        "minimap.background": "#1e222a",
        "minimapSlider.background": "#4b526380",
        "minimapSlider.hoverBackground": "#5a637880",
        "minimapSlider.activeBackground": "#6a748d80",
        "badge.background": "#2c313a",
        "badge.foreground": "#abb2bf",
      },
    });
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    registerEspanolLang(monaco);
    defineEspanolDarkTheme(monaco);
    defineOneDarkTheme(monaco);
    const dispose = registerFullIntellisense(monaco, elements);

    monaco.editor.setTheme("one-dark-pro-darker");

    editor.updateOptions({
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      fontLigatures: false,
      lineNumbers: "on",
      lineNumbersMinChars: 3,
      glyphMargin: true,
      folding: true,
      foldingStrategy: "indentation",
      showFoldingControls: "mouseover",
      minimap: {
        enabled: true,
        size: "fit",
        side: "right",
        showSlider: "mouseover",
        renderCharacters: true,
        maxColumn: 120,
      },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      scrollbar: {
        vertical: "visible",
        horizontal: "visible",
        verticalScrollbarSize: 14,
        horizontalScrollbarSize: 14,
        verticalSliderSize: 10,
        horizontalSliderSize: 10,
        useShadows: true,
        verticalHasArrows: true,
        horizontalHasArrows: true,
        arrowSize: 12,
      },
      wordWrap: "off",
      renderWhitespace: "none",
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true,
      },
      formatOnPaste: false,
      formatOnType: false,
      renderLineHighlight: "line",
      roundedSelection: true,
      overviewRulerBorder: true,
      overviewRulerLanes: 3,
      hideCursorInOverviewRuler: false,
      cursorStyle: "line",
      cursorBlinking: "blink",
      cursorWidth: 2,
      multiCursorModifier: "alt",
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: "on",
      snippetSuggestions: "inline",
      tabCompletion: "on",
      wordBasedSuggestions: true,
      parameterHints: { enabled: true },
      selectionHighlight: true,
      occurrencesHighlight: true,
      renderControlCharacters: false,
      renderFinalNewline: true,
      renderIndentGuides: true,
      smoothScrolling: true,
      mouseWheelZoom: true,
    });

    const guardarCodigo = () => {
      if (editorRef.current) {
        const codigo = editorRef.current.getValue();
        setEditorValue(codigo);

        const lexer = new Lexer(codigo);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();

        const generator = new JSGenerator();
        const interpreter = new Interpreter();
        generator.nativeFunctions = interpreter.nativeFunctions;

        const jsCode = generator.generate(ast);

        console.log("Codigo js desde el codeEditor" + jsCode);
        console.log("Statement desde el CodeEditor" + codigo);

        if (onSave) {
          onSave(jsCode, codigo);
        }
      }
    };

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      guardarCodigo,
    );
  };

  const handleChange = (value) => {
    setEditorValue(value || "");
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <div className="w-full h-full relative flex flex-col">
      <div className="h-[6vh] w-full bg-[#1e222a] flex items-center border-b border-[#3b4048] px-4">
        {selectedPage ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#98c379]">📄</span>
            <span className="text-sm text-[#abb2bf]">
              {selectedPage}.waskart
            </span>
            <span className="ml-2 text-xs text-[#7f848e] bg-[#2c313a] px-2 py-0.5 rounded-full">
              {collectElementIds(elements).length} IDs
            </span>
            <button
              onClick={() => {
                if (editorRef.current) {
                  const codigo = editorRef.current.getValue();
                  setEditorValue(codigo);

                  const lexer = new Lexer(codigo);
                  const tokens = lexer.tokenize();
                  const parser = new Parser(tokens);
                  const ast = parser.parse();

                  const generator = new JSGenerator();
                  const interpreter = new Interpreter();
                  generator.nativeFunctions = interpreter.nativeFunctions;

                  const jsCode = generator.generate(ast);

                  console.log("Codigo js desde el codeEditor" + jsCode);
                  console.log("Statement desde el CodeEditor" + codigo);

                  if (onSave) {
                    onSave(jsCode, codigo);
                  }
                }
              }}
              className="ml-4 px-3 py-1 text-xs bg-[#2c313a] text-[#98c379] rounded hover:bg-[#3e4452] transition-colors border border-[#3b4048]"
            >
              💾 Guardar
            </button>
          </div>
        ) : (
          <div className="text-sm text-[#7f848e] italic">
            ⚠️ Sin página seleccionada
          </div>
        )}
        <div className="ml-auto text-xs text-[#7f848e]">
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
          language="espanol-lang"
          theme="espanol-dark-pro"
          value={editorValue}
          onChange={handleChange}
          onMount={handleEditorDidMount}
          path={selectedPage ? `${selectedPage}.waskart` : "unknown.waskart"}
          options={{
            readOnly: readOnly,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            minimap: {
              enabled: true,
              size: "fit",
              side: "right",
              showSlider: "mouseover",
            },
            scrollbar: {
              vertical: "visible",
              horizontal: "visible",
              verticalScrollbarSize: 14,
              horizontalScrollbarSize: 14,
              useShadows: true,
              verticalHasArrows: true,
              horizontalHasArrows: true,
            },
            overviewRulerBorder: true,
            overviewRulerLanes: 3,
            hideCursorInOverviewRuler: false,
            lineNumbers: "on",
            folding: true,
            fontSize: 14,
            fontFamily: 'Consolas, "Courier New", monospace',
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true,
            },
            quickSuggestionsDelay: 0,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: "on",
            tabCompletion: "on",
            wordBasedSuggestions: true,
            parameterHints: { enabled: true },
          }}
        />
      </div>
    </div>
  );
};

export default CustomCodeEditor;
