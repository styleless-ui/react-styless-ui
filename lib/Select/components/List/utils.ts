import { PopperUtils } from "../../../utils";

const calcBoundaryOverflow = (
  anchorElement: HTMLElement,
  element: HTMLElement,
) => {
  PopperUtils;
  const elements = { anchorElement, popperElement: element };
  const strategy: (typeof PopperUtils.strategies)[0] = "fixed";

  const rects = PopperUtils.getElementRects(elements, strategy);

  const topSideCoordinates = {
    x: 0,
    y: rects.anchorRect.y - rects.popperRect.height,
  };

  const bottomSideCoordinates = {
    x: 0,
    y: rects.anchorRect.y + rects.anchorRect.height,
  };

  const overflowArgs = { strategy, elements, elementRects: rects };

  const topSideOverflow = PopperUtils.detectBoundaryOverflow({
    ...overflowArgs,
    coordinates: topSideCoordinates,
  });

  const bottomSideOverflow = PopperUtils.detectBoundaryOverflow({
    ...overflowArgs,
    coordinates: bottomSideCoordinates,
  });

  return {
    topSideOverflow: topSideOverflow.top,
    bottomSideOverflow: bottomSideOverflow.bottom,
  };
};

export const calcSidePlacement = (
  anchorElement: HTMLElement,
  element: HTMLElement,
) => {
  const { topSideOverflow, bottomSideOverflow } = calcBoundaryOverflow(
    anchorElement,
    element,
  );

  if (topSideOverflow < bottomSideOverflow) return "top";

  return "bottom";
};
