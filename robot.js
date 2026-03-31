const ARENA_SIZE_MM = 2440;

// Tamaño provisional de Codey visto desde arriba.
// Esto luego lo afinamos si quieres hacerlo todavía más exacto.
const CODEY_LENGTH_MM = 97;
const CODEY_WIDTH_MM = 95;

const BASE_ZONE = {
  xMm: 1030,
  yMm: 170,
  wMm: 360,
  hMm: 260
};

// Configuración inicial
const START_POSE = {
  xMm: BASE_ZONE.xMm + BASE_ZONE.wMm * 0.50,
  yMm: BASE_ZONE.yMm + BASE_ZONE.hMm * 0.68,
  angleDeg: 90
};

// Calibración inicial del simulador
// Ojo: esto es una base provisional para que ya se sienta "real".
// Luego la ajustamos con pruebas.
const MAX_LINEAR_SPEED_MM_S = 100;   // 100 mm/s = 10 cm/s a potencia 100
const MAX_ANGULAR_SPEED_DEG_S = 180; // 180°/s a potencia 100

const GUIDE_DIVISIONS = 10;
const MAP_MODULES = 7;
const MODULE_MM = ARENA_SIZE_MM / MAP_MODULES;

const codey = {
  ctx: null,
  canvas: null,
  dragEnabled: true,
  isDragging: false,
  isRotating: false,
  activePointerId: null,
  dragOffsetMmX: 0,
  dragOffsetMmY: 0,
  rotateStartPointerAngleDeg: 0,
  rotateStartRobotAngleDeg: 0,

  cancelled: false,
  boardImage: null,
  boardImageReady: false,

  continuousMotionFrameId: null,
  continuousMotion: {
    active: false,
    leftPower: 0,
    rightPower: 0,
    lastRealTs: null
  },

  xMm: START_POSE.xMm,
  yMm: START_POSE.yMm,
  angleDeg: START_POSE.angleDeg,

  savedPose: {
    xMm: START_POSE.xMm,
    yMm: START_POSE.yMm,
    angleDeg: START_POSE.angleDeg
  },

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    this.boardImage = new Image();
    this.boardImage.onload = () => {
      this.boardImageReady = true;
      this.dibujar();
    };
    this.boardImage.onerror = () => {
      console.warn("No se pudo cargar theme-park-board.png");
      this.boardImageReady = false;
      this.dibujar();
    };
    this.boardImage.src = "theme-park-board.png";

    this.setupPointerEvents();
    this.reset();
  },

  reset() {
    this.detenerMovimientoContinuo(false);
    this.xMm = this.savedPose.xMm;
    this.yMm = this.savedPose.yMm;
    this.angleDeg = this.savedPose.angleDeg;
    this.dibujar();
  }, 

  detener() {
    this.cancelled = true;
    this.detenerMovimientoContinuo(false);
  },

  iniciarEjecucion() {
    this.cancelled = false;
    this.detenerMovimientoContinuo(false);
  },

  clampPower(power) {
    return Math.max(-100, Math.min(100, Number(power) || 0));
  },

  detenerMovimientoContinuo(redraw = true) {
    if (this.continuousMotionFrameId !== null) {
      cancelAnimationFrame(this.continuousMotionFrameId);
      this.continuousMotionFrameId = null;
    }

    this.continuousMotion.active = false;
    this.continuousMotion.leftPower = 0;
    this.continuousMotion.rightPower = 0;
    this.continuousMotion.lastRealTs = null;

    if (redraw) {
      this.dibujar();
    }
  },

  moverContinuamenteModo(direction, power) {
    const p = this.clampPower(power);

    switch (direction) {
      case "FORWARD":
        this.moverRuedasContinuamente(p, p);
        break;
      case "BACKWARD":
        this.moverRuedasContinuamente(-p, -p);
        break;
      case "TURN_LEFT":
        this.moverRuedasContinuamente(-p, p);
        break;
      case "TURN_RIGHT":
        this.moverRuedasContinuamente(p, -p);
        break;
      default:
        this.detenerMovimientoContinuo();
        break;
    }
  },

  moverRuedasContinuamente(leftPower, rightPower) {
    const nextLeft = this.clampPower(leftPower);
    const nextRight = this.clampPower(rightPower);

    // Si ya está moviéndose exactamente igual, no reiniciar el loop
    if (
      this.continuousMotion.active &&
      !this.cancelled &&
      this.continuousMotion.leftPower === nextLeft &&
      this.continuousMotion.rightPower === nextRight
    ) {
      return;
    }

    this.cancelled = false;
    this.detenerMovimientoContinuo(false);

    this.continuousMotion.active = true;
    this.continuousMotion.leftPower = nextLeft;
    this.continuousMotion.rightPower = nextRight;
    this.continuousMotion.lastRealTs = null;

    const tick = (realTs) => {
      if (!this.continuousMotion.active || this.cancelled) {
        this.detenerMovimientoContinuo(true);
        return;
      }

      if (this.continuousMotion.lastRealTs === null) {
        this.continuousMotion.lastRealTs = realTs;
      }

      const realDeltaSec = Math.max(
        0,
        (realTs - this.continuousMotion.lastRealTs) / 1000
      );
      this.continuousMotion.lastRealTs = realTs;

      const dt = realDeltaSec * this.getSpeedMultiplier();

      if (dt > 0) {
        const leftPowerNow = this.continuousMotion.leftPower;
        const rightPowerNow = this.continuousMotion.rightPower;

        const leftSpeed = this.linearSpeedFromPower(Math.abs(leftPowerNow)) * Math.sign(leftPowerNow);
        const rightSpeed = this.linearSpeedFromPower(Math.abs(rightPowerNow)) * Math.sign(rightPowerNow);

        const linearSpeed = (leftSpeed + rightSpeed) / 2;
        const angularSpeed =
          ((rightPowerNow - leftPowerNow) / 200) * (MAX_ANGULAR_SPEED_DEG_S * 2);

        this.angleDeg = this.normalizeAngle(this.angleDeg + angularSpeed * dt);

        const rad = this.degToRad(this.angleDeg);
        this.xMm += Math.cos(rad) * linearSpeed * dt;
        this.yMm += Math.sin(rad) * linearSpeed * dt;

        this.keepInsideArena();
        this.dibujar();
      }

      this.continuousMotionFrameId = requestAnimationFrame(tick);
    };

    this.continuousMotionFrameId = requestAnimationFrame(tick);
  },

  getSpeedMultiplier() {
    const speed = document.getElementById("speed");
    return speed ? Number(speed.value || 1) : 1;
  },

  normalizeAngle(angle) {
    let a = angle % 360;
    if (a <= -180) a += 360;
    if (a > 180) a -= 360;
    return a;
  },

  degToRad(deg) {
    return deg * Math.PI / 180;
  },

  linearSpeedFromPower(power) {
    const p = Math.max(0, Math.min(100, Number(power) || 0));
    return (p / 100) * MAX_LINEAR_SPEED_MM_S;
  },

  angularSpeedFromPower(power) {
    const p = Math.max(0, Math.min(100, Number(power) || 0));
    return (p / 100) * MAX_ANGULAR_SPEED_DEG_S;
  },

  getRobotSafetyRadiusMm() {
    return Math.hypot(CODEY_LENGTH_MM / 2, CODEY_WIDTH_MM / 2);
  },

  keepInsideArena() {
    const r = this.getRobotSafetyRadiusMm();
    this.xMm = Math.max(r, Math.min(ARENA_SIZE_MM - r, this.xMm));
    this.yMm = Math.max(r, Math.min(ARENA_SIZE_MM - r, this.yMm));
  },

  isTouchingEdge() {
    const r = this.getRobotSafetyRadiusMm();
    return (
      this.xMm <= r ||
      this.xMm >= ARENA_SIZE_MM - r ||
      this.yMm <= r ||
      this.yMm >= ARENA_SIZE_MM - r
    );
  },

  async animateForDuration(durationSec, stepFn) {
    const total = Math.max(0, Number(durationSec) || 0);
    if (total <= 0) {
      this.dibujar();
      return;
    }

    return new Promise((resolve) => {
      let simElapsed = 0;
      let lastRealTs = null;

      const tick = (realTs) => {
        if (this.cancelled) {
          this.dibujar();
          resolve();
          return;
        }

        if (lastRealTs === null) {
          lastRealTs = realTs;
        }

        const realDeltaSec = Math.max(0, (realTs - lastRealTs) / 1000);
        lastRealTs = realTs;

        const simDeltaSec = realDeltaSec * this.getSpeedMultiplier();
        const remaining = total - simElapsed;
        const dt = Math.min(simDeltaSec, remaining);

        if (dt > 0) {
          stepFn(dt);
          simElapsed += dt;
          this.keepInsideArena();
          this.dibujar();
        }

        if (simElapsed >= total) {
          resolve();
          return;
        }

        requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    });
  },

  async avanzarTiempo(power, timeSec) {
    this.cancelled = false;

    const speed = this.linearSpeedFromPower(power);
    if (speed <= 0) return;

    await this.animateForDuration(timeSec, (dt) => {
      const rad = this.degToRad(this.angleDeg);
      const distance = speed * dt;
      this.xMm += Math.cos(rad) * distance;
      this.yMm += Math.sin(rad) * distance;
    });
  },

  async retrocederTiempo(power, timeSec) {
    this.cancelled = false;

    const speed = this.linearSpeedFromPower(power);
    if (speed <= 0) return;

    await this.animateForDuration(timeSec, (dt) => {
      const rad = this.degToRad(this.angleDeg);
      const distance = speed * dt;
      this.xMm -= Math.cos(rad) * distance;
      this.yMm -= Math.sin(rad) * distance;
    });
  },

  async girarIzquierdaTiempo(power, timeSec) {
    this.cancelled = false;

    const speed = this.angularSpeedFromPower(power);
    if (speed <= 0) return;

    await this.animateForDuration(timeSec, (dt) => {
      this.angleDeg = this.normalizeAngle(this.angleDeg - speed * dt);
    });
  },

  async girarDerechaTiempo(power, timeSec) {
    this.cancelled = false;

    const speed = this.angularSpeedFromPower(power);
    if (speed <= 0) return;

    await this.animateForDuration(timeSec, (dt) => {
      this.angleDeg = this.normalizeAngle(this.angleDeg + speed * dt);
    });
  },

  async girarIzquierdaGrados(angle) {
    this.cancelled = false;

    const target = Math.max(0, Number(angle) || 0);
    if (target <= 0) return;

    const angularSpeed = 180; // deg/s provisional
    const duration = target / angularSpeed;

    await this.animateForDuration(duration, (dt) => {
      this.angleDeg = this.normalizeAngle(this.angleDeg - angularSpeed * dt);
    });
  },

  async girarDerechaGrados(angle) {
    this.cancelled = false;

    const target = Math.max(0, Number(angle) || 0);
    if (target <= 0) return;

    const angularSpeed = 180; // deg/s provisional
    const duration = target / angularSpeed;

    await this.animateForDuration(duration, (dt) => {
      this.angleDeg = this.normalizeAngle(this.angleDeg + angularSpeed * dt);
    });
  },

  getViewMetrics() {
    const canvas = this.ctx.canvas;
    const viewW = canvas.clientWidth || canvas.width;
    const viewH = canvas.clientHeight || canvas.height;

    const padding = 0;
    const boardPx = Math.max(100, Math.min(viewW, viewH) - padding * 2);
    const offsetX = (viewW - boardPx) / 2;
    const offsetY = (viewH - boardPx) / 2;
    const pxPerMm = boardPx / ARENA_SIZE_MM;

    return { viewW, viewH, boardPx, offsetX, offsetY, pxPerMm };
  },

  mmToPxX(mm) {
    const { offsetX, pxPerMm } = this.getViewMetrics();
    return offsetX + mm * pxPerMm;
  },

  mmToPxY(mm) {
    const { offsetY, pxPerMm } = this.getViewMetrics();
    return offsetY + mm * pxPerMm;
  },

  drawArena(ctx) {
    const { boardPx, offsetX, offsetY } = this.getViewMetrics();

    // Fondo base mientras carga o si falla la imagen
    ctx.fillStyle = "#0E7BC6";
    roundRect(ctx, offsetX, offsetY, boardPx, boardPx, 22);
    ctx.fill();

    // Si la imagen ya cargó, dibujarla exacta dentro del tablero
    if (this.boardImage && this.boardImageReady) {
      ctx.save();

      roundRect(ctx, offsetX, offsetY, boardPx, boardPx, 22);
      ctx.clip();

      ctx.drawImage(this.boardImage, offsetX, offsetY, boardPx, boardPx);

      ctx.restore();
    }

    this.drawRectMm(
      ctx,
      BASE_ZONE.xMm,
      BASE_ZONE.yMm,
      BASE_ZONE.wMm,
      BASE_ZONE.hMm,
      "rgba(0, 189, 255, 0.10)",
      "rgba(0, 189, 255, 0.45)",
      12
    );

    // Borde exterior
    ctx.strokeStyle = "#6aa7a0";
    ctx.lineWidth = 2;
    roundRect(ctx, offsetX, offsetY, boardPx, boardPx, 22);
    ctx.stroke();

    // Etiquetas suaves
    ctx.fillStyle = "rgba(10, 32, 45, 0.75)";
    ctx.font = '600 12px Poppins, sans-serif';
    ctx.fillText("0 mm", offsetX + 6, offsetY + boardPx - 8);
    ctx.fillText("2440 mm", offsetX + boardPx - 62, offsetY + boardPx - 8);
    ctx.fillText("2440 mm", offsetX + 8, offsetY + 16);
  },

  cellRect(col, row, colSpan = 1, rowSpan = 1) {
    return {
      xMm: col * MODULE_MM,
      yMm: row * MODULE_MM,
      wMm: colSpan * MODULE_MM,
      hMm: rowSpan * MODULE_MM
    };
  },

  drawRectMm(ctx, xMm, yMm, wMm, hMm, fill, stroke = null, radiusPx = 18) {
    const { offsetX, offsetY, pxPerMm } = this.getViewMetrics();
    const x = offsetX + xMm * pxPerMm;
    const y = offsetY + yMm * pxPerMm;
    const w = wMm * pxPerMm;
    const h = hMm * pxPerMm;

    ctx.fillStyle = fill;
    roundRect(ctx, x, y, w, h, radiusPx);
    ctx.fill();

    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      roundRect(ctx, x, y, w, h, radiusPx);
      ctx.stroke();
    }
  },

  setPoseMm(xMm, yMm, angleDeg = this.angleDeg) {
    this.xMm = xMm;
    this.yMm = yMm;
    this.angleDeg = angleDeg;
    this.keepInsideArena();
    this.dibujar();
  },

  saveCurrentPose() {
    this.savedPose = {
      xMm: this.xMm,
      yMm: this.yMm,
      angleDeg: this.angleDeg
    };
  },

  screenPxToArenaMm(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const { offsetX, offsetY, pxPerMm } = this.getViewMetrics();

    const xPx = clientX - rect.left;
    const yPx = clientY - rect.top;

    return {
      xMm: (xPx - offsetX) / pxPerMm,
      yMm: (yPx - offsetY) / pxPerMm
    };
  },

  getPointerAngleDeg(clientX, clientY) {
    const { xMm, yMm } = this.screenPxToArenaMm(clientX, clientY);
    const dx = xMm - this.xMm;
    const dy = yMm - this.yMm;
    return Math.atan2(dy, dx) * 180 / Math.PI;
  },

  getRotateHandleRadiusMm() {
    return this.getRobotSafetyRadiusMm() * 1.45;
  },

  getRotateHandlePositionMm() {
    const r = this.getRotateHandleRadiusMm();
    const a = this.degToRad(this.angleDeg);
    return {
      xMm: this.xMm + Math.cos(a) * r,
      yMm: this.yMm + Math.sin(a) * r
    };
  },

  isPointOnRotateHandle(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();

    const pointerX = clientX - rect.left;
    const pointerY = clientY - rect.top;

    const handle = this.getRotateHandlePositionMm();
    const hx = this.mmToPxX(handle.xMm);
    const hy = this.mmToPxY(handle.yMm);

    const dPx = Math.hypot(pointerX - hx, pointerY - hy);

    // Radio visual de la bolita (10) + margen cómodo para touch
    return dPx <= 18;
  },

  getRotateRingInnerRadiusMm() {
    return this.getRobotSafetyRadiusMm() * 1.20;
  },

  getRotateRingOuterRadiusMm() {
    return this.getRobotSafetyRadiusMm() * 1.95;
  },

  hitTestInteraction(clientX, clientY) {
    const { xMm, yMm } = this.screenPxToArenaMm(clientX, clientY);

    const dx = xMm - this.xMm;
    const dy = yMm - this.yMm;
    const distance = Math.hypot(dx, dy);

    const moveRadius = this.getRobotSafetyRadiusMm() * 1.15;
    const ringInner = this.getRotateRingInnerRadiusMm();
    const ringOuter = this.getRotateRingOuterRadiusMm();

    // Centro amplio = mover
    if (distance <= moveRadius) return "move";

    // Manija de rotación
    const handleRadius = (ringInner + ringOuter) / 2;
    const handleAngle = this.degToRad(this.angleDeg);
    const hx = this.xMm + Math.cos(handleAngle) * handleRadius;
    const hy = this.yMm + Math.sin(handleAngle) * handleRadius;

    const handleDistance = Math.hypot(xMm - hx, yMm - hy);
    if (handleDistance <= this.getRobotSafetyRadiusMm() * 0.28) return "rotate";

    // Anillo = girar
    if (distance >= ringInner && distance <= ringOuter) return "rotate";

    return null;
  },

  isPointInsideRobot(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();

    const pointerX = clientX - rect.left;
    const pointerY = clientY - rect.top;

    const cx = this.mmToPxX(this.xMm);
    const cy = this.mmToPxY(this.yMm);

    const dx = pointerX - cx;
    const dy = pointerY - cy;

    const distancePx = Math.hypot(dx, dy);

    const { pxPerMm } = this.getViewMetrics();
    const radiusPx = this.getRobotSafetyRadiusMm() * pxPerMm;

    // margen extra para que sea más fácil agarrarlo (especial en touch)
    return distancePx <= radiusPx + 6;
  },

  startDrag(clientX, clientY, pointerId = null) {
    if (!this.dragEnabled) return;

    this.activePointerId = pointerId;

    if (this.isPointOnRotateHandle(clientX, clientY)) {
      this.isDragging = false;
      this.isRotating = true;
      this.rotateStartPointerAngleDeg = this.getPointerAngleDeg(clientX, clientY);
      this.rotateStartRobotAngleDeg = this.angleDeg;
      this.dibujar();
      return;
    }

    if (this.isPointInsideRobot(clientX, clientY)) {
      const p = this.screenPxToArenaMm(clientX, clientY);
      this.isDragging = true;
      this.isRotating = false;
      this.dragOffsetMmX = p.xMm - this.xMm;
      this.dragOffsetMmY = p.yMm - this.yMm;
      return;
    }

    this.activePointerId = null;
  },

  moveDrag(clientX, clientY, pointerId = null) {
    if (this.activePointerId !== null && pointerId !== null && this.activePointerId !== pointerId) {
      return;
    }

    if (this.isDragging) {
      const p = this.screenPxToArenaMm(clientX, clientY);
      this.setPoseMm(
        p.xMm - this.dragOffsetMmX,
        p.yMm - this.dragOffsetMmY,
        this.angleDeg
      );
      return;
    }

    if (this.isRotating) {
      const currentPointerAngle = this.getPointerAngleDeg(clientX, clientY);
      const delta = currentPointerAngle - this.rotateStartPointerAngleDeg;
      const nextAngle = this.normalizeAngle(this.rotateStartRobotAngleDeg + delta);
      this.setPoseMm(this.xMm, this.yMm, nextAngle);
    }
  },

  endDrag(pointerId = null) {
    if (this.activePointerId !== null && pointerId !== null && this.activePointerId !== pointerId) {
      return;
    }

    const wasDragging = this.isDragging;
    const wasRotating = this.isRotating;

    this.isDragging = false;
    this.isRotating = false;
    this.activePointerId = null;

    if (wasDragging || wasRotating) {
      this.saveCurrentPose();
    }

    this.dibujar();
  },

  setupPointerEvents() {
    if (!this.canvas) return;

    const canvas = this.canvas;
    canvas.style.touchAction = "none";

    canvas.addEventListener("pointerdown", (e) => {
      this.startDrag(e.clientX, e.clientY, e.pointerId);

      if (this.isDragging || this.isRotating) {
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch (_) {}
        e.preventDefault();
      }
    });

    canvas.addEventListener("pointermove", (e) => {
      this.moveDrag(e.clientX, e.clientY, e.pointerId);

      if (this.isDragging || this.isRotating) {
        e.preventDefault();
      }
    });

    const finishPointer = (e) => {
      this.endDrag(e.pointerId);
    };

    canvas.addEventListener("pointerup", finishPointer);
    canvas.addEventListener("pointercancel", finishPointer);
    canvas.addEventListener("lostpointercapture", finishPointer);
  },

  drawCodey(ctx) {
    const { pxPerMm } = this.getViewMetrics();

    const cx = this.mmToPxX(this.xMm);
    const cy = this.mmToPxY(this.yMm);

    const bodyL = CODEY_LENGTH_MM * pxPerMm;
    const bodyW = CODEY_WIDTH_MM * pxPerMm;

    const bodyRadius = Math.max(10, bodyW * 0.22);

    // Ahora pensamos el robot "viendo hacia arriba" en su eje local
    const trackW = bodyL * 0.18;

    const faceW = bodyL * 0.44;
    const faceH = bodyW * 0.34;
    const faceY = -bodyW * 0.12;

    const earW = faceW * 0.16;
    const earH = faceH * 0.22;

    const topPanelW = bodyL * 0.20;
    const topPanelH = bodyW * 0.28;
    const topPanelY = bodyW * 0.10;

    const eyeR = Math.max(2, bodyW * 0.05);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.degToRad(this.angleDeg + 90));

    // =========================
    // SOMBRA SUAVE
    // =========================
    ctx.fillStyle = "rgba(0,0,0,0.10)";
    roundRect(
      ctx,
      -bodyL / 2 + 2,
      -bodyW / 2 + 3,
      bodyL,
      bodyW,
      bodyRadius
    );
    ctx.fill();

    // =========================
    // CUERPO BASE BLANCO
    // =========================
    ctx.fillStyle = "#f4f5f7";
    roundRect(
      ctx,
      -bodyL / 2,
      -bodyW / 2,
      bodyL,
      bodyW,
      bodyRadius
    );
    ctx.fill();

    // Borde sutil
    ctx.strokeStyle = "rgba(0,0,0,0.10)";
    ctx.lineWidth = 1.25;
    roundRect(
      ctx,
      -bodyL / 2,
      -bodyW / 2,
      bodyL,
      bodyW,
      bodyRadius
    );
    ctx.stroke();

    // =========================
    // ORUGAS LATERALES
    // =========================
    ctx.fillStyle = "#1f232b";

    roundRect(
      ctx,
      -bodyL / 2,
      -bodyW / 2 + bodyW * 0.04,
      trackW,
      bodyW * 0.92,
      trackW / 2
    );
    ctx.fill();

    roundRect(
      ctx,
      bodyL / 2 - trackW,
      -bodyW / 2 + bodyW * 0.04,
      trackW,
      bodyW * 0.92,
      trackW / 2
    );
    ctx.fill();

    // =========================
    // CARA / PANTALLA NEGRA
    // =========================
    ctx.fillStyle = "#1b1f27";
    roundRect(
      ctx,
      -faceW / 2,
      faceY - faceH / 2,
      faceW,
      faceH,
      faceH * 0.24
    );
    ctx.fill();

    // Orejitas superiores (arriba de la cara)
    roundRect(
      ctx,
      -faceW * 0.24,
      faceY - faceH / 2 - earH * 1.05,
      earW,
      earH,
      earH * 0.35
    );
    ctx.fill();

    roundRect(
      ctx,
      faceW * 0.08,
      faceY - faceH / 2 - earH * 1.05,
      earW,
      earH,
      earH * 0.35
    );
    ctx.fill();

    // Brillo de pantalla
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    roundRect(
      ctx,
      -faceW / 2 + 2,
      faceY - faceH / 2 + 2,
      faceW * 0.78,
      faceH * 0.30,
      faceH * 0.12
    );
    ctx.fill();

    // Ojos
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-faceW * 0.10, faceY, eyeR, 0, Math.PI * 2);
    ctx.arc(faceW * 0.10, faceY, eyeR, 0, Math.PI * 2);
    ctx.fill();

    // =========================
    // PANEL DE PUNTITOS TRASERO
    // =========================
    ctx.fillStyle = "#e7e9ee";
    roundRect(
      ctx,
      -topPanelW / 2,
      topPanelY - topPanelH / 2,
      topPanelW,
      topPanelH,
      topPanelH * 0.28
    );
    ctx.fill();

    // Perforaciones del panel
    ctx.fillStyle = "rgba(140,145,155,0.70)";
    const holeR = Math.max(1.2, bodyW * 0.015);
    const gapX = bodyW * 0.060;
    const gapY = bodyW * 0.060;
    const holesStartX = -gapX * 1.5;
    const holesStartY = topPanelY - gapY * 0.5;

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 4; col++) {
        ctx.beginPath();
        ctx.arc(
          holesStartX + col * gapX,
          holesStartY + row * gapY,
          holeR,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    // =========================
    // FLECHA DE ORIENTACIÓN
    // =========================
    ctx.fillStyle = "#00bdff";
    ctx.beginPath();
    ctx.moveTo(0, -bodyW * 0.34);
    ctx.lineTo(-bodyL * 0.10, -bodyW * 0.16);
    ctx.lineTo(bodyL * 0.10, -bodyW * 0.16);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // =========================
    // MANIJA DE ROTACIÓN
    // =========================
    if (this.dragEnabled) {
      const handle = this.getRotateHandlePositionMm();
      const hx = this.mmToPxX(handle.xMm);
      const hy = this.mmToPxY(handle.yMm);

      ctx.save();

      ctx.strokeStyle = this.isRotating
        ? "rgba(255,255,255,0.95)"
        : "rgba(255,255,255,0.70)";
      ctx.lineWidth = this.isRotating ? 3 : 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(this.mmToPxX(this.xMm), this.mmToPxY(this.yMm));
      ctx.lineTo(hx, hy);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(hx, hy, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = this.isRotating
        ? "rgba(0,255,200,1)"
        : "rgba(0,0,0,0.35)";
      ctx.lineWidth = this.isRotating ? 3 : 2;
      ctx.stroke();

      ctx.restore();
    }
  },

  drawHud(ctx) {
    const { viewW } = this.getViewMetrics();

    ctx.fillStyle = "rgba(10,18,32,0.78)";
    ctx.font = '600 12px Poppins, sans-serif';
    ctx.textAlign = "left";

    const xText = `X: ${Math.round(this.xMm)} mm`;
    const yText = `Y: ${Math.round(this.yMm)} mm`;
    const aText = `Ángulo: ${Math.round(this.angleDeg)}°`;

    ctx.fillText(xText, 18, 22);
    ctx.fillText(yText, 18, 40);
    ctx.fillText(aText, 18, 58);
    ctx.fillText("Modo libre: centro = mover · anillo = girar", 18, 76);

    ctx.textAlign = "right";
    ctx.fillText("Vista superior · escala interna real", viewW - 18, 22);
  },

  dibujar() {
    const ctx = this.ctx;
    if (!ctx) return;

    const canvas = ctx.canvas;

    // Limpieza segura sin arrastrar la transformación del DPR
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    this.drawArena(ctx);
    this.drawCodey(ctx);
    this.drawHud(ctx);
  }
};

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

window.codey = codey;