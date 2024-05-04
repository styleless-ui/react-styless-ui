import * as React from "react";
import { logger, resolvePropWithRenderContext } from "../../internals";
import type { MergeElementProps, PropWithRenderContext } from "../../types";
import {
  componentWithForwardedRef,
  setRef,
  useDeterministicId,
} from "../../utils";
import BaseMenu from "../BaseMenu";
import { MenuContext } from "../context";
import { SubMenuRoot as SubMenuRootSlot } from "../slots";
import { MenuItemContext } from "./Item/context";

export type RenderProps = {
  /**
   * The `open` state of the component.
   */
  open: boolean;
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
};

export type Props = Omit<
  MergeElementProps<"div", OwnProps>,
  "defaultValue" | "defaultChecked"
>;

const SubMenuBase = (props: Props, ref: React.Ref<HTMLDivElement>) => {
  const {
    children: childrenProp,
    className: classNameProp,
    id: idProp,
    ...otherProps
  } = props;

  const id = useDeterministicId(idProp, "styleless-ui__menu-submenu");

  const itemCtx = React.useContext(MenuItemContext);
  const menuCtx = React.useContext(MenuContext);

  if (!menuCtx) {
    logger("You have to use this component as a descendant of <Menu.Root>.", {
      scope: "Menu.SubMenu",
      type: "error",
    });

    return null;
  }

  if (!itemCtx) {
    logger("You have to use this component as `subMenu` prop of <Menu.Item>.", {
      scope: "Menu.SubMenu",
      type: "error",
    });

    return null;
  }

  const openState = itemCtx.isExpanded;

  const renderProps: RenderProps = { open: openState };
  const classNameProps: ClassNameProps = renderProps;

  const children = resolvePropWithRenderContext(childrenProp, renderProps);
  const className = resolvePropWithRenderContext(classNameProp, classNameProps);

  const resolveAnchor = () => document.getElementById(itemCtx.id);

  if (!menuCtx.keepMounted && !openState) return null;

  const refCallback = (node: HTMLElement | null) => {
    setRef(ref, node);

    if (!node) return;

    const anchorItem = document.getElementById(itemCtx.id);

    anchorItem?.setAttribute("data-submenu", id);
  };

  return (
    <BaseMenu
      {...otherProps}
      id={id}
      tabIndex={-1}
      trapFocus={false}
      ref={refCallback}
      activeDescendantId={null}
      resolveAnchor={resolveAnchor}
      alignment="start"
      autoPlacement={{ excludeSides: ["bottom", "top"] }}
      computationMiddleware={menuCtx.computationMiddleware}
      keepMounted={menuCtx.keepMounted}
      open={openState}
      label={{ labelledBy: itemCtx.id }}
      className={className}
      data-slot={SubMenuRootSlot}
      data-root-menu={menuCtx.id}
      data-for-entity={itemCtx.id}
    >
      {children}
    </BaseMenu>
  );
};

const SubMenu = componentWithForwardedRef(SubMenuBase, "Menu.SubMenu");

export default SubMenu;
