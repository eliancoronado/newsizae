class Token {
  constructor(type, value, line) {
    this.type = type;
    this.value = value;
    this.line = line;
  }
}

/* =========================
   LEXER CON INDENT REAL
========================= */
class Lexer {
  constructor(input) {
    this.lines = input.replace(/\r/g, "").split("\n");
    this.tokens = [];
  }

  tokenize() {
    const indentStack = [0];

    for (let lineNum = 0; lineNum < this.lines.length; lineNum++) {
      let line = this.lines[lineNum];

      if (line.trim() === "") continue;

      const indent = line.match(/^ */)[0].length;
      const content = line.trim();

      if (indent > indentStack[indentStack.length - 1]) {
        indentStack.push(indent);
        this.tokens.push(new Token("INDENT", null, lineNum + 1));
      }

      while (indent < indentStack[indentStack.length - 1]) {
        indentStack.pop();
        this.tokens.push(new Token("DEDENT", null, lineNum + 1));
      }

      const parts = content.match(
        /"[^"]*"|\d*\.\d+|\d+|\w+|==|!=|<=|>=|\+\+|\-\-|\+=|\-=|\*=|\/=|%=|<<|>>|&|\||\^|\?|:|\/\/.*|\[|\]|\{|\}|,|;|:|\(|\)|\+|\-|\*|\/|%|>|<|=|\./g,
      );

      if (!parts) continue;

      parts.forEach((p) => {
        const keywords = {
          funcion: "FUNCTION",
          si: "IF",
          sino: "ELSE",
          mientras: "WHILE",
          retornar: "RETURN",
          imprimir: "PRINT",
          clase: "CLASS",
          este: "THIS",
          intentar: "TRY",
          atrapar: "CATCH",
          verdadero: "TRUE",
          falso: "FALSE",
          nulo: "NULL",
          y: "AND",
          o: "OR",
          no: "NOT",
          romper: "BREAK",
          continuar: "CONTINUE",
          para: "FOR",
          //
          elegir: "SWITCH",
          caso: "CASE",
          defecto: "DEFAULT",
          hacer: "DO",
          modulo: "MODULO", // opcional, o usar símbolo %
          importar: "IMPORT",
          desde: "FROM",
          async: "ASYNC",
          esperar: "AWAIT", // await en español
        };

        if (keywords[p])
          this.tokens.push(new Token(keywords[p], p, lineNum + 1));
        else if (/^\d+$/.test(p))
          this.tokens.push(new Token("NUMBER", p, lineNum + 1));
        else if (/^".*"$/.test(p))
          this.tokens.push(new Token("STRING", p, lineNum + 1));
        else if (/^[a-zA-Z_]\w*$/.test(p))
          this.tokens.push(new Token("IDENTIFIER", p, lineNum + 1));
        else this.tokens.push(new Token("SYMBOL", p, lineNum + 1));
      });

      this.tokens.push(new Token("NEWLINE", null, lineNum + 1));
    }

    while (indentStack.length > 1) {
      indentStack.pop();
      this.tokens.push(new Token("DEDENT", null, this.lines.length));
    }

    this.tokens.push(new Token("EOF", null, this.lines.length));
    return this.tokens;
  }
}

