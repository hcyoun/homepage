(() => {
  const $ = (id) => document.getElementById(id);
  const SETS = {
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lower: "abcdefghijklmnopqrstuvwxyz",
    digits: "0123456789",
    symbols: "!@#$%^&*()-_=+[]{};:,.?/~",
  };
  const AMBIGUOUS = /[0Ool1I]/g;
  let current = "";

  /* Unbiased random integer in [0, max) via rejection sampling. */
  function randInt(max) {
    const limit = Math.floor(0x100000000 / max) * max;
    const buf = new Uint32Array(1);
    do crypto.getRandomValues(buf); while (buf[0] >= limit);
    return buf[0] % max;
  }

  function activeSets() {
    const noAmb = $("no-ambiguous").checked;
    return Object.keys(SETS)
      .filter((k) => $(k).checked)
      .map((k) => (noAmb ? SETS[k].replace(AMBIGUOUS, "") : SETS[k]));
  }

  function generate() {
    const sets = activeSets();
    if (!sets.length) return "";
    const length = +$("length").value;
    const pool = sets.join("");
    // Guarantee at least one character from each selected set, then shuffle.
    const chars = sets.map((s) => s[randInt(s.length)]);
    while (chars.length < length) chars.push(pool[randInt(pool.length)]);
    for (let i = chars.length - 1; i > 0; i--) {
      const j = randInt(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.slice(0, length).join("");
  }

  function strength() {
    const pool = activeSets().join("").length;
    const bits = pool ? +$("length").value * Math.log2(pool) : 0;
    if (bits < 40) return { bits, label: "약함", color: "var(--danger)", pct: 20 };
    if (bits < 60) return { bits, label: "보통", color: "#f59e0b", pct: 45 };
    if (bits < 90) return { bits, label: "강함", color: "#22c55e", pct: 75 };
    return { bits, label: "매우 강함", color: "var(--accent-2)", pct: 100 };
  }

  const highlight = (pw) =>
    pw.replace(/[\s\S]/g, (c) => {
      const esc = c.replace(/[&<>]/g, (x) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[x]);
      return /\d/.test(c) ? `<span class="d">${esc}</span>` : /[A-Za-z]/.test(c) ? esc : `<span class="s">${esc}</span>`;
    });

  function render() {
    $("length-value").textContent = $("length").value;
    current = generate();
    $("pw").innerHTML = current ? highlight(current) : '<span style="color:var(--muted)">문자 종류를 하나 이상 선택하세요</span>';
    $("copy").disabled = !current;
    const s = strength();
    $("meter-bar").style.width = `${s.pct}%`;
    $("meter-bar").style.background = s.color;
    $("strength-label").textContent = current ? `${s.label} · 약 ${Math.round(s.bits)}비트` : "";
    $("strength-label").style.color = s.color;
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast("클립보드에 복사했어요");
    } catch (e) {
      showToast("복사하지 못했어요");
    }
  }

  ["length", "upper", "lower", "digits", "symbols", "no-ambiguous"].forEach((id) =>
    $(id).addEventListener("input", render)
  );
  $("regen").addEventListener("click", render);
  $("copy").addEventListener("click", () => copy(current));

  document.querySelectorAll("[data-bulk]").forEach((btn) => btn.addEventListener("click", () => {
    const list = Array.from({ length: +btn.dataset.bulk }, generate).filter(Boolean);
    $("bulk-list").innerHTML = list
      .map((pw) => `<li><span>${pw.replace(/[&<>]/g, (x) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[x])}</span><button data-pw="${encodeURIComponent(pw)}">복사</button></li>`)
      .join("");
  }));
  $("bulk-list").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-pw]");
    if (btn) copy(decodeURIComponent(btn.dataset.pw));
  });

  render();
})();
