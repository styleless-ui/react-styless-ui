import * as React from "react";
import { type PopperProps } from "../Popper";
import { Root as PopperRootSlot } from "../Popper/slots";
import {
  SystemError,
  SystemKeys,
  getLabelInfo,
  resolvePropWithRenderContext,
  useJumpToChar,
} from "../internals";
import type {
  MergeElementProps,
  PropWithRenderContext,
  VirtualElement,
} from "../types";
import {
  componentWithForwardedRef,
  dispatchDiscreteCustomEvent,
  useDeterministicId,
  useEventCallback,
  useEventListener,
  useForkedRefs,
  useOnChange,
} from "../utils";
import BaseMenu from "./BaseMenu";
import { CollapseSubMenuEvent, ExpandSubMenuEvent } from "./constants";
import { MenuContext, type MenuContextValue } from "./context";
import { Root as RootSlot } from "./slots";
import {
  computationMiddleware,
  getAvailableItem,
  getCurrentFocusedElement,
  getCurrentMenuControllerItem,
  getInactiveExpandedDescendant,
  getListItems,
  getOwnControlledMenu,
} from "./utils";

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
  /**
   * A function that will resolve the anchor element for the menu.
   *
   * It has to return `HTMLElement`, or a `VirtualElement`, or `null`.
   * A VirtualElement is an object that implements `getBoundingClientRect(): ClientRect`.
   *
   * If nothing is resolved, the menu won't show up.
   *
   * Please note that this function is only called on the client-side.
   */
  resolveAnchor: () => HTMLElement | VirtualElement | null;
  /**
   * The menu positioning alignment.
   *
   * @default "middle"
   */
  alignment?: PopperProps["alignment"];
  /**
   * 	If `true`, the menu will be open.
   */
  open: boolean;
  /**
   * Callback is called when the menu is about to be closed.
   * This function is required because it will be called when certain interactions occur.
   */
  onClose: () => void;
  /**
   * Used to keep mounting when more control is needed.\
   * Useful when controlling animation with React animation libraries.\
   * It will be inherited by any descendant sub-menus respectively.
   *
   * @default false
   */
  keepMounted?: boolean;
  /**
   * The label of the menu.
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
         * Identifies the element (or elements) that labels the menu.
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

const MenuBase = (props: Props, ref: React.Ref<HTMLDivElement>) => {
  const {
    id: idProp,
    className: classNameProp,
    children: childrenProp,
    label,
    alignment = "middle",
    open = false,
    keepMounted = false,
    resolveAnchor,
    onClose: emitClose,
    onFocus,
    onKeyDown,
    ...otherProps
  } = props;

  if (!emitClose) {
    throw new SystemError("The `onClose` prop needs to be provided.", "Menu");
  }

  const id = useDeterministicId(idProp, "styleless-ui__menu");

  const rootRef = React.useRef<HTMLDivElement>(null);
  const handleRootRef = useForkedRefs(ref, rootRef);

  const previouslyFocusedElement = React.useRef<HTMLElement | null>(null);

  const [activeElement, setActiveElement] = React.useState<HTMLElement | null>(
    null,
  );

  const [activeExpandedDescendant, setActiveExpandedDescendant] =
    React.useState<HTMLElement | null>(null);

  const emitActiveElementChange = React.useCallback(
    (newActiveItem: HTMLElement | null) => {
      setActiveElement(newActiveItem);

      if (!newActiveItem) setActiveExpandedDescendant(null);
      else {
        setActiveExpandedDescendant(
          getCurrentMenuControllerItem(newActiveItem),
        );
      }
    },
    [],
  );

  const jumpToChar = useJumpToChar({
    getListItems: () => getListItems(id, activeExpandedDescendant),
    activeDescendantElement: activeElement,
    onActiveDescendantElementChange: emitActiveElementChange,
  });

  useOnChange(open, currentOpen => {
    if (currentOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      rootRef.current?.focus();
    } else {
      previouslyFocusedElement.current?.focus();
      previouslyFocusedElement.current = null;

      emitActiveElementChange(null);
    }
  });

  const labelProps = getLabelInfo(label, "Menu", {
    customErrorMessage: [
      "Invalid `label` property.",
      "The `label` property must be in shape of " +
        "`{ screenReaderLabel: string; } | { labelledBy: string; }`",
    ].join("\n"),
  });

  const collapseInactiveExpandedDescendants = () => {
    const inactiveEntities = activeExpandedDescendant
      ? null
      : getInactiveExpandedDescendant(id);

    if (!inactiveEntities) return;

    inactiveEntities.forEach(inactiveEntity => {
      const item = document.getElementById(inactiveEntity);

      if (!item) return;

      dispatchDiscreteCustomEvent(item, CollapseSubMenuEvent);
    });
  };

  const handleFocus = useEventCallback<React.FocusEvent>(event => {
    if (event.target === event.currentTarget) return;

    rootRef.current?.focus();

    onFocus?.(event as React.FocusEvent<HTMLDivElement>);
  });

  const handleExitTrap = useEventCallback(() => {
    rootRef.current?.focus();
  });

  const handleOutsideClick = useEventCallback<MouseEvent>(event => {
    const anchor = resolveAnchor();

    if (!anchor) return;
    if (!event.target) return;
    if (!rootRef.current) return;

    const target = event.target as HTMLElement;

    if (rootRef.current === target) return;
    if (anchor === target) return;

    const popper = target.closest<HTMLElement>(
      `[data-slot='${PopperRootSlot}']`,
    );

    if (popper) return;

    emitClose();
  });

  const handleKeyDown = useEventCallback<React.KeyboardEvent>(event => {
    const items = getListItems(id, activeExpandedDescendant);

    const currentFocusedElement = getCurrentFocusedElement(
      items,
      activeElement,
    );

    if (currentFocusedElement) {
      switch (event.key) {
        case SystemKeys.ESCAPE: {
          event.preventDefault();

          emitClose();

          break;
        }

        case SystemKeys.HOME: {
          event.preventDefault();

          const { item } = getAvailableItem(items, 0, true);

          emitActiveElementChange(item);
          collapseInactiveExpandedDescendants();

          break;
        }

        case SystemKeys.END: {
          event.preventDefault();

          const { item } = getAvailableItem(items, items.length - 1, false);

          emitActiveElementChange(item);
          collapseInactiveExpandedDescendants();

          break;
        }

        case SystemKeys.UP: {
          event.preventDefault();

          const { index } = currentFocusedElement;

          collapseInactiveExpandedDescendants();

          if (index === -1) {
            const { item } = getAvailableItem(items, items.length - 1, false);

            emitActiveElementChange(item);

            break;
          }

          const nextIdx = (index - 1 + items.length) % items.length;
          const { item } = getAvailableItem(items, nextIdx, false);

          emitActiveElementChange(item);

          break;
        }

        case SystemKeys.DOWN: {
          event.preventDefault();

          const { index } = currentFocusedElement;

          collapseInactiveExpandedDescendants();

          if (index === -1) {
            const { item } = getAvailableItem(items, 0, true);

            emitActiveElementChange(item);

            break;
          }

          const nextIdx = (index + 1) % items.length;
          const { item } = getAvailableItem(items, nextIdx, true);

          emitActiveElementChange(item);

          break;
        }

        case SystemKeys.LEFT: {
          event.preventDefault();

          const { item } = currentFocusedElement;

          if (!item) break;

          const parent = getCurrentMenuControllerItem(item);

          if (!parent) break;

          const isDisabled =
            parent.getAttribute("aria-disabled") === "true" ||
            parent.hasAttribute("data-disabled") ||
            parent.hasAttribute("data-hidden") ||
            parent.getAttribute("aria-hidden") === "true";

          if (!isDisabled) emitActiveElementChange(parent);

          dispatchDiscreteCustomEvent(parent, CollapseSubMenuEvent);

          break;
        }

        case SystemKeys.RIGHT: {
          event.preventDefault();

          const { item } = currentFocusedElement;

          if (!item) break;

          const isExpandable = item.getAttribute("data-expandable") === "true";

          if (!isExpandable) break;

          dispatchDiscreteCustomEvent(item, ExpandSubMenuEvent);

          const submenu = getOwnControlledMenu(item);

          if (!submenu) break;

          const descendants = Array.from(
            submenu.querySelectorAll<HTMLElement>("[role*='menuitem']"),
          );

          const { item: nextActiveElement } = getAvailableItem(
            descendants,
            0,
            true,
          );

          if (!nextActiveElement) break;

          emitActiveElementChange(nextActiveElement);

          break;
        }

        case SystemKeys.SPACE:
        case SystemKeys.ENTER: {
          event.preventDefault();

          const { item } = currentFocusedElement;

          if (!item) break;

          const isExpandable = item.getAttribute("data-expandable") === "true";

          if (!isExpandable) {
            item.click();

            break;
          }

          dispatchDiscreteCustomEvent(item, ExpandSubMenuEvent);

          const submenu = getOwnControlledMenu(item);

          if (!submenu) break;

          const descendants = Array.from(
            submenu.querySelectorAll<HTMLElement>("[role*='menuitem']"),
          );

          const { item: nextActiveElement } = getAvailableItem(
            descendants,
            0,
            true,
          );

          if (!nextActiveElement) break;

          emitActiveElementChange(nextActiveElement);

          break;
        }

        default: {
          jumpToChar(event as React.KeyboardEvent<HTMLElement>);

          break;
        }
      }
    }

    onKeyDown?.(event as React.KeyboardEvent<HTMLDivElement>);
  });

  const refCallback = React.useCallback(
    (node: HTMLDivElement | null) => {
      handleRootRef(node);

      if (!node) return;
      if (!open) return;

      if (document.activeElement === node) return;

      node.focus();
    },
    [handleRootRef, open],
  );

  const getActiveDescendant = () => {
    if (!activeElement) return undefined;

    return activeElement.id;
  };

  const renderProps: RenderProps = { open };

  const classNameProps = renderProps;

  const children = resolvePropWithRenderContext(childrenProp, renderProps);
  const className = resolvePropWithRenderContext(classNameProp, classNameProps);

  const context: MenuContextValue = {
    id,
    activeElement,
    keepMounted,
    emitClose,
    emitActiveElementChange,
    computationMiddleware,
  };

  if (typeof document !== "undefined") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEventListener(
      {
        target: document,
        eventType: "click",
        handler: handleOutsideClick,
        options: { capture: true },
      },
      open,
    );
  }

  return (
    <BaseMenu
      {...otherProps}
      trapFocus
      autoPlacement={{ excludeSides: ["left", "right"] }}
      id={id}
      ref={refCallback}
      onKeyDown={handleKeyDown}
      onExitTrap={handleExitTrap}
      onFocus={handleFocus}
      activeDescendantId={getActiveDescendant()}
      resolveAnchor={resolveAnchor}
      alignment={alignment}
      keepMounted={keepMounted}
      open={open}
      label={labelProps}
      className={className}
      data-slot={RootSlot}
    >
      <MenuContext.Provider value={context}>{children}</MenuContext.Provider>
    </BaseMenu>
  );
};

const Menu = componentWithForwardedRef(MenuBase, "Menu");

export default Menu;
