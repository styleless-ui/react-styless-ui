import * as React from "react";
import { ToggleGroupContext } from "../ToggleGroup/context";
import {
  SystemError,
  logger,
  resolvePropWithRenderContext,
} from "../internals";
import type { MergeElementProps, PropWithRenderContext } from "../types";
import {
  componentWithForwardedRef,
  computeAccessibleName,
  useCheckBase,
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
  /**
   * The `pressed` state of the component.
   */
  pressed: boolean;
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
   * The value of the toggle. Use when it is a ToggleGroup's child.
   */
  value?: string;
  /**
   * If `true`, the toggle will be focused automatically.
   * @default false
   */
  autoFocus?: boolean;
  /**
   * If `true`, the toggle will be pressed.
   * @default false
   */
  pressed?: boolean;
  /**
   * The default state of `pressed`. Use when the component is not controlled.
   * @default false
   */
  defaultPressed?: boolean;
  /**
   * If `true`, the toggle will be disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * A value to replace `tabIndex` with.
   */
  overrideTabIndex?: number;
  /**
   * The Callback is fired when the state of `pressed` changes.
   */
  onPressedChange?: (pressed: boolean) => void;
};

export type Props = Omit<
  MergeElementProps<"button", OwnProps>,
  "defaultValue" | "defaultChecked"
>;

const ToggleBase = (props: Props, ref: React.Ref<HTMLButtonElement>) => {
  const {
    value,
    children: childrenProp,
    className: classNameProp,
    overrideTabIndex,
    defaultPressed,
    pressed,
    autoFocus = false,
    disabled = false,
    onPressedChange,
    onBlur,
    onFocus,
    onKeyDown,
    onKeyUp,
    ...otherProps
  } = props;

  const toggleGroupCtx = React.useContext(ToggleGroupContext);

  if (toggleGroupCtx && typeof value === "undefined") {
    throw new SystemError(
      [
        "The `value` property is missing.",
        "It's mandatory to provide a `value` property " +
          "when <ToggleGroup /> is a wrapper for <Toggle />.",
      ].join("\n"),
      "Toggle",
    );
  }

  const groupCtx = toggleGroupCtx
    ? {
        value: toggleGroupCtx.value,
        onChange: toggleGroupCtx.onChange,
      }
    : null;

  const rootRef = React.useRef<HTMLButtonElement>(null);

  const checkBase = useCheckBase({
    value,
    autoFocus,
    disabled,
    checked: pressed,
    togglable: true,
    keyboardActivationBehavior: toggleGroupCtx?.keyboardActivationBehavior,
    selectMode: toggleGroupCtx?.multiple ? "multiple" : "single",
    defaultChecked: defaultPressed,
    enterKeyFunctionality: "check",
    groupCtx,
    getGroupElement: () => rootRef.current?.closest("[role='group']") ?? null,
    getGroupItems: group =>
      Array.from(
        group.querySelectorAll<HTMLElement>(`[data-slot='${Slots.Root}']`),
      ),
    onChange: onPressedChange,
    onBlur,
    onFocus,
    onKeyDown,
    onKeyUp,
  });

  const handleRef = useForkedRefs(ref, rootRef, checkBase.handleControllerRef);

  const renderProps: RenderProps = {
    disabled,
    pressed: checkBase.checked as boolean,
    focusedVisible: checkBase.isFocusedVisible,
  };

  const classNameProps: ClassNameProps = renderProps;

  const className = resolvePropWithRenderContext(classNameProp, classNameProps);
  const children = resolvePropWithRenderContext(childrenProp, renderProps);

  const refCallback = (node: HTMLButtonElement | null) => {
    handleRef(node);

    if (!node) return;

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
        { scope: "Toggle", type: "error" },
      );
    }
  };

  const calcTabIndex = () => {
    if (typeof overrideTabIndex !== "undefined") return overrideTabIndex;
    if (disabled) return -1;
    if (!toggleGroupCtx) return 0;
    if (toggleGroupCtx.multiple) return 0;

    const forcedTabableItem = toggleGroupCtx.forcedTabability;

    if (forcedTabableItem && forcedTabableItem === value) return 0;

    const isSelected = toggleGroupCtx.value === value;

    if (!isSelected) return -1;

    return 0;
  };

  const dataAttrs = {
    "data-slot": Slots.Root,
    "data-pressed": renderProps.pressed ? "" : undefined,
    "data-disabled": renderProps.disabled ? "" : undefined,
    "data-entity": value,
    "data-focus-visible": renderProps.focusedVisible ? "" : undefined,
  };

  return (
    <button
      {...otherProps}
      // @ts-expect-error React hasn't added `inert` yet
      inert={disabled ? "" : undefined}
      className={className}
      tabIndex={calcTabIndex()}
      type="button"
      ref={refCallback}
      disabled={disabled}
      onFocus={checkBase.handleFocus}
      onBlur={checkBase.handleBlur}
      onKeyDown={checkBase.handleKeyDown}
      onKeyUp={checkBase.handleKeyUp}
      onClick={checkBase.handleClick}
      aria-pressed={checkBase.checked}
      {...dataAttrs}
    >
      {children}
    </button>
  );
};

const Toggle = componentWithForwardedRef(ToggleBase, "Toggle");

export default Toggle;
