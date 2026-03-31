window.addEventListener("DOMContentLoaded", () => {
    // ====== Portrait lock overlay (mobile) ======
    const rotateOverlay = document.getElementById('rotateOverlay');
    const isMobile = () => window.matchMedia("(max-width: 980px)").matches;
    const isPortrait = () => window.matchMedia("(orientation: portrait)").matches;

    function updateRotateOverlay(){
      const show = isMobile() && isPortrait();
      rotateOverlay.style.display = show ? "grid" : "none";
      rotateOverlay.setAttribute("aria-hidden", show ? "false" : "true");
      document.body.style.overflow = show ? "hidden" : "";
    }
    window.addEventListener("resize", updateRotateOverlay);
    window.addEventListener("orientationchange", updateRotateOverlay);
    updateRotateOverlay();

    // ====== Top toolbar placeholders ======
    const btnRun = document.getElementById("btnRun");
    const btnStop = document.getElementById("btnStop");
    const speed = document.getElementById("speed");
    const speedVal = document.getElementById("speedVal");

    const simStatus = document.getElementById("simStatus");
    const simStatusText = document.getElementById("simStatusText");
    function setStatus(running){
      if (!simStatus || !simStatusText) return;
      simStatus.classList.toggle("running", !!running);
      simStatus.classList.toggle("stopped", !running);
      simStatusText.textContent = running ? "Ejecutando" : "Detenido";
    }
    window.setSimStatus = setStatus;

    speed?.addEventListener("input", () => {
      if (speedVal) {
        speedVal.textContent = Number(speed.value).toFixed(2) + "×";
      }
    });
    btnRun?.addEventListener("click", () => { setStatus(true); });
    btnStop?.addEventListener("click", () => { setStatus(false); });

    // ====== Stage canvas placeholder drawing ======
    const canvas = document.getElementById("stage");
    const stageCanvas = document.querySelector(".stage-canvas");

    if (!canvas || !stageCanvas) {
      console.warn("Stage canvas no disponible");
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.warn("No se pudo obtener el contexto 2D del canvas");
      return;
    }

    function resizeCanvas(){
      const rect = stageCanvas.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);

      if(w <= 10 || h <= 10){
        requestAnimationFrame(resizeCanvas);
        return;
      }

      const raw = Math.floor(Math.min(w, h));
      const targetCssSize = raw;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(targetCssSize * dpr);
      canvas.height = Math.floor(targetCssSize * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (typeof codey !== "undefined" && typeof codey.dibujar === "function" && codey.ctx) {
        codey.dibujar();
      }
    }

    window.resizeStageCanvas = resizeCanvas;

    // Reacciona también cuando cambie el layout (theater / panel / etc.)
    const ro = new ResizeObserver(() => resizeCanvas());
    ro.observe(stageCanvas);

    window.addEventListener("beforeunload", () => {
      ro.disconnect();
    });

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    const btnTheater = document.getElementById("btnTheater");

    let theaterMode = false;

    btnTheater?.addEventListener("click", () => {
      theaterMode = !theaterMode;
      document.body.classList.toggle("theater-mode", theaterMode);

      requestAnimationFrame(() => {
        resizeCanvas();

        if (typeof codey !== "undefined" && typeof codey.dibujar === "function" && codey.ctx) {
          codey.dibujar();
        }
      });
    });

    const btnHideStage = document.getElementById("btnHideStage");
    const btnZoomIn = document.getElementById("btnZoomIn");
    const btnZoomOut = document.getElementById("btnZoomOut");
    const btnResetView = document.getElementById("btnResetView");
    const btnUndo = document.getElementById("btnUndo");
    const btnRedo = document.getElementById("btnRedo");

    let initialScale = 1;

    window.addEventListener("load", () => {
      if (window.workspace) {
        initialScale = window.workspace.scale || 1;
      }
    });

    btnHideStage?.addEventListener("click", () => {
      const hidden = document.body.classList.toggle("hide-stage");

      btnHideStage.textContent = hidden ? "🗗" : "⛶";
      btnHideStage.title = hidden ? "Mostrar escenario" : "Ocultar escenario";

      requestAnimationFrame(() => {
        if (window.workspace && typeof Blockly !== "undefined" && Blockly.svgResize) {
          Blockly.svgResize(window.workspace);
        }

        if (typeof resizeCanvas === "function") {
          resizeCanvas();
        }

        if (typeof codey !== "undefined" && typeof codey.dibujar === "function" && codey.ctx) {
          codey.dibujar();
        }
      });
    });

    btnZoomIn?.addEventListener("click", () => {
      if (window.workspace) window.workspace.zoomCenter(1);
    });

    btnZoomOut?.addEventListener("click", () => {
      if (window.workspace) window.workspace.zoomCenter(-1);
    });

    btnResetView?.addEventListener("click", () => {
      if (!window.workspace) return;
      window.workspace.setScale(initialScale);
      window.workspace.scrollCenter();
    });

    btnUndo?.addEventListener("click", () => {
      if (window.workspace) window.workspace.undo(false);
    });

    btnRedo?.addEventListener("click", () => {
      if (window.workspace) window.workspace.undo(true);
    });

});
