import { categories, services } from "../data/catalog.js";

const INITIAL_LIMIT = 8;
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

  article.innerHTML = `
    <div class="card__media">
      <span class="card__tag">${categories.find((category) => category.id === item.category)?.title ?? ""}</span>
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

export const initCatalog = () => {
  const grid = document.querySelector("[data-catalog-grid]");
  if (!grid) {
    return;
  }

  const firstCategory = categories[0];
  const items = services.filter((item) => item.category === firstCategory.id);
  const visible = items.slice(0, INITIAL_LIMIT);

  grid.replaceChildren(...visible.map(createCard));

  const count = document.querySelector("[data-catalog-count]");
  if (count) {
    count.textContent = `Showing ${visible.length} services`;
  }
};
