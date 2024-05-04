import type { RequireOnlyOne, VirtualElement } from "../types";

export type Alignment = "start" | "end";
export type Side = "top" | "right" | "bottom" | "left";
export type AlignedPlacement = `${Side}-${Alignment}`;
export type Placement = Side | AlignedPlacement;

export type Strategy = "absolute" | "fixed";

export type Coordinates = { x: number; y: number };
export type Dimensions = { width: number; height: number };

export type Rect = Coordinates & Dimensions;
export type ElementRects = { anchorRect: Rect; popperRect: Rect };
export type Elements = {
  anchorElement: HTMLElement | VirtualElement;
  popperElement: HTMLElement;
};

export type OffsetMiddleware =
  | number
  | {
      /**
       * The axis that runs along the side of the popper element.
       */
      mainAxis?: number;
      /**
       * The axis that runs along the alignment of the popper element.
       */
      crossAxis?: number;
    };

export type AutoPlacementMiddleware = boolean | { excludeSides: Side[] };

export type MiddlewareResult = RequireOnlyOne<{
  coordinates: Partial<Coordinates>;
  placement: Placement;
}>;

export type ComputationMiddlewareArgs = {
  elementRects: ElementRects;
  elements: Elements;
  coordinates: Coordinates;
  placement: Placement;
  strategy: Strategy;
  overflow: Record<Side, number>;
};
export type ComputationMiddlewareResult = MiddlewareResult;
export type ComputationMiddlewareOrder =
  | "beforeAutoPlacement"
  | "afterAutoPlacement";
export type ComputationMiddleware = (
  args: ComputationMiddlewareArgs,
) => ComputationMiddlewareResult;

export type ComputationResult = Coordinates & { placement: Placement };
export type ComputationConfig = {
  placement: Placement;
  strategy: Strategy;
  autoPlacement: AutoPlacementMiddleware;
  offset: OffsetMiddleware;
  computationMiddleware?: ComputationMiddleware;
  computationMiddlewareOrder: ComputationMiddlewareOrder;
};
