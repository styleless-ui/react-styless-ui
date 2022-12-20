import * as React from "react";
import { type MergeElementProps } from "../../typings.d";
import {
  componentWithForwardedRef,
  computeAccessibleName,
  useButtonBase,
  useDeterministicId,
  useForkedRefs
} from "../../utils";
import SnackbarContext from "../context";
import { Action as SnackbarActionSlot } from "../slots";

interface ActionBaseProps {
  /**
   * The content of the snackbar action.
   */
  children?:
    | React.ReactNode
    | ((ctx: {
        disabled: boolean;
        focusedVisible: boolean;
      }) => React.ReactNode);
  /**
   * The className applied to the component.
   */
  className?:
    | string
    | ((ctx: { disabled: boolean; focusedVisible: boolean }) => string);
}

export type ActionProps = Omit<
  MergeElementProps<"button", ActionBaseProps>,
  "defaultChecked" | "defaultValue"
>;

const SnackbarActionBase = (
  props: ActionProps,
  ref: React.Ref<HTMLButtonElement>
) => {
  const {
    className: classNameProp,
    children: childrenProp,
    id: idProp,
    onBlur,
    onFocus,
    onClick,
    onKeyDown,
    onKeyUp,
    autoFocus,
    disabled = false,
    ...otherProps
  } = props;

  const snackbarCtx = React.useContext(SnackbarContext);

  const id = useDeterministicId(idProp, "styleless-ui__snackbar-action");

  const buttonBase = useButtonBase({
    onBlur,
    onClick,
    onFocus,
    onKeyDown,
    onKeyUp,
    autoFocus,
    disabled
  });

  const rootRef = React.useRef<HTMLButtonElement>(null);
  const handleRef = useForkedRefs(ref, rootRef, buttonBase.handleButtonRef);

  const renderCtx = {
    disabled,
    focusedVisible: buttonBase.isFocusedVisible
  };

  const refCallback = (node: HTMLButtonElement | null) => {
    handleRef(node);

    if (!node) return;

    const accessibleName = computeAccessibleName(node);

    if (!accessibleName) {
      // eslint-disable-next-line no-console
      console.error(
        [
          "[StylelessUI][Snackbar/Action]: Can't determine an accessible name.",
          "It's mandatory to provide an accessible name for the component. " +
            "Possible accessible names:",
          ". Set `aria-label` attribute.",
          ". Set `aria-labelledby` attribute.",
          ". Set `title` attribute.",
          ". Use an informative content.",
          ". Use a <label> with `for` attribute referencing to this component."
        ].join("\n")
      );
    }

    const rootRole = snackbarCtx?.role;

    if (!rootRole) return;
    if (rootRole === "alertdialog") return;

    // eslint-disable-next-line no-console
    console.error(
      [
        "[StylelessUI][Snackbar/Action]: If your snackbar has interactive controls/actions associated with it, you should only use the `alertdialog` role.",
        'To fix the issue set `role="alerdialog".`'
      ].join("\n")
    );
  };

  const className =
    typeof classNameProp === "function"
      ? classNameProp(renderCtx)
      : classNameProp;

  const children =
    typeof childrenProp === "function" ? childrenProp(renderCtx) : childrenProp;

  return (
    <button
      {...otherProps}
      id={id}
      type="button"
      ref={refCallback}
      tabIndex={disabled ? -1 : 0}
      autoFocus={autoFocus}
      className={className}
      disabled={disabled}
      onClick={buttonBase.handleClick}
      onBlur={buttonBase.handleBlur}
      onFocus={buttonBase.handleFocus}
      onKeyDown={buttonBase.handleKeyDown}
      onKeyUp={buttonBase.handleKeyUp}
      data-slot={SnackbarActionSlot}
      data-focus-visible={renderCtx.focusedVisible ? "" : undefined}
    >
      {children}
    </button>
  );
};

const SnackbarAction = componentWithForwardedRef(SnackbarActionBase);

export default SnackbarAction;