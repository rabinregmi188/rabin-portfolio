const STORAGE_KEY = "smartnotes.v1";
const THEME_KEY = "smartnotes.theme";

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
  themeToggle: document.getElementById("theme-toggle"),
  showShortcuts: document.getElementById("show-shortcuts"),
  shortcutsDialog: document.getElementById("shortcuts-dialog"),
  closeShortcuts: document.getElementById("close-shortcuts"),
  form: document.getElementById("editor-form"),
  title: document.getElementById("note-title"),
  tags: document.getElementById("note-tags"),
  content: document.getElementById("note-content"),
  heading: document.getElementById("editor-heading"),
  previewBody: document.getElementById("preview-body"),
  previewTags: document.getElementById("preview-tags"),
  updatedAt: document.getElementById("updated-at"),
  saveState: document.getElementById("save-state"),
  saveLabel: document.getElementById("save-label"),
  wordCount: document.getElementById("word-count"),
  togglePin: document.getElementById("toggle-pin"),
  duplicateNote: document.getElementById("duplicate-note"),
  deleteNote: document.getElementById("delete-note"),
  statTotal: document.getElementById("stat-total"),
  statPinned: document.getElementById("stat-pinned"),
  statTags: document.getElementById("stat-tags"),
  toastContainer: document.getElementById("toast-container"),
};

initTheme();
init();

function init() {
  bindEvents();
  if (!state.notes.length) {
    createEmptyNote();
  }
  render();
  updateWordCount();
  setSaveState("saved", "All changes saved");
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
    elements.title.focus();
    showToast("New note created");
  });

  elements.seedDemo.addEventListener("click", () => {
    state.notes = demoNotes();
    state.selectedId = state.notes[0].id;
    saveState();
    render();
    showToast("Demo notes loaded");
  });

  elements.exportJson.addEventListener("click", () => {
    exportNotes();
    showToast("Notes exported", "success");
  });

  elements.themeToggle.addEventListener("click", toggleTheme);
  elements.showShortcuts.addEventListener("click", toggleShortcuts);
  elements.closeShortcuts.addEventListener("click", closeShortcuts);
  elements.shortcutsDialog.addEventListener("click", (e) => {
    if (e.target === elements.shortcutsDialog) closeShortcuts();
  });

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
    showToast(note.pinned ? "Note pinned" : "Note unpinned");
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
    showToast("Note duplicated");
  });

  elements.deleteNote.addEventListener("click", () => {
    if (!state.notes.length) return;
    state.notes = state.notes.filter((note) => note.id !== state.selectedId);
    if (!state.notes.length) createEmptyNote();
    else state.selectedId = sortedNotes(filteredNotes())[0]?.id || state.notes[0].id;
    saveState();
    render();
    showToast("Note deleted", "danger");
  });

  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveCurrentNote();
    showToast("Saved", "success");
  });

  [elements.title, elements.tags, elements.content].forEach((el) => {
    el.addEventListener("input", () => {
      setSaveState("dirty", "Saving...");
      updateWordCount();
      scheduleAutoSave();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (elements.shortcutsDialog.classList.contains("open")) closeShortcuts();
      return;
    }
    const mod = event.metaKey || event.ctrlKey;
    if (!mod) return;
    const key = event.key.toLowerCase();
    if (key === "n") {
      event.preventDefault();
      createEmptyNote();
      render();
      elements.title.focus();
      showToast("New note created");
    } else if (key === "s") {
      event.preventDefault();
      saveCurrentNote();
      showToast("Saved", "success");
    } else if (key === "k") {
      event.preventDefault();
      elements.searchInput.focus();
      elements.searchInput.select();
    } else if (event.key === "/") {
      event.preventDefault();
      toggleShortcuts();
    }
  });
}

let autoSaveTimer = null;
function scheduleAutoSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    saveCurrentNote({ silent: true });
    setSaveState("saved", "All changes saved");
  }, 500);
}

