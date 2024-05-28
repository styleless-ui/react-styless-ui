// This file is cherry-picked from https://floating-ui.com/
import type { BoundingClientRect, VirtualElement } from "../types";
import {
  clamp,
  contains,
  getBoundingClientRect,
  getDirection,
  getDocumentElement,
  getNodeName,
  getOffsetParent,
  getParentNode,
  getViewportRect,
  getWindow,
  isElement,
  isHTMLElement,
  isOverflowElement,
  isWindow,
} from "../utils";
import type {
  Alignment,
  ComputationConfig,
  ComputationMiddlewareArgs,
  ComputationMiddlewareResult,
  ComputationResult,
  Coordinates,
  Dimensions,
  ElementRects,
  Elements,
  MiddlewareResult,
  OffsetMiddleware,
  Placement,
  Rect,
  Side,
  Strategy,
} from "./types";

export const sides: Readonly<Side[]> = Object.freeze([
  "top",
  "right",
  "bottom",
  "left",
]);

export const alignments: Readonly<Alignment[]> = Object.freeze([
  "end",
  "start",
]);

export const strategies: Readonly<Strategy[]> = Object.freeze([
  "absolute",
  "fixed",
]);

const allPlacements: Readonly<Placement[]> = sides.reduce(
  (result, side) => [...result, side, `${side}-start`, `${side}-end`],
  [] as Placement[],
);

const getSideFromPlacement = (placement: Placement): Side =>
  placement.split("-")[0] as Side;

const getMainAxisFromPlacement = (placement: Placement): keyof Coordinates =>
  ["top", "bottom"].includes(getSideFromPlacement(placement)) ? "x" : "y";

const getLengthFromAxis = (axis: keyof Coordinates): keyof Dimensions =>
  axis === "y" ? "height" : "width";

const getAlignmentFromPlacement = (
  placement: Placement,
): Alignment | undefined => placement.split("-")[1] as Alignment | undefined;

const getAlignmentSidesFromPlacement = (
  placement: Placement,
  elementRects: ElementRects,
  isRTL: boolean,
): { mainSide: Side; crossSide: Side } => {
  const alignment = getAlignmentFromPlacement(placement);
  const mainAxis = getMainAxisFromPlacement(placement);
  const length = getLengthFromAxis(mainAxis);

  const _getOppositeSide = (side: Side) =>
    side.replace(
      /left|right|bottom|top/g,
      matched =>
        ({ left: "right", right: "left", top: "bottom", bottom: "top" })[
          matched
        ] ?? "",
    ) as Side;

  let mainSide: Side =
    mainAxis === "x"
      ? alignment === (isRTL ? "end" : "start")
        ? "right"
        : "left"
      : alignment === "start"
        ? "bottom"
        : "top";

  if (elementRects.anchorRect[length] > elementRects.popperRect[length])
    mainSide = _getOppositeSide(mainSide);

  return { mainSide, crossSide: _getOppositeSide(mainSide) };
};

const getDocumentRect = (element: HTMLElement): Rect => {
  const window = getWindow(element);
  const html = getDocumentElement(element);
  const scroll = getScrollProps(element);
  const body = element.ownerDocument?.body;

  const width = Math.max(
    html.scrollWidth,
    html.clientWidth,
    body ? body.scrollWidth : 0,
    body ? body.clientWidth : 0,
  );

  const height = Math.max(
    html.scrollHeight,
    html.clientHeight,
    body ? body.scrollHeight : 0,
    body ? body.clientHeight : 0,
  );

  let x = -scroll.scrollLeft + getWindowScrollBarX(element);
  const y = -scroll.scrollTop;

  if (window.getComputedStyle(body || html).direction === "rtl") {
    x += Math.max(html.clientWidth, body ? body.clientWidth : 0) - width;
  }

  return { width, height, x, y };
};