/* =========================
   PARSER
========================= */
class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek() {
    return this.tokens[this.pos];
  }
  // O crea un método separado:
  peekNext() {
    return this.tokens[this.pos + 1];
  }
  next() {
    return this.tokens[this.pos++];
  }

  parse() {
    let body = [];
    while (this.peek().type !== "EOF") {
      if (this.peek().type === "NEWLINE") {
        this.next();
        continue;
      }
      body.push(this.statement());
    }
    return { type: "Program", body };
  }

  forStmt() {
    this.next(); // FOR

    const init = this.assignment();

    if (this.peek().value !== ";") throw new Error("Se esperaba ';' en for");

    this.next();

    const test = this.expression();

    if (this.peek().value !== ";") throw new Error("Se esperaba ';' en for");

    this.next();

    const update = this.assignment();

    if (this.peek().value !== ":") throw new Error("Se esperaba ':' en for");

    this.next();

    return {
      type: "For",
      init,
      test,
      update,
      body: this.block(),
    };
  }

  importStmt() {
    this.next(); // IMPORT
    let names = [];

    if (this.peek().value === "{") {
      this.next(); // consumir {
      while (this.peek().value !== "}") {
        names.push(this.next().value);
        if (this.peek().value === ",") this.next();
      }
      this.next(); // consumir }
    } else {
      names.push(this.next().value);
    }

    if (this.peek().type !== "FROM") throw new Error("Se esperaba 'desde'");
    this.next(); // FROM

    const module = this.next().value; // string con el nombre del módulo

    return { type: "Import", names, module };
  }

  switchStmt() {
    this.next(); // SWITCH
    const value = this.expression();

    if (this.peek().value !== ":") throw new Error("Se esperaba ':'");
    this.next(); // consumir :

    // Saltar NEWLINEs e INDENT
    while (this.peek().type === "NEWLINE") this.next();
    if (this.peek().type !== "INDENT")
      throw new Error("Se esperaba indentación");
    this.next(); // consumir INDENT

    const cases = [];
    let defaultCase = null;

    while (this.peek().type !== "DEDENT" && this.peek().type !== "EOF") {
      if (this.peek().type === "NEWLINE") {
        this.next();
        continue;
      }

      if (this.peek().type === "CASE") {
        this.next(); // CASE
        const caseValue = this.expression();
        if (this.peek().value !== ":") throw new Error("Se esperaba ':'");
        this.next(); // consumir :

        // Saltar NEWLINEs
        while (this.peek().type === "NEWLINE") this.next();
        if (this.peek().type !== "INDENT")
          throw new Error("Se esperaba indentación en case");
        this.next(); // consumir INDENT

        const body = [];
        while (this.peek().type !== "DEDENT" && this.peek().type !== "EOF") {
          if (this.peek().type === "NEWLINE") {
            this.next();
            continue;
          }
          body.push(this.statement());
          while (this.peek().type === "NEWLINE") this.next();
        }
        this.next(); // consumir DEDENT

        cases.push({ type: "Case", value: caseValue, body });
      } else if (this.peek().type === "DEFAULT") {
        this.next(); // DEFAULT
        if (this.peek().value !== ":") throw new Error("Se esperaba ':'");
        this.next(); // consumir :

        while (this.peek().type === "NEWLINE") this.next();
        if (this.peek().type !== "INDENT")
          throw new Error("Se esperaba indentación en default");
        this.next(); // consumir INDENT

        const body = [];
        while (this.peek().type !== "DEDENT" && this.peek().type !== "EOF") {
          if (this.peek().type === "NEWLINE") {
            this.next();
            continue;
          }
          body.push(this.statement());
          while (this.peek().type === "NEWLINE") this.next();
        }
        this.next(); // consumir DEDENT

        defaultCase = { type: "Default", body };
      }
    }

    this.next(); // consumir DEDENT final del switch
    return { type: "Switch", value, cases, default: defaultCase };
  }

  doWhileStmt() {
    this.next(); // DO

    if (this.peek().value !== ":") throw new Error("Se esperaba ':'");
    this.next(); // consumir :

    const body = this.block();

    if (this.peek().type !== "WHILE") throw new Error("Se esperaba 'mientras'");
    this.next(); // WHILE

    const test = this.expression();

    return { type: "DoWhile", test, body };
  }

  statement() {
    const t = this.peek();

    if (t.type === "BREAK") {
      this.next();
      return { type: "Break" };
    }

    if (t.type === "CONTINUE") {
      this.next();
      return { type: "Continue" };
    }
    if (t.type === "FOR") return this.forStmt();
    if (t.type === "FUNCTION") return this.functionDecl();
    if (t.type === "ASYNC") return this.functionDecl();
    if (t.type === "CLASS") return this.classDecl();
    if (t.type === "IF") return this.ifStmt();
    if (t.type === "WHILE") return this.whileStmt();
    if (t.type === "RETURN") return this.returnStmt();
    if (t.type === "PRINT") return this.printStmt();
    if (t.type === "TRY") return this.tryStmt();
    if (t.type === "SWITCH") return this.switchStmt();
    if (t.type === "DO") return this.doWhileStmt();
    if (t.type === "IMPORT") return this.importStmt();

    // Verificar si es una asignación a una propiedad con THIS
    if (t.type === "THIS") {
      const currentPos = this.pos;
      this.next(); // consumir THIS
      if (this.peek().value === ".") {
        this.next(); // consumir .
        const prop = this.next();
        if (this.peek().value === "=") {
          this.pos = currentPos;
          return this.thisAssignment();
        }
      }
      this.pos = currentPos;
    }

    // 🔥 DETECTAR TODOS LOS CASOS DE IDENTIFICADOR EN UN SOLO BLOQUE
    if (t.type === "IDENTIFIER") {
      const startPos = this.pos;

      // Guardar el nombre antes de consumir
      const name = t.value;

      // Guardar posición actual
      const currentPos = this.pos;

      // Ver el siguiente token sin consumirlo
      // Avanzar para ver el siguiente token
      this.next(); // consumir temporalmente el IDENTIFIER
      const nextToken = this.peek();

      // Restaurar posición
      this.pos = currentPos;

      // 🔥 Detectar operadores compuestos PRIMERO
      if (
        nextToken &&
        ["+=", "-=", "*=", "/=", "%="].includes(nextToken.value)
      ) {
        // Consumir el IDENTIFIER
        this.next(); // consumir IDENTIFIER
        const opToken = this.next(); // consumir el operador compuesto
        const operator = opToken.value[0];
        const value = this.expression();

        return {
          type: "CompoundAssign",
          name: name,
          operator: operator,
          value: value,
        };
      }

      // Si no es compuesto, continuar con la lógica normal
      const expr = this.expression();

      console.log("Expresión parseada:", JSON.stringify(expr, null, 2));
      console.log("Siguiente token:", this.peek());

      // 🔥 NUEVO: Manejar incremento/decremento como statement
      if (expr.type === "Update") {
        return {
          type: "ExpressionStatement",
          expression: expr,
        };
      }

      // Caso 1: Asignación (variable = valor  o  objeto.prop = valor)
      if (this.peek().value === "=") {
        this.next(); // consumir =

        if (expr.type === "Get") {
          return {
            type: "Set",
            object: expr.object,
            name: expr.name,
            value: this.expression(),
          };
        } else if (expr.type === "Variable") {
          return {
            type: "Assign",
            name: expr.name,
            value: this.expression(),
          };
        } else {
          throw new Error("Asignación inválida línea " + t.line);
        }
      }

      // Caso 2: Evento (algo.algo(...): )
      if (this.peek().value === ":") {
        this.next(); // consumir :

        // 🔥 NUEVO: Saltar NEWLINEs opcionales antes del bloque
        while (this.peek().type === "NEWLINE") {
          this.next();
        }

        return {
          type: "Event",
          callee: expr,
          body: this.block(),
        };
      }

      // Caso 3: Llamada como statement (algo.algo(...))
      if (expr.type === "Call") {
        return {
          type: "ExpressionStatement",
          expression: expr,
        };
      }

      // 🔥 También manejar Unary expressions (ej: -5)
      if (expr.type === "Unary") {
        return {
          type: "ExpressionStatement",
          expression: expr,
        };
      }

      // Si no es ninguno de los casos anteriores, error
      this.pos = startPos;
      throw new Error("Declaración inválida línea " + t.line);
    }

    throw new Error("Declaración inválida línea " + t.line);
  }

  // Nueva función para manejar asignaciones a this
  thisAssignment() {
    this.next(); // consumir THIS
    this.next(); // consumir .
    const prop = this.next().value; // nombre de la propiedad
    this.next(); // consumir =
    const value = this.expression();

    return {
      type: "ThisAssign",
      prop,
      value,
    };
  }

  block() {
    // Saltar NEWLINEs iniciales
    while (this.peek().type === "NEWLINE") {
      this.next();
    }

    // Verificar que hay INDENT
    if (this.peek().type !== "INDENT") {
      throw new Error("Se esperaba indentación en línea " + this.peek().line);
    }

    this.next(); // Consumir INDENT

    let body = [];

    // Procesar statements hasta encontrar DEDENT
    while (this.peek().type !== "DEDENT" && this.peek().type !== "EOF") {
      if (this.peek().type === "NEWLINE") {
        this.next();
        continue;
      }

      // Importante: guardar la posición actual antes de procesar el statement
      body.push(this.statement());

      // Después de cada statement, saltar NEWLINEs si los hay
      while (this.peek().type === "NEWLINE") {
        this.next();
      }
    }

    // Consumir el DEDENT
    if (this.peek().type === "DEDENT") {
      this.next();
    }

    return body;
  }

  functionDecl() {
    let isAsync = false;

    // Detectar si es async
    if (this.peek().type === "ASYNC") {
      isAsync = true;
      this.next(); // consumir ASYNC
    }

    this.next(); // FUNCTION
    const name = this.next().value;

    this.next(); // (
    let params = [];
    while (this.peek().value !== ")") {
      params.push(this.next().value);
      if (this.peek().value === ",") this.next();
    }
    this.next(); // )

    if (this.peek().value !== ":")
      throw new Error("Se esperaba ':' en línea " + this.peek().line);

    this.next(); // :

    return {
      type: "Function",
      name,
      params,
      body: this.block(),
      async: isAsync, // ✅ ¡AGREGAR ESTA LÍNEA!
    };
  }

  classDecl() {
    this.next(); // CLASS
    const name = this.next().value;

    if (this.peek().value !== ":")
      throw new Error("Se esperaba ':' en línea " + this.peek().line);

    this.next(); // :

    return {
      type: "Class",
      name,
      body: this.block(),
    };
  }

  ifStmt() {
    this.next(); // IF
    const test = this.expression();

    if (this.peek().value !== ":")
      throw new Error("Se esperaba ':' en línea " + this.peek().line);

    this.next(); // :

    const consequent = this.block();

    let alternate = [];

    if (this.peek().type === "ELSE") {
      this.next(); // ELSE

      if (this.peek().value !== ":")
        throw new Error("Se esperaba ':' en línea " + this.peek().line);

      this.next(); // :

      alternate = this.block();
    }

    return { type: "If", test, consequent, alternate };
  }

  whileStmt() {
    this.next(); // WHILE
    const test = this.expression();

    if (this.peek().value !== ":")
      throw new Error("Se esperaba ':' en línea " + this.peek().line);

    this.next(); // :

    return {
      type: "While",
      test,
      body: this.block(),
    };
  }

  tryStmt() {
    this.next(); // TRY

    if (this.peek().value !== ":")
      throw new Error("Se esperaba ':' en línea " + this.peek().line);

    this.next(); // :

    const tryBlock = this.block();

    if (this.peek().type !== "CATCH")
      throw new Error("Se esperaba 'atrapar' en línea " + this.peek().line);

    this.next(); // CATCH

    if (this.peek().value !== ":")
      throw new Error("Se esperaba ':' en línea " + this.peek().line);

    this.next(); // :

    const catchBlock = this.block();

    return { type: "Try", tryBlock, catchBlock };
  }

  returnStmt() {
    this.next(); // consumir RETURN

    // 🔥 Si viene NEWLINE o DEDENT, es retorno vacío
    if (this.peek().type === "NEWLINE" || this.peek().type === "DEDENT") {
      return {
        type: "Return",
        value: { type: "Literal", value: null },
      };
    }

    const value = this.expression();

    return {
      type: "Return",
      value: value,
    };
  }

  printStmt() {
    this.next(); // consumir PRINT
    const expr = this.expression();
    return { type: "Print", expr };
  }

  anonymousFunction() {
    let isAsync = false;

    // Detectar si es async
    if (this.peek().type === "ASYNC") {
      isAsync = true;
      this.next(); // consumir ASYNC
    }

    this.next(); // FUNCTION (consumir FUNCTION)

    this.next(); // consumir (

    let params = [];
    while (this.peek().value !== ")") {
      params.push(this.next().value);
      if (this.peek().value === ",") this.next();
    }

    this.next(); // )

    if (this.peek().value !== ":")
      throw new Error("Se esperaba ':' en línea " + this.peek().line);

    this.next(); // :

    return {
      type: "AnonFunction",
      params,
      body: this.block(),
      async: isAsync, // ✅ ¡AGREGAR ESTA LÍNEA!
    };
  }

  assignment() {
    const name = this.next().value;

    if (this.peek().value !== "=")
      throw new Error("Se esperaba '=' en línea " + this.peek().line);

    this.next(); // =

    return {
      type: "Assign",
      name,
      value: this.expression(),
    };
  }

  compoundAssignment() {
    const name = this.next().value; // nombre de la variable
    const opToken = this.next(); // operador compuesto
    const op = opToken.value[0]; // extraer el operador base (+, -, *, /, %)
    const value = this.expression();

    console.log("CompoundAssign - name:", name, "op:", op, "value:", value);

    return {
      type: "CompoundAssign",
      name: name,
      operator: op,
      value: value,
    };
  }

  logicalOr() {
    let expr = this.logicalAnd();

    while (this.peek().type === "OR") {
      const op = "||";
      this.next();
      const right = this.logicalAnd();
      expr = { type: "Binary", left: expr, op, right };
    }

    return expr;
  }

  ternary() {
    let expr = this.shift(); // Cambiar de bitwiseOr a shift

    if (this.peek().value === "?") {
      this.next();
      const consequent = this.expression();
      if (this.peek().value !== ":") throw new Error("Se esperaba ':'");
      this.next();
      const alternate = this.expression();
      expr = { type: "Ternary", test: expr, consequent, alternate };
    }

    return expr;
  }

  logicalAnd() {
    let expr = this.equality();

    while (this.peek().type === "AND") {
      const op = "&&";
      this.next();
      const right = this.equality();
      expr = { type: "Binary", left: expr, op, right };
    }

    return expr;
  }

  equality() {
    let expr = this.comparison();

    while (["==", "!="].includes(this.peek().value)) {
      const op = this.next().value;
      const right = this.comparison();
      expr = { type: "Binary", left: expr, op, right };
    }

    return expr;
  }

  comparison() {
    let expr = this.term();

    while (["<", ">", "<=", ">="].includes(this.peek().value)) {
      const op = this.next().value;
      const right = this.term();
      expr = { type: "Binary", left: expr, op, right };
    }

    return expr;
  }

  term() {
    let expr = this.factor();

    while (["+", "-"].includes(this.peek().value)) {
      const op = this.next().value;
      const right = this.factor();
      expr = { type: "Binary", left: expr, op, right };
    }

    return expr;
  }

  factor() {
    let expr = this.unary();

    // En factor(), después de while (["*", "/"].includes...
    while (["*", "/", "%"].includes(this.peek().value)) {
      const op = this.next().value;
      const right = this.unary();
      expr = { type: "Binary", left: expr, op, right };
    }

    return expr;
  }

  bitwiseOr() {
    let expr = this.bitwiseXor();

    while (this.peek().value === "|") {
      const op = this.next().value;
      const right = this.bitwiseXor();
      expr = { type: "Binary", left: expr, op, right };
    }

    return expr;
  }

  bitwiseXor() {
    let expr = this.bitwiseAnd();

    while (this.peek().value === "^") {
      const op = this.next().value;
      const right = this.bitwiseAnd();
      expr = { type: "Binary", left: expr, op, right };
    }

    return expr;
  }

  bitwiseAnd() {
    let expr = this.equality();

    while (this.peek().value === "&") {
      const op = this.next().value;
      const right = this.equality();
      expr = { type: "Binary", left: expr, op, right };
    }

    return expr;
  }

  // Shift operators (<<, >>)
  shift() {
    let expr = this.bitwiseOr();

    while (["<<", ">>"].includes(this.peek().value)) {
      const op = this.next().value;
      const right = this.bitwiseOr();
      expr = { type: "Binary", left: expr, op, right };
    }

    return expr;
  }

  // Modificar expression() para incluir bitwise
  expression() {
    return this.ternary();
  }

  unary() {
    // Detectar prefijos ++ y --
    if (this.peek().value === "++" || this.peek().value === "--") {
      const op = this.next().value;
      const expr = this.primary();
      return { type: "Update", operator: op, argument: expr, prefix: true };
    }

    if (this.peek().type === "NOT") {
      this.next();
      const right = this.unary();
      return { type: "Unary", op: "!", right };
    }

    if (this.peek().value === "-") {
      const op = this.next().value;
      const right = this.unary();
      return { type: "Unary", op, right };
    }

    return this.call();
  }

  call() {
    let expr = this.primary();

    while (true) {
      // 🔥 DETECTAR AWAIT
      if (this.peek().type === "AWAIT") {
        this.next(); // consumir AWAIT
        const arg = this.call(); // la expresión después de await
        expr = { type: "Await", argument: arg };
        continue;
      }
      if (this.peek().value === "(") {
        this.next(); // (

        let args = [];
        while (this.peek().value !== ")") {
          args.push(this.expression());
          if (this.peek().value === ",") this.next();
        }

        this.next(); // )

        expr = { type: "Call", callee: expr, args };
      } else if (this.peek().value === ".") {
        this.next(); // .

        const name = this.next().value;

        expr = { type: "Get", object: expr, name };
      } else if (this.peek().value === "[") {
        // NUEVO: Acceso a arreglo
        this.next(); // [
        const index = this.expression();
        this.next(); // ]
        expr = { type: "Index", object: expr, index };
      } else break;
    }

    return expr;
  }

  primary() {
    const t = this.next();

    // 🔥 AWAIT puede empezar una expresión primaria
    if (t.type === "AWAIT") {
      const arg = this.expression();
      return { type: "Await", argument: arg };
    }

    if (t.type === "NUMBER") return { type: "Literal", value: Number(t.value) };

    if (t.type === "STRING")
      return { type: "Literal", value: t.value.slice(1, -1) };

    if (t.type === "THIS") return { type: "This" };

    if (t.type === "IDENTIFIER") {
      // Detectar postfix ++ o --
      if (this.peek().value === "++" || this.peek().value === "--") {
        const op = this.next().value;
        return {
          type: "Update",
          operator: op,
          argument: { type: "Variable", name: t.value },
          prefix: false,
        };
      }
      return { type: "Variable", name: t.value };
    }

    if (t.type === "TRUE") return { type: "Literal", value: true };
    if (t.type === "FALSE") return { type: "Literal", value: false };
    if (t.type === "NULL") return { type: "Literal", value: null };

    if (t.value === "(") {
      const expr = this.expression();
      this.next(); // )
      return expr;
    }

    if (t.value === "[") return this.arrayLiteral();
    if (t.value === "{") return this.objectLiteral();
    if (t.type === "FUNCTION") {
      return this.anonymousFunction();
    }

    throw new Error("Expresión inválida línea " + t.line);
  }

  arrayLiteral() {
    let elements = [];
    while (this.peek().value !== "]") {
      elements.push(this.expression());
      if (this.peek().value === ",") this.next();
    }
    this.next();
    return { type: "Array", elements };
  }

  objectLiteral() {
    let props = [];
    while (this.peek().value !== "}") {
      const key = this.next().value;
      this.next();
      const value = this.expression();
      props.push({ key, value });
      if (this.peek().value === ",") this.next();
    }
    this.next();
    return { type: "Object", props };
  }
}

