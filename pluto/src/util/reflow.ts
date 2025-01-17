// Trigger reflow causes the browser to re-paint the element. This is necessary to
// fix white-spacing and wrapping issues in safari when the text gets dynamically
// changed.
export const triggerReflow = (el: HTMLElement): void => {
  if (el == null) return;
  el.style.display = "none";
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  el.offsetHeight;
  el.style.display = "";
};
