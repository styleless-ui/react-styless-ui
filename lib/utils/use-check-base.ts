import * as React from "react";
import {
  requestFormSubmit,
  useControlledProp,
  useEventCallback,
  useForkedRefs,
  useIsFocusVisible,
  useIsMounted,
  useIsomorphicLayoutEffect,
} from ".";
import { SystemKeys } from "../internals";

type GenericGroupContextValue = {
  value: string | string[];
  onChange: (newState: boolean, itemValue: string) => void;
};

type CheckBaseProps = {
  selectMode?: "multiple" | "single";
  enterKeyFunctionality?: "request-form-submit" | "check";
  keyboardActivationBehavior?: "manual" | "automatic";
  value?: string;
  groupCtx: GenericGroupContextValue | null;
  checked?: boolean | "indeterminate";
  defaultChecked?: boolean | "indeterminate";
  togglable?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  getGroupElement: () => HTMLElement | null;
  getGroupItems: (group: HTMLElement) => HTMLElement[];
  onChange?: (checkedState: boolean) => void;
  onBlur?: React.FocusEventHandler<HTMLButtonElement>;
  onFocus?: React.FocusEventHandler<HTMLButtonElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>;
  onKeyUp?: React.KeyboardEventHandler<HTMLButtonElement>;
};

