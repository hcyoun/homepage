(() => {
  const $ = (id) => document.getElementById(id);

  /* Each unit converts to/from the category's base unit. */
  const linear = (factor) => ({ toBase: (v) => v * factor, fromBase: (v) => v / factor });
  const CATEGORIES = {
    length: {
      label: "📏 길이",
      units: {
        mm: ["밀리미터 (mm)", linear(0.001)], cm: ["센티미터 (cm)", linear(0.01)], m: ["미터 (m)", linear(1)],
        km: ["킬로미터 (km)", linear(1000)], in: ["인치 (in)", linear(0.0254)], ft: ["피트 (ft)", linear(0.3048)],
        yd: ["야드 (yd)", linear(0.9144)], mi: ["마일 (mi)", linear(1609.344)], ja: ["자 (尺)", linear(10 / 33)],
      },
      defaults: ["cm", "in"],
    },
    weight: {
      label: "⚖️ 무게",
      units: {
        mg: ["밀리그램 (mg)", linear(0.001)], g: ["그램 (g)", linear(1)], kg: ["킬로그램 (kg)", linear(1000)],
        t: ["톤 (t)", linear(1e6)], oz: ["온스 (oz)", linear(28.349523125)], lb: ["파운드 (lb)", linear(453.59237)],
        geun: ["근 (600g)", linear(600)], don: ["돈 (3.75g)", linear(3.75)],
      },
      defaults: ["kg", "lb"],
    },
    temperature: {
      label: "🌡️ 온도",
      units: {
        c: ["섭씨 (°C)", { toBase: (v) => v, fromBase: (v) => v }],
        f: ["화씨 (°F)", { toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => v * 9 / 5 + 32 }],
        k: ["켈빈 (K)", { toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 }],
      },
      defaults: ["c", "f"],
    },
    area: {
      label: "🏠 넓이",
      units: {
        m2: ["제곱미터 (m²)", linear(1)], pyeong: ["평", linear(400 / 121)], km2: ["제곱킬로미터 (km²)", linear(1e6)],
        ha: ["헥타르 (ha)", linear(1e4)], ft2: ["제곱피트 (ft²)", linear(0.09290304)], acre: ["에이커 (ac)", linear(4046.8564224)],
      },
      defaults: ["pyeong", "m2"],
    },
    data: {
      label: "💾 데이터",
      units: {
        b: ["바이트 (B)", linear(1)], kb: ["킬로바이트 (KB)", linear(1024)], mb: ["메가바이트 (MB)", linear(1024 ** 2)],
        gb: ["기가바이트 (GB)", linear(1024 ** 3)], tb: ["테라바이트 (TB)", linear(1024 ** 4)], bit: ["비트 (bit)", linear(1 / 8)],
      },
      defaults: ["gb", "mb"],
    },
    speed: {
      label: "🚗 속도",
      units: {
        ms: ["미터/초 (m/s)", linear(1)], kmh: ["킬로미터/시 (km/h)", linear(1 / 3.6)],
        mph: ["마일/시 (mph)", linear(0.44704)], kn: ["노트 (kn)", linear(1852 / 3600)],
      },
      defaults: ["kmh", "mph"],
    },
  };

  let cat = store.get("tb-conv-cat", "length");
  if (!CATEGORIES[cat]) cat = "length";

  const fmt = (n) => {
    if (!Number.isFinite(n)) return "—";
    if (n !== 0 && (Math.abs(n) >= 1e12 || Math.abs(n) < 1e-6)) return n.toExponential(6);
    return n.toLocaleString("ko-KR", { maximumFractionDigits: 8 });
  };
  const convert = (v, from, to) => {
    const u = CATEGORIES[cat].units;
    return u[to][1].fromBase(u[from][1].toBase(v));
  };

  function renderCategories() {
    $("categories").innerHTML = Object.entries(CATEGORIES)
      .map(([key, c]) => `<button role="tab" data-cat="${key}" aria-selected="${key === cat}">${c.label}</button>`)
      .join("");
  }

  function fillSelects() {
    const { units, defaults } = CATEGORIES[cat];
    const options = Object.entries(units).map(([k, [name]]) => `<option value="${k}">${name}</option>`).join("");
    $("from-unit").innerHTML = options;
    $("to-unit").innerHTML = options;
    [$("from-unit").value, $("to-unit").value] = defaults;
  }

  function update() {
    const from = $("from-unit").value;
    const to = $("to-unit").value;
    const raw = $("from-value").value;
    const v = parseFloat(raw);
    const units = CATEGORIES[cat].units;

    if (raw === "" || Number.isNaN(v)) {
      $("to-value").value = "";
      $("formula").textContent = "";
      $("all-table").innerHTML = "";
      return;
    }
    $("to-value").value = fmt(convert(v, from, to));
    $("formula").textContent = `${fmt(v)} ${units[from][0]} = ${fmt(convert(v, from, to))} ${units[to][0]}`;
    $("all-table").innerHTML = Object.entries(units)
      .map(([k, [name]]) => `<tr class="${k === to ? "current" : ""}"><td>${name}</td><td>${fmt(convert(v, from, k))}</td></tr>`)
      .join("");
  }

  $("categories").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    cat = btn.dataset.cat;
    store.set("tb-conv-cat", cat);
    renderCategories();
    fillSelects();
    update();
  });
  $("from-value").addEventListener("input", update);
  $("from-unit").addEventListener("change", update);
  $("to-unit").addEventListener("change", update);
  $("swap").addEventListener("click", () => {
    const from = $("from-unit").value;
    const result = convert(parseFloat($("from-value").value), from, $("to-unit").value);
    $("from-unit").value = $("to-unit").value;
    $("to-unit").value = from;
    if (Number.isFinite(result)) $("from-value").value = parseFloat(result.toPrecision(10));
    update();
  });

  renderCategories();
  fillSelects();
  update();
})();
