import * as React from "react";
import { flushSync } from "react-dom";
import { SystemKeys, useJumpToChar } from "../../../internals";
import {
  isPrintableKey,
  useEventCallback,
  useForkedRefs,
  useIsFocusVisible,
  useIsMounted,
  useIsomorphicLayoutEffect,
  useOnChange,
} from "../../../utils";
import type { SelectContextValue } from "../../context";

type Props<T extends HTMLElement> = {
  disabled: boolean;
  readOnly: boolean;
  autoFocus: boolean;
  searchable: boolean;
  listOpenState: boolean;
  activeDescendant: SelectContextValue["activeDescendant"];
  onClick?: React.MouseEventHandler<T>;
  onBlur?: React.FocusEventHandler<T>;
  onFocus?: React.FocusEventHandler<T>;
  onKeyDown?: React.KeyboardEventHandler<T>;
  onPrintableKeyDown?: React.KeyboardEventHandler<T>;
  onEscapeKeyDown?: React.KeyboardEventHandler<T>;
  onBackspaceKeyDown?: React.KeyboardEventHandler<T>;
  onInputChange?: React.ChangeEventHandler<HTMLInputElement>;
  getOptionElements: () => HTMLElement[];
  getOptionsInfo: SelectContextValue["getOptions"];
  onFilteredEntities: (
    entities: SelectContextValue["filteredEntities"],
  ) => void;
  onListOpenChange: (nextListOpenState: boolean) => void;
  onActiveDescendantChange: (
    nextActiveDescendant: SelectContextValue["activeDescendant"],
  ) => void;
};

