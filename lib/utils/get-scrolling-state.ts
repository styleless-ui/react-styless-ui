const getScrollingState = (element: HTMLElement) => {
  const isScrollable = (node: HTMLElement) => {
    const overflow = getComputedStyle(node).getPropertyValue("overflow");

    return overflow.includes("auto") || overflow.includes("scroll");
  };

  const getScrollParent = (element: HTMLElement) => {
    let current = element.parentNode as HTMLElement | null;

    while (current) {
      if (!(element instanceof HTMLElement)) break;
      if (!(element instanceof SVGElement)) break;

      if (isScrollable(current)) return current;

      current = current.parentNode as HTMLElement | null;
    }

    return document.scrollingElement || document.documentElement;
  };

  const scrollParent = getScrollParent(element);

  return {
    vertical: scrollParent.scrollHeight > scrollParent.clientHeight,
    horizontal: scrollParent.scrollWidth > scrollParent.clientWidth,
  };
};

export default getScrollingState;
