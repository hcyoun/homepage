(() => {
  const root = document.documentElement;
  root.classList.add("js");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Theme ---------- */
  const themeBtn = document.getElementById("theme-toggle");
  const isDark = () =>
    root.dataset.theme
      ? root.dataset.theme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
  themeBtn.addEventListener("click", () => {
    const next = isDark() ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("dw-theme", next); } catch (e) {}
  });

  /* ---------- Mobile menu ---------- */
  const menuBtn = document.getElementById("menu-toggle");
  const links = document.querySelector(".nav-links");
  menuBtn.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  links.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      links.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
    }
  });

  /* ---------- Sticky nav border ---------- */
  const nav = document.querySelector(".nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Copy to clipboard ---------- */
  const toast = document.getElementById("toast");
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1600);
  };
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("클립보드에 복사했습니다");
    } catch (e) {
      showToast("복사하지 못했습니다");
    }
  };
  document.querySelectorAll("[data-copy]").forEach((el) =>
    el.addEventListener("click", () => copy(el.dataset.copy))
  );
  document.querySelectorAll(".copyable").forEach((pre) => {
    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.type = "button";
    btn.textContent = "복사";
    btn.addEventListener("click", () => copy(pre.querySelector("code").innerText.trim()));
    pre.appendChild(btn);
  });

  /* ---------- Install tabs ---------- */
  const tabs = document.querySelectorAll('[role="tab"]');
  tabs.forEach((tab) =>
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
      document.querySelectorAll(".tab-panel").forEach((p) => {
        p.hidden = p.dataset.panel !== tab.dataset.tab;
      });
    })
  );

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        }),
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ---------- Terminal demo ---------- */
  const term = document.getElementById("term");
  const script = [
    { cmd: "driftwatch snapshot ./prod -o baseline.json" },
    { out: '<span class="c-dim">Saved 142 keys from /srv/prod → baseline.json</span>' },
    { out: "" },
    { cmd: "driftwatch diff ./staging baseline.json" },
    { out: "" },
    { out: '<span class="c-b">config/app.json</span>' },
    { out: '<span class="c-y">  ~ db.pool: 10 → 50</span>' },
    { out: '<span class="c-y">  ~ cache.ttl: 300 → 60</span>' },
    { out: '<span class="c-r">  - debug: True</span>' },
    { out: '<span class="c-g">  + replicas: 3</span>' },
    { out: '<span class="c-b">.env.production</span>' },
    { out: '<span class="c-y">  ~ DB_PASSWORD: \'••••••\' → \'••••••\'</span>' },
    { out: "" },
    { out: '<span class="c-r">✖ Drift detected: 1 added, 1 removed, 3 changed</span>' },
  ];
  const prompt = '<span class="c-p">$</span> ';
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const renderStatic = () => {
    term.innerHTML = script
      .map((s) => (s.cmd ? prompt + s.cmd : s.out))
      .join("\n");
  };

  const play = async () => {
    while (true) {
      let html = "";
      for (const step of script) {
        if (step.cmd) {
          html += prompt;
          for (const ch of step.cmd) {
            html += ch;
            term.innerHTML = html + '<span class="cursor"></span>';
            await sleep(28 + Math.random() * 40);
          }
          await sleep(350);
        } else {
          await sleep(90);
        }
        html += (step.cmd ? "" : step.out) + "\n";
        term.innerHTML = html + '<span class="cursor"></span>';
      }
      await sleep(4500);
    }
  };

  if (reduceMotion) renderStatic();
  else play();
})();
