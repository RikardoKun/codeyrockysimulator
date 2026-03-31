// blockly-config.js

let workspace = null;

window.addEventListener("load", () => {
  const blocklyDiv = document.getElementById("blocklyDiv");
  const toolbox = document.getElementById("toolbox");
  
  const TechScratchTheme = Blockly.Theme.defineTheme("techScratchTheme", {
    base: Blockly.Themes.Zelos,

    categoryStyles: {
      eventsCategory:   { colourPrimary: "#FFBF00" },
      motionCategory:   { colourPrimary: "#4C97FF" },
      looksCategory:    { colourPrimary: "#9966FF" },
      soundCategory:    { colourPrimary: "#CF63CF" },
      controlCategory:  { colourPrimary: "#FFAB19" },
      sensingCategory:  { colourPrimary: "#5CB1D6" },
      operatorsCategory:{ colourPrimary: "#59C059" },
      variablesCategory:{ colourPrimary: "#FF8C1A" },
      myBlocksCategory: { colourPrimary: "#FF6680" }
    },

    blockStyles: {
      events_blocks: {
        colourPrimary: "#FFBF00",
        colourSecondary: "#E6AC00",
        colourTertiary: "#CC9900"
      },
      motion_blocks: {
        colourPrimary: "#4C97FF",
        colourSecondary: "#4280D7",
        colourTertiary: "#376CB5"
      }
    },

    componentStyles: {
      workspaceBackgroundColour: "#f3f5f9",
      toolboxBackgroundColour: "#ffffff",
      toolboxForegroundColour: "#3f4652",
      toolboxOpacity: 1,

      flyoutBackgroundColour: "#f7f9fc",
      flyoutForegroundColour: "#3f4652",
      flyoutOpacity: 1,

      scrollbarColour: "#c7cfdb",
      scrollbarOpacity: 0.75,

      insertionMarkerColour: "#111111",
      insertionMarkerOpacity: 0.15,

      markerColour: "#1a73e8",
      cursorColour: "#1a73e8",

      blackBackground: "#000000"
    },

    fontStyle: {
      family: "Inter, Poppins, sans-serif",
      weight: "600",
      size: 10
    },

    startHats: true
  });

  (function aplicarEstiloCompactoBlockly() {
    const cp = Blockly.blockRendering?.ConstantProvider?.prototype;
    if (!cp) return;

    // Bordes más suaves
    cp.CORNER_RADIUS = 7;

    // Encaje entre bloques más fino
    cp.NOTCH_WIDTH = 12;
    cp.NOTCH_HEIGHT = 3;

    // 🔥 ALTURA GENERAL MÁS PEQUEÑA
    cp.MIN_BLOCK_HEIGHT = 24;

    // 🔥 MENOS ESPACIO INTERNO
    cp.MEDIUM_PADDING = 3;
    cp.SMALL_PADDING = 1;

    // Inputs más compactos
    cp.FIELD_BORDER_RECT_X_PADDING = 6;
    cp.FIELD_BORDER_RECT_Y_PADDING = 3;
  })();

  definirBloquesCodey();
  definirGeneradoresCodey();

  workspace = Blockly.inject(blocklyDiv, {
    toolbox: toolbox,
    theme: TechScratchTheme,
    renderer: "zelos",
    toolboxPosition: "start",

    move: {
      scrollbars: true,
      drag: true,
      wheel: false
    },

    zoom: {
      controls: false,
      wheel: false,
      startScale: 0.95,
      maxScale: 3,
      minScale: 0.3,
      scaleSpeed: 1.2
    },
    
    trashcan: true,

    grid: {
      spacing: 20,
      length: 3,
      colour: "#d7ddea",
      snap: false
    }
  });

  window.workspace = workspace;
});

