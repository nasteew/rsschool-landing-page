class Slider {
  constructor(root) {
    this.root = root;
    this.viewport = root.querySelector(".slider__viewport");
    this.track = root.querySelector(".slider__track");
    this.prevButton = root.querySelector("[data-slider-prev]");
    this.nextButton = root.querySelector("[data-slider-next]");
    this.dots = [...root.querySelectorAll(".slider__dot")];
    this.originalSlides = [...this.track.children];
    this.slideCount = this.originalSlides.length;
    this.index = 1;
    this.isAnimating = false;
    this.resizeTimer = 0;

    this.onTransitionEnd = this.onTransitionEnd.bind(this);
    this.onResize = this.onResize.bind(this);

    this.setupClones();
    this.bind();
    this.setPosition(false);
    this.updateDots();
  }

  setupClones() {
    const first = this.originalSlides[0].cloneNode(true);
    const last = this.originalSlides[this.slideCount - 1].cloneNode(true);
    first.setAttribute("aria-hidden", "true");
    last.setAttribute("aria-hidden", "true");
    this.track.prepend(last);
    this.track.append(first);
  }

  bind() {
    this.prevButton?.addEventListener("click", () => this.go(-1));
    this.nextButton?.addEventListener("click", () => this.go(1));
    this.track.addEventListener("transitionend", this.onTransitionEnd);
    window.addEventListener("resize", this.onResize);

    this.dots.forEach((dot, dotIndex) => {
      dot.addEventListener("click", () => this.goTo(dotIndex + 1));
    });
  }

  get offset() {
    return this.viewport.clientWidth * this.index;
  }

  prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  setPosition(animate) {
    const useMotion = animate && !this.prefersReducedMotion();
    this.track.classList.toggle("is-instant", !useMotion);

    if (!useMotion) {
      this.track.getBoundingClientRect();
    }

    this.track.style.transform = `translateX(-${this.offset}px)`;
    this.updateDots();

    if (!useMotion) {
      this.snapIfClone();
      this.isAnimating = false;
    }
  }

  go(step) {
    if (this.isAnimating || !this.slideCount) {
      return;
    }

    this.isAnimating = true;
    this.index += step;
    this.setPosition(true);
  }

  goTo(targetIndex) {
    if (this.isAnimating || targetIndex === this.index) {
      return;
    }

    this.isAnimating = true;
    this.index = targetIndex;
    this.setPosition(true);
  }

  onTransitionEnd(event) {
    if (event.propertyName !== "transform" || event.target !== this.track) {
      return;
    }

    this.snapIfClone();
    this.isAnimating = false;
  }

  snapIfClone() {
    if (this.index === 0) {
      this.index = this.slideCount;
      this.setPosition(false);
      return;
    }

    if (this.index === this.slideCount + 1) {
      this.index = 1;
      this.setPosition(false);
    }
  }

  realIndex() {
    if (this.index === 0) {
      return this.slideCount - 1;
    }

    if (this.index === this.slideCount + 1) {
      return 0;
    }

    return this.index - 1;
  }

  updateDots() {
    const active = this.realIndex();
    this.dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === active;
      dot.classList.toggle("is-active", isActive);
      if (isActive) {
        dot.setAttribute("aria-current", "true");
      } else {
        dot.removeAttribute("aria-current");
      }
    });
  }

  onResize() {
    window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => {
      this.setPosition(false);
    }, 50);
  }
}

export const initSlider = () => {
  const root = document.querySelector("[data-slider]");
  if (!root) {
    return;
  }

  new Slider(root);
};