function setSaveState(kind, label) {
  elements.saveState.dataset.state = kind;
  elements.saveLabel.textContent = label;
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
    JSON.stringify({ notes: state.notes, selectedId: state.selectedId })
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

function saveCurrentNote(opts = {}) {
  const note = selectedNote();
  if (!note) return;
  note.title = elements.title.value.trim();
  note.content = elements.content.value.trim();
  note.tags = parseTags(elements.tags.value);
  note.updatedAt = new Date().toISOString();
  saveState();
  if (!opts.silent) setSaveState("saved", "All changes saved");
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
  if (!selectedNote() && state.notes.length) {
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
            <button class="tag-chip ${state.activeTag === tag ? "active" : ""}" style="--tag-hue:${tagHue(tag)}" data-tag="${escapeAttr(tag)}">
              #${escapeHtml(tag)}
            </button>
          `
        )
        .join("")
    : `<span class="empty-state">No tags yet. Add some in a note.</span>`;

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
                ${note.pinned ? `<span class="pin-badge" title="Pinned">📌</span>` : ""}
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
  elements.togglePin.classList.toggle("active", note.pinned);
  const expectedTitle = note.title || "";
  const expectedTags = note.tags.join(", ");
  const expectedContent = note.content || "";
  if (elements.title.value !== expectedTitle) elements.title.value = expectedTitle;
  if (elements.tags.value !== expectedTags) elements.tags.value = expectedTags;
  if (elements.content.value !== expectedContent) elements.content.value = expectedContent;
  updateWordCount();
}

function renderPreview(note) {
  if (!note) return;
  elements.updatedAt.textContent = `Updated ${new Date(note.updatedAt).toLocaleString()}`;
  elements.previewTags.innerHTML = note.tags.length
    ? note.tags
        .map(
          (tag) =>
            `<span class="tag-chip" style="--tag-hue:${tagHue(tag)}">#${escapeHtml(tag)}</span>`
        )
        .join("")
    : "";

  const body = renderMarkdown(note.content || "");
  elements.previewBody.innerHTML = `
    <h1>${escapeHtml(note.title || "Untitled note")}</h1>
    ${body || `<p class="empty-state" style="text-align:left;padding:0;">Start writing to see a richer preview here.</p>`}
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
  URL.revokeObjectURL(link.href);
}

function demoNotes() {
  const now = new Date().toISOString();
  return [
    {
      id: crypto.randomUUID(),
      title: "Portfolio refresh",
      content:
        "# Portfolio refresh\n\nAdd a project spotlight section for shipped work.\n\n## Priorities\n\n- Stronger visual hierarchy for featured apps like **BudgetBuddy** and **SmartNotes**\n- Short 30-second demo clip per project\n- Link straight to the live app and the repo\n\n> Keep the copy tight — one paragraph per project is plenty.",
      tags: ["portfolio", "ideas", "frontend"],
      pinned: true,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      title: "Interview prep checklist",
      content:
        "## This week\n\n- Review JavaScript fundamentals (event loop, closures, prototypes)\n- Practice explaining projects clearly — 90-second pitch each\n- Prepare examples for *teamwork*, *debugging*, and *ownership*\n\n## System design primer\n\n`caching`, `load balancers`, `queues` — revisit the basics.",
      tags: ["career", "prep"],
      pinned: false,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      title: "Study plan",
      content:
        "# Study plan\n\nFocus this week on **data structures** review and **system design** basics.\n\n1. One coding problem per day\n2. Re-read the hashing chapter\n3. Summarize each topic in your own words\n\n> Consistency beats intensity.",
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
  const stripped = text.replace(/[#>*_`]/g, "").replace(/\s+/g, " ").trim();
  return stripped.length > 120 ? `${stripped.slice(0, 120)}...` : stripped;
}

function formatMeta(note) {
  const parts = [];
  if (note.tags.length) {
    parts.push(
      note.tags
        .map(
          (tag) =>
            `<span class="mini-tag" style="--tag-hue:${tagHue(tag)}">#${escapeHtml(tag)}</span>`
        )
        .join(" ")
    );
  }
  parts.push(`<span>${escapeHtml(new Date(note.updatedAt).toLocaleDateString())}</span>`);
  return parts.join(`<span class="dot" aria-hidden="true"></span>`);
}

