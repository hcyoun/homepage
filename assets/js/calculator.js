(() => {
  const exprEl = document.getElementById("expr");
  const resultEl = document.getElementById("result");
  const historyEl = document.getElementById("history");
  const OPS = "+−×÷";

  let expr = "";
  let justEvaluated = false;
  let history = store.get("tb-calc-history", []);

  /* ---------- Parser (recursive descent, no eval) ---------- */
  function evaluate(source) {
    const open = (source.match(/\(/g) || []).length - (source.match(/\)/g) || []).length;
    const text = source + ")".repeat(Math.max(0, open));
    const tokens = text.match(/\d*\.?\d+|[()+−×÷%]/g) || [];
    if (tokens.join("") !== text) throw new Error("잘못된 입력");
    let i = 0;
    const peek = () => tokens[i];
    const next = () => tokens[i++];

    function expression() {
      let value = term();
      while (peek() === "+" || peek() === "−") value = next() === "+" ? value + term() : value - term();
      return value;
    }
    function term() {
      let value = factor();
      while (peek() === "×" || peek() === "÷") {
        if (next() === "×") value *= factor();
        else {
          const d = factor();
          if (d === 0) throw new Error("0으로 나눌 수 없어요");
          value /= d;
        }
      }
      return value;
    }
    function factor() {
      if (peek() === "−") { next(); return -factor(); }
      if (peek() === "+") { next(); return factor(); }
      let value = primary();
      while (peek() === "%") { next(); value /= 100; }
      return value;
    }
    function primary() {
      const tok = next();
      if (tok === "(") {
        const value = expression();
        if (next() !== ")") throw new Error("괄호가 맞지 않아요");
        return value;
      }
      if (tok !== undefined && /\d/.test(tok)) return parseFloat(tok);
      throw new Error("식이 완성되지 않았어요");
    }

    const value = expression();
    if (i !== tokens.length) throw new Error("식이 올바르지 않아요");
    if (!Number.isFinite(value)) throw new Error("계산할 수 없어요");
    return parseFloat(value.toPrecision(12));
  }

  const format = (n) =>
    Math.abs(n) >= 1e15 || (n !== 0 && Math.abs(n) < 1e-9)
      ? n.toExponential(6)
      : n.toLocaleString("ko-KR", { maximumFractionDigits: 10 });

  /* ---------- Rendering ---------- */
  function render(final = false) {
    exprEl.textContent = expr || " ";
    resultEl.classList.remove("error");
    if (!expr) { resultEl.textContent = "0"; return; }
    try {
      resultEl.textContent = format(evaluate(expr));
    } catch (err) {
      if (final) {
        resultEl.textContent = err.message;
        resultEl.classList.add("error");
      }
    }
  }

  function renderHistory() {
    if (!history.length) {
      historyEl.innerHTML = '<li class="history-empty">아직 계산 기록이 없어요.</li>';
      return;
    }
    historyEl.innerHTML = history
      .map((h, idx) => `<li><button data-idx="${idx}"><span class="h-expr">${h.expr} =</span><span class="h-res">${format(h.result)}</span></button></li>`)
      .join("");
  }

  /* ---------- Input ---------- */
  const lastChar = () => expr.slice(-1);
  const currentNumber = () => (expr.match(/\d*\.?\d*$/) || [""])[0];

  function input(v) {
    if (justEvaluated && /[\d.(]/.test(v)) expr = "";
    justEvaluated = false;

    if (OPS.includes(v)) {
      if (!expr && v !== "−") return;
      if (OPS.includes(lastChar())) expr = expr.slice(0, -1);
      if (lastChar() === "(" && v !== "−") return;
    } else if (v === ".") {
      if (currentNumber().includes(".")) return;
      if (!/\d/.test(lastChar())) v = "0.";
    } else if (v === ")") {
      const open = (expr.match(/\(/g) || []).length - (expr.match(/\)/g) || []).length;
      if (open <= 0 || OPS.includes(lastChar()) || lastChar() === "(") return;
    } else if (v === "%") {
      if (!/[\d)%]/.test(lastChar())) return;
    } else if (v === "(" || /\d/.test(v)) {
      if (v === "(" && /[\d)%]/.test(lastChar())) expr += "×";
      if (/\d/.test(v) && /[)%]/.test(lastChar())) expr += "×";
    }
    expr += v;
    render();
  }

  function action(name) {
    if (name === "clear") { expr = ""; justEvaluated = false; }
    if (name === "back") { expr = justEvaluated ? "" : expr.slice(0, -1); justEvaluated = false; }
    if (name === "negate") {
      const m = expr.match(/(\(−)?(\d*\.?\d+)$/);
      if (m) expr = expr.slice(0, m.index) + (m[1] ? m[2] : `(−${m[2]}`);
      justEvaluated = false;
    }
    if (name === "equals") {
      if (!expr) return;
      try {
        const result = evaluate(expr);
        history.unshift({ expr, result });
        history = history.slice(0, 30);
        store.set("tb-calc-history", history);
        renderHistory();
        exprEl.textContent = expr + " =";
        expr = String(result).replace("-", "−");
        resultEl.textContent = format(result);
        resultEl.classList.remove("error");
        justEvaluated = true;
      } catch (err) {
        render(true);
      }
      return;
    }
    render();
  }

  document.getElementById("keys").addEventListener("click", (e) => {
    const key = e.target.closest(".key");
    if (!key) return;
    key.dataset.action ? action(key.dataset.action) : input(key.dataset.value);
  });

  const KEYMAP = { "*": "×", "/": "÷", "-": "−", "+": "+", "(": "(", ")": ")", ".": ".", "%": "%" };
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    let handled = true;
    if (/^\d$/.test(e.key)) input(e.key);
    else if (KEYMAP[e.key]) input(KEYMAP[e.key]);
    else if (e.key === "Enter" || e.key === "=") action("equals");
    else if (e.key === "Backspace") action("back");
    else if (e.key === "Escape" || e.key === "Delete") action("clear");
    else handled = false;
    if (handled) e.preventDefault();
  });

  historyEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-idx]");
    if (!btn) return;
    expr = String(history[btn.dataset.idx].result).replace("-", "−");
    justEvaluated = true;
    render();
  });

  document.getElementById("clear-history").addEventListener("click", () => {
    history = [];
    store.set("tb-calc-history", history);
    renderHistory();
    showToast("기록을 비웠어요");
  });

  render();
  renderHistory();
})();
