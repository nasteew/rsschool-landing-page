import { categories, services } from "../data/catalog.js";
import { lockScroll, unlockScroll } from "./scroll-lock.js";

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const formatDuration = (minutes) => {
  if (minutes >= 60 && minutes % 60 !== 0) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return `${hours} h ${rest} min`;
  }

  return `${minutes} min`;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

const getSelectedItems = (form, service) => {
  const selected = [];

  service.optionGroups.forEach((group) => {
    if (group.type === "single") {
      const value = form.elements[group.id]?.value;
      const item = group.items.find((entry) => entry.id === value);
      if (item) {
        selected.push(item);
      }
      return;
    }

    group.items.forEach((item) => {
      const input = form.querySelector(`#${CSS.escape(`${service.id}-${group.id}-${item.id}`)}`);
      if (input?.checked) {
        selected.push(item);
      }
    });
  });

  return selected;
};

const buildChoiceLabel = (form, service) => {
  const parts = [];

  service.optionGroups.forEach((group) => {
    if (group.type === "single") {
      const value = form.elements[group.id]?.value;
      const item = group.items.find((entry) => entry.id === value);
      if (item) {
        parts.push(item.label);
      }
      return;
    }

    const checkedItems = group.items.filter((item) => {
      const input = form.querySelector(`#${CSS.escape(`${service.id}-${group.id}-${item.id}`)}`);
      return input?.checked;
    });

    if (checkedItems.length === 1) {
      parts.push(checkedItems[0].label);
    } else if (checkedItems.length > 1) {
      parts.push(`${checkedItems.length} add-ons`);
    }
  });

  return parts.join(" · ");
};

const createChip = (service, group, item, index) => {
  const wrap = document.createElement("div");
  wrap.className = "chip";

  const inputId = `${service.id}-${group.id}-${item.id}`;
  const input = document.createElement("input");
  input.className = "visually-hidden";
  input.id = inputId;
  input.type = group.type === "single" ? "radio" : "checkbox";
  input.name = group.type === "single" ? group.id : `${group.id}[]`;
  input.value = item.id;
  input.checked = group.type === "single" && index === 0;

  const label = document.createElement("label");
  label.className = "chip__label";
  label.htmlFor = inputId;
  label.textContent = item.label;

  wrap.append(input, label);
  return wrap;
};

const createGroups = (service) => {
  const fragment = document.createDocumentFragment();

  service.optionGroups.forEach((group) => {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "chip-group";

    const legend = document.createElement("legend");
    legend.className = "chip-group__title";
    legend.textContent = group.title;

    const hint = document.createElement("p");
    hint.className = "chip-group__hint";
    hint.textContent = group.hint ?? (group.type === "single" ? "Choose one" : "Choose any");

    const list = document.createElement("div");
    list.className = "chip-group__list";
    group.items.forEach((item, index) => {
      list.append(createChip(service, group, item, index));
    });

    fieldset.append(legend, hint, list);
    fragment.append(fieldset);
  });

  return fragment;
};

const createBody = (service) => {
  const fragment = document.createDocumentFragment();
  const categoryTitle =
    categories.find((category) => category.id === service.category)?.title ?? "";

  const image = document.createElement("img");
  image.className = "modal__photo";
  image.src = service.image;
  image.alt = service.imageAlt;
  image.width = 800;
  image.height = 1000;

  const content = document.createElement("div");
  content.className = "modal__content";

  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = categoryTitle;

  const title = document.createElement("h2");
  title.id = "modal-title";
  title.textContent = service.title;

  const details = document.createElement("p");
  details.className = "modal__details";
  details.textContent = service.details;

  const form = document.createElement("form");
  form.dataset.optionGroups = "";
  form.append(createGroups(service));

  const summary = document.createElement("div");
  summary.className = "modal__summary";
  summary.setAttribute("aria-live", "polite");

  const priceWrap = document.createElement("p");
  priceWrap.className = "modal__price";
  const priceOut = document.createElement("output");
  priceOut.dataset.modalPrice = "";
  priceWrap.append(priceOut);

  const duration = document.createElement("p");
  duration.className = "modal__duration";
  duration.dataset.modalDuration = "";

  const choice = document.createElement("p");
  choice.className = "modal__choice";
  choice.dataset.modalChoice = "";

  const book = document.createElement("a");
  book.className = "btn btn--primary";
  book.href = "index.html#contact";
  book.textContent = "Book this service";

  summary.append(priceWrap, duration, choice, book);
  content.append(eyebrow, title, details, form, summary);
  fragment.append(image, content);

  return fragment;
};

const updateSummary = (form, service) => {
  const selected = getSelectedItems(form, service);
  const total =
    service.basePrice + selected.reduce((sum, item) => sum + item.priceDelta, 0);
  const duration =
    service.baseDuration + selected.reduce((sum, item) => sum + item.durationDelta, 0);

  const priceOut = form.parentElement.querySelector("[data-modal-price]");
  const durationOut = form.parentElement.querySelector("[data-modal-duration]");
  const choiceOut = form.parentElement.querySelector("[data-modal-choice]");

  if (priceOut) {
    priceOut.textContent = priceFormatter.format(total);
  }

  if (durationOut) {
    durationOut.textContent = formatDuration(duration);
  }

  if (choiceOut) {
    choiceOut.textContent = buildChoiceLabel(form, service);
  }
};

export const initModal = () => {
  const modal = document.querySelector("[data-modal]");
  const grid = document.querySelector("[data-catalog-grid]");
  const dialog = modal?.querySelector(".modal__dialog");
  const closeButtons = modal?.querySelectorAll("[data-modal-close]");

  if (!modal || !grid || !dialog) {
    return;
  }

  let lastCard = null;

  const getFocusable = () =>
    [...dialog.querySelectorAll(FOCUSABLE)].filter(
      (node) => !node.hasAttribute("disabled") && node.getClientRects().length,
    );

  const close = () => {
    if (modal.hidden) {
      return;
    }

    modal.hidden = true;
    unlockScroll();
    lastCard?.focus();
  };

  const open = (card) => {
    const service = services.find((item) => item.id === card.dataset.id);
    const body = dialog.querySelector("[data-modal-body]");
    if (!service || !body) {
      return;
    }

    lastCard = card;
    body.replaceChildren(createBody(service));

    const form = dialog.querySelector("[data-option-groups]");
    updateSummary(form, service);
    form.addEventListener("change", () => updateSummary(form, service));

    modal.hidden = false;
    lockScroll();
    dialog.querySelector(".modal__close")?.focus();
  };

  grid.addEventListener("click", (event) => {
    const card = event.target.closest(".card");
    if (!card) {
      return;
    }

    open(card);
  });

  grid.addEventListener("keydown", (event) => {
    const card = event.target.closest(".card");
    if (!card || event.target !== card) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open(card);
    }
  });

  closeButtons.forEach((node) => {
    node.addEventListener("click", (event) => {
      if (node.classList.contains("modal__backdrop") && event.target !== node) {
        return;
      }

      close();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (modal.hidden) {
      return;
    }

    if (event.key === "Escape") {
      close();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusable = getFocusable();
    if (!focusable.length) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
};
