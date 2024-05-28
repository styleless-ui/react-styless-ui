import * as React from "react";
import { logger } from "../../internals";
import type { MergeElementProps } from "../../types";
import { componentWithForwardedRef } from "../../utils";
import { InputSliderContext } from "../context";
import { RangeRoot as RangeRootSlot } from "../slots";

type OwnProps = {
  /**
   * The content of the component.
   */
  children?: React.ReactNode;
  /**
   * The className applied to the component.
   */
  className?: string;
};

export type Props = Omit<
  MergeElementProps<"div", OwnProps>,
  | "defaultValue"
  | "value"
  | "defaultChecked"
  | "checked"
  | "onChange"
  | "onChangeCapture"
>;

const RangeBase = (props: Props, ref: React.Ref<HTMLDivElement>) => {
  const { className, children, style: styleProp, ...otherProps } = props;

  const ctx = React.useContext(InputSliderContext);

  if (!ctx) {
    logger(
      "You have to use this component as a descendant of <InputSlider.Root>.",
      {
        scope: "InputSlider.Range",
        type: "error",
      },
    );

    return null;
  }

  const { orientation, getPositions } = ctx;

  const position = getPositions().range;

  const style: React.CSSProperties = {
    ...(styleProp ?? {}),
    ...{
      horizontal: {
        left: `${position.start}%`,
        right: `${position.end}%`,
      },
      vertical: {
        top: `${position.end}%`,
        bottom: `${position.start}%`,
      },
    }[orientation],
    position: "absolute",
  };

  return (
    <div
      {...otherProps}
      ref={ref}
      className={className}
      style={style}
      aria-hidden="true"
      data-slot={RangeRootSlot}
    >
      {children}
    </div>
  );
};

const Range = componentWithForwardedRef(RangeBase, "InputSlider.Range");

export default Range;