class JSGenerator {
  constructor() {
    this.declaredVars = new Set(); // 🔥 registro de variables ya declaradas
  }

  generate(node) {
    switch (node.type) {
      case "Program":
        this.declaredVars.clear(); // 🔥 limpiar antes de generar
        return node.body.map((n) => this.generate(n)).join("\n");

      case "Set":
        const objectJS = this.generate(node.object);

        if (node.name === "clase") {
          return `${objectJS}.className = ${this.generate(node.value)};`;
        }

        if (node.name === "texto") {
          return `${objectJS}.textContent = ${this.generate(node.value)};`;
        }

        if (node.name === "html") {
          return `${objectJS}.innerHTML = ${this.generate(node.value)};`;
        }

        if (node.name === "valor") {
          return `${objectJS}.value = ${this.generate(node.value)};`;
        }

        return `${objectJS}.${node.name} = ${this.generate(node.value)};`;

      case "Function":
        const asyncKeyword = node.async ? "async " : "";
        return `
${asyncKeyword}function ${node.name}(${node.params.join(", ")}) {
${node.body.map((n) => this.generate(n)).join("\n")}
}
`;

      case "Class":
        return `
class ${node.name} {
${node.body.map((n) => this.generate(n)).join("\n")}
}
`;

      case "Return":
        if (node.value.type === "Literal" && node.value.value === null)
          return `return;`;
        return `return ${this.generate(node.value)};`;

      case "Index":
        return `${this.generate(node.object)}[${this.generate(node.index)}]`;

      case "ExpressionStatement":
        return this.generate(node.expression);

      case "Break":
        return "break;";

      case "Continue":
        return "continue;";

      case "Print":
        return `console.log(${this.generate(node.expr)});`;

      case "Assign":
        if (this.declaredVars.has(node.name)) {
          return `${node.name} = ${this.generate(node.value)}`;
        } else {
          this.declaredVars.add(node.name);
          return `let ${node.name} = ${this.generate(node.value)}`;
        }

      case "Expression":
        return `${this.generate(node.expr)};`;

      case "Call":
        // 🔥 DOM classList
        if (
          node.callee.type === "Get" &&
          [
            "agregarClase",
            "quitarClase",
            "alternarClase",
            "agregarHijo",
            "poner",
          ].includes(node.callee.name)
        ) {
          const obj = this.generate(node.callee.object);
          const arg = this.generate(node.args[0]);

          if (node.callee.name === "agregarClase")
            return `${obj}.classList.add(${arg});`;
          if (node.callee.name === "poner") return `${obj}.push(${arg});`;

          if (node.callee.name === "agregarHijo")
            return `${obj}.appendChild(${arg});`;

          if (node.callee.name === "quitarClase")
            return `${obj}.classList.remove(${arg});`;

          if (node.callee.name === "alternarClase")
            return `${obj}.classList.toggle(${arg});`;
        }

        const calleeName = this.generate(node.callee);
        const argsList = node.args.map((a) => this.generate(a));
        const args = argsList.join(", ");

        if (this.nativeFunctions && this.nativeFunctions[calleeName]) {
          const native = this.nativeFunctions[calleeName];

          if (typeof native.js === "function") {
            return native.js(argsList);
          }

          return `${native.js}(${args})`;
        }

        if (calleeName === "Date") {
          return `new Date(${args})`;
        }

        return `${calleeName}(${args})`;

      case "Get":
        const obj = this.generate(node.object).trim();

        if (obj === "documento") {
          if (node.name === "elemento") return "document.getElementById";
          if (node.name === "crearElemento") return "document.createElement";
          if (node.name === "seleccionar") return "document.querySelector";
        }

        /* ===============================
     🔥 MAT COMPLETO (equivalente a Math)
  =============================== */

        if (obj === "Mat") {
          const map = {
            // 🔢 Métodos matemáticos
            redondear: "round",
            piso: "floor",
            techo: "ceil",
            truncar: "trunc",
            maximo: "max",
            minimo: "min",
            potencia: "pow",
            raiz: "sqrt",
            absoluto: "abs",
            aleatorio: "random",
            seno: "sin",
            coseno: "cos",
            tangente: "tan",
            arcoseno: "asin",
            arcocoseno: "acos",
            arcotangente: "atan",
            arcotangente2: "atan2",
            exponencial: "exp",
            logaritmo: "log",
            logaritmo10: "log10",
            logaritmo2: "log2",
            hipotenusa: "hypot",
            signo: "sign",
            cubo: "cbrt",
            fround: "fround",
            imul: "imul",
            clz32: "clz32",
          };

          const constants = {
            PI: "PI",
            E: "E",
            LN2: "LN2",
            LN10: "LN10",
            LOG2E: "LOG2E",
            LOG10E: "LOG10E",
            SQRT1_2: "SQRT1_2",
            SQRT2: "SQRT2",
          };

          if (map[node.name]) {
            return `Math.${map[node.name]}`;
          }

          if (constants[node.name]) {
            return `Math.${constants[node.name]}`;
          }
        }

        /* ===============================
     🔥 Propiedades universales DOM
  =============================== */

        // ===============================
        // 🔥 Propiedades universales DOM
        // ===============================

        const domProps = {
          // 📝 Contenido
          texto: "textContent",
          html: "innerHTML",
          valor: "value",
          placeholder: "placeholder",

          // 🎨 Clases y estilos
          clase: "className",
          clases: "classList",
          estilo: "style",
          quitar: "remove",
          agregar: "add",

          // 🆔 Identificación
          id: "id",
          nombre: "name",

          // 📦 Atributos
          tipo: "type",
          src: "src",
          href: "href",
          deshabilitado: "disabled",
          marcado: "checked",
          seleccionado: "selected",

          // 📐 Tamaño y posición
          ancho: "offsetWidth",
          alto: "offsetHeight",
          izquierda: "offsetLeft",
          arriba: "offsetTop",

          // 👁 Visibilidad
          oculto: "hidden",

          // 📍 Estructura DOM
          padre: "parentElement",
          hijos: "children",
          primerHijo: "firstElementChild",
          ultimoHijo: "lastElementChild",
          siguiente: "nextElementSibling",
          anterior: "previousElementSibling",
        };

        if (domProps[node.name]) {
          return `${obj}.${domProps[node.name]}`;
        }

        // ===============================
        // 🔥 ALMACENAMIENTO (localStorage)
        // ===============================

        if (obj === "almacenamiento") {
          const map = {
            guardar: "setItem",
            obtener: "getItem",
            eliminar: "removeItem",
            limpiar: "clear",
            clave: "key",
            longitud: "length",
          };

          if (map[node.name]) {
            return `localStorage.${map[node.name]}`;
          }
        }

        // ===============================
        // 🔥 FECHA (Date en español)
        // ===============================

        // ===============================
        // 🔥 FECHA (Date instance methods)
        // ===============================

        const dateInstanceMap = {
          año: "getFullYear",
          mes: "getMonth",
          dia: "getDate",
          diaSemana: "getDay",
          horas: "getHours",
          minutos: "getMinutes",
          segundos: "getSeconds",
          milisegundos: "getMilliseconds",
          tiempo: "getTime",

          añoUTC: "getUTCFullYear",
          mesUTC: "getUTCMonth",
          diaUTC: "getUTCDate",
          horasUTC: "getUTCHours",
          minutosUTC: "getUTCMinutes",
          segundosUTC: "getUTCSeconds",

          fijarAño: "setFullYear",
          fijarMes: "setMonth",
          fijarDia: "setDate",
          fijarHoras: "setHours",
          fijarMinutos: "setMinutes",
          fijarSegundos: "setSeconds",
          fijarMilisegundos: "setMilliseconds",
          fijarTiempo: "setTime",

          aTexto: "toString",
          aFecha: "toDateString",
          aHora: "toTimeString",
          aISO: "toISOString",
          aLocal: "toLocaleString",
        };

        if (dateInstanceMap[node.name]) {
          return `${obj}.${dateInstanceMap[node.name]}`;
        }

        if (obj === "Date") {
          const staticMap = {
            ahora: "now",
            parsear: "parse",
            utc: "UTC",
          };

          if (staticMap[node.name]) {
            return `Date.${staticMap[node.name]}`;
          }
        }

        const arrayMap = {
          quitarUltimo: "pop",
          quitarPrimero: "shift",
          agregarPrimero: "unshift",
          unir: "join",
          ordenar: "sort",
          invertir: "reverse",
          incluye: "includes",
          encontrar: "find",
          filtrar: "filter",
          mapear: "map",
          reducir: "reduce",
        };

        if (arrayMap[node.name]) {
          return `${obj}.${arrayMap[node.name]}`;
        }

        const stringMap = {
          mayusculas: "toUpperCase",
          minusculas: "toLowerCase",
          cortar: "slice",
          reemplazar: "replace",
          incluye: "includes",
          dividir: "split",
          unir: "concat",
          limpiar: "trim",
        };

        if (stringMap[node.name]) {
          return `${obj}.${stringMap[node.name]}`;
        }

        if (obj === "JSON") {
          const jsonMap = {
            textear: "stringify",
            objeto: "parse",
          };

          if (jsonMap[node.name]) {
            return `JSON.${jsonMap[node.name]}`;
          }
        }

        return `${obj}.${node.name}`;

      case "Variable":
        // Limpiar cualquier salto de línea que pueda haber
        let varName = node.name;
        if (varName === "fecha") return "Date";
        if (varName === "JSONE") return "JSON";
        return varName.trim(); // Asegurar que no hay whitespace

      case "Literal":
        return JSON.stringify(node.value);

      case "Unary":
        const val = this.generate(node.right); // CORREGIDO: usar generate
        switch (node.op) {
          case "-":
            return `-${val}`;
          case "!":
            return `!${val}`;
          default:
            return `${node.op}${val}`;
        }

      case "While":
        return `
while (${this.generate(node.test)}) {
${node.body.map((n) => this.generate(n)).join("\n")}
}
`;

      case "For":
        return `
for (${this.generate(node.init)}; ${this.generate(node.test)}; ${this.generate(node.update)}) {
${node.body.map((n) => this.generate(n)).join("\n")}
}
`;

      case "AnonFunction":
        const asyncKw = node.async ? "async " : "";
        return `${asyncKw}(${node.params.join(", ")}) => {
${node.body.map((n) => this.generate(n)).join("\n")}
}`;

      case "Await":
        return `await ${this.generate(node.argument)}`;

      case "Try":
        return `
try {
${node.tryBlock.map((n) => this.generate(n)).join("\n")}
}
catch (e) {
${node.catchBlock.map((n) => this.generate(n)).join("\n")}
}
`;

      case "Binary":
        return `${this.generate(node.left)} ${node.op} ${this.generate(node.right)}`;

      case "If":
        return `
if (${this.generate(node.test)}) {
${node.consequent.map((n) => this.generate(n)).join("\n")}
}
${
  node.alternate.length
    ? `
else {
${node.alternate.map((n) => this.generate(n)).join("\n")}
}
`
    : ""
}
`;

      case "Array":
        return `[${node.elements.map((e) => this.generate(e)).join(", ")}]`;

      case "Event":
        // Esperamos que callee sea algo tipo:
        // { type: "Call", callee: { type: "Get", object, name }, args }

        if (
          node.callee.type === "Call" &&
          node.callee.callee.type === "Get" &&
          node.callee.callee.name === "evento"
        ) {
          const objectJS = this.generate(node.callee.callee.object);
          const eventName = this.generate(node.callee.args[0]);

          return `
${objectJS}.addEventListener(${eventName}, () => {
${node.body.map((n) => this.generate(n)).join("\n")}
});
`;
        }

        return "";

      case "Object":
        return `{${node.props.map((p) => `${p.key}: ${this.generate(p.value)}`).join(", ")}}`;

      case "CompoundAssign":
        // Esto genera: contador = contador + 5
        return `${node.name} = ${node.name} ${node.operator} ${this.generate(node.value)};`;

      case "Update":
        if (node.prefix) {
          // ++i o --i
          return `${node.operator}${this.generate(node.argument)}`;
        } else {
          // i++ o i--
          return `${this.generate(node.argument)}${node.operator}`;
        }

      case "Ternary":
        return `${this.generate(node.test)} ? ${this.generate(node.consequent)} : ${this.generate(node.alternate)}`;

      case "Switch":
        let switchCode = `switch (${this.generate(node.value)}) {\n`;
        node.cases.forEach((c) => {
          switchCode += `  case ${this.generate(c.value)}:\n`;
          c.body.forEach((stmt) => {
            switchCode += `    ${this.generate(stmt)}\n`;
          });
          switchCode += `    break;\n`;
        });
        if (node.default) {
          switchCode += `  default:\n`;
          node.default.body.forEach((stmt) => {
            switchCode += `    ${this.generate(stmt)}\n`;
          });
        }
        switchCode += `}`;
        return switchCode;

      case "DoWhile":
        return `do {\n${node.body.map((n) => this.generate(n)).join("\n")}\n} while (${this.generate(node.test)});`;

      case "Import":
        const names = node.names.join(", ");
        return `import { ${names} } from ${node.module};`;

      default:
        return "";
    }
  }
}

