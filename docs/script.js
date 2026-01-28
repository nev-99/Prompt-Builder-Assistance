// ===== DOM =====
const basePromptEl = document.getElementById("basePrompt");
const addonPromptEl = document.getElementById("addonPrompt");
const copyBtn = document.getElementById("copyBtn");
const resultArea = document.getElementById("resultArea");
const resultText = document.getElementById("resultText");
const promptListEl = document.getElementById("promptList");

const resetBaseBtn = document.getElementById("resetBaseBtn");
const resetAddonBtn = document.getElementById("resetAddonBtn");
const resetAllTextBtn = document.getElementById("resetAllTextBtn");

const clearPromptsBtn = document.getElementById("clearPromptsBtn");
const exportPromptsBtn = document.getElementById("exportPromptsBtn");
const importPromptsBtn = document.getElementById("importPromptsBtn");

const enableTranslationTemplateEl =
  document.getElementById("enableTranslationTemplate");
const translationOptionsEl =
  document.getElementById("translationOptions");

const STORAGE_KEY = "nev_saved_prompts";

// ===== Translation Template =====
function buildTranslationPrompt() {
  const outputFormat =
    document.querySelector('input[name="outputFormat"]:checked').value;
  const targetLang = document.getElementById("targetLanguage").value;
  const style =
    document.querySelector('input[name="style"]:checked').value;
  const allowSlang = document.getElementById("allowSlang").checked;
  const allowAbbrev = document.getElementById("allowAbbrev").checked;

  const instructions = [];

  instructions.push(`Translate the following text into ${targetLang}.`);

  instructions.push(
    style === "faithful"
      ? "Keep the wording as close to the original as possible."
      : "Make the translation sound natural in the target language."
  );

  if (!allowSlang) instructions.push("Do not use slang.");
  if (!allowAbbrev) instructions.push("Do not use abbreviations.");

  if (outputFormat === "markdown") {
    instructions.push("Use Markdown formatting.");
  } else if (outputFormat === "codeblock") {
    instructions.push("Output the translation inside a Markdown code block.");
  } else {
    instructions.push("Output plain text only.");
  }

  return instructions.join(" ");
}

function updateBasePromptFromTemplate() {
  if (!enableTranslationTemplateEl.checked) return;
  basePromptEl.value = buildTranslationPrompt();
}

enableTranslationTemplateEl.addEventListener("change", () => {
  const enabled = enableTranslationTemplateEl.checked;
  translationOptionsEl.style.display = enabled ? "block" : "none";
  if (enabled) updateBasePromptFromTemplate();
});

translationOptionsEl.addEventListener("change", updateBasePromptFromTemplate);

// ===== Prompt storage =====
function loadPrompts() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function savePrompts(prompts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
}

function renderPromptList() {
  const prompts = loadPrompts();
  promptListEl.innerHTML = "";

  prompts.forEach((prompt, index) => {
    const item = document.createElement("div");
    item.className = "prompt-item";

    const text = document.createElement("div");
    text.className = "prompt-text";
    text.textContent = prompt;
    text.onclick = () => {
      basePromptEl.value = prompt;
    };

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

// ===== Clipboard =====
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

copyBtn.addEventListener("click", async () => {
  const base = basePromptEl.value.trim();
  const addon = addonPromptEl.value.trim();
  if (!base && !addon) return;

  const formatted = `${base}
=
${addon}`;

  await copyToClipboard(formatted);

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

// ===== Resets =====
resetBaseBtn.onclick = () => (basePromptEl.value = "");
resetAddonBtn.onclick = () => (addonPromptEl.value = "");
resetAllTextBtn.onclick = () => {
  basePromptEl.value = "";
  addonPromptEl.value = "";
};

// ===== Cache management =====
clearPromptsBtn.onclick = () => {
  if (!confirm("Delete all saved prompts?")) return;
  localStorage.removeItem(STORAGE_KEY);
  renderPromptList();
};

exportPromptsBtn.onclick = () => {
  const prompts = loadPrompts();
  if (!prompts.length) return alert("No prompts to export.");

  const blob = new Blob(
    [JSON.stringify({ prompts }, null, 2)],
    { type: "application/json" }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "nev_prompts_backup.json";
  a.click();
  URL.revokeObjectURL(url);
};

importPromptsBtn.onclick = () => {
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
        if (!Array.isArray(data.prompts)) throw new Error();
        if (!confirm("Overwrite existing prompts?")) return;
        savePrompts(data.prompts);
        renderPromptList();
      } catch {
        alert("Invalid file.");
      }
    };
    reader.readAsText(file);
  };

  input.click();
};

renderPromptList();

// ===== View mode (single toggle button) =====
const toggleViewModeBtn = document.getElementById("toggleViewModeBtn");

const VIEW_MODE_KEY = "nev_view_mode";

function applyViewMode(mode) {
  document.body.classList.remove("mode-desktop", "mode-vertical");
  document.body.classList.add(mode);

  if (mode === "mode-desktop") {
    toggleViewModeBtn.textContent =
      "Switch to Vertical Scroll Mode";
  } else {
    toggleViewModeBtn.textContent =
      "Switch to Desktop Mode";
  }

  localStorage.setItem(VIEW_MODE_KEY, mode);
}

toggleViewModeBtn.addEventListener("click", () => {
  const isDesktop =
    document.body.classList.contains("mode-desktop");
  applyViewMode(isDesktop ? "mode-vertical" : "mode-desktop");
});

// Restore mode on load
const savedMode =
  localStorage.getItem(VIEW_MODE_KEY) || "mode-desktop";
applyViewMode(savedMode);
