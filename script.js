(() => {
  "use strict";

  const captions = [
    "Tegangan menumpuk di sepanjang bidang sesar.",
    "Batuan mendekati ambang kritis — gesekan hampir kalah.",
    "Energi terlepas: bidang sesar bergeser mendadak.",
    "Gelombang seismik mencapai permukaan sebagai getaran.",
  ];

  const faultData = {
    normal: {
      title: "Sesar normal",
      text: "Terjadi saat kerak meregang. Blok hanging wall turun relatif terhadap footwall. Umum di zona ekstensi seperti rift valley.",
      points: [
        "Gaya: tarikan (tension)",
        "Gerakan: hanging wall turun",
        "Contoh: sesar di zona rift",
      ],
    },
    reverse: {
      title: "Sesar naik (reverse)",
      text: "Terjadi saat kerak tertekan. Hanging wall terdorong naik. Sering terkait zona subduksi dan tumbukan lempeng.",
      points: [
        "Gaya: tekanan (compression)",
        "Gerakan: hanging wall naik",
        "Contoh: zona subduksi",
      ],
    },
    strike: {
      title: "Sesar geser (strike-slip)",
      text: "Blok batuan bergeser mendatar melewati satu sama lain. Gerakan lateral ini menghasilkan gempa dangkal yang kuat.",
      points: [
        "Gaya: geser horizontal",
        "Gerakan: lateral kiri/kanan",
        "Contoh: sesar transform",
      ],
    },
  };

  /* ---------- Nav ---------- */
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Mechanism steps + canvas ---------- */
  const steps = [...document.querySelectorAll(".step")];
  const stageCaption = document.getElementById("stageCaption");
  const mechCanvas = document.getElementById("mechanismCanvas");
  const mechCtx = mechCanvas?.getContext("2d");
  let activeStep = 0;
  let mechTime = 0;

  function setStep(index) {
    activeStep = index;
    steps.forEach((step, i) => {
      step.classList.toggle("is-active", i === index);
    });
    if (stageCaption) stageCaption.textContent = captions[index];
  }

  steps.forEach((step) => {
    step.querySelector(".step-tab")?.addEventListener("click", () => {
      setStep(Number(step.dataset.step));
    });
  });

  // Auto-advance steps gently
  setInterval(() => {
    if (document.hidden) return;
    setStep((activeStep + 1) % steps.length);
  }, 4500);

  function drawMechanism(t) {
    if (!mechCtx || !mechCanvas) return;
    const w = mechCanvas.width;
    const h = mechCanvas.height;
    mechCtx.clearRect(0, 0, w, h);

    // ground layers
    const groundY = h * 0.55;
    const grad = mechCtx.createLinearGradient(0, groundY, 0, h);
    grad.addColorStop(0, "#2a5c4d");
    grad.addColorStop(1, "#16352d");
    mechCtx.fillStyle = grad;
    mechCtx.fillRect(0, groundY, w, h - groundY);

    mechCtx.fillStyle = "rgba(250,247,241,0.08)";
    mechCtx.fillRect(0, 0, w, groundY);

    // fault plane
    const offset =
      activeStep >= 2
        ? Math.min(28, (t % 120) * 0.35)
        : activeStep === 1
          ? Math.sin(t * 0.08) * 2
          : 0;

    mechCtx.save();
    mechCtx.translate(w * 0.5, groundY);
    mechCtx.rotate((-28 * Math.PI) / 180);

    // left block
    mechCtx.fillStyle = "#3d7a68";
    mechCtx.fillRect(-220, -8 + (activeStep === 0 ? Math.sin(t * 0.05) * 1.5 : 0), 210, 160);

    // right block with slip
    mechCtx.fillStyle = "#4e8f7a";
    const slipY = activeStep >= 2 ? offset : 0;
    const slipX = activeStep === 3 ? Math.sin(t * 0.2) * 3 : 0;
    mechCtx.fillRect(10 + slipX, -8 - slipY, 220, 160);

    // stress sparks
    if (activeStep <= 1) {
      mechCtx.strokeStyle = `rgba(232,160,106,${0.35 + Math.sin(t * 0.15) * 0.25})`;
      mechCtx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const y = 10 + i * 24;
        mechCtx.beginPath();
        mechCtx.moveTo(-8, y);
        mechCtx.lineTo(8 + Math.sin(t * 0.2 + i) * 4, y);
        mechCtx.stroke();
      }
    }

    mechCtx.restore();

    // surface buildings / waves
    mechCtx.fillStyle = "rgba(250,247,241,0.75)";
    const shake = activeStep === 3 ? Math.sin(t * 0.45) * 4 : 0;
    for (let i = 0; i < 5; i++) {
      const bx = 80 + i * 110 + shake * (i % 2 === 0 ? 1 : -1);
      const bh = 28 + (i % 3) * 12;
      mechCtx.fillRect(bx, groundY - bh, 28, bh);
    }

    if (activeStep >= 2) {
      mechCtx.strokeStyle = "rgba(232,160,106,0.55)";
      mechCtx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const r = 20 + ((t * 2 + i * 40) % 140);
        mechCtx.beginPath();
        mechCtx.arc(w * 0.55, groundY + 20, r, 0, Math.PI * 2);
        mechCtx.stroke();
      }
    }

    // labels
    mechCtx.fillStyle = "rgba(250,247,241,0.85)";
    mechCtx.font = "500 16px DM Sans, sans-serif";
    mechCtx.fillText("Permukaan", 24, 36);
    mechCtx.fillText("Bidang sesar", w - 140, h - 24);
  }

  /* ---------- Fault diagram ---------- */
  const faultCanvas = document.getElementById("faultCanvas");
  const faultCtx = faultCanvas?.getContext("2d");
  const faultTitle = document.getElementById("faultTitle");
  const faultText = document.getElementById("faultText");
  const faultPoints = document.getElementById("faultPoints");
  const faultBtns = [...document.querySelectorAll(".fault-btn")];
  let currentFault = "normal";
  let faultAnim = 0;

  function setFault(type) {
    currentFault = type;
    faultAnim = 0;
    faultBtns.forEach((btn) => {
      const active = btn.dataset.fault === type;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
    });
    const data = faultData[type];
    if (faultTitle) faultTitle.textContent = data.title;
    if (faultText) faultText.textContent = data.text;
    if (faultPoints) {
      faultPoints.innerHTML = data.points.map((p) => `<li>${p}</li>`).join("");
    }
  }

  faultBtns.forEach((btn) => {
    btn.addEventListener("click", () => setFault(btn.dataset.fault));
  });

  function drawFault(progress) {
    if (!faultCtx || !faultCanvas) return;
    const w = faultCanvas.width;
    const h = faultCanvas.height;
    faultCtx.clearRect(0, 0, w, h);

    const p = Math.min(1, progress);
    const cx = w * 0.5;
    const cy = h * 0.55;

    faultCtx.fillStyle = "rgba(250,247,241,0.06)";
    faultCtx.fillRect(0, 0, w, h);

    faultCtx.save();
    faultCtx.translate(cx, cy);

    if (currentFault === "strike") {
      const move = p * 42;
      faultCtx.fillStyle = "#3d7a68";
      faultCtx.fillRect(-180, -70, 170, 140);
      faultCtx.fillStyle = "#4e8f7a";
      faultCtx.fillRect(10, -70, 170, 140);

      faultCtx.fillStyle = "#2a5c4d";
      faultCtx.fillRect(-180 + move, -70, 170, 55);
      faultCtx.fillRect(10 - move, 0, 170, 70);

      // arrows
      faultCtx.strokeStyle = "#e8a06a";
      faultCtx.lineWidth = 3;
      faultCtx.beginPath();
      faultCtx.moveTo(-90, -90);
      faultCtx.lineTo(-90 + move * 0.6, -90);
      faultCtx.moveTo(90, 90);
      faultCtx.lineTo(90 - move * 0.6, 90);
      faultCtx.stroke();
    } else {
      const angle = (-32 * Math.PI) / 180;
      faultCtx.rotate(angle);
      const shift = currentFault === "normal" ? p * 36 : -p * 36;

      faultCtx.fillStyle = "#3d7a68";
      faultCtx.fillRect(-200, -10, 195, 150);
      faultCtx.fillStyle = "#4e8f7a";
      faultCtx.fillRect(5, -10 + shift, 200, 150);

      faultCtx.strokeStyle = "rgba(232,160,106,0.9)";
      faultCtx.lineWidth = 3;
      faultCtx.beginPath();
      faultCtx.moveTo(0, -20);
      faultCtx.lineTo(0, 140);
      faultCtx.stroke();

      // motion arrow
      faultCtx.beginPath();
      faultCtx.moveTo(70, 20);
      faultCtx.lineTo(70, 20 + shift * 0.8);
      faultCtx.stroke();
    }

    faultCtx.restore();

    faultCtx.fillStyle = "rgba(250,247,241,0.85)";
    faultCtx.font = "500 15px DM Sans, sans-serif";
    faultCtx.fillText(
      currentFault === "normal"
        ? "Hanging wall turun"
        : currentFault === "reverse"
          ? "Hanging wall naik"
          : "Gerakan lateral",
      24,
      36
    );
  }

  /* ---------- Simulation ---------- */
  const stressRateEl = document.getElementById("stressRate");
  const frictionEl = document.getElementById("friction");
  const stressFill = document.getElementById("stressFill");
  const stressValue = document.getElementById("stressValue");
  const thresholdMark = document.getElementById("thresholdMark");
  const simStatus = document.getElementById("simStatus");
  const quakeLog = document.getElementById("quakeLog");
  const btnStart = document.getElementById("btnStart");
  const btnReset = document.getElementById("btnReset");
  const simCanvas = document.getElementById("simCanvas");
  const simCtx = simCanvas?.getContext("2d");

  const sim = {
    running: false,
    stress: 0,
    slip: 0,
    quakeFlash: 0,
    quakes: 0,
    lastRelease: 0,
  };

  function updateThresholdMark() {
    if (thresholdMark && frictionEl) {
      thresholdMark.style.left = `${frictionEl.value}%`;
    }
  }

  function resetSim(message) {
    sim.running = false;
    sim.stress = 0;
    sim.slip = 0;
    sim.quakeFlash = 0;
    if (btnStart) btnStart.textContent = "Jalankan";
    if (stressFill) stressFill.style.width = "0%";
    if (stressValue) stressValue.textContent = "0%";
    if (simStatus) {
      simStatus.textContent =
        message || "Siap. Tekan Jalankan untuk mulai menumpuk tegangan.";
    }
  }

  function releaseQuake() {
    sim.quakes += 1;
    sim.lastRelease = Math.round(sim.stress);
    sim.stress = Math.max(8, sim.stress * 0.12);
    sim.slip = 1;
    sim.quakeFlash = 1;
    if (quakeLog) {
      quakeLog.textContent = `Gempa #${sim.quakes} terpicu! Tegangan lepas dari ~${sim.lastRelease}% ke ${Math.round(sim.stress)}%.`;
    }
    if (simStatus) {
      simStatus.textContent = "Pelepasan energi! Bidang sesar bergeser, lalu tegangan menumpuk lagi.";
    }
  }

  btnStart?.addEventListener("click", () => {
    sim.running = !sim.running;
    btnStart.textContent = sim.running ? "Jeda" : "Jalankan";
    if (simStatus) {
      simStatus.textContent = sim.running
        ? "Tegangan sedang menumpuk di sesar..."
        : "Dijeda. Tekan Jalankan untuk melanjutkan.";
    }
  });

  btnReset?.addEventListener("click", () => {
    sim.quakes = 0;
    if (quakeLog) quakeLog.textContent = "Belum ada gempa dalam sesi ini.";
    resetSim();
  });

  frictionEl?.addEventListener("input", updateThresholdMark);
  updateThresholdMark();

  function drawSim() {
    if (!simCtx || !simCanvas) return;
    const w = simCanvas.width;
    const h = simCanvas.height;
    simCtx.clearRect(0, 0, w, h);

    const groundY = h * 0.5;
    simCtx.fillStyle = "rgba(250,247,241,0.06)";
    simCtx.fillRect(0, 0, w, groundY);

    const rockGrad = simCtx.createLinearGradient(0, groundY, 0, h);
    rockGrad.addColorStop(0, "#2f6b5a");
    rockGrad.addColorStop(1, "#16352d");
    simCtx.fillStyle = rockGrad;
    simCtx.fillRect(0, groundY, w, h - groundY);

    const shake = sim.quakeFlash > 0 ? Math.sin(sim.quakeFlash * 40) * 6 * sim.quakeFlash : 0;
    const lockedGap = 4;
    const opened = sim.slip > 0 ? 18 * sim.slip : 0;

    simCtx.save();
    simCtx.translate(shake, 0);

    // left plate
    simCtx.fillStyle = "#3f826e";
    simCtx.fillRect(40, groundY - 10, w * 0.42 - opened * 0.5, h);

    // right plate
    simCtx.fillStyle = "#4f947d";
    simCtx.fillRect(w * 0.5 + lockedGap + opened * 0.5, groundY - 10, w * 0.42, h);

    // stress glow in gap
    const alpha = 0.15 + (sim.stress / 100) * 0.7;
    simCtx.fillStyle = `rgba(232,160,106,${alpha})`;
    simCtx.fillRect(w * 0.5 - 6 - opened * 0.25, groundY, 12 + opened * 0.5, h - groundY);

    // surface markers
    simCtx.fillStyle = "rgba(250,247,241,0.8)";
    for (let i = 0; i < 6; i++) {
      const x = 70 + i * 90 + (i > 2 ? opened : -opened * 0.2);
      simCtx.fillRect(x, groundY - 34 - (i % 2) * 10, 22, 34 + (i % 2) * 10);
    }

    if (sim.quakeFlash > 0) {
      simCtx.strokeStyle = `rgba(232,160,106,${sim.quakeFlash})`;
      simCtx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const r = 30 + (1 - sim.quakeFlash) * 120 + i * 18;
        simCtx.beginPath();
        simCtx.arc(w * 0.5, groundY + 30, r, 0, Math.PI * 2);
        simCtx.stroke();
      }
    }

    simCtx.restore();

    simCtx.fillStyle = "rgba(250,247,241,0.85)";
    simCtx.font = "500 15px DM Sans, sans-serif";
    simCtx.fillText(`Tegangan: ${Math.round(sim.stress)}%`, 24, 32);
    simCtx.fillText(`Ambang: ${frictionEl?.value || 70}%`, 24, 54);
  }

  function updateSim(dt) {
    if (!sim.running) return;
    const rate = Number(stressRateEl?.value || 4);
    const threshold = Number(frictionEl?.value || 70);
    sim.stress = Math.min(100, sim.stress + rate * 4.2 * dt);

    if (stressFill) stressFill.style.width = `${sim.stress}%`;
    if (stressValue) stressValue.textContent = `${Math.round(sim.stress)}%`;

    if (sim.stress >= threshold) {
      releaseQuake();
    }

    if (sim.slip > 0) {
      sim.slip = Math.max(0, sim.slip - dt * 1.4);
    }
    if (sim.quakeFlash > 0) {
      sim.quakeFlash = Math.max(0, sim.quakeFlash - dt * 1.1);
    }
  }

  /* ---------- Quiz ---------- */
  const quizForm = document.getElementById("quizForm");
  const quizFeedback = document.getElementById("quizFeedback");

  quizForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const chosen = quizForm.querySelector('input[name="q1"]:checked');
    if (!chosen) {
      quizFeedback.textContent = "Pilih salah satu jawaban terlebih dahulu.";
      quizFeedback.className = "quiz-feedback bad";
      return;
    }
    if (chosen.value === "b") {
      quizFeedback.textContent = "Benar. Getaran berasal dari pelepasan energi elastis yang merambat sebagai gelombang seismik.";
      quizFeedback.className = "quiz-feedback ok";
    } else {
      quizFeedback.textContent = "Belum tepat. Ingat: sumber utamanya adalah pelepasan energi di sesar.";
      quizFeedback.className = "quiz-feedback bad";
    }
  });

  /* ---------- Animation loop ---------- */
  let last = performance.now();

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    mechTime += 1;
    faultAnim += dt;

    drawMechanism(mechTime);
    drawFault(faultAnim);
    updateSim(dt);
    if (sim.slip > 0 || sim.quakeFlash > 0 || sim.running) {
      // keep visual updates smooth while animating
    }
    drawSim();

    requestAnimationFrame(frame);
  }

  setStep(0);
  setFault("normal");
  resetSim();
  requestAnimationFrame(frame);
})();