const getClippingRect = (element: Element): Rect => {
  const _getNearestOverflowAncestor = (node: Node): HTMLElement | null => {
    const parentNode = getParentNode(node);

    if (["html", "body", "#document"].includes(getNodeName(parentNode)))
      return node.ownerDocument ? node.ownerDocument.body : null;

    if (isHTMLElement(parentNode) && isOverflowElement(parentNode))
      return parentNode;

    return _getNearestOverflowAncestor(parentNode);
  };

  const _getOverflowAncestors = (
    node: Node,
    list: (Element | Window | VisualViewport)[] = [],
  ): typeof list => {
    const scrollableAncestor = _getNearestOverflowAncestor(node);
    const isBody = scrollableAncestor === node.ownerDocument?.body;
    const window = getWindow(scrollableAncestor as Node);

    const target = isBody
      ? (<(Element | Window | VisualViewport)[]>[window]).concat(
          window.visualViewport ?? [],
          isOverflowElement(scrollableAncestor) ? scrollableAncestor : [],
        )
      : scrollableAncestor ?? [];

    const updatedList = list.concat(target);

    return isBody
      ? updatedList
      : updatedList.concat(
          _getOverflowAncestors(getParentNode(target as HTMLElement)),
        );
  };

  /**
   * A "clipping ancestor" is an overflowable container with the characteristic of
   * clipping (or hiding) overflowing elements with a position different from `initial`.
   */
  const _getClippingAncestors = (element: Element): Element[] => {
    const clippingAncestors = _getOverflowAncestors(element);
    const window = getWindow(element);
    const canEscapeClipping = ["absolute", "fixed"].includes(
      window.getComputedStyle(element).position,
    );

    const clipperElement =
      canEscapeClipping && isHTMLElement(element)
        ? getOffsetParent(element)
        : element;

    if (!isElement(clipperElement)) return [];

    return clippingAncestors.filter(
      ancestor =>
        isElement(ancestor) &&
        contains(ancestor, clipperElement) &&
        getNodeName(ancestor) !== "body",
    ) as Element[];
  };

  const _getInnerBoundingClientRect = (
    element: Element,
  ): BoundingClientRect => {
    const clientRect = getBoundingClientRect(element);

    const top = clientRect.top + element.clientTop;
    const left = clientRect.left + element.clientLeft;

    return {
      top,
      left,
      x: left,
      y: top,
      right: left + element.clientWidth,
      bottom: top + element.clientHeight,
      width: element.clientWidth,
      height: element.clientHeight,
    };
  };

  const _getClientRectFromClippingAncestor = (
    element: Element,
    clippingParent: Element | "viewport",
  ): BoundingClientRect => {
    if (clippingParent === "viewport")
      return rectToClientRect(getViewportRect(element));

    if (isElement(clippingParent))
      return _getInnerBoundingClientRect(clippingParent);

    return rectToClientRect(getDocumentRect(getDocumentElement(element)));
  };

  const clippingAncestors = [
    ..._getClippingAncestors(element),
    "viewport" as const,
  ];

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const firstClippingAncestor = clippingAncestors[0]!;

  const clippingRect = clippingAncestors.reduce(
    (result, clippingAncestor) => {
      const rect = _getClientRectFromClippingAncestor(
        element,
        clippingAncestor,
      );

      result.top = Math.max(rect.top, result.top);
      result.right = Math.min(rect.right, result.right);
      result.bottom = Math.min(rect.bottom, result.bottom);
      result.left = Math.max(rect.left, result.left);

      return result;
    },
    _getClientRectFromClippingAncestor(element, firstClippingAncestor),
  );

  return {
    width: clippingRect.right - clippingRect.left,
    height: clippingRect.bottom - clippingRect.top,
    x: clippingRect.left,
    y: clippingRect.top,
  };
};

const rectToClientRect = (rect: Rect): BoundingClientRect => ({
  ...rect,
  top: rect.y,
  left: rect.x,
  right: rect.x + rect.width,
  bottom: rect.y + rect.height,
});

const getOffsetParentRectRelativeToViewport = (args: {
  popperRect: ElementRects["popperRect"];
  offsetParent: ReturnType<typeof getOffsetParent>;
  strategy: Strategy;
}): Rect => {
  const { popperRect, offsetParent, strategy } = args;

  const documentElement = getDocumentElement(offsetParent);

  if (offsetParent === documentElement) return popperRect;

  const isOffsetParentAHTMLElement = isHTMLElement(offsetParent);

  let scroll = { scrollLeft: 0, scrollTop: 0 };
  const offset = { x: 0, y: 0 };

  if (
    isOffsetParentAHTMLElement ||
    (!isOffsetParentAHTMLElement && strategy !== "fixed")
  ) {
    if (
      getNodeName(offsetParent) !== "body" ||
      isOverflowElement(documentElement)
    ) {
      scroll = getScrollProps(offsetParent);
    }

    if (isOffsetParentAHTMLElement) {
      const offsetRect = getBoundingClientRect(offsetParent, true);

      offset.x = offsetRect.x + offsetParent.clientLeft;
      offset.y = offsetRect.y + offsetParent.clientTop;
    } else if (documentElement) offset.x = getWindowScrollBarX(documentElement);
  }

  return {
    ...popperRect,
    x: popperRect.x - scroll.scrollLeft + offset.x,
    y: popperRect.y - scroll.scrollTop + offset.y,
  };
};

