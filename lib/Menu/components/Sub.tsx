import * as React from "react";
import type { MergeElementProps } from "../../types";
import {
  componentWithForwardedRef,
  useDeterministicId,
  useForkedRefs,
} from "../../utils";
import Menu, { type Props as MenuRootProps } from "../Menu";
import { SubRoot as SubRootSlot } from "../slots";
import { MenuItemContext } from "./Item/context";

type OwnProps = Omit<
  MenuRootProps,
  "anchorElement" | "open" | "onEscape" | "onOutsideClick"
>;

export type Props = Omit<
  MergeElementProps<"div", OwnProps>,
  "defaultValue" | "defaultChecked"
>;

const SubBase = (props: Props, ref: React.Ref<HTMLDivElement>) => {
  const { children, className, id: idProp, ...otherProps } = props;

  const id = useDeterministicId(idProp, "styleless-ui__sub-menu");

  const menuItemCtx = React.useContext(MenuItemContext);

  const rootRef = React.useRef<HTMLDivElement>(null);
  const handleRootRef = useForkedRefs(ref, rootRef);

  if (!menuItemCtx) return null;

  const resolveAnchor = () => document.getElementById(menuItemCtx.id);

  menuItemCtx.registerSubMenu(rootRef, id);

  return (
    <Menu
      {...otherProps}
      open={menuItemCtx.isSubMenuOpen()}
      id={id}
      ref={handleRootRef}
      className={className}
      resolveAnchor={resolveAnchor}
      data-slot={SubRootSlot}
      data-submenu
    >
      {children}
    </Menu>
  );
};

const Sub = componentWithForwardedRef(SubBase, "SubMenu");

export default Sub;