/* =========================
   INTÉRPRETE PROPIO
========================= */
class Environment {
  constructor(parent = null) {
    this.parent = parent;
    this.values = {};
  }

  define(name, val) {
    this.values[name] = val;
  }

  assign(name, val) {
    if (name in this.values) this.values[name] = val;
    else if (this.parent) this.parent.assign(name, val);
    else this.values[name] = val;
  }

  get(name) {
    if (name in this.values) return this.values[name];
    if (this.parent) return this.parent.get(name);
    throw new Error("Variable no definida " + name);
  }
}

class DocumentoEspanol {
  elemento(id) {
    return document.getElementById(id);
  }

  crearElemento(tag) {
    return document.createElement(tag);
  }

  seleccionar(selector) {
    return document.querySelector(selector);
  }
}

// WebSocket wrapper para manejar eventos en tu lenguaje
class WebSocketWrapper {
  constructor(ws) {
    this._ws = ws;
    this._onopen = null;
    this._onmessage = null;
    this._onerror = null;
    this._onclose = null;

    // Configurar handlers nativos
    ws.onopen = (event) => {
      if (this._onopen) this._onopen(event);
    };

    ws.onmessage = (event) => {
      if (this._onmessage) this._onmessage(event.data);
    };

    ws.onerror = (error) => {
      if (this._onerror) this._onerror(error);
    };

    ws.onclose = (event) => {
      if (this._onclose) this._onclose(event.code, event.reason);
    };
  }