const getScrollProps = (element: Element | Window) => {
  if (isWindow(element)) {
    return {
      scrollLeft: element.scrollX || element.pageXOffset,
      scrollTop: element.scrollY || element.pageYOffset,
    };
  }

  return { scrollLeft: element.scrollLeft, scrollTop: element.scrollTop };
};

const getWindowScrollBarX = (element: Element): number => {
  // If <html> has a CSS width greater than the viewport,
  // then this will be incorrect for RTL.
  return (
    getBoundingClientRect(getDocumentElement(element)).left +
    getScrollProps(element).scrollLeft
  );
};

const getRectRelativeToOffsetParent = (
  element: HTMLElement | VirtualElement,
  offsetParent: Element | Window,
  strategy: Strategy,
): Rect => {
  const isOffsetParentAHTMLElement = isHTMLElement(offsetParent);
  const documentElement = getDocumentElement(offsetParent);

  const _isScaled = (element: HTMLElement): boolean => {
    const clientRect = getBoundingClientRect(element);

    return (
      Math.round(clientRect.width) !== element.offsetWidth ||
      Math.round(clientRect.height) !== element.offsetHeight
    );
  };

  const rect = getBoundingClientRect(
    element,
    isOffsetParentAHTMLElement && _isScaled(offsetParent),
  );

  let scroll = { scrollLeft: 0, scrollTop: 0 };
  const offset = { x: 0, y: 0 };

  if (
    isOffsetParentAHTMLElement ||
    (!isOffsetParentAHTMLElement && strategy !== "fixed")
  ) {
    if (
      getNodeName(offsetParent) !== "body" ||
      isOverflowElement(documentElement)
    )
      scroll = getScrollProps(offsetParent);

    if (isHTMLElement(offsetParent)) {
      const offsetRect = getBoundingClientRect(offsetParent, true);

      offset.x = offsetRect.x + offsetParent.clientLeft;
      offset.y = offsetRect.y + offsetParent.clientTop;
    } else if (documentElement) offset.x = getWindowScrollBarX(documentElement);
  }

  return {
    x: rect.left + scroll.scrollLeft - offset.x,
    y: rect.top + scroll.scrollTop - offset.y,
    width: rect.width,
    height: rect.height,
  };
};

/**
 * Returns the anchor and popper rects based on the given strategy.
 */
export const getElementRects = (
  elements: Elements,
  strategy: Strategy,
): ElementRects => ({
  anchorRect: getRectRelativeToOffsetParent(
    elements.anchorElement,
    getOffsetParent(elements.popperElement),
    strategy,
  ),
  popperRect: {
    x: 0,
    y: 0,
    width: elements.popperElement.offsetWidth,
    height: elements.popperElement.offsetHeight,
  },
});

/**
 * Resolves with an object of overflow side offsets that determine how much the
 * element is overflowing clipping boundary.
 *
 * - positive = overflowing the boundary by that number of pixels
 * - negative = how many pixels left before it will overflow
 * - 0 = lies flush with the boundary
 *
 * @see https://floating-ui.com/docs/detectOverflow
 */
export const detectBoundaryOverflow = (args: {
  coordinates: Coordinates;
  elements: Elements;
  elementRects: ElementRects;
  strategy: Strategy;
}) => {
  const padding = 0;

  const element = args.elements.popperElement;

  const clippingRect = getClippingRect(element);
  const clientClippingRect = rectToClientRect(clippingRect);

  const elementClientRect = rectToClientRect(
    getOffsetParentRectRelativeToViewport({
      popperRect: {
        ...args.elementRects.popperRect,
        x: args.coordinates.x,
        y: args.coordinates.y,
      },
      offsetParent: getOffsetParent(element),
      strategy: args.strategy,
    }),
  );

  return {
    top: clientClippingRect.top - elementClientRect.top + padding,
    bottom: elementClientRect.bottom - clientClippingRect.bottom + padding,
    left: clientClippingRect.left - elementClientRect.left + padding,
    right: elementClientRect.right - clientClippingRect.right + padding,
  };
};

