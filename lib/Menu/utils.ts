/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as React from "react";
import type { PopperProps } from "../Popper";
import { logger } from "../internals";
import { getDirection, isHTMLElement, useEventCallback } from "../utils";
import { MenuContext } from "./context";

export const getListItems = (
  rootId: string,
  activeExpanded: HTMLElement | null,
) => {
  let id = rootId;

  if (activeExpanded) {
    const submenuId = activeExpanded.getAttribute("data-submenu");

    if (submenuId) id = submenuId;
  }

  const root = document.getElementById(id);

  if (!root) return [];

  return Array.from(root.querySelectorAll<HTMLElement>("[role*='menuitem']"));
};

export const getTrees = (rootId: string, expanded: string[]) => {
  const root = document.getElementById(rootId);

  if (!root) return [];

  const submenus = expanded
    .map(expandedEntityName =>
      document.querySelector<HTMLElement>(
        `[data-for-entity='${expandedEntityName}']`,
      ),
    )
    .filter(Boolean) as HTMLElement[];

  return [root, ...submenus];
};

export const getOwnControlledMenu = (element: HTMLElement) => {
  const submenuId = element.getAttribute("data-submenu");

  if (!submenuId) return null;

  return document.getElementById(submenuId);
};

export const getCurrentMenu = (element: HTMLElement) =>
  element.closest<HTMLElement>("[role='menu']");

export const getCurrentMenuControllerItem = (element: HTMLElement) => {
  const ownMenu = getCurrentMenu(element);

  if (!ownMenu) return null;

  const controllerItemId = ownMenu.getAttribute("data-for-entity");

  if (!controllerItemId) return null;

  return document.getElementById(controllerItemId);
};

export const getInactiveExpandedDescendant = (rootId: string) => {
  const submenus = Array.from(
    document.querySelectorAll<HTMLElement>(`[data-root-menu='${rootId}']`),
  );

  return submenus
    .map(menu =>
      menu.hasAttribute("data-open")
        ? menu.getAttribute("data-for-entity")
        : null,
    )
    .filter(Boolean) as string[];
};

export const getAvailableItem = (
  items: (HTMLElement | null)[],
  idx: number,
  forward: boolean,
  prevIdxs: number[] = [],
): { item: HTMLElement | null; index: number } => {
  const item = items[idx];

  if (!item) return { item: null, index: idx };
  if (prevIdxs.includes(idx)) return { item: null, index: idx };

  if (
    item.getAttribute("aria-disabled") === "true" ||
    item.hasAttribute("data-hidden") ||
    item.getAttribute("aria-hidden") === "true"
  ) {
    const newIdx = (forward ? idx + 1 : idx - 1 + items.length) % items.length;

    return getAvailableItem(items, newIdx, forward, [...prevIdxs, idx]);
  }

  return { item, index: idx };
};

export const getCurrentFocusedElement = (
  items: HTMLElement[],
  activeElement: HTMLElement | null,
): null | { item: HTMLElement | null; index: number } => {
  if (items.length === 0) return null;

  if (activeElement) {
    const itemIdx = items.findIndex(item => item === activeElement);

    if (itemIdx !== -1) {
      return {
        item: items[itemIdx]!,
        index: itemIdx,
      };
    }
  }

  return { item: null, index: -1 };
};

export const computationMiddleware: NonNullable<
  PopperProps["computationMiddleware"]
> = ({ overflow, elementRects, placement, elements }) => {
  const dir = getDirection(elements.popperElement);

  if (dir === "rtl") {
    const desiredPlacement: typeof placement = "left-start";
    const oppOfDesiredPlacement: typeof placement = "right-start";

    if (placement === desiredPlacement) return { placement };
    if (overflow.left + elementRects.popperRect.width <= 0) {
      return { placement: desiredPlacement };
    } else return { placement: oppOfDesiredPlacement };
  } else {
    const desiredPlacement: typeof placement = "right-start";
    const oppOfDesiredPlacement: typeof placement = "left-start";

    if (placement === desiredPlacement) return { placement };
    if (overflow.right + elementRects.popperRect.width <= 0) {
      return { placement: desiredPlacement };
    } else return { placement: oppOfDesiredPlacement };
  }
};

export const getMenuItem = (event: React.MouseEvent) => {
  if (isHTMLElement(event.target)) {
    const menuItem = event.target.closest<HTMLElement>("[role*='menuitem']");

    if (!menuItem) return null;

    const isDefaultItem = menuItem.role === "menuitem";
    const isDisabled = menuItem.hasAttribute("data-disabled");
    const isActive = menuItem.hasAttribute("data-active");
    const isExpandable = menuItem.getAttribute("data-expandable") === "true";
    const isExpanded = menuItem.hasAttribute("data-expanded");
    const entityName = menuItem.getAttribute("data-entity")!;

    return {
      element: menuItem,
      entityName,
      isDefaultItem,
      isDisabled,
      isExpandable,
      isExpanded,
      isActive,
    };
  }

  return null;
};

export const useBaseItem = (props: {
  type: "expandable-item" | "non-expandable-item" | "check-item" | "radio-item";
  entityName: string;
  disabled: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
}) => {
  const { type, entityName, disabled, onClick, onMouseEnter, onMouseLeave } =
    props;

  const menuCtx = React.useContext(MenuContext);

  let isInvalid = false;

  if (!menuCtx) {
    const scopeMap = {
      "expandable-item": "Menu.Item",
      "non-expandable-item": "Menu.Item",
      "check-item": "Menu.CheckItem",
      "radio-item": "Menu.RadioItem",
    } satisfies Record<typeof type, string>;

    logger("You have to use this component as a descendant of <Menu.Root>.", {
      scope: scopeMap[type],
      type: "error",
    });

    isInvalid = true;
  }

  const isExpandable = type === "expandable-item";
  const isActive =
    menuCtx?.activeElement?.getAttribute("data-entity") === entityName;

  const handleClick = useEventCallback<React.MouseEvent<HTMLDivElement>>(
    event => {
      if (disabled) {
        event.preventDefault();

        return;
      }

      if (!isExpandable) menuCtx?.emitClose();

      onClick?.(event);
    },
  );

  const handleMouseEnter = useEventCallback<React.MouseEvent<HTMLDivElement>>(
    event => {
      if (disabled) {
        event.preventDefault();

        return;
      }

      const item = event.currentTarget as HTMLElement;

      menuCtx?.emitActiveElementChange(item);

      onMouseEnter?.(event);
    },
  );

  const handleMouseLeave = useEventCallback<React.MouseEvent<HTMLDivElement>>(
    event => {
      if (disabled) {
        event.preventDefault();

        return;
      }

      menuCtx?.emitActiveElementChange(null);

      onMouseLeave?.(event);
    },
  );

  return {
    isActive,
    isInvalid,
    handleClick,
    handleMouseEnter,
    handleMouseLeave,
  };
};
