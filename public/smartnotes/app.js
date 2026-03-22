const STORAGE_KEY = "smartnotes.v1";

const state = loadState();

const elements = {
  noteList: document.getElementById("note-list"),
  searchInput: document.getElementById("search-input"),
  tagFilters: document.getElementById("tag-filters"),
  filteredCount: document.getElementById("filtered-count"),
  clearFilter: document.getElementById("clear-filter"),
  newNote: document.getElementById("new-note"),
  seedDemo: document.getElementById("seed-demo"),
  exportJson: document.getElementById("export-json"),
  form: document.getElementById("editor-form"),
  title: document.getElementById("note-title"),
  tags: document.getElementById("note-tags"),
  content: document.getElementById("note-content"),
  heading: document.getElementById("editor-heading"),
  previewBody: document.getElementById("preview-body"),
  previewTags: document.getElementById("preview-tags"),
  updatedAt: document.getElementById("updated-at"),
  saveState: document.getElementById("save-state"),
  togglePin: document.getElementById("toggle-pin"),
  duplicateNote: document.getElementById("duplicate-note"),
  deleteNote: document.getElementById("delete-note"),
  statTotal: document.getElementById("stat-total"),
  statPinned: document.getElementById("stat-pinned"),
  statTags: document.getElementById("stat-tags"),
};

init();

function init() {
  bindEvents();
  if (!state.notes.length) {
    createEmptyNote();
  }
  render();
}

function bindEvents() {
  elements.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    render();
  });

  elements.clearFilter.addEventListener("click", () => {
    state.search = "";
    state.activeTag = "";
    elements.searchInput.value = "";
    render();
  });

  elements.newNote.addEventListener("click", () => {
    createEmptyNote();
    render();
  });

  elements.seedDemo.addEventListener("click", () => {
    state.notes = demoNotes();
    state.selectedId = state.notes[0].id;
    saveState();
    render();
  });

  elements.exportJson.addEventListener("click", exportNotes);

  elements.noteList.addEventListener("click", (event) => {
    const card = event.target.closest("[data-note-id]");
    if (!card) return;
    state.selectedId = card.dataset.noteId;
    render();
  });

  elements.togglePin.addEventListener("click", () => {
    const note = selectedNote();
    if (!note) return;
    note.pinned = !note.pinned;
    note.updatedAt = new Date().toISOString();
    saveState();
    render();
  });

  elements.duplicateNote.addEventListener("click", () => {
    const note = selectedNote();
    if (!note) return;
    const copy = {
      ...note,
      id: crypto.randomUUID(),
      title: `${note.title || "Untitled"} Copy`,
      updatedAt: new Date().toISOString(),
    };
    state.notes.unshift(copy);
    state.selectedId = copy.id;
    saveState();
    render();
  });

  elements.deleteNote.addEventListener("click", () => {
    if (!state.notes.length) return;
    state.notes = state.notes.filter((note) => note.id !== state.selectedId);
    if (!state.notes.length) createEmptyNote();
    else state.selectedId = sortedNotes(filteredNotes())[0]?.id || state.notes[0].id;
    saveState();
    render();
  });

  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveCurrentNote();
  });
}

function loadState() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  return {
    notes: saved.notes || [],
    selectedId: saved.selectedId || "",
    search: "",
    activeTag: "",
  };
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      notes: state.notes,
      selectedId: state.selectedId,
    })
  );
}

function selectedNote() {
  return state.notes.find((note) => note.id === state.selectedId);
}

function createEmptyNote() {
  const note = {
    id: crypto.randomUUID(),
    title: "",
    content: "",
    tags: [],
    pinned: false,
    updatedAt: new Date().toISOString(),
  };
  state.notes.unshift(note);
  state.selectedId = note.id;
  saveState();
}

function saveCurrentNote() {
  const note = selectedNote();
  if (!note) return;
  note.title = elements.title.value.trim();
  note.content = elements.content.value.trim();
  note.tags = parseTags(elements.tags.value);
  note.updatedAt = new Date().toISOString();
  elements.saveState.textContent = "Saved just now.";
  saveState();
  render();
}

function filteredNotes() {
  return state.notes.filter((note) => {
    const haystack = `${note.title} ${note.content} ${note.tags.join(" ")}`.toLowerCase();
    const matchesSearch = !state.search || haystack.includes(state.search);
    const matchesTag = !state.activeTag || note.tags.includes(state.activeTag);
    return matchesSearch && matchesTag;
  });
}

