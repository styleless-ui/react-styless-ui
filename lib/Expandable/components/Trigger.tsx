import * as React from "react";
import Button from "../../Button";
import { logger } from "../../internals";
import type {
  EmptyObjectNotation,
  PolymorphicComponent,
  PolymorphicProps,
} from "../../types";
import {
  componentWithForwardedRef,
  setRef,
  useDeterministicId,
} from "../../utils";
import { ExpandableContext } from "../context";
import {
  ContentRoot as ContentRootSlot,
  Root as RootSlot,
  TriggerRoot as TriggerRootSlot,
} from "../slots";

type DefaultElementType = typeof Button<"div">;

export type Props<E extends React.ElementType = DefaultElementType> =
  PolymorphicProps<E>;

const TriggerBase = <
  E extends React.ElementType = DefaultElementType,
  R extends HTMLElement = HTMLDivElement,
>(
  props: Props<E>,
  ref: React.Ref<R>,
) => {
  const {
    as: RootNode = Button<"div">,
    id: idProp,
    onClick,
    ...otherProps
  } = props as Props<DefaultElementType>;

  const ctx = React.useContext(ExpandableContext);

  const id = useDeterministicId(idProp, "styleless-ui__expandable-trigger");

  if (!ctx) {
    logger(
      "You have to use this component as a descendant of <Expandable.Root>.",
      {
        scope: "Expandable.Trigger",
        type: "error",
      },
    );

    return null;
  }

  const handleClick = (event: React.MouseEvent<R>) => {
    ctx.emitExpandChange(!ctx.isExpanded);
    onClick?.(event as unknown as React.MouseEvent<HTMLDivElement>);
  };

  const refCallback = (node: R | null) => {
    setRef(ref, node);

    if (!node) return;

    const parent = node.closest(`[data-slot="${RootSlot}"]`);

    if (!parent) return;

    const content = parent.querySelector<HTMLDivElement>(
      `[data-slot="${ContentRootSlot}"]`,
    );

    if (!content) return;

    node.setAttribute("aria-controls", content.id);
    content.setAttribute("aria-labelledby", id);
  };

  return (
    <RootNode
      {...otherProps}
      id={id}
      onClick={handleClick as unknown as Props<DefaultElementType>["onClick"]}
      ref={refCallback as Props<DefaultElementType>["ref"]}
      data-slot={TriggerRootSlot}
      aria-expanded={ctx.isExpanded}
      data-expanded={ctx.isExpanded ? "" : undefined}
    />
  );
};

const Trigger: PolymorphicComponent<DefaultElementType, EmptyObjectNotation> =
  componentWithForwardedRef(TriggerBase, "Expandable.Trigger");

export default Trigger;
