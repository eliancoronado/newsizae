export const bloques = [
  {
    type: "dynamic_dropdown",
    message0: "cuando %1 al hacer click hacer %2",
    args0: [
      {
        type: "input_dummy",
        name: "INPUT",
      },
      {
        type: "input_statement",
        name: "DO",
      },
    ],
    extensions: ["dynamic_menu_extension"],
  },
  {
    type: "localstorage_set_item",
    message0: "guardar en local %1 el valor %2",
    args0: [
      {
        type: "field_input",
        name: "KEY",
        text: "nombre",
      },
      {
        type: "input_value",
        name: "VALUE",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 260,
    tooltip:
      "Guarda un valor en el almacenamiento local con una clave definida",
    helpUrl: "",
  },
  {
    type: "localstorage_get",
    message0: "Obtener de local a %1",
    args0: [
      {
        type: "field_input",
        name: "KEY",
        text: "nombre",
      },
    ],
    output: null,
    previousStatement: "Action",
    nextStatement: "Action",
    colour: 230,
    tooltip: "Obtiene un valor del localStorage usando una clave",
    helpUrl: "",
  },
  {
    type: "localstorage_remve_item",
    message0: "Eliminar de local a %1",
    args0: [
      {
        type: "field_input",
        name: "KEY",
        text: "nombre",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 230,
    tooltip: "Obtiene un valor del localStorage usando una clave",
    helpUrl: "",
  },
  {
    type: "classlist_action",
    message0: "elemento %1 %2 estilo global %3",
    args0: [
      {
        type: "input_dummy",
        name: "INPUT",
      },
      {
        type: "field_dropdown",
        name: "ACTION",
        options: [
          ["añadir", "add"],
          ["quitar", "remove"],
          ["intercambiar", "toggle"],
        ],
      },
      {
        type: "input_value",
        name: "CLASS_NAME",
        check: "String",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    extensions: ["dynamic_menu_extension"],
    colour: 230,
    tooltip: "Agrega o elimina una clase de un elemento usando su ID",
    helpUrl: "",
  },
  {
    type: "on_mouse_over",
    message0:
      "cuando el mouse esté encima de %1 hacer %2 de lo contrario hacer %3",
    args0: [
      {
        type: "input_value",
        name: "INPUT",
        check: "String",
      },
      {
        type: "input_statement",
        name: "DO_MOUSEOVER",
      },
      {
        type: "input_statement",
        name: "DO_MOUSEOUT",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 160,
    tooltip:
      "Cambia el fondo cuando el mouse esté encima, y restaurarlo cuando el mouse salga.",
    helpUrl: "",
    extensions: ["dynamic_menu_extension"],
  },
  {
    type: "json_stringify_variables",
    message0: "convertir a información [ %1 ]",
    args0: [
      {
        type: "input_value", // ✅ CAMBIO AQUÍ
        name: "VARIABLES",
      },
    ],
    output: "String",
    colour: 230,
    tooltip: "Convierte variables a una cadena JSON.",
    helpUrl: "",
  },
  {
    type: "json_parse_variables",
    message0: "convertir a parse [ %1 ]",
    args0: [
      {
        type: "input_value", // ✅ CAMBIO AQUÍ
        name: "VARIABLES",
      },
    ],
    output: "String", // o "Boolean", "Number", etc. según lo que corresponda
    colour: 230,
    tooltip: "Convierte variables a una cadena JSON.",
    helpUrl: "",
  },
  {
    type: "parse_int",
    message0: "convertir a numero [ %1 ]",
    args0: [
      {
        type: "input_value", // ✅ CAMBIO AQUÍ
        name: "VARIABLES",
      },
    ],
    output: "String", // o "Boolean", "Number", etc. según lo que corresponda
    colour: 230,
    tooltip: "Convierte variables a una cadena JSON.",
    helpUrl: "",
  },
  {
    type: "json_variable",
    message0: "usar variable %1",
    args0: [
      {
        type: "field_input",
        name: "VAR",
        text: "variable",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 180,
    tooltip: "Añade una variable al objeto JSON.",
    helpUrl: "",
  },
  {
    type: "const_array",
    message0: "array [ %1 ]",
    args0: [
      {
        type: "input_statement",
        name: "ITEMS", // Cambiado de VARIABLES a ITEMS para mayor claridad
      },
    ],
    output: "Array",
    colour: 230,
    tooltip: "Crea un array JSON",
    helpUrl: "",
  },
  {
    type: "const_object",
    message0: "object { %1 }",
    args0: [
      {
        type: "input_statement",
        name: "PROPERTIES", // Cambiado de VARIABLES a PROPERTIES
      },
    ],
    output: "Object",
    previousStatement: null,
    nextStatement: null,
    colour: 230,
    tooltip: "Crea un objeto JSON",
    helpUrl: "",
  },
  {
    type: "json_item",
    message0: "property %1 : %2",
    args0: [
      {
        type: "field_input",
        name: "KEY", // Cambiado de VAR a KEY
        text: "key",
      },
      {
        type: "input_value",
        name: "VALUE", // Cambiado de VARIABLES a VALUE
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 180,
    tooltip: "Añade una propiedad al objeto JSON",
    helpUrl: "",
  },
  {
    type: "change_inner_html",
    message0: "cambiar contenido de %1 a %2",
    args0: [
      {
        type: "input_dummy",
        name: "INPUT",
      },
      {
        type: "input_value",
        name: "VALUE",
      },
    ],
    extensions: ["dynamic_menu_extension"], // Para seleccionar elementos dinámicamente
    previousStatement: null,
    nextStatement: null,
    colour: 230,
    tooltip: "Cambia el contenido HTML de un elemento.",
    helpUrl: "",
  },
  {
    type: "append_child_block",
    message0: "Agregar hijo al elemento %1 con el contenido %2",
    args0: [
      {
        type: "input_dummy",
        name: "INPUT",
      },
      {
        type: "input_value",
        name: "ELEMENT",
        check: "String",
      },
    ],
    extensions: ["dynamic_menu_extension"],
    previousStatement: "Action",
    nextStatement: "Action",
    colour: 230,
    tooltip: "Agrega un elemento hijo al elemento seleccionado por ID.",
    helpUrl: "",
  },
  {
    type: "get_text_input_value",
    message0: "campo %1 valor",
    args0: [
      {
        type: "input_dummy",
        name: "INPUT",
        options: [["Seleccionar ID", "default"]], // Opciones iniciales, se actualizan dinámicamente
      },
    ],
    output: null, // Esto permite conectar el bloque a bocas por la izquierda
    colour: 160, // Color del bloque
    tooltip: "Obtiene el valor del campo de texto por su ID.",
    helpUrl: "",
    extensions: ["dynamic_menu_extension"], // Extensión para obtener los IDs dinámicamente
  },
  {
    type: "equality_block",
    message0: "%1 == %2", // Representación lineal
    args0: [
      {
        type: "input_value", // Entrada izquierda
        name: "LEFT",
        check: null, // Acepta cualquier tipo de dato
      },
      {
        type: "input_value", // Entrada derecha
        name: "RIGHT",
        check: null, // Acepta cualquier tipo de dato
      },
    ],
    inputsInline: true, // Esto asegura que el bloque sea horizontal
    output: "Boolean", // Retorna un valor booleano
    colour: 230, // Color del bloque
    tooltip: "Verifica si dos valores son iguales.",
    helpUrl: "",
  },
  {
    type: "and_block",
    message0: "%1 y %2", // Representación lineal
    args0: [
      {
        type: "input_value", // Entrada izquierda
        name: "LEFT",
        check: null, // Acepta cualquier tipo de dato
      },
      {
        type: "input_value", // Entrada derecha
        name: "RIGHT",
        check: null, // Acepta cualquier tipo de dato
      },
    ],
    inputsInline: true, // Esto asegura que el bloque sea horizontal
    output: "Boolean", // Retorna un valor booleano
    colour: 230, // Color del bloque
    tooltip: "Verifica si dos valores son iguales.",
    helpUrl: "",
  },
  {
    type: "or_block",
    message0: "%1 ó %2", // Representación lineal
    args0: [
      {
        type: "input_value", // Entrada izquierda
        name: "LEFT",
        check: null, // Acepta cualquier tipo de dato
      },
      {
        type: "input_value", // Entrada derecha
        name: "RIGHT",
        check: null, // Acepta cualquier tipo de dato
      },
    ],
    inputsInline: true, // Esto asegura que el bloque sea horizontal
    output: "Boolean", // Retorna un valor booleano
    colour: 230, // Color del bloque
    tooltip: "Verifica si dos valores son iguales.",
    helpUrl: "",
  },
  {
    type: "if_else_block",
    message0: "si %1 entonces %2 si no %3",
    args0: [
      {
        type: "input_value",
        name: "CONDITION", // Entrada para la condición
      },
      {
        type: "input_statement",
        name: "IF_BODY", // Cuerpo del `if`
      },
      {
        type: "input_statement",
        name: "ELSE_BODY", // Cuerpo del `else`
      },
    ],
    previousStatement: null, // Permite conectarse a otros bloques arriba
    nextStatement: null, // Permite conectarse a otros bloques abajo
    colour: 210, // Color del bloque
    tooltip:
      "Si la condición es verdadera, ejecuta el bloque dentro de 'entonces'. Si no, ejecuta el bloque dentro de 'si no'.",
    helpUrl: "",
  },
  {
    type: "dynamic_style_change",
    message0: "A %1 cambiar el estilo %2 a %3",
    args0: [
      {
        type: "input_dummy",
        name: "INPUT", // Campo para el id del elemento
      },
      {
        type: "input_dummy",
        name: "STYLE_NAME", // Campo para el nombre del estilo
      },
      {
        type: "input_value",
        name: "VALUE", // Campo para conectar el valor
      },
    ],
    previousStatement: "Action",
    nextStatement: "Action",
    extensions: ["dynamic_menu_extension", "dynamic_style_menu"],
  },
  {
    type: "dynamic_dropdown_text_content",
    message0: "%1 cambiar texto a %2",
    args0: [
      {
        type: "input_dummy", // No conecta nada a la izquierda, solo la selección del ID
        name: "INPUT",
      },
      {
        type: "input_value", // Conecta un valor a la derecha
        name: "VALUE",
        check: "String", // Asegúrate de que sea un valor de tipo String
      },
    ],
    previousStatement: "Action",
    nextStatement: "Action",
    extensions: ["dynamic_menu_extension"], // Para cargar los elementos dinámicamente
  },
  {
    type: "show_alert",
    message0: "mostrar alerta con mensaje %1",
    args0: [
      {
        type: "input_value",
        name: "VALUE",
      },
    ],
    colour: 160,
    tooltip: "Muestra una alerta con el mensaje proporcionado",
    helpUrl: "",
    previousStatement: null, // Permite que no tenga bloques anteriores (no conecta hacia atrás)
    nextStatement: null, // Permite que se conecten otros bloques después de este
    inputsInline: true, // Hace que los campos de entrada estén en línea
  },
  {
    type: "custom_text",
    message0: "%1",
    args0: [
      {
        type: "field_input",
        name: "TEXT",
        text: "texto",
      },
    ],
    previousStatement: "Action", // Permite que no tenga bloques anteriores (no conecta hacia atrás)
    nextStatement: "Action", // Permite que se conecten otros bloques después de este
    output: null, // Este bloque puede ser usado para conectar con otros bloques como "const_declare" y "show_alert"
    colour: 160,
    tooltip: "Un bloque para ingresar texto",
    helpUrl: "",
  },
  {
    type: "custom_code",
    message0: "código %1",
    args0: [
      {
        type: "field_input",
        name: "TEXT",
        text: "texto",
      },
    ],
    output: "String", // Este bloque puede ser usado para conectar con otros bloques como "const_declare" y "show_alert"
    colour: 160,
    tooltip: "Un bloque para ingresar texto",
    helpUrl: "",
  },
  {
    type: "custom_number",
    message0: "%1",
    args0: [
      {
        type: "field_input",
        name: "TEXT",
        text: "100",
      },
    ],
    output: "String", // Este bloque puede ser usado para conectar con otros bloques como "const_declare" y "show_alert"
    colour: 160,
    tooltip: "Un bloque para ingresar texto",
    helpUrl: "",
  },
  {
    type: "const_declare",
    message0: "definir %1 = %2",
    args0: [
      {
        type: "field_input",
        name: "VAR",
        text: "constante",
      },
      {
        type: "input_value",
        name: "VALUE",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 230,
    tooltip: "Declara una constante con un valor.",
    helpUrl: "",
  },
  {
    type: "var_declare",
    message0: "variable %1 = %2",
    args0: [
      {
        type: "field_input",
        name: "VAR",
        text: "variable",
      },
      {
        type: "input_value",
        name: "VALUE",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 230,
    tooltip: "Declara una variable con var y le asigna un valor.",
    helpUrl: "",
  },
  {
    type: "let_declare",
    message0: "variable (que puede cambiar) %1 = %2",
    args0: [
      {
        type: "field_input",
        name: "LET",
        text: "variable",
      },
      {
        type: "input_value",
        name: "VALUE",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 230,
    tooltip: "Declara una variable con var y le asigna un valor.",
    helpUrl: "http://google.com",
  },
  {
    type: "var_change",
    message0: "%1 = %2",
    args0: [
      {
        type: "field_input",
        name: "VAR",
        text: "Variable",
      },
      {
        type: "input_value",
        name: "VALUE",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 230,
    tooltip: "Declara una variable con var y le asigna un valor.",
    helpUrl: "",
  },
  {
    type: "var_plus",
    message0: "%1 + %2",
    args0: [
      {
        type: "field_input",
        name: "VAR",
        text: "Variable",
      },
      {
        type: "input_value",
        name: "VALUE",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 230,
    tooltip: "Declara una variable con var y le asigna un valor.",
    helpUrl: "",
  },
  {
    type: "var_minus",
    message0: "%1 - %2",
    args0: [
      {
        type: "field_input",
        name: "VAR",
        text: "Variable",
      },
      {
        type: "input_value",
        name: "VALUE",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 230,
    tooltip: "Declara una variable con var y le asigna un valor.",
    helpUrl: "",
  },
  {
    type: "go_to_screen",
    message0: "Ir a la pantalla %1",
    args0: [
      {
        type: "field_input",
        name: "SCREEN_URL",
        text: "index", // Valor por defecto
      },
    ],
    colour: 160,
    tooltip: "Este bloque redirige a la URL especificada.",
    helpUrl: "",
    previousStatement: "Action",
    nextStatement: "Action",
  },
  {
    type: "fetch_request_block",
    message0: "Guardar en %1",
    args0: [
      {
        type: "field_input",
        name: "VAR_NAME",
        text: "response",
      },
    ],
    message1: "Hacer petición a %1",
    args1: [
      {
        type: "field_input",
        name: "URL",
        text: "https://example.org/post",
      },
    ],
    message2: "Con método %1",
    args2: [
      {
        type: "field_dropdown",
        name: "METHOD",
        options: [
          ["Enviar (POST)", "POST"],
          ["Recibir (GET)", "GET"],
        ],
      },
    ],
    message3: "Con tipo de información %1",
    args3: [
      {
        type: "field_dropdown",
        name: "HEADERS",
        options: [
          ["Content-Type: application/json", "application/json"],
          ["Content-Type: text/plain", "text/plain"],
        ],
      },
    ],
    message4: "Con informacion a enviar %1",
    args4: [
      {
        type: "input_value",
        name: "BODY",
        check: "String",
      },
    ],
    previousStatement: "Action",
    nextStatement: "Action",
    colour: 230,
    tooltip:
      "Realiza una petición HTTP con el método y los encabezados especificados y guarda la respuesta en una variable.",
    helpUrl: "",
  },
  {
    type: "parse_json_block",
    message0: "Guardar información obtenida en %1 desde %2",
    args0: [
      {
        type: "field_input",
        name: "DATA_VAR",
        text: "data",
      },
      {
        type: "field_input",
        name: "RESPONSE_VAR",
        text: "response",
      },
    ],
    previousStatement: "Action",
    nextStatement: "Action",
    colour: 180,
    tooltip:
      "Convierte la respuesta de la petición en JSON y la guarda en una variable.",
    helpUrl: "",
  },
  {
    type: "async_function_block",
    message0: "función asincrona %1  %2",
    args0: [
      {
        type: "field_input",
        name: "FUNC_NAME",
        text: "myFunction",
      },
      {
        type: "input_statement",
        name: "CODE",
        check: "Action",
      },
    ],
    output: "Function",
    colour: 230,
    tooltip:
      "Crea una función async con el nombre especificado y el código dentro.",
    helpUrl: "",
  },
  {
    type: "call_async_function_block",
    message0: "Ejecutar función %1",
    args0: [
      {
        type: "field_input",
        name: "FUNC_NAME",
        text: "myFunction",
      },
    ],
    output: null,
    previousStatement: "Action",
    nextStatement: "Action",
    colour: 230,
    tooltip: "Ejecuta la función async especificada.",
    helpUrl: "",
  },
  {
    type: "console_log_block",
    message0: "Mostrar por consola %1",
    args0: [
      {
        type: "input_value",
        name: "VALUE",
        check: "String",
      },
    ],
    previousStatement: "Action",
    nextStatement: "Action",
    colour: 160,
    tooltip: "Muestra un valor en la consola.",
    helpUrl: "",
  },
  {
    type: "create_image_block",
    message0: "Crear elemento %1",
    args0: [
      {
        type: "input_value",
        name: "SRC",
        check: "String",
      },
    ],
    output: null,
    colour: 230,
    tooltip: "Crea un elemento de imagen y asigna su fuente.",
    helpUrl: "",
  },
  {
    type: "use_element_by_id",
    message0: "Elemento con id %1",
    args0: [
      {
        type: "input_dummy",
        name: "INPUT",
      },
    ],
    output: null,
    colour: 230,
    tooltip: "Crea un elemento de imagen y asigna su fuente.",
    helpUrl: "",
    extensions: ["dynamic_menu_extension"],
  },
  {
    type: "set_interval_block",
    message0: "Ejecutar cada %1 milisegundos %2",
    args0: [
      {
        type: "field_number",
        name: "INTERVAL",
        value: 1000,
        min: 1,
      },
      {
        type: "input_statement",
        name: "CODE",
        check: "Action",
      },
    ],
    previousStatement: "Action",
    nextStatement: "Action",
    colour: 230,
    tooltip:
      "Ejecuta el código dentro de este bloque cada cierto tiempo en milisegundos.",
    helpUrl: "",
  },
  {
    type: "set_timeout_block",
    message0: "Ejecutar despues de %1 milisegundos %2",
    args0: [
      {
        type: "field_number",
        name: "INTERVAL",
        value: 1000,
        min: 1,
      },
      {
        type: "input_statement",
        name: "CODE",
        check: "Action",
      },
    ],
    previousStatement: "Action",
    nextStatement: "Action",
    colour: 230,
    tooltip:
      "Ejecuta el código dentro de este bloque cada cierto tiempo en milisegundos.",
    helpUrl: "",
  },
  {
    type: "const_use",
    message0: "%1 %2",
    args0: [
      {
        type: "field_input",
        name: "VAR",
        text: "ValorConstante",
      },
      {
        type: "input_value",
        name: "VALUE",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    output: "String",
    colour: 230,
    tooltip: "Usa una constante declarada previamente.",
    helpUrl: "",
  },
  {
    type: "indexeddb_init_with_stores",
    message0:
      "Iniciar Base de datos %1 versión %2 con stores %3 éxito %4 error %5",
    args0: [
      {
        type: "field_input",
        name: "DB_NAME",
        text: "MiBaseDeDatos",
      },
      {
        type: "field_number",
        name: "VERSION",
        value: 1,
        min: 1,
        precision: 1,
      },
      {
        type: "input_statement",
        name: "STORES",
        check: "store_definition",
      },
      {
        type: "input_statement",
        name: "SUCCESS",
      },
      {
        type: "input_statement",
        name: "ERROR",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 230,
    tooltip: "Inicializa una base de datos con stores definidos",
    helpUrl: "",
  },
  {
    type: "const_array",
    message0: "array [ %1 ]",
    args0: [
      {
        type: "input_statement",
        name: "ITEMS",
      },
    ],
    output: "Array",
    previousStatement: null, // Añadido para permitir conexión
    nextStatement: null, // Añadido para permitir conexión
    colour: 230,
    tooltip: "Crea un array JSON",
    helpUrl: "",
  },
  {
    type: "const_object",
    message0: "object { %1 } %2",
    args0: [
      {
        type: "input_statement",
        name: "PROPERTIES",
      },
      {
        type: "input_dummy", // Espacio para el conector cuando se usa como valor
        align: "RIGHT",
      },
    ],
    output: "Object", // Permite usarlo como valor
    previousStatement: null, // Permite usarlo como statement
    nextStatement: null, // Permite usarlo como statement
    colour: 230,
    tooltip: "Crea un objeto JSON que puede usarse en cualquier contexto",
    helpUrl: "",
  },
  {
    type: "plugin_verdadero_falso",
    message0:
      "Plugin Verdadero/Falso %1 Título: %2 Tiempo: %3 %4 Al cerrar: %5 %6 Al volver: %7 %8",
    args0: [
      {
        type: "input_dummy",
      },
      {
        type: "field_input",
        name: "TITULO",
        text: "Quiz",
      },
      {
        type: "field_number",
        name: "TIEMPO",
        value: 15,
        min: 1,
      },
      {
        type: "input_dummy",
      },
      {
        type: "input_statement",
        name: "AL_CERRAR",
      },
      {
        type: "input_dummy",
        align: "RIGHT",
      },
      {
        type: "input_statement",
        name: "AL_VOLVER",
      },
      {
        type: "input_dummy",
        align: "RIGHT",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 230,
    tooltip: "Crea un juego de verdadero/falso con acciones personalizables",
    helpUrl: "",
  },
  {
    type: "plugin_seleccion_unica",
    message0:
      "Plugin Seleccion Unica %1 Título: %2 Tiempo: %3 %4 Al cerrar: %5 %6 Al volver: %7 %8",
    args0: [
      {
        type: "input_dummy",
      },
      {
        type: "field_input",
        name: "TITULO",
        text: "Quiz",
      },
      {
        type: "field_number",
        name: "TIEMPO",
        value: 15,
        min: 1,
      },
      {
        type: "input_dummy",
      },
      {
        type: "input_statement",
        name: "AL_CERRAR",
      },
      {
        type: "input_dummy",
        align: "RIGHT",
      },
      {
        type: "input_statement",
        name: "AL_VOLVER",
      },
      {
        type: "input_dummy",
        align: "RIGHT",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 230,
    tooltip: "Crea un juego de verdadero/falso con acciones personalizables",
    helpUrl: "",
  },
  {
    type: "plugin_sopa_letras",
    message0:
      "Plugin Sopa de letras %1 Título: %2 Tiempo: %3 %4 Al cerrar: %5 %6 Al volver: %7 %8",
    args0: [
      {
        type: "input_dummy",
      },
      {
        type: "field_input",
        name: "TITULO",
        text: "Quiz",
      },
      {
        type: "field_number",
        name: "TIEMPO",
        value: 15,
        min: 1,
      },
      {
        type: "input_dummy",
      },
      {
        type: "input_statement",
        name: "AL_CERRAR",
      },
      {
        type: "input_dummy",
        align: "RIGHT",
      },
      {
        type: "input_statement",
        name: "AL_VOLVER",
      },
      {
        type: "input_dummy",
        align: "RIGHT",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 230,
    tooltip: "Crea un juego de verdadero/falso con acciones personalizables",
    helpUrl: "",
  },
  {
    type: "json_item",
    message0: "property %1 : %2",
    args0: [
      {
        type: "field_input",
        name: "KEY",
        text: "key",
      },
      {
        type: "input_value",
        name: "VALUE",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 180,
    tooltip: "Añade una propiedad al objeto JSON",
    helpUrl: "",
  },
  {
    type: "store_definition",
    message0: "Store: %1 keyPath: %2 autoIncrement: %3",
    args0: [
      {
        type: "field_input",
        name: "STORE_NAME",
        text: "miStore",
      },
      {
        type: "field_input",
        name: "KEY_PATH",
        text: "id",
      },
      {
        type: "field_checkbox",
        name: "AUTO_INCREMENT",
        checked: true,
      },
    ],
    previousStatement: "store_definition",
    nextStatement: "store_definition",
    colour: 210,
    tooltip: "Define un ObjectStore para IndexedDB",
  },
  {
    type: "store_index",
    message0: "Índice: %1 campo: %2 único: %3 en store: %4",
    args0: [
      {
        type: "field_input",
        name: "INDEX_NAME",
        text: "miIndice",
      },
      {
        type: "field_input",
        name: "FIELD_PATH",
        text: "campo",
      },
      {
        type: "field_checkbox",
        name: "UNIQUE",
        checked: false,
      },
      {
        type: "field_input",
        name: "STORE_NAME",
        text: "miStore",
      },
    ],
    previousStatement: "store_definition",
    nextStatement: "store_definition",
    colour: 180,
    tooltip: "Define un índice para un ObjectStore",
  },
  {
    type: "indexeddb_crud",
    message0: "Operación %1 en store %2 datos %3 clave %4 éxito %5 error %6",
    args0: [
      {
        type: "field_dropdown",
        name: "OPERATION",
        options: [
          ["agregar", "add"],
          ["actualizar", "put"],
          ["obtener", "get"],
          ["obtener todos", "getAll"],
          ["eliminar", "delete"],
        ],
      },
      {
        type: "field_input",
        name: "STORE_NAME",
        text: "miStore",
      },
      {
        type: "input_value",
        name: "DATA",
        check: ["String", "Number"],
      },
      {
        type: "input_value",
        name: "KEY",
        check: ["String", "Number"],
      },
      {
        type: "input_statement",
        name: "SUCCESS",
      },
      {
        type: "input_statement",
        name: "ERROR",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 230,
    tooltip: "Realiza operaciones CRUD en IndexedDB",
  },
  {
    type: "array_forEach",
    message0: "%1 porCada( %2 ) hacer %3 ",
    args0: [
      {
        type: "field_input",
        name: "ARRAY_NAME",
        text: "miArray",
      },
      {
        type: "field_input",
        name: "PARAM_NAME",
        text: "elemento",
      },
      {
        type: "input_statement",
        name: "BODY",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 330,
    tooltip: "Itera sobre un array ejecutando una función para cada elemento",
    helpUrl: "",
  },
  {
    type: "save_user_event",
    message0: "Guardar usuario en IndexedDB con botón",
    previousStatement: null,
    nextStatement: null,
    colour: 230,
    tooltip: "Crea la función saveUser y el evento click para guardar usuarios",
  },
  {
    type: "use_user_event",
    message0: "Usar usuario de IndexedDB",
    previousStatement: null,
    nextStatement: null,
    colour: 230,
    tooltip: "Crea la función saveUser y el evento click para guardar usuarios",
  },
  {
    type: "modify_user_field",
    message0: "Modificar %1 %2 con valor %3",
    args0: [
      {
        type: "field_dropdown",
        name: "FIELD",
        options: [
          ["monedas", "monedas"],
          ["hearts", "hearts"],
        ],
      },
      {
        type: "field_dropdown",
        name: "OPERATION",
        options: [
          ["=", "="],
          ["+", "+"],
          ["-", "-"],
        ],
      },
      {
        type: "input_value",
        name: "VALUE",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 230,
    tooltip: "Modificar monedas o hearts con operación",
    helpUrl: "",
  },
  {
    type: "update_user_field",
    message0: "Actualizar usuario %1 con valor %2",
    args0: [
      {
        type: "field_dropdown",
        name: "FIELD",
        options: [
          ["monedas", "monedas"],
          ["hearts", "hearts"],
        ],
      },
      {
        type: "input_value",
        name: "VALUE",
        check: "Number",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 230,
    tooltip: "Actualiza el valor de monedas o hearts del usuario.",
    helpUrl: "",
  },
  {
    type: "smart_return",
    message0: "retornar %1",
    args0: [
      {
        type: "input_value",
        name: "RETURN_VALUE",
        check: null,
        align: "RIGHT",
      },
    ],
    previousStatement: null,
    colour: 160,
    tooltip: "Retorna 'return valor;' si hay valor, o 'return;' si está vacío",
  },
];
