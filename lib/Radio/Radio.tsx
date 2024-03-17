import * as React from "react";
import { RadioGroupContext } from "../RadioGroup/context";
import { SystemError, getLabelInfo } from "../internals";
import type { MergeElementProps, PropWithRenderContext } from "../types";
import {
  componentWithForwardedRef,
  useCheckBase,
  useDeterministicId,
  useForkedRefs,
} from "../utils";
import * as Slots from "./slots";

export type RenderProps = {
  /**
   * The `checked` state of the radio.
   */
  checked: boolean;
  /**
   * The `disabled` state of the radio.
   */
  disabled: boolean;
  /**
   * The `:focus-visible` of the radio.
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
   * The label of the radio.
   */
  label:
    | {
        /**
         * The label to use as `aria-label` property.
         */
        screenReaderLabel: string;
      }
    | {
        /**
         * Identifies the element (or elements) that labels the radio.
         *
         * @see {@link https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-labelledby MDN Web Docs} for more information.
         */
        labelledBy: string;
      };
  /**
   * The value of the radio.
   */
  value?: string;
  /**
   * If `true`, the radio will be focused automatically.
   * @default false
   */
  autoFocus?: boolean;
  /**
   * If `true`, the radio will be checked.
   * @default false
   */
  checked?: boolean;
  /**
   * The default state of `checked`. Use when the component is not controlled.
   * @default false
   */
  defaultChecked?: boolean;
  /**
   * If `true`, the radio will be disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * The Callback is fired when the state changes.
   */
  onCheckedChange?: (checkedState: boolean) => void;
  /**
   * A value to replace `tabIndex` with.
   */
  overrideTabIndex?: number;
  onFocus?: React.FocusEventHandler<HTMLButtonElement>;
  onBlur?: React.FocusEventHandler<HTMLButtonElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>;
  onKeyUp?: React.KeyboardEventHandler<HTMLButtonElement>;
};

export type Props = Omit<
  MergeElementProps<"button", OwnProps>,
  "defaultValue" | "onChange"
>;

const RadioBase = (props: Props, ref: React.Ref<HTMLButtonElement>) => {
  const {
    label,
    value,
    children: childrenProp,
    defaultChecked,
    id: idProp,
    overrideTabIndex,
    className: classNameProp,
    checked: checkedProp,
    autoFocus = false,
    disabled = false,
    onCheckedChange,
    onBlur,
    onFocus,
    onKeyDown,
    onKeyUp,
    ...otherProps
  } = props;

  const radioGroupCtx = React.useContext(RadioGroupContext);

  if (radioGroupCtx && typeof value === "undefined") {
    throw new SystemError(
      [
        "The `value` property is missing.",
        "It's mandatory to provide a `value` property " +
          "when <RadioGroup /> is a wrapper for <Radio />.",
      ].join("\n"),
      "Radio",
    );
  }

  const rootRef = React.useRef<HTMLButtonElement>(null);

  const checkBase = useCheckBase({
    value,
    groupCtx: radioGroupCtx,
    checked: checkedProp,
    autoFocus,
    disabled,
    defaultChecked,
    selectMode: "single",
    togglable: false,
    getGroupElement: () =>
      rootRef.current?.closest("[role='radiogroup']") ?? null,
    getGroupItems: group =>
      Array.from(
        group.querySelectorAll<HTMLElement>(`[data-slot='${Slots.Root}']`),
      ),
    onChange: onCheckedChange,
    onBlur,
    onFocus,
    onKeyDown,
    onKeyUp,
  });

  const id = useDeterministicId(idProp, "styleless-ui__radio");

  const handleRef = useForkedRefs(ref, rootRef, checkBase.handleControllerRef);

  const labelInfo = getLabelInfo(label, "Radio", {
    customErrorMessage: [
      "Invalid `label` property.",
      "The `label` property must be in shape of " +
        "`{ screenReaderLabel: string; } | { labelledBy: string; }`",
    ].join("\n"),
  });

  const renderProps: RenderProps = {
    disabled,
    checked: checkBase.checked,
    focusedVisible: checkBase.isFocusedVisible,
  };

  const classNameProps: ClassNameProps = renderProps;

  const children =
    typeof childrenProp === "function"
      ? childrenProp(renderProps)
      : childrenProp;

  const className =
    typeof classNameProp === "function"
      ? classNameProp(classNameProps)
      : classNameProp;

  const calcTabIndex = () => {
    if (typeof overrideTabIndex !== "undefined") return overrideTabIndex;
    if (disabled) return -1;
    if (!radioGroupCtx) return 0;

    const forcedTabableItem = radioGroupCtx.forcedTabability;

    if (forcedTabableItem && forcedTabableItem === value) return 0;

    const isSelected = radioGroupCtx.value === value;

    if (!isSelected) return -1;

    return 0;
  };

  const dataAttrs = {
    "data-slot": Slots.Root,
    "data-disabled": classNameProps.disabled ? "" : undefined,
    "data-focus-visible": classNameProps.focusedVisible ? "" : undefined,
    "data-checked": classNameProps.checked ? "" : undefined,
    "data-entity": value,
  };

  return (
    <button
      {...otherProps}
      id={id}
      tabIndex={calcTabIndex()}
      role="radio"
      className={className}
      type="button"
      ref={handleRef}
      disabled={disabled}
      onFocus={checkBase.handleFocus}
      onBlur={checkBase.handleBlur}
      onKeyDown={checkBase.handleKeyDown}
      onKeyUp={checkBase.handleKeyUp}
      onClick={checkBase.handleClick}
      aria-checked={checkBase.checked}
      aria-label={labelInfo.srOnlyLabel}
      aria-labelledby={labelInfo.labelledBy}
      {...dataAttrs}
    >
      {children}
    </button>
  );
};

const Radio = componentWithForwardedRef(RadioBase, "Radio");

export default Radio;
