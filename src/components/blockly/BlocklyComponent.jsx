import React, { useRef, useEffect } from "react";
import * as Blockly from "blockly/core";
import * as libraryBlocks from "blockly/blocks"; // Esto incluye los bloques básicos
import * as Es from "blockly/msg/es";
import { javascriptGenerator, Order } from "blockly/javascript";
// Asegúrate de incluir los estilos básicos
import useStore from "../../store/store";
import { bloques } from "./bloques";

Blockly.setLocale(Es);

const BlocklyComponent = ({ onGenerateCode }) => {
  const blocklyDiv = useRef(null);
  const workspaceRef = useRef(null);
  const { droppedElements: elements, workspaceState: code } = useStore();

  useEffect(() => {
    // Initialize Blockly only once
    console.log(libraryBlocks);
    if (!workspaceRef.current) {
      try {
        workspaceRef.current = Blockly.inject(blocklyDiv.current, {
          toolbox: `
          <xml xmlns="https://developers.google.com/blockly/xml">
            <category name="Funciones" colour="#9A5CA6">
              <block type="show_alert"></block>
              <block type="set_interval_block"></block>
              <block type="set_timeout_block"></block>
              <block type="go_to_screen"></block>
              <block type="localstorage_set_item"></block>
              <block type="localstorage_get"></block>
              <block type="localstorage_remve_item"></block>
              <block type="console_log_block"></block>
              <block type="smart_return"></block>
              <block type="custom_text"></block>
              <block type="custom_code"></block>
              <block type="custom_number"></block>
            </category>
            <category name="Lógica" colour="#5CA65C">
              <block type="controls_if"></block>
              <block type="logic_compare"></block>
              <block type="logic_operation"></block>
              <block type="logic_boolean"></block>
            </category>

            <category name="Bucles" colour="#5C65A6">
              <block type="controls_repeat"></block>
              <block type="controls_whileUntil"></block>
              <block type="controls_for"></block>
            </category>

            <category name="Matemáticas" colour="#A65C5C">
              <block type="math_number"></block>
              <block type="math_arithmetic"></block>
              <block type="math_random_int"></block>
            </category>
            <category name="Database" colour="#9A5CA6">
              <block type="indexeddb_init_with_stores"></block>
              <block type="store_definition"></block>
              <block type="store_index"></block>
              <block type="indexeddb_crud"></block>
              <block type="save_user_event"></block>
              <block type="use_user_event"></block>
              <block type="modify_user_field"></block>
            </category>
            <category name="Llamadas" colour="#FF6347">
              <block type="fetch_request_block"></block>
              <block type="parse_json_block"></block>
              <block type="async_function_block"></block>
              <block type="call_async_function_block"></block>
              <block type="json_stringify_variables"></block>
              <block type="json_parse_variables"></block>
              <block type="parse_int"></block>
              <block type="update_user_field"></block>
            </category>
            <category name="Elementos" colour="#FFD700">
              <block type="dynamic_dropdown"></block>
              <block type="on_mouse_over"></block>
              <block type="get_text_input_value"></block>
              <block type="append_child_block"></block>
              <block type="change_inner_html"></block>
              <block type="use_element_by_id"></block>
              <block type="create_image_block"></block>
              <block type="dynamic_dropdown_text_content"></block>
              <block type="classlist_action"></block>
              <block type="dynamic_style_change"></block>
            </category>
            <category name="Operadores" colour="#FA8072">
              <block type="if_else_block"></block>
              <block type="equality_block"></block>
              <block type="and_block"></block>
              <block type="or_block"></block>
              <block type="array_forEach"></block>
            </category>
            <category name="Variables" colour="#FFA07A">
              <block type="const_declare"></block>
              <block type="var_declare"></block>
              <block type="let_declare"></block>
              <block type="const_use"></block>
              <block type="var_change"></block>
              <block type="var_plus"></block>
              <block type="var_minus"></block>
              <block type="const_array"></block>
              <block type="const_object"></block>
              <block type="json_variable"></block>
              <block type="json_item"></block>
            </category>
            <category name="Plugins" colour="#FFA07A">
              <block type="plugin_verdadero_falso"></block>
              <block type="plugin_seleccion_unica"></block>
              <block type="plugin_sopa_letras"></block>
            </category>
          </xml>
          `,
          scrollbars: true,
          trashcan: true,
        });
      } catch (error) {
        console.error("Error al inyectar Blockly:", error);
      }
    }

    function collectElementIds(elements) {
      let ids = [];

      elements.forEach((el) => {
        // Agregar el ID del elemento actual
        ids.push(el.id.toString());

        // Si el elemento tiene hijos, llamamos recursivamente
        if (el.children && el.children.length > 0) {
          ids = ids.concat(collectElementIds(el.children));
        }
      });

      return ids;
    }

    function collectElementStyles(elements) {
      if (elements.length > 0 && elements[0].styles) {
        return Object.keys(elements[0].styles); // Extraer las claves de estilos del primer elemento
      }
      return [];
    }

    // Register the dynamic_menu_extension only once
    Blockly.Extensions.register("dynamic_menu_extension", function () {
      this.getInput("INPUT").appendField(
        new Blockly.FieldDropdown(function () {
          const options = collectElementIds(elements).map((id) => [id, id]);

          return options;
        }),
        "DAY"
      );
    });

    Blockly.Extensions.register("dynamic_style_menu", function () {
      this.getInput("STYLE_NAME").appendField(
        new Blockly.FieldDropdown(function () {
          const options = collectElementStyles(elements).map((style) => [
            style,
            style,
          ]);
          return options;
        }),
        "STYLE"
      );
    });

    // Define Blockly blocks
    Blockly.defineBlocksWithJsonArray(bloques);

    // Cargar bloques desde JSON
    if (code) {
      try {
        const state = JSON.parse(code); // Convertir el texto JSON en un objeto
        Blockly.serialization.workspaces.load(state, workspaceRef.current);
      } catch (error) {
        console.error("Error al cargar bloques desde JSON:", error);
      }
    }

    return () => {
      // Cleanup function to unregister the extension when the component unmounts
      Blockly.Extensions.unregister("dynamic_menu_extension");
      Blockly.Extensions.unregister("dynamic_style_menu");
    };
  }, [elements, code]); // Dependency on elements to update dropdown options

  // Define JavaScript code generation for the block
  javascriptGenerator.forBlock["dynamic_dropdown"] = function (block) {
    const elementId = block.getFieldValue("DAY");
    const statementsDo = javascriptGenerator.statementToCode(block, "DO");

    console.log("Element ID:", elementId, "Statements:", statementsDo); // Debug
    if (elementId === "NONE") {
      return "// No element selected.\n";
    }

    return `document.getElementById("${elementId}").addEventListener("click", () => {\n${statementsDo}});\n`;
  };

  // Define JavaScript code generation for the block
  javascriptGenerator.forBlock["classlist_action"] = function (block) {
    const elementId = block.getFieldValue("DAY");
    const action = block.getFieldValue("ACTION"); // Obtener la acción seleccionada
    const clasname = javascriptGenerator.valueToCode(
      block,
      "CLASS_NAME",
      Order.ASSIGNMENT
    );

    return `document.getElementById("${elementId}").classList.${action}(${clasname});\n`;
  };

  javascriptGenerator.forBlock["on_mouse_over"] = function (block) {
    const elementId = block.getFieldValue("DAY");
    const statementsMouseOver = javascriptGenerator.statementToCode(
      block,
      "DO_MOUSEOVER"
    );
    const statementsMouseOut = javascriptGenerator.statementToCode(
      block,
      "DO_MOUSEOUT"
    );

    // Generar el código para el evento mouseover
    const code = `
        document.getElementById(${elementId}).addEventListener("mouseover", () => {
            ${statementsMouseOver}
        });
        document.getElementById(${elementId}).addEventListener("mouseout", () => {
            ${statementsMouseOut}
        });
    `;
    return code;
  };

  javascriptGenerator.forBlock["change_inner_html"] = function (block) {
    const elementId = block.getFieldValue("DAY") || "NONE";
    const value =
      javascriptGenerator.valueToCode(block, "VALUE", Order.ASSIGNMENT) || "''"; // Si no hay valor, usa una cadena vacía

    if (elementId === "NONE") {
      return "// No element selected.\n";
    }

    return `document.getElementById("${elementId}").innerHTML = ${value};\n`;
  };

  javascriptGenerator.forBlock["append_child_block"] = function (block) {
    const elementId = block.getFieldValue("DAY"); // Obtener el ID del elemento donde se va a agregar el hijo
    const childElement =
      javascriptGenerator.valueToCode(block, "ELEMENT", Order.ATOMIC) || "null"; // Obtener el bloque o valor para el hijo

    if (elementId === "NONE") {
      return "// No element selected.\n";
    }

    return `document.getElementById("${elementId}").appendChild(${childElement});\n`;
  };

  javascriptGenerator.forBlock["get_text_input_value"] = function (block) {
    // Obtener el valor del campo desplegable (ID seleccionado)
    const id = block.getFieldValue("DAY") || "default";

    // Generar el código JavaScript
    const code = `document.getElementById("${id}").value`;

    // Retornar el código
    return [code, Order.ATOMIC];
  };

  javascriptGenerator.forBlock["equality_block"] = function (block) {
    // Obtener los valores conectados a las entradas
    const left =
      javascriptGenerator.valueToCode(block, "LEFT", Order.ATOMIC) || "null";
    const right =
      javascriptGenerator.valueToCode(block, "RIGHT", Order.ATOMIC) || "null";

    // Generar el código de comparación
    const code = `${left} === ${right}`;

    // Retornar el código generado
    return [code, Order.EQUALITY];
  };

  javascriptGenerator.forBlock["and_block"] = function (block) {
    // Obtener los valores conectados a las entradas
    const left =
      javascriptGenerator.valueToCode(block, "LEFT", Order.ATOMIC) || "false";
    const right =
      javascriptGenerator.valueToCode(block, "RIGHT", Order.ATOMIC) || "false";

    // Generar el código de operación lógica AND
    const code = `${left} && ${right}`;

    // Retornar el código generado
    return [code, Order.LOGICAL_AND];
  };

  javascriptGenerator.forBlock["or_block"] = function (block) {
    // Obtener los valores conectados a las entradas
    const left =
      javascriptGenerator.valueToCode(block, "LEFT", Order.ATOMIC) || "false";
    const right =
      javascriptGenerator.valueToCode(block, "RIGHT", Order.ATOMIC) || "false";

    // Generar el código de operación lógica OR
    const code = `${left} || ${right}`;

    // Retornar el código generado
    return [code, Order.LOGICAL_OR];
  };

  javascriptGenerator.forBlock["fetch_request_block"] = function (block) {
    const varName = block.getFieldValue("VAR_NAME") || "response"; // Nombre de la variable
    const url = block.getFieldValue("URL"); // URL ingresada
    const method = block.getFieldValue("METHOD"); // Método (GET o POST)
    const headersType = block.getFieldValue("HEADERS"); // Tipo de header
    const body =
      javascriptGenerator.valueToCode(block, "BODY", Order.NONE) || "null"; // Body del request

    // Construcción del objeto de opciones para fetch
    let fetchOptions = `{
        method: "${method}",
        headers: {
            "Content-Type": "${headersType}"
        }`;

    if (method === "POST") {
      fetchOptions += `,
        body: ${body}`;
    }

    fetchOptions += `\n    }`;

    // Generar código final de fetch sin console.log ni data
    return `const ${varName} = await fetch("${url}", ${fetchOptions});\n`;
  };

  javascriptGenerator.forBlock["console_log_block"] = function (block) {
    const value =
      javascriptGenerator.valueToCode(
        block,
        "VALUE",
        javascriptGenerator.ORDER_ATOMIC
      ) || "''"; // Si no hay valor, usa una cadena vacía
    return `console.log(${value});\n`;
  };

  javascriptGenerator.forBlock["create_image_block"] = function (block) {
    const srcValue =
      javascriptGenerator.valueToCode(block, "SRC", Order.ATOMIC) || "''";

    const lineCode = `document.createElement(${srcValue})\n`;

    // Determinar cómo devolver el código basado en el contexto
    if (block.outputConnection && block.outputConnection.targetConnection) {
      // Si está siendo usado como valor (en let_declare, etc.)
      return [lineCode, Order.ATOMIC];
    } else {
      // Si está siendo usado como statement
      return lineCode + "\n";
    }
  };

  javascriptGenerator.forBlock["parse_json_block"] = function (block) {
    const dataVar = block.getFieldValue("DATA_VAR") || "data"; // Nombre de la variable para guardar el JSON
    const responseVar = block.getFieldValue("RESPONSE_VAR") || "response"; // Nombre de la variable de la respuesta

    return `const ${dataVar} = await ${responseVar}.json();\n`;
  };

  javascriptGenerator.forBlock["localstorage_set_item"] = function (block) {
    const key = block.getFieldValue("KEY") || "clave";
    const value =
      javascriptGenerator.valueToCode(block, "VALUE", Order.NONE) ||
      "undefined";

    return `localStorage.setItem(${JSON.stringify(key)}, ${value});\n`;
  };

  javascriptGenerator.forBlock["call_async_function_block"] = function (block) {
    const funcName = block.getFieldValue("FUNC_NAME"); // Obtiene el nombre de la función

    // Determinar cómo devolver el código basado en el contexto
    if (block.outputConnection && block.outputConnection.targetConnection) {
      // Si está siendo usado como valor (en let_declare, etc.)
      return [`${funcName}()\n`, Order.ATOMIC];
    } else {
      // Si está siendo usado como statement
      return `${funcName}()\n`;
    }
  };

  javascriptGenerator.forBlock["async_function_block"] = function (block) {
    const funcName = block.getFieldValue("FUNC_NAME"); // Obtiene el nombre de la función
    const code = javascriptGenerator.statementToCode(block, "CODE"); // Obtiene el código dentro de la función

    // Devuelve el código JavaScript para crear la función async
    return `async function ${funcName}() {\n${code}\n}\n`;
  };

  javascriptGenerator.forBlock["if_else_block"] = function (block) {
    // Obtener el código de la condición
    const condition =
      javascriptGenerator.valueToCode(block, "CONDITION", Order.NONE) ||
      "false";

    // Obtener los bloques dentro del `if`
    const ifBody = javascriptGenerator.statementToCode(block, "IF_BODY") || "";

    // Obtener los bloques dentro del `else`
    const elseBody =
      javascriptGenerator.statementToCode(block, "ELSE_BODY") || "";

    // Generar el código JavaScript del bloque
    const code = `
  if (${condition}) {
    ${ifBody}
  } else {
    ${elseBody}
  }
  `;
    return code;
  };

  javascriptGenerator.forBlock["go_to_screen"] = function (block) {
    const screenUrl = block.getFieldValue("SCREEN_URL"); // Obtener el valor de la URL ingresada en el campo de texto
    return `location.href = "${screenUrl}.html";\n`; // Generar el código JavaScript para redirigir
  };

  javascriptGenerator.forBlock["custom_text"] = function (block) {
    const text = block.getFieldValue("TEXT"); // Obtener el texto ingresado

    // Determinar cómo devolver el código basado en el contexto
    if (block.outputConnection && block.outputConnection.targetConnection) {
      // Si está siendo usado como valor (en let_declare, etc.)
      return [`"${text}"`, Order.ATOMIC];
    } else {
      // Si está siendo usado como statement
      return `"${text}",` + "\n";
    }
  };
  javascriptGenerator.forBlock["custom_code"] = function (block) {
    const text = block.getFieldValue("TEXT"); // Obtiene el texto ingresado

    // Escapa las backticks para evitar problemas al generar el código
    const escapedText = text.replace(/`/g, "\\`");

    // Retorna el texto entre backticks, respetando template literals
    return [`\`${escapedText}\``, Order.ATOMIC];
  };

  javascriptGenerator.forBlock["custom_number"] = function (block) {
    const text = block.getFieldValue("TEXT"); // Obtener el texto ingresado
    return [`${text}`, Order.ATOMIC]; // Generar el código con el texto entre comillas
  };

  javascriptGenerator.forBlock["dynamic_style_change"] = function (block) {
    const elementId = block.getFieldValue("DAY"); // El id seleccionado
    const styleName = block.getFieldValue("STYLE"); // El estilo seleccionado
    const value = javascriptGenerator.valueToCode(
      block,
      "VALUE",
      Order.ASSIGNMENT
    ); // El valor conectado

    return `document.getElementById("${elementId}").style.${styleName} = ${value};\n`;
  };

  javascriptGenerator.forBlock["const_declare"] = function (block) {
    const variableName = block.getFieldValue("VAR");

    // Obtener el valor del bloque de texto conectado al campo "VALUE"
    const value = javascriptGenerator.valueToCode(
      block,
      "VALUE",
      Order.ASSIGNMENT
    );

    // Si el bloque no está conectado o no tiene un valor, usar "undefined"
    if (!value) {
      return `const ${variableName} = undefined;\n`;
    }

    // Si el bloque tiene un valor, se genera el código de la constante
    return `const ${variableName} = ${value};\n`;
  };

  javascriptGenerator.forBlock["var_declare"] = function (block) {
    const variableName = block.getFieldValue("VAR");

    // Obtener el valor del bloque de texto conectado al campo "VALUE"
    const value = javascriptGenerator.valueToCode(
      block,
      "VALUE",
      Order.ASSIGNMENT
    );

    // Si el bloque no está conectado o no tiene un valor, usar "undefined"
    if (!value) {
      return `var ${variableName} = "";\n`;
    }

    // Si el bloque tiene un valor, se genera el código de la constante
    return `var ${variableName} = ${value};\n`;
  };
  javascriptGenerator.forBlock["let_declare"] = function (block) {
    const variableName = block.getFieldValue("LET");

    // Obtener el valor del bloque de texto conectado al campo "VALUE"
    const value = javascriptGenerator.valueToCode(
      block,
      "VALUE",
      Order.ASSIGNMENT
    );

    // Si el bloque no está conectado o no tiene un valor, usar "undefined"
    if (!value) {
      return `let ${variableName} = "";\n`;
    }

    // Si el bloque tiene un valor, se genera el código de la constante
    return `let ${variableName} = ${value};\n`;
  };
  javascriptGenerator.forBlock["var_change"] = function (block) {
    const variableName = block.getFieldValue("VAR");

    // Obtener el valor del bloque de texto conectado al campo "VALUE"
    const value = javascriptGenerator.valueToCode(
      block,
      "VALUE",
      Order.ASSIGNMENT
    );

    // Si el bloque no está conectado o no tiene un valor, usar "undefined"
    if (!value) {
      return `${variableName} = "";\n`;
    }

    // Si el bloque tiene un valor, se genera el código de la constante
    return `${variableName} = ${value};\n`;
  };
  javascriptGenerator.forBlock["var_plus"] = function (block) {
    const variableName = block.getFieldValue("VAR");

    // Obtener el valor del bloque de texto conectado al campo "VALUE"
    const value = javascriptGenerator.valueToCode(
      block,
      "VALUE",
      Order.ASSIGNMENT
    );

    // Si el bloque no está conectado o no tiene un valor, usar "undefined"
    if (!value) {
      return `${variableName} += "";\n`;
    }

    // Si el bloque tiene un valor, se genera el código de la constante
    return `${variableName} += ${value};\n`;
  };
  javascriptGenerator.forBlock["var_minus"] = function (block) {
    const variableName = block.getFieldValue("VAR");

    // Obtener el valor del bloque de texto conectado al campo "VALUE"
    const value = javascriptGenerator.valueToCode(
      block,
      "VALUE",
      Order.ASSIGNMENT
    );

    // Si el bloque no está conectado o no tiene un valor, usar "undefined"
    if (!value) {
      return `${variableName} -= "";\n`;
    }

    // Si el bloque tiene un valor, se genera el código de la constante
    return `${variableName} -= ${value};\n`;
  };

  javascriptGenerator.forBlock["show_alert"] = function (block) {
    const value = javascriptGenerator.valueToCode(
      block,
      "VALUE",
      Order.ASSIGNMENT
    );
    return `alert(${value});\n`;
  };

  javascriptGenerator.forBlock["json_stringify_variables"] = function (block) {
    const variables = javascriptGenerator.valueToCode(
      block,
      "VARIABLES",
      Order.ATOMIC
    );

    return [`JSON.stringify(${variables})`, Order.ATOMIC];
  };

  // Generadores de código corregidos
  javascriptGenerator.forBlock["const_object"] = function (block) {
    const propertiesCode = javascriptGenerator.statementToCode(
      block,
      "PROPERTIES"
    );

    // Procesar propiedades
    const properties = propertiesCode
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => line.replace(/,\s*$/, ""))
      .filter((prop) => prop.trim() !== "");

    const objectCode = `{${properties.join(", ")}}`;

    // Determinar cómo devolver el código basado en el contexto
    if (block.outputConnection && block.outputConnection.targetConnection) {
      // Si está siendo usado como valor (en let_declare, etc.)
      return [objectCode, Order.ATOMIC];
    } else {
      // Si está siendo usado como statement
      return objectCode + "\n";
    }
  };

  javascriptGenerator.forBlock["const_array"] = function (block) {
    const itemsCode = javascriptGenerator.statementToCode(block, "ITEMS");

    const items = itemsCode
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => line.replace(/,\s*$/, ""))
      .filter((item) => item.trim() !== "");

    return [`[${items.join(", ")}]`, Order.ATOMIC];
  };

  javascriptGenerator.forBlock["plugin_verdadero_falso"] = function (block) {
    const title = block.getFieldValue("TITULO");
    const time = block.getFieldValue("TIEMPO");
    const alCerrar =
      javascriptGenerator.statementToCode(block, "AL_CERRAR") || "";
    const alVolver =
      javascriptGenerator.statementToCode(block, "AL_VOLVER") || "";

    return `
function actualizarUI() {
      elementos.preguntaTexto.textContent = questions[estado.preguntaActual].title;
      elementos.tiempoRestante.textContent = estado.tiempoRestante;
      elementos.timerBar.style.width = \`\${(estado.tiempoRestante / ${time}) * 100}%\`;
      elementos.monedas.textContent = estado.monedas;
      elementos.corazones.textContent = estado.corazones;
      
      // Habilitar/deshabilitar botones según el estado
      elementos.falsoBtn.disabled = estado.respondida;
      elementos.verdaderoBtn.disabled = estado.respondida;
    }

    // Temporizador
    let temporizador;
    function iniciarTemporizador() {
      clearInterval(temporizador);
      
      temporizador = setInterval(() => {
        estado.tiempoRestante--;
        actualizarUI();
        
        if (estado.tiempoRestante <= 0 && !estado.respondida) {
          estado.respondida = true;
          clearInterval(temporizador);
          
          setTimeout(() => {
            siguientePregunta();
          }, 1000);
        }
      }, 1000);
    }

    // Manejar respuesta
    function manejarRespuesta(respuestaUsuario) {
      if (estado.respondida) return;
      
      const respuestaCorrecta = questions[estado.preguntaActual].hint === "1";
      const acerto = respuestaUsuario === respuestaCorrecta;
      
      if (acerto) {
        estado.puntaje++;
      }
      
      estado.respondida = true;
      clearInterval(temporizador);
      
      setTimeout(() => {
        siguientePregunta(estado.puntaje);
      }, 1000);
    }

    // Siguiente pregunta o finalizar juego
    function siguientePregunta(puntajeActual = estado.puntaje) {
      if (estado.preguntaActual < questions.length - 1) {
        estado.preguntaActual++;
        estado.tiempoRestante = ${time};
        estado.respondida = false;
        actualizarUI();
        iniciarTemporizador();
      } else {
        finalizarJuego(puntajeActual);
      }
    }

    // Finalizar el juego
    function finalizarJuego(puntajeFinal) {
      const totalPreguntas = questions.length;
      const porcentaje = Math.round((puntajeFinal / totalPreguntas) * 100);
      
      if (puntajeFinal === totalPreguntas) {
        // Ganó
        estado.monedas += 50;
        localStorage.setItem('monedas', estado.monedas);
        mostrarResultado(true, puntajeFinal, totalPreguntas, porcentaje);
      } else {
        // Perdió
        estado.corazones -= 1;
        localStorage.setItem('corazones', estado.corazones);        
        mostrarResultado(false, puntajeFinal, totalPreguntas, porcentaje);
      }
    }

    // Mostrar resultado final
    function mostrarResultado(gano, puntaje, total, porcentaje) {
      elementos.resultadoFinal.style.display = "flex";
      
      if (gano) {
        elementos.resultadoIcono.innerHTML = '<i class="bx  bx-trophy-star"></i> ';
        elementos.resultadoTitulo.textContent = '¡Felicidades!';
      } else {
        elementos.resultadoIcono.innerHTML = '<i class="bx  bx-heart-half"  ></i> ';
        elementos.resultadoTitulo.textContent = 'Intenta de nuevo';
      }
      
      elementos.resultadoMensaje.textContent = \`Total de aciertos:\${puntaje} de \${total} (\${porcentaje}%)\`;
    }

    // Event Listeners
    elementos.falsoBtn.addEventListener('click', () => manejarRespuesta(false));
    elementos.verdaderoBtn.addEventListener('click', () => manejarRespuesta(true));
    elementos.cerrarResultado.addEventListener('click', () => {
      elementos.resultadoFinal.classList.add('hidden');
      ${alCerrar}
    });
    elementos.volverBtn.addEventListener('click', () => {
      ${alVolver}
    });

    // Iniciar el juego cuando la página carga
    window.addEventListener('DOMContentLoaded', iniciarJuego);
`;
  };
  javascriptGenerator.forBlock["plugin_seleccion_unica"] = function (block) {
    const title = block.getFieldValue("TITULO");
    const time = block.getFieldValue("TIEMPO");
    const alCerrar =
      javascriptGenerator.statementToCode(block, "AL_CERRAR") || "";
    const alVolver =
      javascriptGenerator.statementToCode(block, "AL_VOLVER") || "";

    return `
// Actualizar la interfaz de usuario
    function actualizarUI() {
      const pregunta = questions[estado.preguntaActual];
      
      elementos.preguntaTexto.textContent = pregunta.title;
      elementos.opcion1.textContent = pregunta.opcion1;
      elementos.opcion2.textContent = pregunta.opcion2;
      elementos.opcion3.textContent = pregunta.opcion3;
      elementos.opcion4.textContent = pregunta.opcion4;
      
      elementos.tiempoRestante.textContent = estado.tiempoRestante;
      elementos.timerBar.style.width = \`\${(estado.tiempoRestante / ${time}) * 100}%\`;
      elementos.monedas.textContent = estado.monedas;
      elementos.corazones.textContent = estado.corazones;
      
      // Habilitar/deshabilitar botones según el estado
      elementos.opcion1.disabled = estado.respondida;
      elementos.opcion2.disabled = estado.respondida;
      elementos.opcion3.disabled = estado.respondida;
      elementos.opcion4.disabled = estado.respondida;
      
      // Resetear colores de opciones
      [elementos.opcion1, elementos.opcion2, elementos.opcion3, elementos.opcion4].forEach(op => {
        op.style.background = 'blue';
      });
    }

    // Temporizador
    let temporizador;
    function iniciarTemporizador() {
      clearInterval(temporizador);
      
      temporizador = setInterval(() => {
        estado.tiempoRestante--;
        actualizarUI();
        
        if (estado.tiempoRestante <= 0 && !estado.respondida) {
          estado.respondida = true;
          clearInterval(temporizador);
          
          // Mostrar la respuesta correcta cuando se acaba el tiempo
          mostrarRespuestaCorrecta();
          
          setTimeout(() => {
            siguientePregunta();
          }, 2000);
        }
      }, 1000);
    }

    // Manejar respuesta
    function manejarRespuesta(opcionSeleccionada) {
      if (estado.respondida) return;
      
      const pregunta = questions[estado.preguntaActual];
      const opcionCorrecta = pregunta.hint;
      const acerto = opcionSeleccionada === opcionCorrecta;
      
      // Marcar visualmente la respuesta seleccionada y la correcta
      if (acerto) {
        estado.puntaje++;
        elementos[opcionSeleccionada].style.background = 'red';
      } else {
         elementos[opcionSeleccionada].style.background = 'red';
        
        // Mostrar también la opción correcta
        elementos[opcionCorrecta].style.background = 'green';
      }
      
      estado.respondida = true;
      clearInterval(temporizador);
      
      setTimeout(() => {
        siguientePregunta();
      }, 2000);
    }

    // Mostrar respuesta correcta cuando se acaba el tiempo
    function mostrarRespuestaCorrecta() {
      const opcionCorrecta = questions[estado.preguntaActual].hint;
      elementos[opcionCorrecta].style.background = 'blue';
    }

    // Siguiente pregunta o finalizar juego
    function siguientePregunta() {
      if (estado.preguntaActual < questions.length - 1) {
        estado.preguntaActual++;
        estado.tiempoRestante = ${time};
        estado.respondida = false;
        actualizarUI();
        iniciarTemporizador();
      } else {
        finalizarJuego();
      }
    }

    // Finalizar el juego
    function finalizarJuego() {
      const totalPreguntas = questions.length;
      const porcentaje = Math.round((estado.puntaje / totalPreguntas) * 100);
      
      if (porcentaje >= 70) { // Umbral para ganar (70% de aciertos)
        // Ganó
        estado.monedas += 50;
        localStorage.setItem('monedas', estado.monedas);
        mostrarResultado(true, estado.puntaje, totalPreguntas, porcentaje);
      } else {
        // Perdió
        estado.corazones -= 1;
        localStorage.setItem('corazones', estado.corazones);
        mostrarResultado(false, estado.puntaje, totalPreguntas, porcentaje);
      }
    }

    // Mostrar resultado final
    function mostrarResultado(gano, puntaje, total, porcentaje) {
      elementos.resultadoFinal.style.display = "flex";
      
      if (gano) {
        elementos.resultadoIcono.innerHTML = '<i class="bx  bx-trophy-star"></i> ';
        elementos.resultadoTitulo.textContent = '¡Felicidades!';
        elementos.resultadoMensaje.textContent = \`Acertaste \${puntaje} de \${total} (\${porcentaje}%). ¡Ganaste 50 monedas!\`;
      } else {
        elementos.resultadoIcono.innerHTML = '<i class="bx  bx-heart-half"  ></i>';
        elementos.resultadoTitulo.textContent = 'Intenta de nuevo';
        elementos.resultadoMensaje.textContent = \`Acertaste\${puntaje} de \${total} (\${porcentaje}%). Pierdes 1 corazón.\`;
      }
    }

    // Event Listeners
    elementos.opcion1.addEventListener('click', () => manejarRespuesta('opcion1'));
    elementos.opcion2.addEventListener('click', () => manejarRespuesta('opcion2'));
    elementos.opcion3.addEventListener('click', () => manejarRespuesta('opcion3'));
    elementos.opcion4.addEventListener('click', () => manejarRespuesta('opcion4'));
    
    elementos.cerrarResultado.addEventListener('click', () => {
      elementos.resultadoFinal.classList.add('hidden');
      ${alCerrar}
    });
    
    elementos.volverBtn.addEventListener('click', () => {
      ${alVolver}
    });

    // Iniciar el juego cuando la página carga
    window.addEventListener('DOMContentLoaded', iniciarJuego);
`;
  };
  javascriptGenerator.forBlock["plugin_sopa_letras"] = function (block) {
    const title = block.getFieldValue("TITULO");
    const time = block.getFieldValue("TIEMPO");
    const alCerrar =
      javascriptGenerator.statementToCode(block, "AL_CERRAR") || "";
    const alVolver =
      javascriptGenerator.statementToCode(block, "AL_VOLVER") || "";

    return `
    // Funciones auxiliares
    function generarLetraAleatoria() {
      const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      return letras[Math.floor(Math.random() * letras.length)];
    }

    function generarGridVacio(size) {
      return Array.from({ length: size }, () => Array(size).fill(''));
    }

    function colocarPalabrasEnGrid(words, size) {
      const grid = generarGridVacio(size);

      const colocarPalabra = (word) => {
        const dir = Math.random() > 0.5 ? "horizontal" : "vertical";
        const maxX = dir === "horizontal" ? size - word.length : size;
        const maxY = dir === "vertical" ? size - word.length : size;

        let colocada = false;
        while (!colocada) {
          const x = Math.floor(Math.random() * maxX);
          const y = Math.floor(Math.random() * maxY);
          let puedeColocar = true;

          for (let i = 0; i < word.length; i++) {
            const xi = dir === "horizontal" ? x + i : x;
            const yi = dir === "vertical" ? y + i : y;
            if (grid[yi][xi] && grid[yi][xi] !== word[i]) {
              puedeColocar = false;
              break;
            }
          }

          if (puedeColocar) {
            for (let i = 0; i < word.length; i++) {
              const xi = dir === "horizontal" ? x + i : x;
              const yi = dir === "vertical" ? y + i : y;
              grid[yi][xi] = word[i];
            }
            colocada = true;
          }
        }
      };

      palabras.forEach(palabra => colocarPalabra(palabra));

      // Rellenar espacios vacíos con letras aleatorias
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (!grid[y][x]) {
            grid[y][x] = generarLetraAleatoria();
          }
        }
      }

      return grid;
    }

    // Funciones principales del juego
    function iniciarJuego() {
      // Cargar estado del usuario desde localStorage
      estado.monedas = parseInt(localStorage.getItem('monedas')) || 0;
      estado.corazones = parseInt(localStorage.getItem('corazones')) || 3;
      
      // Inicializar estado del juego
      estado.grid = colocarPalabrasEnGrid(palabras, tamañoSopa);
      estado.timeLeft = ${time};
      estado.gameOver = false;
      estado.resultado = null;
      estado.selectedCells = new Set();
      estado.foundWords = new Set();
      estado.highlightedCells = new Set();
      
      actualizarUI();
      iniciarTemporizador();
    }

    function actualizarUI() {
      // Actualizar barra de tiempo
  elementos.tiempoRestante.textContent = estado.timeLeft;
  elementos.timerBar.style.width = \`\${(estado.timeLeft / ${time}) * 100}%\`;

  // Actualizar monedas y corazones
  elementos.monedas.textContent = estado.monedas;
  elementos.corazones.textContent = estado.corazones;

  // Actualizar grid de sopa de letras
  elementos.sopaContainer.innerHTML = "";
  elementos.sopaContainer.style.gridTemplateColumns = \`repeat(\${tamañoSopa}, 32px)\`;
  elementos.sopaContainer.style.display = "grid";
  elementos.sopaContainer.style.gap = "0";
  elementos.sopaContainer.style.touchAction = "none"; // Importante para evitar scroll no deseado

  estado.grid.forEach((fila, y) => {
    fila.forEach((letra, x) => {
      const celdaId = \`\${x}-\${y}\`;
      const celda = document.createElement("div");

      // Estilos base de la celda
      celda.style.width = "32px";
      celda.style.height = "32px";
      celda.style.border = "1px solid #ccc";
      celda.style.textAlign = "center";
      celda.style.lineHeight = "32px";
      celda.style.fontWeight = "bold";
      celda.style.cursor = "pointer";
      celda.style.userSelect = "none";

      // Estilos según el estado de la celda
      if (estado.highlightedCells.has(celdaId)) {
        celda.style.backgroundColor = "#48BB78"; // verde-500
        celda.style.color = "white";
      } else if (estado.selectedCells.has(celdaId)) {
        celda.style.backgroundColor = "#BFDBFE"; // azul-200
      } else {
        celda.style.backgroundColor = "white";
        celda.style.transition = "background-color 0.2s";
      }

      celda.textContent = letra;
      celda.dataset.x = x;
      celda.dataset.y = y;

      // Eventos para mouse
      celda.addEventListener("mousedown", () => manejarMouseDown(x, y));
      celda.addEventListener("mouseenter", () => manejarMouseEnter(x, y));
      celda.addEventListener("mouseup", () => manejarMouseUp(x, y));
      
      // Eventos para touch (móvil)
      celda.addEventListener("touchstart", (e) => {
        e.preventDefault();
        manejarTouchStart(x, y);
      }, { passive: false });
      
      celda.addEventListener("touchmove", (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (element && element.dataset.x && element.dataset.y) {
          manejarTouchMove(parseInt(element.dataset.x), parseInt(element.dataset.y));
        }
      }, { passive: false });
      
      celda.addEventListener("touchend", (e) => {
        e.preventDefault();
        manejarTouchEnd(x, y);
      }, { passive: false });

      elementos.sopaContainer.appendChild(celda);
    });
  });
      
      // Actualizar lista de palabras
      elementos.palabrasList.innerHTML = '';
      elementos.palabrasList.style.display = 'flex';
      elementos.palabrasList.style.flexWrap = 'wrap';
      elementos.palabrasList.style.justifyContent = 'center';
      elementos.palabrasList.style.gap = '8px';
      
      palabras.forEach(palabra => {
        const palabraElement = document.createElement('div');
        palabraElement.style.fontSize = '1.25rem';
        palabraElement.style.fontWeight = '500';
        
        if (estado.foundWords.has(palabra)) {
          palabraElement.style.textDecoration = 'line-through';
          palabraElement.style.color = '#48BB78'; // verde-500
        }
        
        palabraElement.textContent = palabra;
        elementos.palabrasList.appendChild(palabraElement);
      });
    }

    // Temporizador
    let temporizador;
    function iniciarTemporizador() {
      clearInterval(temporizador);
      
      temporizador = setInterval(() => {
        estado.timeLeft--;
        actualizarUI();
        
        if (estado.timeLeft <= 0) {
          clearInterval(temporizador);
          estado.gameOver = true;
          verificarCompletado();
        }
      }, 1000);
    }

     // Manejo de selección de celdas
      function manejarMouseDown(x, y) {
        const celdaId = \`\${x}-\${y}\`;
        estado.isDragging = true;
        estado.dragStartCell = celdaId;
        estado.selectedCells = new Set([celdaId]);
        actualizarUI();
      }

      function manejarMouseEnter(x, y) {
        if (!estado.isDragging) return;

        const celdaId = \`\${x}-\${y}\`;
        estado.selectedCells.add(celdaId);
        actualizarUI();
      }

      function manejarMouseUp(x, y) {
        if (!estado.isDragging) return;

        estado.isDragging = false;

        // Extraer la palabra seleccionada
        const celdasSeleccionadas = Array.from(estado.selectedCells).sort();
        const palabraSeleccionada = celdasSeleccionadas
          .map((celdaId) => {
            const [x, y] = celdaId.split("-").map(Number);
            return estado.grid[y][x];
          })
          .join("");

        // Verificar si la palabra está en la lista
        if (palabras.includes(palabraSeleccionada)) {
          estado.foundWords.add(palabraSeleccionada);
          celdasSeleccionadas.forEach((celdaId) => {
            estado.highlightedCells.add(celdaId);
          });
        }

        estado.selectedCells = new Set();
        actualizarUI();
      }

    // Nuevas funciones para manejo táctil
  function manejarTouchStart(x, y) {
    const celdaId = \`\${x}-\${y}\`;
    estado.isDragging = true;
    estado.dragStartCell = celdaId;
    estado.selectedCells = new Set([celdaId]);
    actualizarUI();
  }

  function manejarTouchMove(x, y) {
    if (!estado.isDragging) return;
    
    const celdaId = \`\${x}-\${y}\`;
    estado.selectedCells.add(celdaId);
    actualizarUI();
  }

  function manejarTouchEnd(x, y) {
    if (!estado.isDragging) return;
    
    estado.isDragging = false;
    
    // Extraer la palabra seleccionada
    const celdasSeleccionadas = Array.from(estado.selectedCells).sort();
    const palabraSeleccionada = celdasSeleccionadas
      .map((celdaId) => {
        const [x, y] = celdaId.split("-").map(Number);
        return estado.grid[y][x];
      })
      .join("");

    // Verificar si la palabra está en la lista
    if (palabras.includes(palabraSeleccionada)) {
      estado.foundWords.add(palabraSeleccionada);
      celdasSeleccionadas.forEach((celdaId) => {
        estado.highlightedCells.add(celdaId);
      });
    }

    estado.selectedCells = new Set();
    actualizarUI();
  }

    // Verificación de completado
    function verificarCompletado() {
      const porcentaje = Math.floor((estado.foundWords.size / palabras.length) * 100);
      
      if (estado.foundWords.size === palabras.length) {
        // Ganó
        estado.monedas += 50;
        localStorage.setItem('monedas', estado.monedas);
        mostrarResultado(true, estado.foundWords.size, palabras.length, porcentaje);
      } else {
        // Perdió
        estado.corazones -= 1;
        localStorage.setItem('corazones', estado.corazones);
        mostrarResultado(false, estado.foundWords.size, palabras.length, porcentaje);
      }
    }

    // Mostrar resultado final
    function mostrarResultado(gano, encontradas, total, porcentaje) {
      elementos.resultadoFinal.style.display = 'flex';
      
      if (gano) {
        elementos.resultadoIcono.innerHTML = '<i class="bx  bx-trophy-star" style="color: #F59E0B;"></i>'; // amarillo-500
        elementos.resultadoTitulo.textContent = '¡Felicidades!';
        elementos.resultadoMensaje.textContent = \`Encontraste \${encontradas} de \${total} palabras (\${porcentaje}%). ¡Ganaste 50 monedas!\`;
      } else {
        elementos.resultadoIcono.innerHTML = '<i class="bx  bx-heart-half" style="color: #EF4444;"></i>'; // rojo-500
        elementos.resultadoTitulo.textContent = 'Intenta de nuevo';
        elementos.resultadoMensaje.textContent = \`Encontraste \${encontradas} de \${total} palabras (\${porcentaje}%). Pierdes 1 corazón.\`;
      }
    }

    // Event Listeners
    elementos.verificarBtn.addEventListener('click', verificarCompletado);
    elementos.cerrarResultado.addEventListener('click', () => {
      elementos.resultadoFinal.style.display = 'none';
      ${alCerrar}
    });
    elementos.volverBtn.addEventListener('click', () => {
      ${alVolver}
    });

    // Iniciar el juego cuando la página carga
    window.addEventListener('DOMContentLoaded', iniciarJuego);
`;
  };

  javascriptGenerator.forBlock["json_item"] = function (block) {
    const key = block.getFieldValue("KEY").trim();
    const value = javascriptGenerator.valueToCode(block, "VALUE", Order.ATOMIC);

    // Formatear la clave correctamente para JSON
    const formattedKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
      ? key
      : `"${key}"`;

    const jsitemCode = `${formattedKey}: ${value},`; // Sin coma al final

    // Determinar cómo devolver el código basado en el contexto
    if (block.outputConnection && block.outputConnection.targetConnection) {
      // Si está siendo usado como valor (en let_declare, etc.)
      return [jsitemCode, Order.ATOMIC];
    } else {
      // Si está siendo usado como statement
      return jsitemCode + "\n";
    }
  };

  // Define JavaScript code generation for the block
  javascriptGenerator.forBlock["use_element_by_id"] = function (block) {
    const elementId = block.getFieldValue("DAY");

    if (elementId === "NONE") {
      return "// No element selected.\n";
    }

    const lineCode = `document.getElementById("${elementId}")\n`;

    // Determinar cómo devolver el código basado en el contexto
    if (block.outputConnection && block.outputConnection.targetConnection) {
      // Si está siendo usado como valor (en let_declare, etc.)
      return [lineCode, Order.ATOMIC];
    } else {
      // Si está siendo usado como statement
      return lineCode + "\n";
    }
  };

  javascriptGenerator.forBlock["json_parse_variables"] = function (block) {
    const variables = javascriptGenerator.valueToCode(
      block,
      "VARIABLES",
      Order.ATOMIC
    );
    return [`JSON.parse(${variables})`, Order.ATOMIC];
  };

  javascriptGenerator.forBlock["parse_int"] = function (block) {
    const variables = javascriptGenerator.valueToCode(
      block,
      "VARIABLES",
      Order.ATOMIC
    );
    return [`parseInt(${variables})`, Order.ATOMIC];
  };

  javascriptGenerator.forBlock["localstorage_get"] = function (block) {
    const key = block.getFieldValue("KEY") || "clave";
    const code = `localStorage.getItem(${JSON.stringify(key)})`;
    return [code, Order.ATOMIC]; // 👈 devuelve como expresión
  };

  javascriptGenerator.forBlock["localstorage_remve_item"] = function (block) {
    const key = block.getFieldValue("KEY") || "clave";
    const code = `localStorage.removeItem(${JSON.stringify(key)});`;
    return code + "\n"; // ✅ devolución correcta para bloques tipo sentencia
  };

  javascriptGenerator.forBlock["json_variable"] = function (block) {
    const variableName = block.getFieldValue("VAR").trim();
    return `${variableName},\n`;
  };

  javascriptGenerator.forBlock["update_user_field"] = function (block) {
    const field = block.getFieldValue("FIELD");
    const value =
      javascriptGenerator.valueToCode(
        block,
        "VALUE",
        javascriptGenerator.ORDER_ATOMIC
      ) || "0";

    const code = `updateUserField("${field}", ${value});\n`;
    return code;
  };

  javascriptGenerator.forBlock["const_use"] = function (block) {
    const variableName = block.getFieldValue("VAR");
    // Obtener el valor del bloque de texto conectado al campo "VALUE"
    const value = javascriptGenerator.valueToCode(block, "VALUE", Order.MEMBER);

    // Si no hay valor conectado, devolvemos solo el nombre
    if (!value) {
      return [variableName, Order.ATOMIC];
    }

    // Si hay algo conectado, lo concatenamos (ej: user.username)
    const code = `${variableName}.${value}`;
    return [code, Order.MEMBER];
  };

  javascriptGenerator.forBlock["set_interval_block"] = function (block) {
    var interval = block.getFieldValue("INTERVAL"); // Obtiene el valor de los milisegundos
    var statements_code = javascriptGenerator.statementToCode(block, "CODE"); // Obtiene el código dentro del bloque

    var code = `setInterval(() => {\n${statements_code}}, ${interval});\n`;
    return code;
  };

  javascriptGenerator.forBlock["set_timeout_block"] = function (block) {
    var interval = block.getFieldValue("INTERVAL"); // Obtiene el valor de los milisegundos
    var statements_code = javascriptGenerator.statementToCode(block, "CODE"); // Obtiene el código dentro del bloque

    var code = `setTimeout(() => {\n${statements_code}}, ${interval});\n`;
    return code;
  };

  javascriptGenerator.forBlock["dynamic_dropdown_text_content"] = function (
    block
  ) {
    const elementId = block.getFieldValue("DAY"); // El ID seleccionado
    const value = javascriptGenerator.valueToCode(
      block,
      "VALUE",
      Order.ASSIGNMENT
    ); // El valor que se asignará

    return `document.getElementById("${elementId}").textContent = ${value};\n`;
  };

  // Generador para el bloque de inicialización con stores
  javascriptGenerator.forBlock["indexeddb_init_with_stores"] = function (
    block
  ) {
    const dbName = block.getFieldValue("DB_NAME") || "myDataBase";
    const version = block.getFieldValue("VERSION") || 1;
    const storesCode = javascriptGenerator.statementToCode(block, "STORES");
    const successCode = javascriptGenerator.statementToCode(block, "SUCCESS");
    const errorCode = javascriptGenerator.statementToCode(block, "ERROR");

    const code = `
// Inicialización de IndexedDB con stores
let db;
const request = indexedDB.open("${dbName}", ${version});

request.onerror = function(event) {
  console.error("Error al abrir la base de datos:", event.target.error);
  ${errorCode.replace(/\n/g, "\n  ")}
};

request.onsuccess = function(event) {
  db = event.target.result;
  console.log("Base de datos ${dbName} abierta con éxito");
  ${successCode.replace(/\n/g, "\n  ")}
};

request.onupgradeneeded = function(event) {
  const db = event.target.result;
  console.log("Configuración inicial de la base de datos ${dbName}");
  ${storesCode.replace(/\n/g, "\n  ")}
};\n`;

    return code;
  };

  // Generador para el bloque de definición de store
  javascriptGenerator.forBlock["store_definition"] = function (block) {
    const storeName = block.getFieldValue("STORE_NAME") || "miStore";
    const keyPath = block.getFieldValue("KEY_PATH") || "id";
    const autoIncrement = block.getFieldValue("AUTO_INCREMENT")
      ? "true"
      : "false";

    const code = `
// Crear ObjectStore: ${storeName}
const ${storeName}Store = db.createObjectStore("${storeName}", {
  keyPath: "${keyPath}",
  autoIncrement: ${autoIncrement}
});\n`;

    return code;
  };

  // Generador para el bloque de índice en store
  javascriptGenerator.forBlock["store_index"] = function (block) {
    const storeName = block.getFieldValue("STORE_NAME") || "miStore";
    const indexName = block.getFieldValue("INDEX_NAME") || "miIndice";
    const fieldPath = block.getFieldValue("FIELD_PATH") || "campo";
    const unique = block.getFieldValue("UNIQUE") ? "true" : "false";

    const code = `
// Crear índice en ${storeName}
${storeName}Store.createIndex("${indexName}", "${fieldPath}", { unique: ${unique} });\n`;

    return code;
  };

  javascriptGenerator.forBlock["indexeddb_crud"] = function (block) {
    const operation = block.getFieldValue("OPERATION");
    const storeName = block.getFieldValue("STORE_NAME") || "miStore";

    // Obtener el código de los bloques conectados
    const data =
      javascriptGenerator.valueToCode(block, "DATA", Order.MEMBER) || "{}";
    const key =
      javascriptGenerator.valueToCode(block, "KEY", Order.ATOMIC) || "null";

    // Obtener los bloques de éxito y error
    const successCode = javascriptGenerator.statementToCode(block, "SUCCESS");
    const errorCode = javascriptGenerator.statementToCode(block, "ERROR");

    let code = "";
    const transactionCode = `const transaction = db.transaction(["${storeName}"], "${
      operation === "getAll" ? "readonly" : "readwrite"
    }");
const store = transaction.objectStore("${storeName}");\n`;

    switch (operation) {
      case "add":
        code = transactionCode + `const request = store.add(${data});\n`;
        break;
      case "put":
        code =
          transactionCode + `const request = store.put(${data}, ${key});\n`;
        break;
      case "get":
        code = transactionCode + `const request = store.get(${key});\n`;
        break;
      case "delete":
        code = transactionCode + `const request = store.delete(${key});\n`;
        break;
      case "getAll":
        code = transactionCode + `const request = store.getAll();\n`;
        break;
    }

    code += `
request.onsuccess = function(event) {
  // Resultado disponible en event.target.result
  ${successCode.replace(/\n/g, "\n  ")}
};\n
request.onerror = function(event) {
  // Error disponible en event.target.error
  ${errorCode.replace(/\n/g, "\n  ")}
};\n`;

    return code;
  };

  javascriptGenerator.forBlock["array_forEach"] = function (block) {
    const arrayName = block.getFieldValue("ARRAY_NAME") || "miArray";
    const paramName = block.getFieldValue("PARAM_NAME") || "elemento";
    const bodyCode = javascriptGenerator.statementToCode(block, "BODY");

    // Asegurarse de que el código del cuerpo esté indentado correctamente
    const indentedBodyCode = bodyCode
      .split("\n")
      .map((line) => (line ? "  " + line : line))
      .join("\n");

    const code = `${arrayName}.forEach((${paramName}) => {\n${indentedBodyCode}\n});\n`;
    return code;
  };

  javascriptGenerator.forBlock["modify_user_field"] = function (block) {
    const field = block.getFieldValue("FIELD");
    const operation = block.getFieldValue("OPERATION");
    const value =
      javascriptGenerator.valueToCode(block, "VALUE", Order.ATOMIC) || "0";

    const code = `
    (function(){
      const transaction = db.transaction(["users"], "readwrite");
      const store = transaction.objectStore("users");
      const getRequest = store.getAll();

      getRequest.onsuccess = () => {
        const users = getRequest.result;
        if (users.length === 0) return;

        const lastUser = users[users.length - 1];

        // Operación dinámica
        if ("${operation}" === "=") lastUser["${field}"] = ${value};
        if ("${operation}" === "+") lastUser["${field}"] += ${value};
        if ("${operation}" === "-") lastUser["${field}"] -= ${value};

        const putRequest = store.put(lastUser);
        putRequest.onsuccess = () => {
          if ("${field}" === "monedas" && declarations.coinsBox) declarations.coinsBox.textContent = lastUser["${field}"];
          if ("${field}" === "hearts" && declarations.heartsBox) declarations.heartsBox.textContent = lastUser["${field}"];
        };

        putRequest.onerror = (event) => console.error("Error al actualizar usuario:", event.target.error);
      };

      getRequest.onerror = (event) => console.error("Error al leer usuarios:", event.target.error);
    })();
  `;

    return code;
  };

  javascriptGenerator.forBlock["save_user_event"] = function (block) {
    // Código a generar
    const code = `
// ---------------- FUNCIONES ----------------
const saveUser = (username) => {
  const transaction = db.transaction(["users"], "readwrite");
  const store = transaction.objectStore("users");
  const request = store.add(
  { username,
   monedas: 0,
   hearts: 3,
   }
   );

  request.onsuccess = () => {
    console.log("Usuario guardado:", username);
  };

  request.onerror = (event) => {
    console.error("Error al guardar el usuario:", event.target.error);
  };
};


// ---------------- EVENTOS ----------------
declarations.registerBtn.addEventListener("click", () => {
  const username = declarations.username.value.trim();
  if (!username) {
    alert("Por favor escribe un nombre");
    return;
  }
  saveUser(username);
  declarations.username.value = ""; // limpiar input
});`;
    return code;
  };

  javascriptGenerator.forBlock["use_user_event"] = function (block) {
    // Código a generar
    const code = `
const loadUserData = () => {
      const transaction = db.transaction(["users"], "readonly");
      const store = transaction.objectStore("users");
      const request = store.getAll();

      request.onsuccess = () => {
        const users = request.result;
        if (users.length === 0) return;

        const lastUser = users[users.length - 1]; // último registrado

        if (declarations.usernameBox) {
          declarations.usernameBox.textContent = lastUser.username;
        }
        if (declarations.coinsBox) {
          declarations.coinsBox.textContent = lastUser.monedas;
        }
        if (declarations.heartsBox) {
          declarations.heartsBox.textContent = lastUser.hearts;
        }
      };

      request.onerror = (event) => {
        console.error("Error al leer usuarios:", event.target.error);
      };
    };`;
    return code;
  };

  javascriptGenerator.forBlock["smart_return"] = function (block) {
    // 2. Valor a retornar (si existe)
    const returnValue = javascriptGenerator.valueToCode(
      block,
      "RETURN_VALUE",
      Order.NONE
    );

    // 3. Decide el tipo de return
    let returnStatement = "return;";
    if (returnValue) {
      returnStatement = `return ${returnValue};`;
    }

    // Combina todo: bloques anteriores + return
    return `return;`;
  };

  // Function to generate code from Blockly blocks
  const generateCode = () => {
    if (!workspaceRef.current) {
      console.error("Workspace not initialized");
      return;
    }

    try {
      const blocklyCode = javascriptGenerator.workspaceToCode(
        workspaceRef.current
      );
      // Serializar el estado del espacio de trabajo a JSON
      const state = Blockly.serialization.workspaces.save(workspaceRef.current);
      const jsonText = JSON.stringify(state);

      onGenerateCode(blocklyCode, jsonText); // Envía ambos al callback
    } catch (error) {
      console.error("Error generating code:", error);
    }
  };

  return (
    <div className="relative w-full h-screen">
      <div ref={blocklyDiv} className="w-full h-full text-black"></div>
      <button
        onClick={generateCode}
        className="absolute top-2 right-2 px-4 py-2 bg-blue-400 text-white rounded-3xl"
      >
        Guardar Código
      </button>
    </div>
  );
};

export default BlocklyComponent;