function updateWordCount() {
  const text = elements.content.value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  const mins = words ? Math.max(1, Math.round(words / 200)) : 0;
  elements.wordCount.textContent = `${words} word${words === 1 ? "" : "s"} · ${mins} min read`;
}

/* Theme */
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const theme = saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.dataset.theme = theme;
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem(THEME_KEY, next);
  showToast(`${next === "dark" ? "Dark" : "Light"} mode`);
}

/* Shortcuts dialog */
function openShortcuts() {
  elements.shortcutsDialog.classList.add("open");
  elements.shortcutsDialog.setAttribute("aria-hidden", "false");
}

function closeShortcuts() {
  elements.shortcutsDialog.classList.remove("open");
  elements.shortcutsDialog.setAttribute("aria-hidden", "true");
}

function toggleShortcuts() {
  if (elements.shortcutsDialog.classList.contains("open")) closeShortcuts();
  else openShortcuts();
}

/* Toast */
function showToast(message, variant = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${variant}`;
  toast.textContent = message;
  elements.toastContainer.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 280);
  }, 2200);
}

/* Deterministic color-per-tag */
function tagHue(tag) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  return hash % 360;
}

/* Minimal safe markdown renderer */
function renderMarkdown(src) {
  if (!src) return "";
  const codeBlocks = [];
  src = src.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const i = codeBlocks.length;
    codeBlocks.push({ lang, code });
    return `\u0000CODEBLOCK${i}\u0000`;
  });

  const blocks = src.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return blocks
    .map((block) => {
      const cbMatch = block.match(/^\u0000CODEBLOCK(\d+)\u0000$/);
      if (cbMatch) {
        const { lang, code } = codeBlocks[+cbMatch[1]];
        return `<pre><code${lang ? ` class="lang-${escapeAttr(lang)}"` : ""}>${escapeHtml(
          code.replace(/\n$/, "")
        )}</code></pre>`;
      }
      const h = block.match(/^(#{1,3})\s+(.+)$/);
      if (h && !block.includes("\n")) {
        const level = h[1].length;
        return `<h${level}>${inlineMd(h[2])}</h${level}>`;
      }
      const lines = block.split("\n");
      if (lines.every((l) => /^>\s?/.test(l))) {
        const inner = lines.map((l) => inlineMd(l.replace(/^>\s?/, ""))).join("<br>");
        return `<blockquote>${inner}</blockquote>`;
      }
      if (lines.every((l) => /^[-*]\s+/.test(l))) {
        const items = lines.map((l) => `<li>${inlineMd(l.replace(/^[-*]\s+/, ""))}</li>`).join("");
        return `<ul>${items}</ul>`;
      }
      if (lines.every((l) => /^\d+\.\s+/.test(l))) {
        const items = lines.map((l) => `<li>${inlineMd(l.replace(/^\d+\.\s+/, ""))}</li>`).join("");
        return `<ol>${items}</ol>`;
      }
      if (/^(-{3,}|\*{3,})$/.test(block)) return "<hr/>";
      return `<p>${lines.map(inlineMd).join("<br>")}</p>`;
    })
    .join("");
}

function inlineMd(text) {
  const codes = [];
  text = text.replace(/`([^`\n]+)`/g, (_, c) => {
    const i = codes.length;
    codes.push(c);
    return `\u0001C${i}\u0001`;
  });
  text = escapeHtml(text);
  text = text.replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, "$1<em>$2</em>");
  text = text.replace(/(^|[^_\w])_([^_\n]+?)_(?!\w)/g, "$1<em>$2</em>");
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => {
    const safe = /^(https?:\/\/|mailto:|#|\/)/.test(url) ? url : "#";
    return `<a href="${escapeAttr(safe)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
  text = text.replace(
    /\u0001C(\d+)\u0001/g,
    (_, i) => `<code>${escapeHtml(codes[+i])}</code>`
  );
  return text;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}
