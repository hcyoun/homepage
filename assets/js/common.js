/* Shared header, footer, theme and toast for every page. */
const TOOLS = [
  { id: "calculator", href: "calculator.html", icon: "🧮", name: "계산기", desc: "사칙연산과 계산 기록. 키보드로도 입력할 수 있어요." },
  { id: "notes", href: "notes.html", icon: "📝", name: "노트", desc: "브라우저에 자동 저장되는 메모장. 검색과 고정 기능 포함." },
  { id: "timer", href: "timer.html", icon: "⏱️", name: "타이머", desc: "스톱워치, 카운트다운, 뽀모도로를 한 곳에서." },
  { id: "converter", href: "converter.html", icon: "📏", name: "단위 변환", desc: "길이, 무게, 온도, 데이터 크기를 즉시 변환." },
  { id: "password", href: "password.html", icon: "🔐", name: "비밀번호 생성", desc: "안전한 난수로 강력한 비밀번호를 만들어요." },
];

(() => {
  const root = document.documentElement;
  const current = document.body.dataset.page;

  /* ---------- Header ---------- */
  const header = document.getElementById("site-header");
  header.className = "site-header";
  header.innerHTML = `
    <div class="container header-inner">
      <a class="brand" href="index.html"><span class="brand-logo">✦</span>툴박스</a>
      <nav class="main-nav" id="main-nav" aria-label="도구 메뉴">
        <a href="index.html" ${current === "home" ? 'aria-current="page"' : ""}>🏠 홈</a>
        ${TOOLS.map((t) => `<a href="${t.href}" ${current === t.id ? 'aria-current="page"' : ""}>${t.icon} ${t.name}</a>`).join("")}
      </nav>
      <div class="header-actions">
        <button class="icon-btn" id="theme-toggle" aria-label="테마 전환" title="테마 전환"></button>
        <button class="icon-btn menu-btn" id="menu-toggle" aria-label="메뉴 열기" aria-expanded="false">☰</button>
      </div>
    </div>`;

  const nav = document.getElementById("main-nav");
  const menuBtn = document.getElementById("menu-toggle");
  menuBtn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });

  /* ---------- Theme ---------- */
  const themeBtn = document.getElementById("theme-toggle");
  const isDark = () =>
    root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const paintThemeIcon = () => { themeBtn.textContent = isDark() ? "🌙" : "☀️"; };
  themeBtn.addEventListener("click", () => {
    root.dataset.theme = isDark() ? "light" : "dark";
    try { localStorage.setItem("tb-theme", root.dataset.theme); } catch (e) {}
    paintThemeIcon();
  });
  paintThemeIcon();

  /* ---------- Footer ---------- */
  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="container footer-inner">
      <span>© ${new Date().getFullYear()} 툴박스 · 모든 데이터는 이 브라우저에만 저장됩니다.</span>
      <a href="https://github.com/hcyoun/homepage" target="_blank" rel="noopener">GitHub</a>
    </div>`;
  document.body.appendChild(footer);

  /* ---------- Toast ---------- */
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  document.body.appendChild(toast);
  let timer;
  window.showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove("show"), 1600);
  };
})();

/* localStorage that never throws (private mode, blocked storage). */
window.store = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  },
};
