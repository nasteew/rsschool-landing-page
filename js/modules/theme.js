const STORAGE_KEY = "aura-theme";

const getTheme = () =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";

const syncToggle = (button, theme) => {
  const isDark = theme === "dark";
  button.setAttribute("aria-pressed", isDark ? "true" : "false");
  button.setAttribute(
    "aria-label",
    isDark ? "Switch to light theme" : "Switch to dark theme",
  );
};

export const initTheme = () => {
  const button = document.querySelector("[data-theme-toggle]");
  if (!button) {
    return;
  }

  syncToggle(button, getTheme());

  button.addEventListener("click", () => {
    const nextTheme = getTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;

    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      /* storage may be unavailable */
    }

    syncToggle(button, nextTheme);
  });
};
