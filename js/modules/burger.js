import { lockScroll, unlockScroll } from "./scroll-lock.js";

const MEDIA_QUERY = "(max-width: 768px)";

export const initBurger = () => {
  const button = document.querySelector("[data-burger]");
  const menu = document.querySelector("[data-burger-menu]");

  if (!button || !menu) {
    return;
  }

  const media = window.matchMedia(MEDIA_QUERY);
  let isOpen = false;

  const setOpen = (nextOpen) => {
    if (nextOpen === isOpen) {
      return;
    }

    isOpen = nextOpen;
    button.setAttribute("aria-expanded", nextOpen ? "true" : "false");
    button.setAttribute("aria-label", nextOpen ? "Close menu" : "Open menu");
    menu.classList.toggle("is-open", nextOpen);

    if (nextOpen) {
      lockScroll();
    } else {
      unlockScroll();
    }
  };

  const close = () => {
    setOpen(false);
  };

  button.addEventListener("click", () => {
    setOpen(!isOpen);
  });

  menu.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link) {
      return;
    }

    close();
  });

  document.addEventListener("keydown", (event) => {
    const modal = document.querySelector("[data-modal]");
    const modalOpen = modal && !modal.hidden;
    if (event.key === "Escape" && isOpen && !modalOpen) {
      close();
    }
  });

  const onMediaChange = (event) => {
    if (!event.matches) {
      close();
    }
  };

  media.addEventListener("change", onMediaChange);

  if (!media.matches) {
    close();
  }
};
