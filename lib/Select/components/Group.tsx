import * as React from "react";
import {
  getLabelInfo,
  logger,
  resolvePropWithRenderContext,
} from "../../internals";
import type { MergeElementProps, PropWithRenderContext } from "../../types";
import { componentWithForwardedRef, useDeterministicId } from "../../utils";
import { SelectContext } from "../context";
import { GroupRoot as GroupRootSlot } from "../slots";
import { getOptions } from "../utils";

export type RenderProps = {
  /**
   * The `hidden` state of the component.
   * If no descendant option is visible, it's going to be `true`.
   */
  hidden: boolean;
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
         * Identifies the element (or elements) that labels the component.
         *
         * @see {@link https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-labelledby MDN Web Docs} for more information.
         */
        labelledBy: string;
      };
};

export type Props = Omit<
  MergeElementProps<"div", OwnProps>,
  "defaultChecked" | "defaultValue"
>;

const GroupBase = (props: Props, ref: React.Ref<HTMLDivElement>) => {
  const {
    id: idProp,
    label,
    className: classNameProp,
    children: childrenProp,
    ...otherProps
  } = props;

  const id = useDeterministicId(idProp, "styleless-ui__select__group");

  const labelInfo = getLabelInfo(label, "Select.Group", {
    customErrorMessage: [
      "Invalid `label` property.",
      "The `label` property must be in shape of " +
        "`{ screenReaderLabel: string; } | { labelledBy: string; }`",
    ].join("\n"),
  });

  const ctx = React.useContext(SelectContext);

  const isHidden = React.useMemo(() => {
    let hidden = false;

    const filtered = ctx?.filteredEntities;

    if (filtered != null) {
      if (filtered.length === 0) hidden = true;
      else {
        const options = getOptions(
          React.Children.toArray(
            resolvePropWithRenderContext(childrenProp, { hidden: false }),
          ),
          true,
        );

        hidden = options.every(
          option => !filtered.some(value => value === option.value),
        );
      }
    }

    return hidden;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx?.filteredEntities]);

  if (!ctx) {
    logger("You have to use this component as a descendant of <Select.Root>.", {
      scope: "Select.Group",
      type: "error",
    });

    return null;
  }

  const renderProps: RenderProps = {
    hidden: isHidden,
  };

  const classNameProps: ClassNameProps = renderProps;

  const children = resolvePropWithRenderContext(childrenProp, renderProps);
  const className = resolvePropWithRenderContext(classNameProp, classNameProps);

  return (
    <div
      {...otherProps}
      id={id}
      ref={ref}
      role="group"
      aria-label={labelInfo.srOnlyLabel}
      aria-labelledby={labelInfo.labelledBy}
      aria-hidden={isHidden}
      data-slot={GroupRootSlot}
      data-hidden={isHidden ? "" : undefined}
      className={className}
    >
      {children}
    </div>
  );
};

const Group = componentWithForwardedRef(GroupBase, "Select.Group");

export default Group;
