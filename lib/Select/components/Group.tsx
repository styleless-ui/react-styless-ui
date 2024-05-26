import * as React from "react";
import {
  getLabelInfo,
  logger,
  resolvePropWithRenderContext,
} from "../../internals";
import type { MergeElementProps, PropWithRenderContext } from "../../types";
import {
  componentWithForwardedRef,
  useDeterministicId,
  useIsServerHandoffComplete,
} from "../../utils";
import { SelectContext } from "../context";
import { GroupRoot as GroupRootSlot } from "../slots";

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

  const isServerHandoffComplete = useIsServerHandoffComplete();

  const labelInfo = getLabelInfo(label, "Select.Group", {
    customErrorMessage: [
      "Invalid `label` property.",
      "The `label` property must be in shape of " +
        "`{ screenReaderLabel: string; } | { labelledBy: string; }`",
    ].join("\n"),
  });

  const ctx = React.useContext(SelectContext);

  const getOptionElements = () => {
    const group = document.getElementById(id);

    if (!group) return [];

    return Array.from(group.querySelectorAll<HTMLElement>(`[role='option']`));
  };

  const isHidden = React.useMemo(() => {
    if (!isServerHandoffComplete) return false;

    const filtered = ctx?.filteredEntities;

    if (filtered == null) return false;
    if (filtered.length === 0) return true;

    const optionElements: HTMLElement[] = getOptionElements();

    return optionElements.every(
      optionElement =>
        !filtered.some(
          value => value === optionElement.getAttribute("data-entity"),
        ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx?.filteredEntities, isServerHandoffComplete]);

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
