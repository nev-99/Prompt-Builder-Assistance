// DOM references
const basePromptEl = document.getElementById("basePrompt");
const addonPromptEl = document.getElementById("addonPrompt");
const copyBtn = document.getElementById("copyBtn");
const resultArea = document.getElementById("resultArea");
const resultText = document.getElementById("resultText");
const promptListEl = document.getElementById("promptList");

// Control buttons
const resetBaseBtn = document.getElementById("resetBaseBtn");
const resetAddonBtn = document.getElementById("resetAddonBtn");
const resetAllTextBtn = document.getElementById("resetAllTextBtn");
const clearPromptsBtn = document.getElementById("clearPromptsBtn");
const exportPromptsBtn = document.getElementById("exportPromptsBtn");
const importPromptsBtn = document.getElementById("importPromptsBtn");

// LocalStorage key
const STORAGE_KEY = "nev_saved_prompts";

// ===== Prompt persistence =====

// Load saved prompts from localStorage
function loadPrompts() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

// Save prompts to localStorage
function savePrompts(prompts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
}

// Render prompt list in the sidebar
function renderPromptList() {
  const prompts = loadPrompts();
  promptListEl.innerHTML = "";

  prompts.forEach((prompt, index) => {
    const item = document.createElement("div");
    item.className = "prompt-item";

    const text = document.createElement("div");
    text.className = "prompt-text";
    text.textContent = prompt;

    // Click to reuse prompt
    text.onclick = () => {
      basePromptEl.value = prompt;
    };

    // Delete button
    const del = document.createElement("div");
    del.className = "delete-btn";
    del.textContent = "×";
    del.onclick = (e) => {
      e.stopPropagation();
      prompts.splice(index, 1);
      savePrompts(prompts);
      renderPromptList();
    };

    item.appendChild(text);
    item.appendChild(del);
    promptListEl.appendChild(item);
  });
}

// ===== Clipboard handling =====

// Copy text to clipboard with fallback
function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  } else {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return Promise.resolve();
  }
}

// Copy button behavior
copyBtn.addEventListener("click", async () => {
  const base = basePromptEl.value.trim();
  const addon = addonPromptEl.value.trim();

  if (!base && !addon) return;

  const formatted = `${base}
=
${addon}`;

  await copyToClipboard(formatted);

  // Save base prompt if not duplicated
  if (base) {
    const prompts = loadPrompts();
    if (!prompts.includes(base)) {
      prompts.push(base);
      savePrompts(prompts);
      renderPromptList();
    }
  }

  resultText.textContent = formatted;
  resultArea.style.display = "block";
});

// ===== Text reset controls =====

resetBaseBtn.addEventListener("click", () => {
  basePromptEl.value = "";
});

resetAddonBtn.addEventListener("click", () => {
  addonPromptEl.value = "";
});

resetAllTextBtn.addEventListener("click", () => {
  basePromptEl.value = "";
  addonPromptEl.value = "";
});

// ===== Cache management =====

// Clear all saved prompts
clearPromptsBtn.addEventListener("click", () => {
  const ok = confirm("Are you sure you want to delete all saved prompts?");
  if (!ok) return;

  localStorage.removeItem(STORAGE_KEY);
  renderPromptList();
});

// Export prompts to local JSON file
exportPromptsBtn.addEventListener("click", () => {
  const prompts = loadPrompts();
  if (prompts.length === 0) {
    alert("No prompts to export.");
    return;
  }

  const data = {
    exportedAt: new Date().toISOString(),
    prompts: prompts
  };

  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "nev_prompts_backup.json";
  a.click();
  URL.revokeObjectURL(url);
});

// Import prompts from JSON file
importPromptsBtn.addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";

  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);

        if (!Array.isArray(data.prompts)) {
          throw new Error("Invalid format");
        }

        const ok = confirm(
          "This will overwrite existing saved prompts. Continue?"
        );
        if (!ok) return;

        savePrompts(data.prompts);
        renderPromptList();
      } catch {
        alert("Invalid backup file.");
      }
    };

    reader.readAsText(file);
  };

  input.click();
});

// Initial render
renderPromptList();
