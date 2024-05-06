import * as React from "react";
import { CheckGroupContext } from "../CheckGroup/context";
import {
  SystemError,
  getLabelInfo,
  logger,
  resolvePropWithRenderContext,
} from "../internals";
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
   * The `checked` state of the checkbox.
   */
  checked: boolean;
  /**
   * The `readOnly` state of the checkbox.
   */
  readOnly: boolean;
  /**
   * The `disabled` state of the checkbox.
   */
  disabled: boolean;
  /**
   * The `indeterminate` state of the checkbox.
   */
  indeterminate: boolean;
  /**
   * The `:focus-visible` of the checkbox.
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
   * The label of the checkbox.
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
         * Identifies the element (or elements) that labels the checkbox.
         *
         * @see {@link https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-labelledby MDN Web Docs} for more information.
         */
        labelledBy: string;
      };
  /**
   * The value of the checkbox.
   *
   * Opt-in this prop when using with CheckGroup or
   * when using checkbox as a form control that has the `name` prop.
   *
   * Submitted with the form as part of a name/value pair.
   */
  value?: string;
  /**
   * If `true`, the checkbox will be focused automatically.
   *
   * @default false
   */
  autoFocus?: boolean;
  /**
   * If `true`, the checkbox will be checked.
   *
   * If `indeterminate`, the checkbox will appear indeterminate.
   * This does not set the native input element to indeterminate due to inconsistent behavior across browsers.
   *
   * @default false
   */
  checked?: boolean | "indeterminate";
  /**
   * The default state of `checked`. Use when the component is not controlled.
   *
   * @default false
   */
  defaultChecked?: boolean | "indeterminate";
  /**
   * If `true`, the checkbox will be disabled.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * If `true`, the checkbox will be read-only.
   *
   * @default false
   */
  readOnly?: boolean;
  /**
   * A value to replace `tabIndex` with.
   */
  overrideTabIndex?: number;
  /**
   * The name of the form control when submitted.
   * Submitted with the form as part of a name/value pair.
   */
  name?: string;
  /**
   * The Callback is fired when the state changes.
   */
  onCheckedChange?: (checkedState: boolean) => void;
};

export type Props = Omit<
  MergeElementProps<"button", OwnProps>,
  "defaultValue" | "onChange" | "onChangeCapture"
>;