export const useComboboxBase = <T extends HTMLElement>(props: Props<T>) => {
  const {
    onClick,
    onBlur,
    onFocus,
    onKeyDown,
    onInputChange,
    onPrintableKeyDown,
    onEscapeKeyDown,
    onBackspaceKeyDown,
    getOptionElements,
    getOptionsInfo,
    onActiveDescendantChange,
    onListOpenChange,
    onFilteredEntities,
    listOpenState,
    activeDescendant,
    searchable,
    disabled,
    readOnly,
    autoFocus,
  } = props;

  const isMounted = useIsMounted();

  const {
    isFocusVisibleRef,
    onBlur: handleBlurVisible,
    onFocus: handleFocusVisible,
    ref: focusVisibleRef,
  } = useIsFocusVisible<T>();

  const jumpToChar = useJumpToChar({
    activeDescendantElement: activeDescendant,
    getListItems: getOptionElements,
    onActiveDescendantElementChange: onActiveDescendantChange,
  });

  const ref = React.useRef<T>();
  const handleRef = useForkedRefs(ref, focusVisibleRef);

  const isSelectOnly = !searchable;

  const [isFocusedVisible, setIsFocusedVisible] = React.useState(() =>
    disabled ? false : autoFocus,
  );

  if (disabled && isFocusedVisible) setIsFocusedVisible(false);

  // Sync focus visible states
  React.useEffect(() => void (isFocusVisibleRef.current = isFocusedVisible));

  // Initial focus
  useIsomorphicLayoutEffect(() => {
    if (!isFocusedVisible) return;

    ref.current?.focus();
  }, []);

  useOnChange(listOpenState, currentOpenState => {
    if (disabled || readOnly) return;
    if (currentOpenState) return;
    if (!(ref.current instanceof HTMLInputElement)) return;

    ref.current.value = "";
    onFilteredEntities(null);
  });

  const handleClick = useEventCallback<React.MouseEvent<T>>(event => {
    event.preventDefault();
    event.stopPropagation();

    if (disabled || readOnly || !isMounted()) return;

    onClick?.(event);
  });

  const handleFocus = useEventCallback<React.FocusEvent<T>>(event => {
    if (disabled || !isMounted()) {
      event.preventDefault();

      return;
    }

    // Fix for https://github.com/facebook/react/issues/7769
    if (!ref.current) ref.current = event.currentTarget;

    handleFocusVisible(event);

    if (isFocusVisibleRef.current) setIsFocusedVisible(true);

    onFocus?.(event);
  });

  const handleBlur = useEventCallback<React.FocusEvent<T>>(event => {
    if (disabled || !isMounted()) {
      event.preventDefault();

      return;
    }

    handleBlurVisible(event);

    if (isFocusVisibleRef.current === false) setIsFocusedVisible(false);

    onBlur?.(event);
  });

  const handleKeyDown = useEventCallback<React.KeyboardEvent<T>>(event => {
    if (disabled || !isMounted()) {
      event.preventDefault();

      return;
    }

    if (readOnly) return;

    const getAvailableItem = (
      items: (HTMLElement | null)[],
      idx: number,
      forward: boolean,
      prevIdxs: number[] = [],
    ): HTMLElement | null => {
      const item = items[idx];

      if (!item) return null;
      if (prevIdxs.includes(idx)) return null;

      if (
        item.getAttribute("aria-disabled") === "true" ||
        item.hasAttribute("data-hidden") ||
        item.getAttribute("aria-hidden") === "true"
      ) {
        const newIdx =
          (forward ? idx + 1 : idx - 1 + items.length) % items.length;

        return getAvailableItem(items, newIdx, forward, [...prevIdxs, idx]);
      }

      return item;
    };

    const getInitialAvailableItem = (
      items: (HTMLElement | null)[],
      forward: boolean,
    ) => {
      const selectedItems = items.filter(item =>
        item?.hasAttribute("data-selected"),
      );

      return getAvailableItem(
        selectedItems.length > 0 ? selectedItems : items,
        0,
        forward,
      );
    };

    switch (event.key) {
      case SystemKeys.DOWN: {
        event.preventDefault();

        if (!listOpenState) {
          flushSync(() => {
            onListOpenChange(true);
          });

          const items = getOptionElements();
          const nextActive = getInitialAvailableItem(items, true);

          onActiveDescendantChange(nextActive);

          break;
        }

        const items = getOptionElements();
        let nextActive: HTMLElement | null = null;

        if (activeDescendant) {
          const currentIdx = items.findIndex(item => item === activeDescendant);
          const nextIdx = (currentIdx + 1) % items.length;

          nextActive = getAvailableItem(items, nextIdx, true);
        } else nextActive = getInitialAvailableItem(items, true);

        onActiveDescendantChange(nextActive);

        break;
      }

      case SystemKeys.UP: {
        if (readOnly) return;

        event.preventDefault();

        if (!listOpenState) {
          flushSync(() => {
            onListOpenChange(true);
          });

          const items = getOptionElements();
          const nextActive = getInitialAvailableItem(items, true);

          onActiveDescendantChange(nextActive);

          break;
        }

        const items = getOptionElements();
        let nextActive: HTMLElement | null = null;

        if (activeDescendant) {
          const currentIdx = items.findIndex(item => item === activeDescendant);
          const nextIdx =
            currentIdx === -1
              ? 0
              : (currentIdx - 1 + items.length) % items.length;

          nextActive = getAvailableItem(items, nextIdx, false);
        } else nextActive = getInitialAvailableItem(items, false);

        onActiveDescendantChange(nextActive);

        break;
      }

      case SystemKeys.HOME: {
        event.preventDefault();

        if (!listOpenState) break;

        const items = getOptionElements();
        const nextActive = getAvailableItem(items, 0, true);

        onActiveDescendantChange(nextActive);

        break;
      }

      case SystemKeys.END: {
        event.preventDefault();

        if (!listOpenState) break;

        const items = getOptionElements();
        const nextActive = getAvailableItem(items, items.length - 1, false);

        onActiveDescendantChange(nextActive);

        break;
      }

      case SystemKeys.ESCAPE: {
        event.preventDefault();

        onEscapeKeyDown?.(event);

        break;
      }

      case SystemKeys.TAB: {
        onListOpenChange(false);
        break;
      }

      case SystemKeys.BACKSPACE: {
        onBackspaceKeyDown?.(event);
        break;
      }

      case SystemKeys.ENTER: {
        if (!listOpenState) {
          if (!isSelectOnly) break;

          event.preventDefault();
          event.currentTarget.click();
        } else {
          event.preventDefault();
          activeDescendant?.click();
        }

        break;
      }

      default: {
        if (event.key === SystemKeys.SPACE && isSelectOnly) {
          event.preventDefault();

          if (!listOpenState) event.currentTarget.click();
          else activeDescendant?.click();

          break;
        }

        if (isSelectOnly) {
          if (isPrintableKey(event.key)) jumpToChar(event);

          break;
        }

        if (!isPrintableKey(event.key)) break;

        if (!listOpenState) onListOpenChange(true);

        onPrintableKeyDown?.(event);

        break;
      }
    }

    onKeyDown?.(event);
  });

  const handleQueryChange = useEventCallback<
    React.ChangeEvent<HTMLInputElement>
  >(event => {
    if (disabled || readOnly || !isMounted()) {
      event.preventDefault();

      return;
    }

    const target = event.target;

    if (!(target instanceof HTMLInputElement)) return;

    const query = target.value;

    const options = getOptionsInfo();

    const entities = options
      .filter(option => {
        const text = option.valueLabel.toLowerCase();

        return text.includes(query.toLowerCase());
      })
      .map(option => option.value);

    onFilteredEntities(entities);
    onInputChange?.(event);
  });

  return {
    isFocusedVisible,
    handleQueryChange,
    handleBlur,
    handleClick,
    handleFocus,
    handleKeyDown,
    handleRef,
  };
};

export default useComboboxBase;
