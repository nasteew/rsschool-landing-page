import { categories, services } from "../data/catalog.js";

const INITIAL_DESKTOP = 8;
const INITIAL_MOBILE = 4;
const MOBILE_QUERY = "(max-width: 768px)";

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

const createCard = (item) => {
  const article = document.createElement("article");
  article.className = "card";
  article.dataset.id = item.id;
  article.tabIndex = 0;
  article.setAttribute("role", "button");
  article.setAttribute("aria-haspopup", "dialog");

  const categoryTitle =
    categories.find((category) => category.id === item.category)?.title ?? "";

  article.innerHTML = `
    <div class="card__media">
      <span class="card__tag">${categoryTitle}</span>
      <img class="card__img" src="${item.image}" alt="${item.imageAlt}" width="800" height="1000" loading="lazy">
    </div>
    <div class="card__body">
      <h3 class="card__title">${item.title}</h3>
      <p class="card__desc">${item.description}</p>
      <p class="card__meta">
        <span>from ${priceFormatter.format(item.basePrice)}</span>
        <span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="8.5"></circle>
            <path d="M12 7.5V12l3 2"></path>
          </svg>
          ${formatDuration(item.baseDuration)}
        </span>
      </p>
    </div>
  `;

  return article;
};

const itemsByCategory = (categoryId) =>
  services.filter((item) => item.category === categoryId);

export const initCatalog = () => {
  const grid = document.querySelector("[data-catalog-grid]");
  const tabs = [...document.querySelectorAll("[data-category]")];
  const moreButton = document.querySelector("[data-show-more]");
  const count = document.querySelector("[data-catalog-count]");
  const heading = document.querySelector("#catalog-heading");

  if (!grid || !tabs.length) {
    return;
  }

  const media = window.matchMedia(MOBILE_QUERY);
  let activeCategoryId = categories[0].id;
  let renderedCount = 0;

  const moreWrap = moreButton?.closest(".catalog__more");

  const initialLimit = () =>
    media.matches ? INITIAL_MOBILE : INITIAL_DESKTOP;

  const updateCount = (visible) => {
    if (count) {
      count.textContent = `Showing ${visible} services`;
    }
  };

  const updateMoreButton = (total) => {
    if (moreButton) {
      moreButton.hidden = renderedCount >= total;
    }

    if (moreWrap) {
      moreWrap.hidden = renderedCount >= total;
    }
  };

  const renderInitial = () => {
    const items = itemsByCategory(activeCategoryId);
    const limit = Math.min(initialLimit(), items.length);
    grid.replaceChildren(...items.slice(0, limit).map(createCard));
    renderedCount = limit;
    updateCount(renderedCount);
    updateMoreButton(items.length);
  };

  const showRemaining = () => {
    const items = itemsByCategory(activeCategoryId);
    const extra = items.slice(renderedCount);
    extra.forEach((item) => {
      grid.append(createCard(item));
    });
    renderedCount = items.length;
    updateCount(renderedCount);
    updateMoreButton(items.length);
  };

  const setActiveTab = (categoryId) => {
    activeCategoryId = categoryId;
    const activeCategory = categories.find((category) => category.id === categoryId);

    tabs.forEach((tab) => {
      const isActive = tab.dataset.category === categoryId;
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
      tab.classList.toggle("is-active", isActive);
      tab.tabIndex = isActive ? 0 : -1;
    });

    if (heading && activeCategory) {
      heading.textContent = activeCategory.title;
    }

    if (grid) {
      const activeTab = tabs.find((tab) => tab.dataset.category === categoryId);
      if (activeTab) {
        grid.setAttribute("aria-labelledby", activeTab.id);
      }
    }

    renderInitial();
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      setActiveTab(tab.dataset.category);
    });
  });

  moreButton?.addEventListener("click", showRemaining);

  media.addEventListener("change", () => {
    renderInitial();
  });

  setActiveTab(categories[0].id);
};
