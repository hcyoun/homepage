(() => {
  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(Math.floor(n)).padStart(2, "0");
  const mmss = (sec) => {
    sec = Math.max(0, Math.ceil(sec));
    const h = Math.floor(sec / 3600);
    return (h ? `${h}:${pad((sec % 3600) / 60)}` : pad(sec / 60)) + `:${pad(sec % 60)}`;
  };

  /* ---------- Beep (Web Audio, no files) ---------- */
  let audioCtx;
  function beep(times = 3) {
    try {
      audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
      for (let i = 0; i < times; i++) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const t = audioCtx.currentTime + i * 0.35;
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.26);
      }
    } catch (e) {}
  }

  /* ---------- Tabs ---------- */
  const tabs = document.querySelectorAll("[data-mode]");
  tabs.forEach((tab) => tab.addEventListener("click", () => {
    tabs.forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
    document.querySelectorAll("[data-panel]").forEach((p) => { p.hidden = p.dataset.panel !== tab.dataset.mode; });
  }));

  /* ---------- Stopwatch ---------- */
  const sw = { start: 0, elapsed: 0, raf: 0, laps: [] };
  const swTime = $("sw-time");
  const swFmt = (ms) => `${pad(ms / 60000)}:${pad((ms / 1000) % 60)}<small>.${pad((ms / 10) % 100)}</small>`;
  const swNow = () => sw.elapsed + (sw.raf ? performance.now() - sw.start : 0);

  function swTick() {
    swTime.innerHTML = swFmt(swNow());
    sw.raf = requestAnimationFrame(swTick);
  }
  function swRenderLaps() {
    const splits = sw.laps.map((t, i) => t - (sw.laps[i - 1] || 0));
    const best = Math.min(...splits), worst = Math.max(...splits);
    $("sw-laps").innerHTML = splits
      .map((s, i) => {
        const cls = splits.length > 2 && s === best ? "best" : splits.length > 2 && s === worst ? "worst" : "";
        return `<li class="${cls}"><span>랩 ${i + 1}</span><span>${swFmt(s).replace(/<\/?small>/g, "")}</span></li>`;
      })
      .reverse().join("");
  }
  $("sw-start").addEventListener("click", (e) => {
    if (sw.raf) {
      sw.elapsed = swNow();
      cancelAnimationFrame(sw.raf);
      sw.raf = 0;
      e.target.textContent = "계속";
    } else {
      sw.start = performance.now();
      swTick();
      e.target.textContent = "정지";
    }
    $("sw-lap").disabled = !sw.raf;
    $("sw-reset").disabled = false;
  });
  $("sw-lap").addEventListener("click", () => { sw.laps.push(swNow()); swRenderLaps(); });
  $("sw-reset").addEventListener("click", () => {
    cancelAnimationFrame(sw.raf);
    Object.assign(sw, { start: 0, elapsed: 0, raf: 0, laps: [] });
    swTime.innerHTML = swFmt(0);
    $("sw-laps").innerHTML = "";
    $("sw-start").textContent = "시작";
    $("sw-lap").disabled = $("sw-reset").disabled = true;
  });

  /* ---------- Countdown ---------- */
  const CIRC = 2 * Math.PI * 54;
  const cd = { total: 300, endAt: 0, remaining: 300, interval: 0 };
  const cdWrap = document.querySelector(".ring-wrap");

  function cdRender() {
    $("cd-time").textContent = mmss(cd.remaining);
    $("cd-ring").style.strokeDashoffset = String(CIRC * (1 - cd.remaining / cd.total));
  }
  function cdSetFromInputs() {
    const sec = Math.min(999, +$("cd-min").value || 0) * 60 + Math.min(59, +$("cd-sec").value || 0);
    cd.total = cd.remaining = Math.max(1, sec);
    cdWrap.classList.remove("done");
    cdRender();
  }
  function cdStop(label) {
    clearInterval(cd.interval);
    cd.interval = 0;
    $("cd-start").textContent = label;
    $("cd-inputs").classList.remove("disabled");
  }
  $("cd-min").addEventListener("input", () => !cd.interval && cdSetFromInputs());
  $("cd-sec").addEventListener("input", () => !cd.interval && cdSetFromInputs());
  document.querySelectorAll(".chip").forEach((chip) => chip.addEventListener("click", () => {
    if (cd.interval) cdStop("시작");
    $("cd-min").value = Math.floor(chip.dataset.sec / 60);
    $("cd-sec").value = chip.dataset.sec % 60;
    cdSetFromInputs();
  }));
  $("cd-start").addEventListener("click", () => {
    if (cd.interval) { cdStop("계속"); return; }
    if (cd.remaining <= 0) cdSetFromInputs();
    cdWrap.classList.remove("done");
    cd.endAt = Date.now() + cd.remaining * 1000;
    $("cd-start").textContent = "일시정지";
    $("cd-inputs").classList.add("disabled");
    cd.interval = setInterval(() => {
      cd.remaining = (cd.endAt - Date.now()) / 1000;
      if (cd.remaining <= 0) {
        cd.remaining = 0;
        cdStop("다시 시작");
        cdWrap.classList.add("done");
        beep();
        showToast("⏰ 시간이 다 됐어요!");
      }
      cdRender();
    }, 200);
  });
  $("cd-reset").addEventListener("click", () => { cdStop("시작"); cdSetFromInputs(); });
  cdRender();
  $("cd-ring").style.strokeDasharray = String(CIRC);

  /* ---------- Pomodoro ---------- */
  const PHASES = { focus: { sec: 25 * 60, label: "🍅 집중 시간" }, short: { sec: 5 * 60, label: "☕ 짧은 휴식" }, long: { sec: 15 * 60, label: "🌿 긴 휴식" } };
  const pomo = { phase: "focus", remaining: PHASES.focus.sec, done: 0, endAt: 0, interval: 0 };

  function pomoRender() {
    $("pomo-time").textContent = mmss(pomo.remaining);
    $("pomo-phase").textContent = PHASES[pomo.phase].label;
    $("pomo-phase").classList.toggle("break", pomo.phase !== "focus");
    const filled = pomo.phase === "long" ? 4 : pomo.done % 4;
    $("pomo-dots").innerHTML = Array.from({ length: 4 }, (_, i) => `<span class="${i < filled ? "on" : ""}"></span>`).join("");
    document.title = pomo.interval ? `${mmss(pomo.remaining)} ${PHASES[pomo.phase].label} — 툴박스` : "타이머 — 툴박스";
  }
  function pomoPause() {
    clearInterval(pomo.interval);
    pomo.interval = 0;
    $("pomo-start").textContent = "계속";
  }
  function pomoNext() {
    if (pomo.phase === "focus") {
      pomo.done++;
      pomo.phase = pomo.done % 4 === 0 ? "long" : "short";
    } else {
      pomo.phase = "focus";
    }
    pomo.remaining = PHASES[pomo.phase].sec;
    pomo.endAt = Date.now() + pomo.remaining * 1000;
  }
  $("pomo-start").addEventListener("click", () => {
    if (pomo.interval) { pomoPause(); pomoRender(); return; }
    pomo.endAt = Date.now() + pomo.remaining * 1000;
    $("pomo-start").textContent = "일시정지";
    pomo.interval = setInterval(() => {
      pomo.remaining = (pomo.endAt - Date.now()) / 1000;
      if (pomo.remaining <= 0) {
        beep(2);
        pomoNext();
        showToast(`${PHASES[pomo.phase].label} 시작!`);
      }
      pomoRender();
    }, 250);
    pomoRender();
  });
  $("pomo-skip").addEventListener("click", () => { pomoNext(); pomoRender(); });
  $("pomo-reset").addEventListener("click", () => {
    clearInterval(pomo.interval);
    Object.assign(pomo, { phase: "focus", remaining: PHASES.focus.sec, done: 0, interval: 0 });
    $("pomo-start").textContent = "시작";
    pomoRender();
  });
  pomoRender();
})();
