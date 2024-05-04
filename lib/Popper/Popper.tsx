import * as React from "react";
import Portal from "../Portal";
import { resolvePropWithRenderContext } from "../internals";
import type {
  MergeElementProps,
  PropWithRenderContext,
  VirtualElement,
} from "../types";
import {
  componentWithForwardedRef,
  useDeterministicId,
  useForkedRefs,
  useIsomorphicLayoutEffect,
  useIsomorphicValue,
} from "../utils";
import * as Slots from "./slots";
import type {
  Alignment,
  AutoPlacementMiddleware,
  ComputationConfig,
  ComputationMiddleware,
  ComputationMiddlewareOrder,
  Coordinates,
  OffsetMiddleware,
  Placement,
  Side,
  Strategy,
} from "./types";
import { computePosition, translate } from "./utils";

export type RenderProps = {
  /**
   * The placement of the component.
   */
  placement: Placement;
  /**
   * The `open` state of the component.
   */
  open: boolean;
};

export type ClassNameProps = RenderProps;

type OwnProps = {
  /**
   * The className applied to the component.
   */
  className?: PropWithRenderContext<string, ClassNameProps>;
  /**
   * The content of the component.
   */
  children?: PropWithRenderContext<React.ReactNode, RenderProps>;
  /**
   * If `true`, the popper will be open.
   */
  open: boolean;
  /**
   * The popper positioning side.
   *
   * @default "top"
   */
  side?: Side;
  /**
   * The popper positioning alignment.
   *
   * @default "middle"
   */
  alignment?: Alignment | "middle";
  /**
   * By enabling this option, popper chooses the placement automatically
   * (the one with the most space available)
   * and ignores the `side` property value but will consider the `alignment` value.
   *
   * @default false
   */
  autoPlacement?: AutoPlacementMiddleware;
  /**
   * The type of CSS positioning strategy to use.
   * You will want to use `fixed` if your anchor element is inside a fixed container
   *
   * @default "absolute"
   */
  positioningStrategy?: Strategy;
  /**
   * If a number is provided, it will represent the `mainAxis` offset.
   *
   * The `mainAxis` indicates x-axis
   * when the `placement` is equal to any combination of `top` or `bottom`.
   * In other cases it indicates the y-axis.
   *
   * Accordingly, the `crossAxis` works opposite to the `mainAxis`.
   *
   * @default 8
   */
  offset?: OffsetMiddleware;
  /**
   * A callback that runs as an in-between "middle" step of
   * the placement computation and eventual return.
   *
   * It should return an object containing either new coordinates or a new placement.\
   * (**Note**: You can't return both of them!)
   *
   * You can control the execution order of this callback via `computationMiddlewareOrder`
   * property.
   */
  computationMiddleware?: ComputationMiddleware;
  /**
   * Controls the execution order of `computationMiddleware`.
   *
   * @default "afterAutoPlacement"
   */
  computationMiddlewareOrder?: ComputationMiddlewareOrder;
  /**
   * The actions you can perform on the popper instance.
   */
  actions?: React.RefObject<{
    /**
     * Re-runs the positioning computation process.
     */
    recompute: () => void;
  }>;
  /**
   * A function that will resolve the anchor element for the popper.
   *
   * It has to return `HTMLElement`, or a `VirtualElement`, or `null`.
   * A VirtualElement is an object that implements `getBoundingClientRect(): BoundingClientRect`.
   *
   * If nothing is resolved, the popper won't show up.
   *
   * Please note that this function is only called on the client-side.
   */
  resolveAnchor: () => HTMLElement | VirtualElement | null;
  /**
   * Used to keep mounting when more control is needed.\
   * Useful when controlling animation with React animation libraries.
   *
   * @default false
   */
  keepMounted?: boolean;
};

export type Props = Omit<
  MergeElementProps<"div", OwnProps>,
  | "defaultChecked"
  | "defaultValue"
  | "autoSave"
  | "autoCapitalize"
  | "autoCorrect"
>;

const PopperBase = (props: Props, ref: React.Ref<HTMLDivElement>) => {
  const {
    open: openProp,
    actions,
    style: styleProp,
    id: idProp,
    className: classNameProp,
    children: childrenProp,
    computationMiddleware,
    resolveAnchor,
    offset = 8,
    side = "top",
    keepMounted = false,
    autoPlacement = false,
    alignment = "middle",
    positioningStrategy: strategy = "absolute",
    computationMiddlewareOrder = "afterAutoPlacement",
    ...otherProps
  } = props;

  const open = useIsomorphicValue(openProp, false);

  const id = useDeterministicId(idProp, "styleless-ui__popper");

  const popperRef = React.useRef<HTMLDivElement>(null);
  const handlePopperRef = useForkedRefs(ref, popperRef);

  const [coordinates, setCoordinates] = React.useState<Coordinates>({
    x: 0,
    y: 0,
  });

  const { current: initialPlacement } = React.useRef<Placement>(
    alignment === "middle" ? side : `${side}-${alignment}`,
  );

  const [placement, setPlacement] = React.useState(initialPlacement);

  const config: ComputationConfig = {
    computationMiddleware,
    computationMiddlewareOrder,
    placement: initialPlacement,
    autoPlacement,
    offset,
    strategy,
  };

  const updatePosition = () => {
    const anchor = resolveAnchor();

    if (anchor && popperRef.current) {
      const position = computePosition(anchor, popperRef.current, config);

      setPlacement(position.placement);
      setCoordinates({ x: position.x, y: position.y });

      return true;
    }

    return false;
  };

  React.useImperativeHandle(actions, () => ({
    recompute: (): void => void updatePosition(),
  }));

  const refCallback = React.useCallback(
    (node: HTMLDivElement | null) => {
      handlePopperRef(node);

      if (!node) return;
      if (!open) return;

      updatePosition();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open],
  );

  useIsomorphicLayoutEffect(() => {
    const anchor = resolveAnchor();

    if (id && anchor instanceof HTMLElement) {
      anchor.setAttribute("aria-describedby", id);
    }
  });

  const renderProps: RenderProps = {
    placement,
    open,
  };

  const classNameProps: ClassNameProps = renderProps;

  const children = resolvePropWithRenderContext(childrenProp, renderProps);
  const className = resolvePropWithRenderContext(classNameProp, classNameProps);

  const style = {
    ...(styleProp ?? {}),
    ...translate(coordinates),
    position: strategy,
    left: 0,
    top: 0,
  };

  if (!keepMounted && !open) return null;

  return (
    <Portal>
      <div
        data-slot="Portal:Root"
        role="presentation"
        tabIndex={-1}
        aria-hidden={!open}
        style={{ position: "absolute", top: 0, left: 0, right: 0 }}
      >
        <div
          {...otherProps}
          id={id}
          ref={refCallback}
          style={style}
          className={className}
          tabIndex={-1}
          data-slot={Slots.Root}
          data-placement={placement}
          data-open={open ? "" : undefined}
        >
          {children}
        </div>
      </div>
    </Portal>
  );
};

const Popper = componentWithForwardedRef(PopperBase, "Popper");

export default Popper;
