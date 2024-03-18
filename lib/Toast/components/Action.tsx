import * as React from "react";
import Button from "../../Button";
import type { PolymorphicProps } from "../../types";
import { componentWithForwardedRef } from "../../utils";
import { ActionRoot as ActionRootSlot } from "../slots";

export type Props<E extends React.ElementType = typeof Button<"button">> =
  PolymorphicProps<E>;

const ActionBase = <
  E extends React.ElementType = typeof Button<"button">,
  R extends HTMLElement = HTMLButtonElement,
>(
  props: Props<E>,
  ref: React.Ref<R>,
) => {
  type TProps = Props<typeof Button<"button">>;

  const { as: RootNode = Button<"button">, ...otherProps } = props as TProps;

  return (
    <RootNode
      {...otherProps}
      ref={ref as TProps["ref"]}
      type="button"
      data-slot={ActionRootSlot}
    />
  );
};

type PolymorphicComponent = <
  E extends React.ElementType = typeof Button<"button">,
>(
  props: Props<E>,
) => JSX.Element | null;

const Action: PolymorphicComponent = componentWithForwardedRef(
  ActionBase,
  "Toast.Action",
);

export default Action;