const useCheckBase = (props: CheckBaseProps) => {
  const {
    checked: checkedProp,
    value = "",
    groupCtx,
    defaultChecked,
    getGroupElement,
    getGroupItems,
    onBlur,
    onChange,
    onFocus,
    onKeyDown,
    onKeyUp,
    keyboardActivationBehavior = "automatic",
    enterKeyFunctionality = "request-form-submit",
    selectMode = "check-control",
    autoFocus = false,
    togglable = false,
    disabled = false,
    readOnly = false,
  } = props;

  const isMounted = useIsMounted();

  const [checked, setChecked] = useControlledProp(
    checkedProp,
    defaultChecked,
    false,
  );

  const isSingleSelect = selectMode === "single";

  const checkedState = groupCtx
    ? !isSingleSelect
      ? groupCtx.value.includes(value)
      : groupCtx.value === value
    : checked;

  const {
    isFocusVisibleRef,
    onBlur: handleBlurVisible,
    onFocus: handleFocusVisible,
    ref: focusVisibleRef,
  } = useIsFocusVisible<HTMLButtonElement>();

  const controllerRef = React.useRef<HTMLButtonElement>();
  const handleControllerRef = useForkedRefs(controllerRef, focusVisibleRef);

  const spaceKeyDownRef = React.useRef(false);
  const enterKeyDownRef = React.useRef(false);

  const [isFocusedVisible, setIsFocusedVisible] = React.useState(() =>
    disabled ? false : autoFocus,
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(
    () => void (disabled && isFocusedVisible && setIsFocusedVisible(false)),
  );
  React.useEffect(() => void (isFocusVisibleRef.current = isFocusedVisible));

  // Initial focus
  useIsomorphicLayoutEffect(() => {
    if (isFocusedVisible) controllerRef.current?.focus();
  }, []);

  const emitChange = (newChecked: boolean) => {
    if (readOnly || disabled || !isMounted()) return;
    if (isSingleSelect && checkedState && !togglable) return;

    setChecked(newChecked);
    groupCtx?.onChange(newChecked, value);
    onChange?.(newChecked);
  };

  const handleClick = useEventCallback<React.MouseEvent<HTMLButtonElement>>(
    event => {
      if (readOnly || disabled || !isMounted()) {
        event.preventDefault();

        return;
      }

      event.preventDefault();

      const newChecked =
        checkedState === "indeterminate" ? true : !checkedState;

      emitChange(newChecked);
    },
  );

  const handleFocus = useEventCallback<React.FocusEvent<HTMLButtonElement>>(
    event => {
      if (disabled || !isMounted()) {
        event.preventDefault();

        return;
      }

      // Fix for https://github.com/facebook/react/issues/7769
      if (!controllerRef.current) controllerRef.current = event.currentTarget;

      handleFocusVisible(event);

      if (isFocusVisibleRef.current) setIsFocusedVisible(true);

      onFocus?.(event);
    },
  );

  const handleBlur = useEventCallback<React.FocusEvent<HTMLButtonElement>>(
    event => {
      if (disabled || !isMounted()) {
        event.preventDefault();

        return;
      }

      handleBlurVisible(event);

      if (isFocusVisibleRef.current === false) setIsFocusedVisible(false);

      onBlur?.(event);
    },
  );

  const handleKeyDown = useEventCallback<
    React.KeyboardEvent<HTMLButtonElement>
  >(event => {
    if (disabled || !isMounted() || event.target !== event.currentTarget) {
      event.preventDefault();

      return;
    }

    if ([SystemKeys.SPACE, SystemKeys.ENTER].includes(event.key)) {
      event.preventDefault();

      if (readOnly) return;
    }

    if (isFocusedVisible) {
      if (spaceKeyDownRef.current === false && event.key === SystemKeys.SPACE) {
        spaceKeyDownRef.current = true;
      }

      if (enterKeyDownRef.current === false && event.key === SystemKeys.ENTER) {
        enterKeyDownRef.current = true;
      }
    }

    if (
      groupCtx &&
      isFocusedVisible &&
      isSingleSelect &&
      controllerRef.current
    ) {
      const group = getGroupElement();

      if (!group) return;

      const items = getGroupItems(group);

      const currentItemIdx = items.findIndex(
        item => item.getAttribute("data-entity") === value,
      );

      const currentItem = items[currentItemIdx];

      if (!currentItem) return;

      const dir = window.getComputedStyle(currentItem).direction;

      const goPrev = [
        SystemKeys.UP,
        dir === "ltr" ? SystemKeys.LEFT : SystemKeys.RIGHT,
      ].includes(event.key);

      const goNext = [
        SystemKeys.DOWN,
        dir === "ltr" ? SystemKeys.RIGHT : SystemKeys.LEFT,
      ].includes(event.key);

      let activeItem: HTMLElement | null = null;

      const getAvailableItem = (
        idx: number,
        forward: boolean,
        prevIdxs: number[] = [],
      ): HTMLElement | null => {
        const item = items[idx];

        if (!item) return null;
        if (prevIdxs.includes(idx)) return null;

        const newIdx =
          (forward ? idx + 1 : idx - 1 + items.length) % items.length;

        const isDisabled =
          item.hasAttribute("disabled") ||
          item.getAttribute("aria-disabled") === "true";

        if (!isDisabled) return item;

        return getAvailableItem(newIdx, forward, [...prevIdxs, idx]);
      };

      if (goPrev) {
        activeItem = getAvailableItem(
          (currentItemIdx - 1 + items.length) % items.length,
          false,
        );
      } else if (goNext) {
        activeItem = getAvailableItem(
          (currentItemIdx + 1) % items.length,
          true,
        );
      } else if (event.key === SystemKeys.HOME) {
        activeItem = getAvailableItem(0, true);
      } else if (event.key === SystemKeys.END) {
        activeItem = getAvailableItem(0, false);
      }

      if (activeItem) {
        event.preventDefault();

        activeItem?.focus();
        if (keyboardActivationBehavior === "automatic" && !readOnly) {
          activeItem?.click();
        }
      }
    }

    onKeyDown?.(event);
  });

  const handleKeyUp = useEventCallback<React.KeyboardEvent<HTMLButtonElement>>(
    event => {
      if (disabled || !isMounted() || event.target !== event.currentTarget) {
        event.preventDefault();

        return;
      }

      if ([SystemKeys.SPACE, SystemKeys.ENTER].includes(event.key)) {
        event.preventDefault();

        if (readOnly) return;
      }

      if (isFocusedVisible && !readOnly) {
        if (event.key === SystemKeys.SPACE) spaceKeyDownRef.current = false;
        if (event.key === SystemKeys.ENTER) enterKeyDownRef.current = false;
      }

      const newChecked =
        checkedState === "indeterminate" ? true : !checkedState;

      if (event.key === SystemKeys.SPACE) {
        emitChange(newChecked);
      } else if (event.key === SystemKeys.ENTER) {
        enterKeyFunctionality === "request-form-submit"
          ? requestFormSubmit(event.target as HTMLElement)
          : emitChange(newChecked);
      }

      onKeyUp?.(event);
    },
  );

  return {
    checked: checkedState,
    isFocusedVisible,
    controllerRef,
    emitChange,
    handleBlur,
    handleClick,
    handleFocus,
    handleKeyDown,
    handleKeyUp,
    handleControllerRef,
  };
};

export default useCheckBase;
