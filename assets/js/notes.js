(() => {
  const KEY = "tb-notes";
  const $ = (id) => document.getElementById(id);
  const layout = document.querySelector(".notes-layout");
  const listEl = $("note-list");
  const titleEl = $("title");
  const bodyEl = $("body");

  let notes = store.get(KEY, null);
  if (!notes) {
    notes = [{
      id: crypto.randomUUID(),
      title: "툴박스에 오신 것을 환영해요 👋",
      body: "이 노트는 예시입니다.\n\n• 왼쪽 위 ‘새 노트’로 메모를 추가하세요.\n• 입력하면 바로 자동 저장됩니다.\n• 📌 고정한 노트는 목록 맨 위에 보여요.\n• 내보내기로 .txt 파일을 받을 수 있어요.",
      pinned: true,
      updated: Date.now(),
    }];
    store.set(KEY, notes);
  }
  let activeId = null;
  let query = "";
  let saveTimer;

  const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const fmtTime = (t) => new Date(t).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const active = () => notes.find((n) => n.id === activeId);
  const persist = () => store.set(KEY, notes);

  function renderList() {
    const q = query.trim().toLowerCase();
    const shown = notes
      .filter((n) => !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q))
      .sort((a, b) => (b.pinned - a.pinned) || (b.updated - a.updated));

    if (!shown.length) {
      listEl.innerHTML = `<li class="list-empty">${q ? "검색 결과가 없어요." : "노트가 없어요."}</li>`;
      return;
    }
    listEl.innerHTML = shown.map((n) => `
      <li>
        <button class="note-item ${n.id === activeId ? "active" : ""}" data-id="${n.id}">
          <strong>${n.pinned ? "📌 " : ""}${escapeHtml(n.title || "제목 없음")}</strong>
          <span class="preview">${escapeHtml(n.body.split("\n").find((l) => l.trim()) || "내용 없음")}</span>
          <time>${fmtTime(n.updated)}</time>
        </button>
      </li>`).join("");
  }

  function renderEditor() {
    const note = active();
    $("editor-empty").hidden = !!note;
    $("editor-body").hidden = !note;
    layout.classList.toggle("editing", !!note);
    if (!note) return;
    titleEl.value = note.title;
    bodyEl.value = note.body;
    $("pin-btn").textContent = note.pinned ? "📌 고정 해제" : "📌 고정";
    renderMeta();
  }

  function renderMeta() {
    const note = active();
    if (!note) return;
    const chars = note.body.length;
    const words = note.body.trim() ? note.body.trim().split(/\s+/).length : 0;
    $("meta").textContent = `${chars.toLocaleString()}자 · ${words.toLocaleString()}단어 · 마지막 수정 ${fmtTime(note.updated)}`;
  }

  function select(id) {
    activeId = id;
    renderList();
    renderEditor();
  }

  function createNote() {
    const note = { id: crypto.randomUUID(), title: "", body: "", pinned: false, updated: Date.now() };
    notes.push(note);
    persist();
    query = "";
    $("search").value = "";
    select(note.id);
    titleEl.focus();
  }

  function onEdit() {
    const note = active();
    if (!note) return;
    note.title = titleEl.value;
    note.body = bodyEl.value;
    note.updated = Date.now();
    $("saved").textContent = "저장 중…";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      persist();
      $("saved").textContent = "저장됨";
      renderList();
    }, 400);
    renderMeta();
  }

  listEl.addEventListener("click", (e) => {
    const item = e.target.closest(".note-item");
    if (item) select(item.dataset.id);
  });
  $("new-note").addEventListener("click", createNote);
  $("search").addEventListener("input", (e) => { query = e.target.value; renderList(); });
  titleEl.addEventListener("input", onEdit);
  bodyEl.addEventListener("input", onEdit);
  titleEl.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); bodyEl.focus(); } });

  $("pin-btn").addEventListener("click", () => {
    const note = active();
    note.pinned = !note.pinned;
    persist();
    renderList();
    renderEditor();
  });

  $("delete-btn").addEventListener("click", () => {
    const note = active();
    if (!confirm(`‘${note.title || "제목 없음"}’ 노트를 삭제할까요?`)) return;
    notes = notes.filter((n) => n.id !== note.id);
    persist();
    select(null);
    showToast("노트를 삭제했어요");
  });

  $("download-btn").addEventListener("click", () => {
    const note = active();
    const name = (note.title || "note").replace(/[\\/:*?"<>|]/g, "_");
    const blob = new Blob([`${note.title}\n\n${note.body}`], { type: "text/plain;charset=utf-8" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `${name}.txt` });
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $("back-btn").addEventListener("click", () => select(null));

  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.key.toLowerCase() === "n") { e.preventDefault(); createNote(); }
  });

  renderList();
  renderEditor();
})();
