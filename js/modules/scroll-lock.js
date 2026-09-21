let lockCount = 0;

export const lockScroll = () => {
  lockCount += 1;
  document.documentElement.classList.add("no-scroll");
};

export const unlockScroll = () => {
  lockCount = Math.max(0, lockCount - 1);

  if (lockCount === 0) {
    document.documentElement.classList.remove("no-scroll");
  }
};