const CheckboxBase = (props: Props, ref: React.Ref<HTMLButtonElement>) => {
  const {
    label,
    value,
    children: childrenProp,
    id: idProp,
    className: classNameProp,
    overrideTabIndex,
    defaultChecked,
    checked,
    name: nameProp,
    autoFocus = false,
    disabled = false,
    readOnly = false,
    onCheckedChange,
    onBlur,
    onFocus,
    onKeyDown,
    onKeyUp,
    ...otherProps
  } = props;

  const checkGroupCtx = React.useContext(CheckGroupContext);

  if (checkGroupCtx) {
    if (typeof value === "undefined") {
      throw new SystemError(
        [
          "The `value` property is missing.",
          "It's mandatory to provide a `value` property " +
            "when <CheckGroup /> is a wrapper for <Checkbox />.",
        ].join("\n"),
        "Checkbox",
      );
    }

    if (typeof nameProp !== "undefined") {
      logger(
        "The `name` prop shouldn't be set " +
          "when <CheckGroup /> is a wrapper for <Checkbox />. " +
          "Set the `name` prop on the <CheckGroup /> instead.",
        { scope: "Checkbox", type: "warn" },
      );
    }

    if (
      typeof checked !== "undefined" ||
      typeof defaultChecked !== "undefined"
    ) {
      logger(
        "The `checked` or `defaultChecked` props shouldn't be set " +
          "when <CheckGroup /> is a wrapper for <Checkbox />. " +
          "Set the checked props on the <CheckGroup /> instead.",
        { scope: "Checkbox", type: "warn" },
      );
    }
  }

  const name = checkGroupCtx?.name != null ? checkGroupCtx.name : nameProp;

  const isDisabled =
    checkGroupCtx?.disabled != null ? checkGroupCtx.disabled : disabled;

  const isReadOnly =
    checkGroupCtx?.readOnly != null ? checkGroupCtx.readOnly : readOnly;

  const rootRef = React.useRef<HTMLButtonElement>(null);

  const checkBase = useCheckBase({
    value,
    autoFocus,
    checked,
    defaultChecked,
    disabled: isDisabled,
    readOnly: isReadOnly,
    groupCtx: checkGroupCtx,
    selectMode: "multiple",
    togglable: true,
    onBlur,
    onFocus,
    onKeyDown,
    onKeyUp,
    getGroupElement: () => rootRef.current?.closest("[role='group']") ?? null,
    getGroupItems: group =>
      Array.from(
        group.querySelectorAll<HTMLElement>(`[data-slot='${Slots.Root}']`),
      ),
    onChange: onCheckedChange,
  });

  const id = useDeterministicId(idProp, "styleless-ui__checkbox");

  const handleRef = useForkedRefs(ref, rootRef, checkBase.handleControllerRef);

  const labelInfo = getLabelInfo(label, "Checkbox", {
    customErrorMessage: [
      "Invalid `label` property.",
      "The `label` property must be in shape of " +
        "`{ screenReaderLabel: string; } | { labelledBy: string; }`",
    ].join("\n"),
  });

  const isIndeterminated = checkBase.checked === "indeterminate";
  const isChecked = isIndeterminated ? false : (checkBase.checked as boolean);

  const renderProps: RenderProps = {
    disabled: isDisabled,
    readOnly: isReadOnly,
    indeterminate: isIndeterminated,
    checked: isChecked,
    focusedVisible: checkBase.isFocusedVisible,
  };

  const classNameProps: ClassNameProps = renderProps;

  const children = resolvePropWithRenderContext(childrenProp, renderProps);
  const className = resolvePropWithRenderContext(classNameProp, classNameProps);

  const refCallback = (node: HTMLButtonElement | null) => {
    handleRef(node);

    if (!node) return;
    if (!isIndeterminated) return;

    const controls = node.getAttribute("aria-controls");

    if (controls) return;

    logger(
      "You must provide the set of checkbox IDs controlled by the mixed " +
        "(`indeterminate`) checkbox by the `aria-controls` property.",
      { scope: "Checkbox", type: "warn" },
    );
  };

  const dataAttrs = {
    "data-slot": Slots.Root,
    "data-disabled": isDisabled ? "" : undefined,
    "data-readonly": isReadOnly ? "" : undefined,
    "data-indeterminate": isIndeterminated ? "" : undefined,
    "data-focus-visible": checkBase.isFocusedVisible ? "" : undefined,
    "data-checked": isChecked ? "" : undefined,
  };

  let tabIndex = disabled ? -1 : 0;

  if (typeof overrideTabIndex !== "undefined") tabIndex = overrideTabIndex;

  const renderHiddenInput = () => {
    if (!name || !value || !isChecked) return null;

    return (
      <input
        type="hidden"
        name={name}
        value={value}
        disabled={isDisabled}
      />
    );
  };

  return (
    <button
      {...otherProps}
      // @ts-expect-error React hasn't added `inert` yet
      inert={isDisabled ? "" : undefined}
      id={id}
      className={className}
      ref={refCallback}
      disabled={isDisabled}
      onFocus={checkBase.handleFocus}
      onBlur={checkBase.handleBlur}
      onKeyDown={checkBase.handleKeyDown}
      onKeyUp={checkBase.handleKeyUp}
      onClick={checkBase.handleClick}
      tabIndex={tabIndex}
      type="button"
      role="checkbox"
      aria-checked={isIndeterminated ? "mixed" : isChecked}
      aria-readonly={isReadOnly}
      aria-label={labelInfo.srOnlyLabel}
      aria-labelledby={labelInfo.labelledBy}
      {...dataAttrs}
    >
      {children}
      {renderHiddenInput()}
    </button>
  );
};

const Checkbox = componentWithForwardedRef(CheckboxBase, "Checkbox");

export default Checkbox;
