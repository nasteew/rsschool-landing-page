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

const createClockIcon = () => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");

  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", "12");
  circle.setAttribute("cy", "12");
  circle.setAttribute("r", "8.5");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M12 7.5V12l3 2");

  svg.append(circle, path);
  return svg;
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

  const media = document.createElement("div");
  media.className = "card__media";

  const tag = document.createElement("span");
  tag.className = "card__tag";
  tag.textContent = categoryTitle;

  const image = document.createElement("img");
  image.className = "card__img";
  image.src = item.image;
  image.alt = item.imageAlt;
  image.width = 800;
  image.height = 1000;
  image.loading = "lazy";

  media.append(tag, image);

  const body = document.createElement("div");
  body.className = "card__body";

  const title = document.createElement("h3");
  title.className = "card__title";
  title.textContent = item.title;

  const description = document.createElement("p");
  description.className = "card__desc";
  description.textContent = item.description;

  const meta = document.createElement("p");
  meta.className = "card__meta";

  const price = document.createElement("span");
  price.textContent = `from ${priceFormatter.format(item.basePrice)}`;

  const duration = document.createElement("span");
  duration.append(createClockIcon(), document.createTextNode(formatDuration(item.baseDuration)));

  meta.append(price, duration);
  body.append(title, description, meta);
  article.append(media, body);

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

    const activeTab = tabs.find((tab) => tab.dataset.category === categoryId);
    if (activeTab) {
      grid.setAttribute("aria-labelledby", activeTab.id);
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
