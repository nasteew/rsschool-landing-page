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
      const input = form.querySelector(`#${service.id}-${group.id}-${item.id}`);
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

    const count = group.items.filter((item) => {
      const input = form.querySelector(`#${service.id}-${group.id}-${item.id}`);
      return input?.checked;
    }).length;

    if (count === 1) {
      const item = group.items.find((entry) => {
        const input = form.querySelector(`#${service.id}-${group.id}-${entry.id}`);
        return input?.checked;
      });
      if (item) {
        parts.push(item.label);
      }
    } else if (count > 1) {
      parts.push(`${count} add-ons`);
    }
  });

  return parts.join(" · ");
};

const renderGroups = (service) =>
  service.optionGroups
    .map((group) => {
      const hint = group.hint ?? (group.type === "single" ? "Choose one" : "Choose any");
      const options = group.items
        .map((item, index) => {
          const inputId = `${service.id}-${group.id}-${item.id}`;
          const inputType = group.type === "single" ? "radio" : "checkbox";
          const name = group.type === "single" ? group.id : `${group.id}[]`;
          const checked = group.type === "single" && index === 0 ? "checked" : "";

          return `
            <div class="chip">
              <input class="visually-hidden" id="${inputId}" name="${name}" type="${inputType}" value="${item.id}" ${checked}>
              <label class="chip__label" for="${inputId}">${item.label}</label>
            </div>
          `;
        })
        .join("");

      return `
        <fieldset class="chip-group">
          <legend class="chip-group__title">${group.title}</legend>
          <p class="chip-group__hint">${hint}</p>
          <div class="chip-group__list">${options}</div>
        </fieldset>
      `;
    })
    .join("");

const renderBody = (service) => {
  const categoryTitle =
    categories.find((category) => category.id === service.category)?.title ?? "";

  return `
    <img class="modal__photo" src="${service.image}" alt="${service.imageAlt}" width="800" height="1000">
    <div class="modal__content">
      <p class="eyebrow">${categoryTitle}</p>
      <h2 id="modal-title">${service.title}</h2>
      <p class="modal__details">${service.details}</p>
      <form data-option-groups>
        ${renderGroups(service)}
      </form>
      <div class="modal__summary" aria-live="polite">
        <p class="modal__price"><output data-modal-price></output></p>
        <p class="modal__duration" data-modal-duration></p>
        <p class="modal__choice" data-modal-choice></p>
        <a class="btn btn--primary" href="index.html#contact">Book this service</a>
      </div>
    </div>
  `;
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
    if (!service) {
      return;
    }

    lastCard = card;
    dialog.querySelector("[data-modal-body]").innerHTML = renderBody(service);

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
