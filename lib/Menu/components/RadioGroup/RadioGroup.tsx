import * as React from "react";
import { getLabelInfo } from "../../../internals";
import type { MergeElementProps } from "../../../types";
import { componentWithForwardedRef, useDeterministicId } from "../../../utils";
import { RadioGroupRoot as RadioGroupRootSlot } from "../../slots";
import { RadioGroupContext } from "./context";

type OwnProps = {
  /**
   * The content of the component.
   */
  children?: React.ReactNode;
  /**
   * The className applied to the component.
   */
  className?: string;
  /**
   * The label of the group.
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
         * Identifies the element (or elements) that labels the group.
         *
         * @see {@link https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-labelledby MDN Web Docs} for more information.
         */
        labelledBy: string;
      };
  /**
   * The value of the selected radio.
   */
  value: string;
  /**
   * The Callback is fired when the state changes.
   */
  onValueChange?: (value: string) => void;
};

export type Props = Omit<
  MergeElementProps<"div", OwnProps>,
  "defaultChecked" | "checked" | "onChange" | "onChangeCapture" | "defaultValue"
>;

const RadioGroupBase = (props: Props, ref: React.Ref<HTMLDivElement>) => {
  const {
    children,
    className,
    value,
    onValueChange,
    label,
    id: idProp,
    ...otherProps
  } = props;

  const id = useDeterministicId(idProp, "styleless-ui__menu-radio-group");

  const labelInfo = getLabelInfo(label, "Menu.RadioGroup", {
    customErrorMessage: [
      "Invalid `label` property.",
      "The `label` property must be in shape of " +
        "`{ screenReaderLabel: string; } | { labelledBy: string; }`",
    ].join("\n"),
  });

  const handleChange = (radioValue: string) => {
    onValueChange?.(radioValue);
  };

  return (
    <div
      {...otherProps}
      id={id}
      ref={ref}
      className={className}
      role="group"
      tabIndex={-1}
      data-slot={RadioGroupRootSlot}
      aria-label={labelInfo.srOnlyLabel}
      aria-labelledby={labelInfo.labelledBy}
    >
      <RadioGroupContext.Provider
        value={{ value, onValueChange: handleChange }}
      >
        {children}
      </RadioGroupContext.Provider>
    </div>
  );
};

const RadioGroup = componentWithForwardedRef(RadioGroupBase, "Menu.RadioGroup");

export default RadioGroup;
