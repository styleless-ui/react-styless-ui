import * as React from "react";
import { getLabelInfo, resolvePropWithRenderContext } from "../internals";
import type { MergeElementProps, PropWithRenderContext } from "../types";
import { componentWithForwardedRef, remap } from "../utils";
import { Root as RootSlot } from "./slots";

export type RenderProps = {
  /**
   * The value of the progress bar.
   */
  value: number;
  /**
   * The percentage value of the progress bar.
   */
  percentageValue: number;
  /**
   * The text used to represent the value.
   */
  valueText: string;
  /**
   * Determines whether the progress bar is indeterminate or not.
   */
  indeterminate: boolean;
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
   * The current value of the progress bar.
   */
  value: number | "indeterminate";
  /**
   * The minimum allowed value of the progress bar.
   * Should not be greater than or equal to `max`.
   */
  min: number;
  /**
   * The maximum allowed value of the progress bar.
   * Should not be less than or equal to `min`.
   */
  max: number;
  /**
   * A string value that provides a user-friendly name
   * for the current value of the progress bar.
   * This is important for screen reader users.
   *
   * If component is indeterminate, it ignores valuetext
   * since we don't have any deterministic value.
   */
  valueText: string;
  /**
   * The label of the component.
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
         * Identifies the element (or elements) that labels the progress bar.
         *
         * @see {@link https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-labelledby MDN Web Docs} for more information.
         */
        labelledBy: string;
      };
};

export type Props = Omit<
  MergeElementProps<"div", OwnProps>,
  "defaultValue" | "defaultChecked"
>;

const ProgressBarBase = (props: Props, ref: React.Ref<HTMLDivElement>) => {
  const {
    className: classNameProp,
    children: childrenProp,
    value,
    min,
    max,
    valueText,
    label,
    ...otherProps
  } = props;

  const labelInfo = getLabelInfo(label, "ProgressBar", {
    customErrorMessage: [
      "Invalid `label` property.",
      "The `label` property must be in shape of " +
        "`{ screenReaderLabel: string; } | { labelledBy: string; }`",
    ].join("\n"),
  });

  const isIndeterminate = value === "indeterminate";

  const numericValue = isIndeterminate ? min : value;

  const percentageValue = isIndeterminate
    ? min
    : remap(numericValue, min, max, 0, 100);

  const renderProps: RenderProps = {
    percentageValue,
    value: numericValue,
    valueText,
    indeterminate: isIndeterminate,
  };

  const classNameProps: ClassNameProps = renderProps;

  const children = resolvePropWithRenderContext(childrenProp, renderProps);
  const className = resolvePropWithRenderContext(classNameProp, classNameProps);

  return (
    <div
      {...otherProps}
      role="progressbar"
      ref={ref}
      className={className}
      aria-valuenow={isIndeterminate ? undefined : value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={isIndeterminate ? undefined : valueText}
      aria-label={labelInfo.srOnlyLabel}
      aria-labelledby={labelInfo.labelledBy}
      data-slot={RootSlot}
      data-indeterminate={isIndeterminate ? "" : undefined}
    >
      {children}
    </div>
  );
};

const ProgressBar = componentWithForwardedRef(ProgressBarBase, "ProgressBar");

export default ProgressBar;