const calcCoordinatesFromPlacement = (args: {
  placement: Placement;
  offset: OffsetMiddleware;
  elements: Elements;
  elementRects: ElementRects;
  strategy: Strategy;
  isRTL: boolean;
}): Coordinates => {
  const { placement, offset, elementRects, elements, strategy, isRTL } = args;

  const { anchorRect, popperRect } = elementRects;

  const commonX = anchorRect.x + (anchorRect.width - popperRect.width) / 2;
  const commonY = anchorRect.y + (anchorRect.height - popperRect.height) / 2;

  const mainAxis = getMainAxisFromPlacement(placement);
  const length = getLengthFromAxis(mainAxis);

  const commonAlign = (anchorRect[length] - popperRect[length]) / 2;

  const side = getSideFromPlacement(placement);
  const alignment = getAlignmentFromPlacement(placement);

  const isVertical = mainAxis === "x";

  let coordinates: Coordinates;

  switch (side) {
    case "top":
      coordinates = { x: commonX, y: anchorRect.y - popperRect.height };
      break;
    case "bottom":
      coordinates = { x: commonX, y: anchorRect.y + anchorRect.height };
      break;
    case "left":
      coordinates = { x: anchorRect.x - popperRect.width, y: commonY };
      break;
    case "right":
      coordinates = { x: anchorRect.x + anchorRect.width, y: commonY };
      break;
    default:
      coordinates = { x: anchorRect.x, y: anchorRect.y };
  }

  switch (alignment) {
    case "start":
      coordinates[mainAxis] -= commonAlign * (isRTL && isVertical ? -1 : 1);
      break;
    case "end":
      coordinates[mainAxis] += commonAlign * (isRTL && isVertical ? -1 : 1);
      break;
    default:
  }

  let { x, y } = coordinates;

  // Shift internal middleware
  ({ x, y } = (() => {
    const overflow = detectBoundaryOverflow({
      coordinates,
      elementRects,
      elements,
      strategy,
    });

    const crossAxis = mainAxis === "x" ? "y" : ("x" as keyof Coordinates);

    const mainAxisCoord = coordinates[mainAxis];
    const minSide = mainAxis === "y" ? "top" : "left";
    const maxSide = mainAxis === "y" ? "bottom" : "right";
    const min = mainAxisCoord + overflow[minSide];
    const max = mainAxisCoord - overflow[maxSide];

    return {
      [crossAxis]: coordinates[crossAxis],
      [mainAxis]: clamp(mainAxisCoord, min, max),
    } as Coordinates;
  })());

  // Offset internal middleware
  const diffCoordinates = (() => {
    const mainAxisCoef = ["left", "top"].includes(side) ? -1 : 1;

    let crossAxisCoef = 1;

    if (alignment === "end") crossAxisCoef = -1;
    if (isRTL && isVertical) crossAxisCoef *= -1;

    let mainAxisOffset = 0;
    let crossAxisOffset = 0;

    if (typeof offset === "number") mainAxisOffset = offset;
    else if (typeof offset === "object") {
      const { crossAxis = 0, mainAxis = 0 } = offset;

      mainAxisOffset = mainAxis;
      crossAxisOffset = crossAxis;
    }

    return (
      isVertical
        ? {
            x: crossAxisOffset * crossAxisCoef,
            y: mainAxisOffset * mainAxisCoef,
          }
        : {
            x: mainAxisOffset * mainAxisCoef,
            y: crossAxisOffset * crossAxisCoef,
          }
    ) as Coordinates;
  })();

  x += diffCoordinates.x;
  y += diffCoordinates.y;

  return { x, y };
};

