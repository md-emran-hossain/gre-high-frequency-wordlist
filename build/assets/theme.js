function applyTheme(theme) {
  if (theme === "system") {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = theme;
  }
}

function readSavedTheme() {
  try {
    return localStorage.getItem("theme") || "system";
  } catch {
    return "system";
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem("theme", theme);
  } catch {}
}

applyTheme(readSavedTheme());
