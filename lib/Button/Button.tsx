import * as React from "react";
import { logger, resolvePropWithRenderContext } from "../internals";
import type {
  PolymorphicComponent,
  PolymorphicProps,
  PropWithRenderContext,
} from "../types";
import {
  componentWithForwardedRef,
  computeAccessibleName,
  getNodeName,
  useButtonBase,
  useDeterministicId,
  useForkedRefs,
} from "../utils";
import * as Slots from "./slots";

export type RenderProps = {
  /**
   * The `disabled` state of the component.
   */
  disabled: boolean;
  /**
   * Determines whether it is focused-visible or not.
   */
  focusedVisible: boolean;
};

export type ClassNameProps = RenderProps;

type OwnProps = {
  /**
   * The content of the component.
   */
  children?: PropWithRenderContext<React.ReactNode, RenderProps>;
  /**
   * The className applied to the component.
   */
  className?: PropWithRenderContext<string, ClassNameProps>;
  /**
   * If `true`, the component will be disabled.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * A value to replace `tabIndex` with.
   */
  overrideTabIndex?: number;
};

export type Props<E extends React.ElementType = "button"> = PolymorphicProps<
  E,
  OwnProps
>;

const ButtonBase = <
  E extends React.ElementType = "button",
  R extends HTMLElement = HTMLButtonElement,
>(
  props: Props<E>,
  ref: React.Ref<R>,
) => {
  const {
    className: classNameProp,
    children: childrenProp,
    id: idProp,
    as: RootNode = "button",
    overrideTabIndex,
    onBlur,
    onFocus,
    onClick,
    onKeyDown,
    onKeyUp,
    autoFocus,
    disabled = false,
    ...otherProps
  } = props as Props<"button">;

  const id = useDeterministicId(idProp, "styleless-ui__button");

  const buttonBase = useButtonBase({
    onBlur,
    onClick,
    onFocus,
    onKeyDown,
    onKeyUp,
    autoFocus,
    disabled,
  });

  const rootRef = React.useRef<HTMLElement>(null);
  const handleRef = useForkedRefs(ref, rootRef, buttonBase.handleButtonRef);

  const renderProps: RenderProps = {
    disabled,
    focusedVisible: buttonBase.isFocusedVisible,
  };

  const classNameProps = renderProps;

  const refCallback = (node: HTMLElement | null) => {
    handleRef(node);

    if (!node) return;

    const isNativeButton = getNodeName(node) === "button";

    if (!isNativeButton) {
      node.setAttribute("role", "button");
      node.setAttribute("aria-disabled", String(disabled));
    } else {
      (node as HTMLButtonElement).disabled = disabled;
    }

    const accessibleName = computeAccessibleName(node, { hidden: true });

    if (!accessibleName) {
      logger(
        [
          "Can't determine an accessible name.",
          "It's mandatory to provide an accessible name for the component. " +
            "Possible accessible names:",
          ". Set `aria-label` attribute.",
          ". Set `aria-labelledby` attribute.",
          ". Set `title` attribute.",
          ". Use an informative content.",
          ". Use a <label> with `for` attribute referencing to this component.",
        ].join("\n"),
        { scope: "Button", type: "error" },
      );
    }
  };

  const className = resolvePropWithRenderContext(classNameProp, classNameProps);
  const children = resolvePropWithRenderContext(childrenProp, renderProps);

  let tabIndex = disabled ? -1 : 0;

  if (typeof overrideTabIndex !== "undefined") tabIndex = overrideTabIndex;

  return (
    <RootNode
      data-slot={Slots.Root}
      {...otherProps}
      // @ts-expect-error React hasn't added `inert` yet
      inert={disabled ? "" : undefined}
      id={id}
      ref={refCallback}
      className={className}
      autoFocus={autoFocus}
      onClick={buttonBase.handleClick}
      onBlur={buttonBase.handleBlur}
      onFocus={buttonBase.handleFocus}
      onKeyDown={buttonBase.handleKeyDown}
      onKeyUp={buttonBase.handleKeyUp}
      tabIndex={tabIndex}
      data-disabled={disabled ? "" : undefined}
      data-focus-visible={buttonBase.isFocusedVisible ? "" : undefined}
    >
      {children}
    </RootNode>
  );
};

const Button: PolymorphicComponent<"button", OwnProps> =
  componentWithForwardedRef(ButtonBase, "Button");

export default Button;
