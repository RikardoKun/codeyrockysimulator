window.addEventListener("load", () => {
  const canvas = document.getElementById("stage");
  if (!canvas) {
    console.error("Canvas no encontrado");
    return;
  }
  codey.init(canvas);

  if (typeof window.resizeStageCanvas === "function") {
    window.resizeStageCanvas();
  }

  if (typeof codey.dibujar === "function") {
    codey.dibujar();
  }

  document.getElementById("btnRun")?.addEventListener("click", ejecutarPrograma);
  document.getElementById("btnStop")?.addEventListener("click", detenerPrograma);
});

function obtenerCodigoBlockly() {
  const jsGenerator = Blockly.JavaScript || Blockly.javascriptGenerator;
  if (!window.workspace || !jsGenerator) return "";
  return jsGenerator.workspaceToCode(window.workspace);
}

// =========================
// Runtime del simulador
// =========================
const runtime = {
  running: false,
  startHandlers: [],
  keyHandlers: {},
  buttonHandlers: {},
  receiveHandlers: {},
  activeTasks: new Set(),
  keyListener: null,
  buttonAListener: null,
  buttonBListener: null,
  buttonCListener: null,

  reset() {
    this.stopAll();
    this.startHandlers = [];
    this.keyHandlers = {};
    this.buttonHandlers = {};
    this.receiveHandlers = {};
  },

  stopAll() {
    this.running = false;

    for (const task of this.activeTasks) {
      try {
        task.cancelled = true;
      } catch (_) {}
    }
    this.activeTasks.clear();

    if (this.keyListener) {
      window.removeEventListener("keydown", this.keyListener);
      this.keyListener = null;
    }

    if (this.buttonAListener) {
      const btnA = document.getElementById("simButtonA");
      if (btnA) {
        btnA.removeEventListener("click", this.buttonAListener);
      }
      this.buttonAListener = null;
    }

    if (this.buttonBListener) {
      const btnB = document.getElementById("simButtonB");
      if (btnB) {
        btnB.removeEventListener("click", this.buttonBListener);
      }
      this.buttonBListener = null;
    }

    if (this.buttonCListener) {
      const btnC = document.getElementById("simButtonC");
      if (btnC) {
        btnC.removeEventListener("click", this.buttonCListener);
      }
      this.buttonCListener = null;
    }
  },

  trackPromise(promise) {
    const task = { cancelled: false, promise };
    this.activeTasks.add(task);

    promise.finally(() => {
      this.activeTasks.delete(task);
      this.updateStatusIfIdle();
    });

    return task;
  },

  runHandler(fn, label = "handler") {
    const p = Promise.resolve()
      .then(() => fn())
      .catch((error) => {
        console.error(`Error en ${label}:`, error);
        const codeOut = document.getElementById("codeOut");
        if (codeOut) {
          codeOut.textContent += `\n// Error en ${label}: ${error.message}`;
        }
      });

    this.trackPromise(p);
    return p;
  },

  updateStatusIfIdle() {
    if (!this.running) return;

    const hasEventHandlers =
      this.startHandlers.length > 0 ||
      Object.keys(this.keyHandlers).length > 0 ||
      Object.keys(this.buttonHandlers).length > 0 ||
      Object.keys(this.receiveHandlers).length > 0;

    if (this.activeTasks.size === 0 && !hasEventHandlers) {
      this.running = false;

      // 🔥 AQUI ESTA LA CLAVE
      codey.detener?.();
      codey.dibujar?.(); // opcional pero recomendado

      window.setSimStatus?.(false);
    }
  },

  onStart(fn) {
    this.startHandlers.push(fn);
  },

  onKey(key, fn) {
    if (!this.keyHandlers[key]) this.keyHandlers[key] = [];
    this.keyHandlers[key].push(fn);
  },

  onButton(button, fn) {
    if (!this.buttonHandlers[button]) this.buttonHandlers[button] = [];
    this.buttonHandlers[button].push(fn);
  },

  onReceive(message, fn) {
    if (!this.receiveHandlers[message]) this.receiveHandlers[message] = [];
    this.receiveHandlers[message].push(fn);
  },

  async broadcast(message) {
    if (!this.running) return;
    const handlers = this.receiveHandlers[message] || [];
    for (const fn of handlers) {
      this.runHandler(fn, "broadcast");
    }
  },

  async broadcastAndWait(message) {
    if (!this.running) return;
    const handlers = this.receiveHandlers[message] || [];
    const promises = handlers.map(fn => {
      const p = this.runHandler(fn, "broadcastAndWait");
      return p;
    });
    await Promise.all(promises);
  },

  normalizeKey(key) {
    const map = {
      " ": "SPACE",
      "ArrowUp": "ARROWUP",
      "ArrowDown": "ARROWDOWN",
      "ArrowLeft": "ARROWLEFT",
      "ArrowRight": "ARROWRIGHT",
      "a": "A",
      "A": "A"
    };
    return map[key] || key.toUpperCase();
  },

  attachKeyEvents() {
    this.keyListener = (event) => {
      if (!this.running) return;
      const normalized = this.normalizeKey(event.key);
      const handlers = this.keyHandlers[normalized] || [];
      handlers.forEach(fn => {
        this.runHandler(fn, "evento de teclado");
      });
    };
    window.addEventListener("keydown", this.keyListener);
  },

  attachButtonA() {
    const mini = document.querySelector(".stage-top .mini");
    if (!mini) return;

    const ensureButton = (id, label) => {
      let btn = document.getElementById(id);

      if (!btn) {
        btn = document.createElement("button");
        btn.id = id;
        btn.type = "button";
        btn.textContent = label;
        btn.className = "btn sim-chip-btn";
        btn.style.marginLeft = "8px";
        mini.appendChild(btn);
      }

      return btn;
    };

    const btnA = this.buttonHandlers["A"]?.length ? ensureButton("simButtonA", "A") : null;
    const btnB = this.buttonHandlers["B"]?.length ? ensureButton("simButtonB", "B") : null;
    const btnC = this.buttonHandlers["C"]?.length ? ensureButton("simButtonC", "C") : null;

    const runButtonHandlers = (buttonName) => {
      if (!this.running) return;
      const handlers = this.buttonHandlers[buttonName] || [];
      handlers.forEach(fn => {
        this.runHandler(fn, `botón ${buttonName}`);
      });
    };

    this.buttonAListener = () => runButtonHandlers("A");
    this.buttonBListener = () => runButtonHandlers("B");
    this.buttonCListener = () => runButtonHandlers("C");

    btnA?.addEventListener("click", this.buttonAListener);
    btnB?.addEventListener("click", this.buttonBListener);
    btnC?.addEventListener("click", this.buttonCListener);
  },

  async runProgram(codigo) {
    this.reset();
    codey.iniciarEjecucion?.();
    this.running = true;
    window.setSimStatus?.(true);

    // API global que usan los bloques generados
    window.onStart = (fn) => this.onStart(fn);
    window.onKey = (key, fn) => this.onKey(key, fn);
    window.onButton = (button, fn) => this.onButton(button, fn);
    window.onReceive = (message, fn) => this.onReceive(message, fn);
    window.broadcast = (message) => this.broadcast(message);
    window.broadcastAndWait = (message) => this.broadcastAndWait(message);

    window.waitSeconds = (seconds) => new Promise((resolve) => {
      const totalMs = Math.max(0, Number(seconds) || 0) * 1000;
      const start = performance.now();

      const tick = (now) => {
        if (!this.running) {
          resolve();
          return;
        }

        const elapsed = (now - start) * codey.getSpeedMultiplier();
        if (elapsed >= totalMs) {
          resolve();
          return;
        }

        requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    });
    window.yieldFrame = () => new Promise((resolve) => {
      requestAnimationFrame(() => {
        resolve();
      });
    });

    const runner = new Function(`
      return (async () => {
        ${codigo}
      })();
    `);

    try {
      await runner();
    } catch (e) {
      console.error("Error en código generado:", e);
      throw e;
    }

    this.attachKeyEvents();
    this.attachButtonA();

    const startPromises = this.startHandlers.map(fn => {
      const p = this.runHandler(fn, "evento start");
      return p;
    });

    await Promise.all(startPromises);

    // 🔥 Si ya no hay nada ejecutándose, terminar completamente
    if (this.activeTasks.size === 0) {
      this.running = false;

      // 🔥 Detener robot (movimiento + estado)
      codey.detener?.();

      // 🔥 Redibujar para reflejar estado idle
      codey.dibujar?.();

      // 🔥 UI a "detenido"
      window.setSimStatus?.(false);
    } else {
      this.updateStatusIfIdle();
    }
  }
};

async function ejecutarPrograma() {
  const codeOut = document.getElementById("codeOut");

  if (runtime.running) {
    return;
  }

  try {
    if (codey.dragEnabled) {
      runtime.stopAll();
      codey.detener?.();
      codey.iniciarEjecucion?.();
      codey.dibujar();
    } else {
      detenerPrograma(false, true);
    }
    const codigo = obtenerCodigoBlockly();

    if (!codigo.trim()) {
      if (codeOut) {
        codeOut.textContent = "⚠️ Agrega bloques antes de ejecutar 😊\n";
      }
      window.setSimStatus?.(false);
      return;
    }

    if (codeOut) {
      codeOut.textContent = "// Código generado por Blockly\n" + codigo;
    }
    await runtime.runProgram(codigo);
  } catch (error) {
    console.error(error);
    if (codeOut) {
      codeOut.textContent = "// Error al ejecutar\n" + error.message;
    }
    runtime.stopAll();
    window.setSimStatus?.(false);
  }
}

function detenerPrograma(resetCodeOut = true, resetPose = true) {
  runtime.stopAll();
  codey.detener?.();

  if (resetPose) {
    codey.reset();
  } else {
    codey.cancelled = false;
    codey.dibujar();
  }

  if (resetCodeOut) {
    const codeOut = document.getElementById("codeOut");
    if (codeOut) {
      codeOut.textContent = "// ⏹ Simulación reiniciada.\n";
    }
  }

  window.setSimStatus?.(false);
}

window.runtime = runtime;