const suppressViewportOverflow = (
  excludeSides: Side[],
  args: {
    placement: Placement;
    elementRects: ElementRects;
    isRTL: boolean;
    overflow: ComputationMiddlewareArgs["overflow"];
  },
) => {
  const { overflow, placement, elementRects, isRTL: isRTL } = args;
  const alignment = getAlignmentFromPlacement(placement);

  const _getOppositeAlignment = (placement: Placement) =>
    placement.replace(
      /start|end/g,
      matched => ({ start: "end", end: "start" })[matched] ?? "",
    ) as Placement;

  const _onlySides = (placement: Placement) =>
    getSideFromPlacement(placement) === placement;

  const _equalAlignments = (placement: Placement) =>
    getAlignmentFromPlacement(placement) === alignment;

  const _notEqualAlignments = (placement: Placement) =>
    getAlignmentFromPlacement(placement) !== alignment;

  const _oppositeAlignments = (placement: Placement) =>
    _getOppositeAlignment(placement) !== placement;

  const placements = allPlacements.filter(
    placement => !excludeSides.includes(getSideFromPlacement(placement)),
  );

  const placementsSortedByAlignment = alignment
    ? [
        ...placements.filter(_equalAlignments),
        ...placements.filter(_notEqualAlignments),
      ].filter(
        placement =>
          _equalAlignments(placement) || _oppositeAlignments(placement),
      )
    : placements.filter(_onlySides);

  const _findBestPlacement = (recursionData: {
    placementIndex: number;
    overflows: { placement: Placement; overflows: number[] }[];
  }): MiddlewareResult => {
    const { placementIndex, overflows } = recursionData;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const currentPlacement = placementsSortedByAlignment[placementIndex]!;

    const { mainSide, crossSide } = getAlignmentSidesFromPlacement(
      currentPlacement,
      elementRects,
      isRTL,
    );

    const currentOverflows = [
      overflow[getSideFromPlacement(currentPlacement)],
      overflow[mainSide],
      overflow[crossSide],
    ];

    const allOverflows = [
      ...overflows,
      { placement: currentPlacement, overflows: currentOverflows },
    ];

    const nextPlacementIndex = placementIndex + 1;
    const nextPlacement = placementsSortedByAlignment[nextPlacementIndex];

    // There are more placements to check
    if (nextPlacement) {
      return _findBestPlacement({
        overflows: allOverflows,
        placementIndex: nextPlacementIndex,
      });
    }

    const placementsSortedByLeastOverflow = allOverflows
      .slice()
      .sort((a, b) => (a.overflows[0] ?? 0) - (b.overflows[0] ?? 0));

    const placementThatFitsOnAllSides = placementsSortedByLeastOverflow.find(
      ({ overflows }) => overflows.every(overflow => overflow <= 0),
    )?.placement;

    return {
      placement:
        placementThatFitsOnAllSides ??
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        placementsSortedByLeastOverflow[0]!.placement,
    };
  };

  return _findBestPlacement({
    placementIndex: 0,
    overflows: [],
  });
};

/**
 * Computes the `x` and `y` coordinates that will place the popper element
 * next to a anchor element when it is given a certain positioning strategy.
 */
export const computePosition = (
  anchorElement: HTMLElement | VirtualElement,
  popperElement: HTMLElement,
  config: ComputationConfig,
): ComputationResult => {
  const {
    strategy,
    autoPlacement,
    offset,
    placement: initialPlacement,
    computationMiddleware,
    computationMiddlewareOrder,
  } = config;

  let placement = initialPlacement;

  const elements: Elements = { anchorElement, popperElement };
  const elementRects = getElementRects(elements, strategy);

  const isRTL = getDirection(elements.popperElement) === "rtl";

  let { x, y } = calcCoordinatesFromPlacement({
    isRTL,
    offset,
    strategy,
    elements,
    placement,
    elementRects,
  });

  const middlewares = (
    computationMiddlewareOrder === "afterAutoPlacement"
      ? ["auto_placement", "custom_middleware"]
      : ["custom_middleware", "auto_placement"]
  ) as Readonly<("auto_placement" | "custom_middleware")[]>;

  middlewares.forEach(middleware => {
    let result: ComputationMiddlewareResult | undefined;

    const args = {
      coordinates: { x, y },
      placement,
      elements,
      elementRects,
      strategy,
    };

    const overflow = detectBoundaryOverflow(args);

    switch (middleware) {
      case "auto_placement": {
        if (autoPlacement) {
          const excludeSides =
            typeof autoPlacement === "object" ? autoPlacement.excludeSides : [];

          result = suppressViewportOverflow(excludeSides, {
            elementRects,
            placement,
            overflow,
            isRTL,
          });
        }

        break;
      }

      case "custom_middleware": {
        result = computationMiddleware?.({ ...args, overflow });
        break;
      }

      default:
    }

    if (!result) return;

    if (result.placement) {
      placement = result.placement ?? placement;

      const coords = calcCoordinatesFromPlacement({
        isRTL,
        offset,
        strategy,
        elements,
        placement,
        elementRects,
      });

      x = coords.x;
      y = coords.y;
    } else {
      x = result.coordinates.x ?? x;
      y = result.coordinates.y ?? y;
    }
  });

  return { x, y, placement };
};

/**
 * Returns a translate CSS value that is rounded by DPR.
 */
export const translate = (coordinates: Coordinates) => {
  const { x, y } = coordinates;

  const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;

  // Rounding coordinates by DPR
  const { x: _x, y: _y } = (() => ({
    x: Math.round(Math.round(x * dpr) / dpr),
    y: Math.round(Math.round(y * dpr) / dpr),
  }))();

  const transformValue = `translate(${_x}px, ${_y}px)`;

  return {
    transform: transformValue,
    WebkitTransform: transformValue,
    MozTransform: transformValue,
    msTransform: transformValue,
  };
};