function sortedNotes(notes) {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });
}

function allTags() {
  return [...new Set(state.notes.flatMap((note) => note.tags))].sort();
}

function render() {
  const visibleNotes = sortedNotes(filteredNotes());
  const note = selectedNote();
  if (!note && state.notes.length) {
    state.selectedId = state.notes[0].id;
  }
  renderTagFilters();
  renderNoteList(visibleNotes);
  renderEditor(selectedNote());
  renderPreview(selectedNote());
  renderStats();
}

function renderTagFilters() {
  const tags = allTags();
  elements.tagFilters.innerHTML = tags.length
    ? tags
        .map(
          (tag) => `
            <button class="tag-chip ${state.activeTag === tag ? "active" : ""}" data-tag="${tag}">
              #${tag}
            </button>
          `
        )
        .join("")
    : `<span class="empty-state">No tags yet.</span>`;

  elements.tagFilters.querySelectorAll("[data-tag]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTag = state.activeTag === button.dataset.tag ? "" : button.dataset.tag;
      render();
    });
  });
}

function renderNoteList(notes) {
  elements.filteredCount.textContent = `${notes.length} shown`;
  elements.noteList.innerHTML = notes.length
    ? notes
        .map(
          (note) => `
            <article class="note-card ${note.id === state.selectedId ? "active" : ""}" data-note-id="${note.id}">
              <div class="note-title-row">
                <strong>${escapeHtml(note.title || "Untitled note")}</strong>
                ${note.pinned ? `<span class="pin-badge">📌</span>` : ""}
              </div>
              <p class="note-snippet">${escapeHtml(snippet(note.content || "No content yet."))}</p>
              <div class="note-meta">${formatMeta(note)}</div>
            </article>
          `
        )
        .join("")
    : `<p class="empty-state">No notes match the current search.</p>`;
}

function renderEditor(note) {
  if (!note) return;
  elements.heading.textContent = note.title || "Create a note";
  elements.title.value = note.title || "";
  elements.tags.value = note.tags.join(", ");
  elements.content.value = note.content || "";
  elements.togglePin.classList.toggle("active", note.pinned);
}

function renderPreview(note) {
  if (!note) return;
  elements.updatedAt.textContent = `Updated ${new Date(note.updatedAt).toLocaleString()}`;
  elements.previewTags.innerHTML = note.tags.length
    ? note.tags.map((tag) => `<span class="tag-chip">#${escapeHtml(tag)}</span>`).join("")
    : "";
  const paragraphs = (note.content || "")
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`)
    .join("");
  elements.previewBody.innerHTML = `
    <h3>${escapeHtml(note.title || "Untitled note")}</h3>
    ${paragraphs || "<p>Start writing to see a richer preview here.</p>"}
  `;
}

function renderStats() {
  elements.statTotal.textContent = state.notes.length;
  elements.statPinned.textContent = state.notes.filter((note) => note.pinned).length;
  elements.statTags.textContent = allTags().length;
}

function exportNotes() {
  const blob = new Blob([JSON.stringify(state.notes, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "smartnotes-export.json";
  link.click();
}

function demoNotes() {
  const now = new Date().toISOString();
  return [
    {
      id: crypto.randomUUID(),
      title: "Portfolio ideas",
      content:
        "Add a project spotlight section for shipped work.\n\nInclude stronger visual hierarchy for featured apps like BudgetBuddy and SmartNotes.",
      tags: ["portfolio", "ideas", "frontend"],
      pinned: true,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      title: "Interview prep checklist",
      content:
        "Review JavaScript fundamentals.\nPractice explaining projects clearly.\nPrepare examples for teamwork, debugging, and ownership.",
      tags: ["career", "prep"],
      pinned: false,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      title: "Study notes",
      content:
        "Focus this week on data structures review and system design basics.\n\nFinish one coding problem per day.",
      tags: ["school", "cs"],
      pinned: false,
      updatedAt: now,
    },
  ];
}

function parseTags(value) {
  return [...new Set(value.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}

function snippet(text) {
  return text.length > 110 ? `${text.slice(0, 110)}...` : text;
}

function formatMeta(note) {
  const parts = [];
  if (note.tags.length) parts.push(note.tags.map((tag) => `#${tag}`).join(" "));
  parts.push(new Date(note.updatedAt).toLocaleDateString());
  return parts.join(" • ");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