function definirBloquesCodey() {
  // =========================
  // EVENTOS
  // =========================

  Blockly.Blocks["event_when_flag_clicked"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("cuando clic en")
        .appendField("⚑");
      this.appendStatementInput("DO");
      this.setColour("#FEC619");
      this.setTooltip("Inicia el programa al presionar la bandera.");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks["event_when_key_pressed"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("cuando tecla")
        .appendField(new Blockly.FieldDropdown([
          ["espacio", "SPACE"],
          ["flecha arriba", "ARROWUP"],
          ["flecha abajo", "ARROWDOWN"],
          ["flecha izquierda", "ARROWLEFT"],
          ["flecha derecha", "ARROWRIGHT"],

          ["A", "A"], ["B", "B"], ["C", "C"], ["D", "D"], ["E", "E"],
          ["F", "F"], ["G", "G"], ["H", "H"], ["I", "I"], ["J", "J"],
          ["K", "K"], ["L", "L"], ["M", "M"], ["N", "N"], ["O", "O"],
          ["P", "P"], ["Q", "Q"], ["R", "R"], ["S", "S"], ["T", "T"],
          ["U", "U"], ["V", "V"], ["W", "W"], ["X", "X"], ["Y", "Y"],
          ["Z", "Z"],

          ["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"],
          ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"]
        ]), "KEY")
        .appendField("pulsada");
      this.appendStatementInput("DO");
      this.setColour("#FEC619");
      this.setTooltip("Ejecuta acciones al pulsar una tecla.");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks["event_when_button_a_pressed"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("al pulsar botón")
        .appendField(new Blockly.FieldDropdown([
          ["A", "A"],
          ["B", "B"],
          ["C", "C"]
        ]), "BTN");
      this.appendStatementInput("DO");
      this.setColour("#FEC619");
      this.setTooltip("Ejecuta acciones al pulsar un botón del simulador.");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks["event_when_i_receive"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("al recibir")
        .appendField(new Blockly.FieldTextInput("mensaje1"), "MESSAGE");
      this.appendStatementInput("DO");
      this.setColour("#FEC619");
      this.setTooltip("Ejecuta acciones al recibir un mensaje.");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks["event_broadcast"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("envía")
        .appendField(new Blockly.FieldTextInput("mensaje1"), "MESSAGE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#FEC619");
      this.setTooltip("Envía un mensaje.");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks["event_broadcast_and_wait"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("envía")
        .appendField(new Blockly.FieldTextInput("mensaje1"), "MESSAGE")
        .appendField("y espera");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#FEC619");
      this.setTooltip("Envía un mensaje y espera.");
      this.setHelpUrl("");
    }
  };

  // =========================
  // ACCIÓN
  // =========================

  Blockly.Blocks["codey_move_forward_time"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("avanza a potencia")
        .appendField(new Blockly.FieldNumber(50, 0, 100, 1), "POWER")
        .appendField("% durante")
        .appendField(new Blockly.FieldNumber(1, 0, 999, 0.1), "TIME")
        .appendField("seg");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#4C97FF");
      this.setTooltip("Avanza hacia adelante durante un tiempo.");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks["codey_move_backward_time"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("retrocede a potencia")
        .appendField(new Blockly.FieldNumber(50, 0, 100, 1), "POWER")
        .appendField("% durante")
        .appendField(new Blockly.FieldNumber(1, 0, 999, 0.1), "TIME")
        .appendField("seg");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#4C97FF");
      this.setTooltip("Retrocede durante un tiempo.");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks["codey_go_straight_forward_time"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("sigue recto hacia adelante a potencia")
        .appendField(new Blockly.FieldNumber(50, 0, 100, 1), "POWER")
        .appendField("% durante")
        .appendField(new Blockly.FieldNumber(1, 0, 999, 0.1), "TIME")
        .appendField("seg");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#4C97FF");
      this.setTooltip("Avanza recto hacia adelante durante un tiempo.");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks["codey_go_straight_backward_time"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("sigue recto hacia atrás a potencia")
        .appendField(new Blockly.FieldNumber(50, 0, 100, 1), "POWER")
        .appendField("% durante")
        .appendField(new Blockly.FieldNumber(1, 0, 999, 0.1), "TIME")
        .appendField("seg");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#4C97FF");
      this.setTooltip("Avanza recto hacia atrás durante un tiempo.");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks["codey_turn_left_time"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("gira a la izquierda a potencia")
        .appendField(new Blockly.FieldNumber(50, 0, 100, 1), "POWER")
        .appendField("% durante")
        .appendField(new Blockly.FieldNumber(1, 0, 999, 0.1), "TIME")
        .appendField("seg");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#4C97FF");
      this.setTooltip("Gira a la izquierda durante un tiempo.");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks["codey_turn_right_time"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("gira a la derecha a potencia")
        .appendField(new Blockly.FieldNumber(50, 0, 100, 1), "POWER")
        .appendField("% durante")
        .appendField(new Blockly.FieldNumber(1, 0, 999, 0.1), "TIME")
        .appendField("seg");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#4C97FF");
      this.setTooltip("Gira a la derecha durante un tiempo.");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks["codey_turn_left_angle"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("gira a la izquierda")
        .appendField(new Blockly.FieldNumber(15, 0, 360, 1), "ANGLE")
        .appendField("grados hasta finalizar");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#4C97FF");
      this.setTooltip("Gira a la izquierda un número de grados.");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks["codey_turn_right_angle"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("gira a la derecha")
        .appendField(new Blockly.FieldNumber(15, 0, 360, 1), "ANGLE")
        .appendField("grados hasta finalizar");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#4C97FF");
      this.setTooltip("Gira a la derecha un número de grados.");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks["codey_move_direction_power"] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ["avanza", "FORWARD"],
          ["retrocede", "BACKWARD"],
          ["gira a la izquierda", "TURN_LEFT"],
          ["gira a la derecha", "TURN_RIGHT"]
        ]), "DIRECTION")
        .appendField("a potencia")
        .appendField(new Blockly.FieldNumber(50, 0, 100, 1), "POWER")
        .appendField("%");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#4C97FF");
      this.setTooltip("Inicia movimiento continuo del robot a la potencia indicada.");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks["codey_drive_wheels_power"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("rueda izquierda a potencia")
        .appendField(new Blockly.FieldNumber(50, -100, 100, 1), "LEFT_POWER")
        .appendField("%, rueda derecha a potencia")
        .appendField(new Blockly.FieldNumber(50, -100, 100, 1), "RIGHT_POWER")
        .appendField("%");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#4C97FF");
      this.setTooltip("Controla las dos ruedas de forma continua.");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks["codey_stop"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("para");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#4C97FF");
      this.setTooltip("Detiene el robot.");
      this.setHelpUrl("");
    }
  };

  // =========================
  // CONTROL
  // =========================

  Blockly.Blocks["control_wait"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("espera")
        .appendField(new Blockly.FieldNumber(1, 0, 999, 0.1), "TIME")
        .appendField("seg");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#FFAB19");
      this.setTooltip("Espera una cantidad de segundos.");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks["control_wait_until"] = {
    init: function () {
      this.appendValueInput("COND")
        .setCheck("Boolean")
        .appendField("esperar hasta que");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#FFAB19");
      this.setTooltip("Espera hasta que la condición sea verdadera.");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks["control_repeat"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("repetir")
        .appendField(new Blockly.FieldNumber(10, 1, 999, 1), "TIMES")
        .appendField("veces");
      this.appendStatementInput("DO");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#FFAB19");
      this.setTooltip("Repite un conjunto de bloques varias veces.");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks["control_repeat_until"] = {
    init: function () {
      this.appendValueInput("COND")
        .setCheck("Boolean")
        .appendField("repite hasta que");
      this.appendStatementInput("DO");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#FFAB19");
      this.setTooltip("Repite los bloques hasta que la condición sea verdadera.");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks["control_while"] = {
    init: function () {
      this.appendValueInput("COND")
        .setCheck("Boolean")
        .appendField("mientras");
      this.appendStatementInput("DO");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#FFAB19");
      this.setTooltip("Repite los bloques mientras la condición sea verdadera.");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks["control_forever"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("por siempre");
      this.appendStatementInput("DO");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#FFAB19");
      this.setTooltip("Repite indefinidamente mientras el programa esté activo.");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks["control_if"] = {
    init: function () {
      this.appendValueInput("COND")
        .setCheck("Boolean")
        .appendField("si");
      this.appendStatementInput("DO")
        .appendField("entonces");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#FFAB19");
      this.setTooltip("Ejecuta bloques si la condición es verdadera.");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks["control_if_else"] = {
    init: function () {
      this.appendValueInput("COND")
        .setCheck("Boolean")
        .appendField("si");
      this.appendStatementInput("DO")
        .appendField("entonces");
      this.appendStatementInput("ELSE")
        .appendField("si no");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#FFAB19");
      this.setTooltip("Ejecuta un bloque si la condición es verdadera y otro si es falsa.");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks["control_stop"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("detener")
        .appendField(new Blockly.FieldDropdown([
          ["todos", "ALL"],
          ["este programa", "THIS"],
          ["otros programas del objeto", "OTHER"]
        ]), "TARGET");

      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#FFAB19");
      this.setTooltip("Detiene la ejecución del programa.");
      this.setHelpUrl("");
    }
  };

  // =========================
  // SENSORES
  // =========================

  Blockly.Blocks["sensing_touching_edge"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("tocando borde");
      this.setOutput(true, "Boolean");
      this.setColour("#5CB1D6");
      this.setTooltip("Devuelve verdadero si el robot toca el borde.");
      this.setHelpUrl("");
    }
  };
}

function definirGeneradoresCodey() {
  const jsGenerator = Blockly.JavaScript || Blockly.javascriptGenerator;
  if (!jsGenerator) return;

  const generar = (tipo, fn) => {
    if (jsGenerator.forBlock) {
      jsGenerator.forBlock[tipo] = fn;
    } else {
      jsGenerator[tipo] = fn;
    }
  };

  // =========================
  // EVENTOS
  // =========================

  generar("event_when_flag_clicked", function (block, generator) {
    const statements = generator.statementToCode(block, "DO");
    return `onStart(async function () {\n${statements}});\n`;
  });

  generar("event_when_key_pressed", function (block, generator) {
    const key = block.getFieldValue("KEY");
    const statements = generator.statementToCode(block, "DO");
    return `onKey("${key}", async function () {\n${statements}});\n`;
  });

  generar("event_when_button_a_pressed", function (block, generator) {
    const btn = block.getFieldValue("BTN");
    const statements = generator.statementToCode(block, "DO");
    return `onButton("${btn}", async function () {\n${statements}});\n`;
  });

  generar("event_when_i_receive", function (block, generator) {
    const message = block.getFieldValue("MESSAGE");
    const statements = generator.statementToCode(block, "DO");
    return `onReceive("${message}", async function () {\n${statements}});\n`;
  });

  generar("event_broadcast", function (block) {
    const message = block.getFieldValue("MESSAGE");
    return `await broadcast("${message}");\n`;
  });

  generar("event_broadcast_and_wait", function (block) {
    const message = block.getFieldValue("MESSAGE");
    return `await broadcastAndWait("${message}");\n`;
  });

  // =========================
  // ACCIÓN
  // =========================

  generar("codey_move_forward_time", function (block) {
    const power = Number(block.getFieldValue("POWER"));
    const time = Number(block.getFieldValue("TIME"));
    return `await codey.avanzarTiempo(${power}, ${time});\n`;
  });

  generar("codey_move_backward_time", function (block) {
    const power = Number(block.getFieldValue("POWER"));
    const time = Number(block.getFieldValue("TIME"));
    return `await codey.retrocederTiempo(${power}, ${time});\n`;
  });

  generar("codey_go_straight_forward_time", function (block) {
    const power = Number(block.getFieldValue("POWER"));
    const time = Number(block.getFieldValue("TIME"));
    return `await codey.avanzarTiempo(${power}, ${time});\n`;
  });

  generar("codey_go_straight_backward_time", function (block) {
    const power = Number(block.getFieldValue("POWER"));
    const time = Number(block.getFieldValue("TIME"));
    return `await codey.retrocederTiempo(${power}, ${time});\n`;
  });

  generar("codey_turn_left_time", function (block) {
    const power = Number(block.getFieldValue("POWER"));
    const time = Number(block.getFieldValue("TIME"));
    return `await codey.girarIzquierdaTiempo(${power}, ${time});\n`;
  });

  generar("codey_turn_right_time", function (block) {
    const power = Number(block.getFieldValue("POWER"));
    const time = Number(block.getFieldValue("TIME"));
    return `await codey.girarDerechaTiempo(${power}, ${time});\n`;
  });

  generar("codey_turn_left_angle", function (block) {
    const angle = Number(block.getFieldValue("ANGLE"));
    return `await codey.girarIzquierdaGrados(${angle});\n`;
  });

  generar("codey_turn_right_angle", function (block) {
    const angle = Number(block.getFieldValue("ANGLE"));
    return `await codey.girarDerechaGrados(${angle});\n`;
  });

  generar("codey_move_direction_power", function (block) {
    const direction = block.getFieldValue("DIRECTION");
    const power = Number(block.getFieldValue("POWER"));
    return `codey.moverContinuamenteModo("${direction}", ${power});\n`;
  });

  generar("codey_drive_wheels_power", function (block) {
    const leftPower = Number(block.getFieldValue("LEFT_POWER"));
    const rightPower = Number(block.getFieldValue("RIGHT_POWER"));
    return `codey.moverRuedasContinuamente(${leftPower}, ${rightPower});\n`;
  });

  generar("codey_stop", function () {
    return `codey.detener();\n`;
  });

  // =========================
  // CONTROL
  // =========================

  generar("control_wait", function (block) {
    const time = Number(block.getFieldValue("TIME"));
    return `await waitSeconds(${time});\n`;
  });

  generar("control_wait_until", function (block, generator) {
    const condition = generator.valueToCode(block, "COND", jsGenerator.ORDER_NONE) || "false";
    return `while (runtime.running && !(${condition})) {\n  await yieldFrame();\n}\n`;
  });

  generar("control_repeat", function (block, generator) {
    const times = Math.max(0, Math.floor(Number(block.getFieldValue("TIMES")) || 0));
    const statements = generator.statementToCode(block, "DO");
    return `for (let i = 0; i < ${times}; i++) {\n${statements}}\n`;
  });

  generar("control_repeat_until", function (block, generator) {
    const condition = generator.valueToCode(block, "COND", jsGenerator.ORDER_NONE) || "false";
    const statements = generator.statementToCode(block, "DO");

    return `while (runtime.running && !(${condition})) {\n${statements}  await yieldFrame();\n}\n`;
  });

  generar("control_while", function (block, generator) {
    const condition = generator.valueToCode(block, "COND", jsGenerator.ORDER_NONE) || "false";
    const statements = generator.statementToCode(block, "DO");

    return `while (runtime.running && (${condition})) {\n${statements}  await yieldFrame();\n}\n`;
  });

  generar("control_forever", function (block, generator) {
    const statements = generator.statementToCode(block, "DO");
    return `
  while (runtime.running) {
  ${statements}
    await yieldFrame();
  }
  `;
  });

  generar("control_if", function (block, generator) {
    const condition = generator.valueToCode(block, "COND", jsGenerator.ORDER_NONE) || "false";
    const statements = generator.statementToCode(block, "DO");
    return `if (${condition}) {\n${statements}}\n`;
  });

  generar("control_if_else", function (block, generator) {
    const condition = generator.valueToCode(block, "COND", jsGenerator.ORDER_NONE) || "false";
    const doStatements = generator.statementToCode(block, "DO");
    const elseStatements = generator.statementToCode(block, "ELSE");

    return `if (${condition}) {\n${doStatements}} else {\n${elseStatements}}\n`;
  });

  generar("control_stop", function (block) {
    const target = block.getFieldValue("TARGET");

    return `
  detenerPrograma(false, false);
  return;
  `;
  });

  // =========================
  // SENSORES
  // =========================

  generar("sensing_touching_edge", function () {
    return ["codey.isTouchingEdge()", jsGenerator.ORDER_FUNCTION_CALL];
  });
}