  // Métodos públicos
  enviar(mensaje) {
    this._ws.send(mensaje);
  }

  cerrar() {
    this._ws.close();
  }

  // Getters/Setters para eventos
  get alAbrir() {
    return this._onopen;
  }
  set alAbrir(handler) {
    this._onopen = handler;
  }

  get alMensaje() {
    return this._onmessage;
  }
  set alMensaje(handler) {
    this._onmessage = handler;
  }

  get alError() {
    return this._onerror;
  }
  set alError(handler) {
    this._onerror = handler;
  }

  get alCerrar() {
    return this._onclose;
  }
  set alCerrar(handler) {
    this._onclose = handler;
  }

  get estado() {
    switch (this._ws.readyState) {
      case 0:
        return "CONECTANDO";
      case 1:
        return "ABIERTO";
      case 2:
        return "CERRANDO";
      case 3:
        return "CERRADO";
      default:
        return "DESCONOCIDO";
    }
  }
}

class Interpreter {
  constructor() {
    this.global = new Environment();

    // 🔥 INYECTAR DOM
    this.global.define("documento", new DocumentoEspanol());
    // 🔥 OBJETO MATEMÁTICO EN ESPAÑOL
    const Mat = {
      aleatorio: () => Math.random(),
      redondear: (n) => Math.round(n),
      piso: (n) => Math.floor(n),
      techo: (n) => Math.ceil(n),
      maximo: (...nums) => Math.max(...nums),
      minimo: (...nums) => Math.min(...nums),
      potencia: (base, exp) => Math.pow(base, exp),
      raiz: (n) => Math.sqrt(n),
      absoluto: (n) => Math.abs(n),
    };
    // 🔥 ALMACENAMIENTO EN ESPAÑOL
    const almacenamiento = {
      guardar: (clave, valor) => localStorage.setItem(clave, valor),
      obtener: (clave) => localStorage.getItem(clave),
      eliminar: (clave) => localStorage.removeItem(clave),
      limpiar: () => localStorage.clear(),
      clave: (i) => localStorage.key(i),
      longitud: () => localStorage.length,
    };

    // 🔥 FECHA EN ESPAÑOL
    const fecha = (...args) => new Date(...args);

    fecha.ahora = () => Date.now();
    fecha.parsear = (str) => Date.parse(str);
    fecha.utc = (...args) => Date.UTC(...args);

    this.global.define("fecha", fecha);
    this.global.define("almacenamiento", almacenamiento);
    this.global.define("Mat", Mat);

    // 🔥 REGISTRO CENTRAL DE NATIVAS
    this.nativeFunctions = {
      alerta: {
        js: "alert",
        runtime: (msg) => alert(msg),
      },

      entero: {
        js: "parseInt",
        runtime: (v) => parseInt(v),
      },

      esNumero: {
        js: "isNaN",
        runtime: (v) => isNaN(v),
      },

      aleatorioEntre: {
        js: (args) =>
          `Math.floor(Math.random()*(${args[1]}-${args[0]}+1))+${args[0]}`,
        runtime: (min, max) =>
          Math.floor(Math.random() * (max - min + 1)) + min,
      },

      longitud: {
        js: (args) => `${args[0]}.length`,
        runtime: (arr) => arr.length,
      },

      numero: {
        js: "parseFloat",
        runtime: (val) => parseFloat(val),
      },

      tipo: {
        js: (args) => `typeof ${args[0]}`,
        runtime: (v) => typeof v,
      },

      lanzar: {
        js: (args) => `throw new Error(${args[0]})`,
        runtime: (msg) => {
          throw new Error(msg);
        },
      },

      navegar: {
        js: (args) => `location.href = ${args[0]}`,
        runtime: (url) => (location.href = url),
      },

      confirmar: {
        js: "confirm",
        runtime: (msg) => confirm(msg),
      },

      preguntar: {
        js: "prompt",
        runtime: (msg) => prompt(msg),
      },

      temporizador: {
        js: "setTimeout",
        runtime: (fn, ms) => setTimeout(fn, ms),
      },

      intervalo: {
        js: "setInterval",
        runtime: (fn, ms) => setInterval(fn, ms),
      },

      limpiarIntervalo: {
        js: "clearInterval",
        runtime: (id) => clearInterval(id),
      },

      limpiarTemporizador: {
        js: "clearTimeout",
        runtime: (id) => clearTimeout(id),
      },

      recargar: {
        js: () => "location.reload()",
        runtime: () => location.reload(),
      },

      atras: {
        js: () => "history.back()",
        runtime: () => history.back(),
      },

      adelante: {
        js: () => "history.forward()",
        runtime: () => history.forward(),
      },

      anchoPantalla: {
        js: () => "window.innerWidth",
        runtime: () => window.innerWidth,
      },

      altoPantalla: {
        js: () => "window.innerHeight",
        runtime: () => window.innerHeight,
      },

      imprimirConsola: {
        js: "console.log",
        runtime: (...args) => console.log(...args),
      },

      errorConsola: {
        js: "console.error",
        runtime: (...args) => console.error(...args),
      },

      advertenciaConsola: {
        js: "console.warn",
        runtime: (...args) => console.warn(...args),
      },
      solicitar: {
        js: "fetch",
        runtime: async (url, options = {}) => {
          try {
            const response = await fetch(url, options);
            return {
              ok: response.ok,
              status: response.status,
              statusText: response.statusText,
              headers: response.headers,
              json: async () => await response.json(),
              text: async () => await response.text(),
              _rawResponse: response,
            };
          } catch (error) {
            throw new Error("Error en solicitud: " + error.message);
          }
        },
      },

      solicitarJSON: {
        js: (args) => `fetch(${args[0]}).then(r => r.json())`,
        runtime: async (url) => {
          const response = await fetch(url);
          return await response.json();
        },
      },

      solicitarTexto: {
        js: (args) => `fetch(${args[0]}).then(r => r.text())`,
        runtime: async (url) => {
          const response = await fetch(url);
          return await response.text();
        },
      },

      // ===== WEB SOCKETS =====
      crearWebSocket: {
        js: "WebSocket",
        runtime: (url) => {
          const ws = new WebSocket(url);
          // Crear un wrapper para manejar eventos
          return new WebSocketWrapper(ws);
        },
      },

      // En nativeFunctions, añade:
      metodosHTTP: {
        js: (args) => {
          const [url, method, body, headers] = args;
          return `fetch(${url}, { method: ${method}, body: ${body}, headers: ${headers} })`;
        },
        runtime: async (url, method = "GET", body = null, headers = {}) => {
          const options = { method };
          if (body) options.body = body;
          if (Object.keys(headers).length) options.headers = headers;

          const response = await fetch(url, options);
          return {
            ok: response.ok,
            status: response.status,
            data: await response.json(),
          };
        },
      },
    };

    // 🔥 AUTO-REGISTRO EN ENTORNO GLOBAL
    for (const name in this.nativeFunctions) {
      this.global.define(name, this.nativeFunctions[name].runtime);
    }
  }

