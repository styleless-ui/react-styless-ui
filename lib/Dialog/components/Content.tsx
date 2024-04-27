import * as React from "react";
import { logger } from "../../internals";
import type { MergeElementProps } from "../../types";
import { componentWithForwardedRef, useDeterministicId } from "../../utils";
import { DialogContext } from "../context";
import { ContentRoot as ContentRootSlot } from "../slots";

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
  "defaultChecked" | "defaultValue"
>;

const ContentBase = (props: Props, ref: React.Ref<HTMLDivElement>) => {
  const { className, children, id: idProp, ...otherProps } = props;

  const ctx = React.useContext(DialogContext);

  const id = useDeterministicId(idProp, "styleless-ui__dialog-content");

  if (!ctx) {
    logger("You have to use this component as a descendant of <Dialog.Root>.", {
      scope: "Dialog.Content",
      type: "error",
    });

    return null;
  }

  return (
    <div
      {...otherProps}
      id={id}
      ref={ref}
      className={className}
      role={ctx.role}
      data-slot={ContentRootSlot}
      aria-modal="true"
    >
      {children}
    </div>
  );
};

const Content = componentWithForwardedRef(ContentBase, "Dialog.Content");

export default Content;