  eval(node, env = this.global) {
    switch (node.type) {
      case "Program":
        node.body.forEach((n) => this.eval(n, env));
        break;

      case "ThisAssign":
        // Buscar el objeto 'este' en el entorno actual
        const thisObj = env.get("este");
        if (!thisObj)
          throw new Error("No se puede usar 'este' fuera de un método");

        // Asignar el valor a la propiedad
        thisObj.fields[node.prop] = this.eval(node.value, env);
        break;

      case "Await":
        if (!env.get("__isAsync")) {
          throw new Error(
            "'esperar' solo puede usarse dentro de funciones 'async'",
          );
        }
        const promise = this.eval(node.argument, env);
        if (promise && typeof promise.then === "function") {
          // Para simplificar, retornamos la promesa
          // En una implementación completa, necesitarías manejar async/await
          return promise;
        }
        return promise;

      case "AnonFunction":
        return {
          type: "UserFunction",
          declaration: {
            params: node.params,
            body: node.body,
          },
          closure: env,
        };

      case "CompoundAssign":
        const currentValue = env.get(node.name);
        const rightValue = this.eval(node.value, env);
        let newValue;
        switch (node.operator) {
          case "+":
            newValue = currentValue + rightValue;
            break;
          case "-":
            newValue = currentValue - rightValue;
            break;
          case "*":
            newValue = currentValue * rightValue;
            break;
          case "/":
            newValue = currentValue / rightValue;
            break;
          case "%":
            newValue = currentValue % rightValue;
            break;
          default:
            newValue = rightValue;
        }
        env.assign(node.name, newValue);
        break;

      case "Update":
        let variable;
        if (node.argument.type === "Variable") {
          variable = env.get(node.argument.name);
        }
        const increment = node.operator === "++" ? 1 : -1;
        const newVal = variable + increment;
        env.assign(node.argument.name, newVal);
        return node.prefix ? newVal : variable;

      case "Ternary":
        return this.eval(node.test, env)
          ? this.eval(node.consequent, env)
          : this.eval(node.alternate, env);

      case "Switch":
        const switchValue = this.eval(node.value, env);
        let matched = false;

        for (const caseItem of node.cases) {
          const caseValue = this.eval(caseItem.value, env);
          if (switchValue === caseValue || matched) {
            matched = true;
            for (const stmt of caseItem.body) {
              this.eval(stmt, env);
            }
          }
        }

        if (!matched && node.default) {
          for (const stmt of node.default.body) {
            this.eval(stmt, env);
          }
        }
        break;

      case "DoWhile":
        do {
          try {
            node.body.forEach((n) => this.eval(n, env));
          } catch (signal) {
            if (signal && signal.__break) break;
            if (signal && signal.__continue) continue;
            throw signal;
          }
        } while (this.eval(node.test, env));
        break;

      case "Import":
        // Cargar módulo dinámicamente (requiere implementación adicional)
        console.warn("Importación aún no implementada completamente");
        break;

      case "Class":
        const methods = {};

        node.body.forEach((member) => {
          if (member.type === "Function") {
            methods[member.name] = {
              declaration: member,
              closure: env,
            };
          }
        });

        env.define(node.name, {
          type: "Class",
          methods,
        });

        break;

      case "Call":
        // Evaluar el callee primero
        const callee = this.eval(node.callee, env);

        // 🔥 Primero verificar si es función JS nativa
        if (typeof callee === "function") {
          const args = node.args.map((arg) => this.eval(arg, env));
          const result = callee(...args);
          // 🔥 Manejar promesas automáticamente
          if (result && typeof result.then === "function") {
            // Devolver la promesa para manejo async
            return result;
          }
          return result;
        }

        if (
          !callee ||
          (callee.type !== "UserFunction" && callee.type !== "Class")
        ) {
          throw new Error("Intentando llamar algo no invocable");
        }

        // Si es una función de usuario
        if (callee.type === "UserFunction") {
          const localEnv = new Environment(callee.closure);

          // Evaluar argumentos y asignar parámetros
          callee.declaration.params.forEach((param, i) => {
            const argValue = node.args[i] ? this.eval(node.args[i], env) : null;
            localEnv.define(param, argValue);
          });

          // Ejecutar el cuerpo de la función
          try {
            callee.declaration.body.forEach((stmt) => {
              this.eval(stmt, localEnv);
            });
          } catch (ret) {
            if (ret && ret.__return) {
              return ret.value;
            }
            throw ret;
          }

          return null;
        }

        // Si es una clase (para constructores)
        if (callee.type === "Class") {
          const instance = {
            type: "Instance",
            class: callee,
            fields: {},
          };

          const constructor = callee.methods["constructor"];

          if (constructor) {
            const localEnv = new Environment(constructor.closure);
            localEnv.define("este", instance);

            constructor.declaration.params.forEach((param, i) => {
              const argValue = node.args[i]
                ? this.eval(node.args[i], env)
                : null;
              localEnv.define(param, argValue);
            });

            constructor.declaration.body.forEach((stmt) => {
              this.eval(stmt, localEnv);
            });
          }

          return instance;
        }

        throw new Error(
          `Intentando llamar algo no invocable: tipo ${callee.type || typeof callee}`,
        );

      case "Function":
        const func = {
          type: "UserFunction",
          declaration: node,
          closure: env, // Importante: guardar el entorno actual como clausura
        };

        const localEnv = new Environment(env);
        if (node.async) {
          localEnv.define("__isAsync", true);
        }

        env.define(node.name, func);
        break;

      case "Get":
        const objt = this.eval(node.object, env);

        if (!objt) {
          throw new Error("Acceso a propiedad de valor nulo");
        }

        // Instancias de clase
        if (objt.type === "Instance") {
          if (node.name in objt.fields) {
            return objt.fields[node.name];
          }

          if (node.name in objt.class.methods) {
            const method = objt.class.methods[node.name];

            return {
              type: "UserFunction",
              declaration: method.declaration,
              closure: (() => {
                const methodEnv = new Environment(method.closure);
                methodEnv.define("este", objt);
                return methodEnv;
              })(),
            };
          }

          return undefined;
        }

        // 🔥 OBJETOS LITERALES NORMALES
        if (typeof objt === "object") {
          return objt[node.name];
        }

        throw new Error("No se puede acceder propiedad de tipo inválido");

      case "Assign":
        const assignValue = this.eval(node.value, env);

        // Si ya existe en cadena → assign normal
        try {
          env.get(node.name);
          env.assign(node.name, assignValue);
        } catch {
          // Si no existe → definir en entorno actual
          env.define(node.name, assignValue);
        }

        break;

      case "Index":
        const array = this.eval(node.object, env);
        const index = this.eval(node.index, env);

        if (!Array.isArray(array)) {
          throw new Error("Solo se puede usar índices en arreglos");
        }

        return array[index];
        break;

      case "Expression":
        return this.eval(node.expr, env);
      case "ExpressionStatement":
        return this.eval(node.expression, env);
      case "Literal":
        return node.value;
      case "Break":
        throw { __break: true };

      case "Continue":
        throw { __continue: true };

      case "Variable":
        return env.get(node.name);

      case "Return":
        const returnVal = this.eval(node.value, env);
        throw { __return: true, value: returnVal };

      case "For":
        this.eval(node.init, env);

        while (this.eval(node.test, env)) {
          try {
            node.body.forEach((n) => this.eval(n, env));
          } catch (signal) {
            if (signal && signal.__break) break;
            if (signal && signal.__continue) {
              this.eval(node.update, env);
              continue;
            }
            throw signal;
          }

          this.eval(node.update, env);
        }
        break;

      case "Binary":
        const l = this.eval(node.left, env);
        const r = this.eval(node.right, env);
        if (l === undefined || r === undefined) {
          throw new Error("Operación con valor indefinido");
        }

        switch (node.op) {
          case "+":
            return l + r;
          case "-":
            return l - r;
          case "*":
            return l * r;
          case "/":
            if (r === 0) {
              throw new Error("División por cero");
            }
            return l / r;
          case "<":
            return l < r;
          case ">":
            return l > r;
          case "==":
            return l === r;
          case "!=":
            return l !== r;
          case "<=":
            return l <= r;
          case ">=":
            return l >= r;
          case "&&":
            return l && r;
          case "||":
            return l || r;
        }

      case "Array":
        return node.elements.map((e) => this.eval(e, env));

      case "Object":
        const obj = {};
        node.props.forEach((p) => (obj[p.key] = this.eval(p.value, env)));
        return obj;

      case "Print":
        output(this.eval(node.expr, env));
        break;
      case "This":
        return env.get("este");

      case "If":
        if (this.eval(node.test, env))
          node.consequent.forEach((n) => this.eval(n, env));
        else node.alternate.forEach((n) => this.eval(n, env));
        break;

      case "While":
        while (this.eval(node.test, env)) {
          try {
            node.body.forEach((n) => this.eval(n, env));
          } catch (signal) {
            if (signal && signal.__break) break;
            if (signal && signal.__continue) continue;
            throw signal;
          }
        }
        break;

      case "Set":
        const obje = this.eval(node.object, env);
        obje[node.name] = this.eval(node.value, env);
        break;

      case "Unary":
        const val = this.eval(node.right, env);
        switch (node.op) {
          case "-":
            return -val;
          case "!":
            return !val;
        }

      case "Try":
        try {
          node.tryBlock.forEach((n) => this.eval(n, env));
        } catch (e) {
          node.catchBlock.forEach((n) => this.eval(n, env));
        }
        break;
    }
  }
}

/* =========================
   EJECUCIÓN
========================= */
function output(msg) {
  document.getElementById("salida").innerHTML += msg + "<br>";
}

function ejecutar() {
  document.getElementById("salida").innerHTML = "";
  try {
    const code = document.getElementById("codigo").value;
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const interpreter = new Interpreter();
    const generator = new JSGenerator();
    generator.nativeFunctions = interpreter.nativeFunctions;

    const jsCode = generator.generate(ast);

    // 🔥 MOSTRAR EN CONSOLA
    console.log("===== CÓDIGO JS GENERADO =====");
    console.log(jsCode);
    console.log("===== FIN JS =====");
    interpreter.eval(ast);
  } catch (e) {
    output("Error: " + e.message);
  }
}

// compilador.js

export { Lexer, Parser, JSGenerator, Interpreter };
