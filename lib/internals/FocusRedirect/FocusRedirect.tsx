import * as React from "react";
import {
  contains,
  isFocusable,
  useEventCallback,
  useEventListener,
  useForkedRefs,
  usePreviousValue,
} from "../../utils";
import SystemError from "../SystemError";

export type Props = {
  /**
   * The content of the component.
   */
  children: JSX.Element;
  /**
   * If `true`, the focus will be redirected here (once!).
   *
   * @default false
   */
  enabled?: boolean;
};

const FocusRedirect = (props: Props) => {
  const { children, enabled = false } = props;

  const child = (() => {
    try {
      if (!React.isValidElement(children)) throw 0;
      return React.Children.only(
        children,
      ) as React.FunctionComponentElement<unknown>;
    } catch {
      throw new SystemError(
        "The `children` prop has to be a single valid element.",
        "FocusRedirect",
      );
    }
  })();

  const prevEnabledState = usePreviousValue(enabled);

  const ignoreFocusChanges = React.useRef(false);
  const isRedirectionCompleted = React.useRef(false);
  const isRestored = React.useRef(false);

  const nodeToRestore = React.useRef<HTMLElement | null>(null);
  const lastFocusableElement = React.useRef<HTMLElement | null>(null);
  const firstFocusableElement = React.useRef<HTMLElement | null>(null);

  const rootRef = React.useRef<HTMLElement>(null);
  const handleRootRef = useForkedRefs(rootRef, child.ref ?? null);

  const childProps = { ref: handleRootRef };

  if (enabled !== prevEnabledState) {
    nodeToRestore.current = null;

    lastFocusableElement.current = null;
    firstFocusableElement.current = null;

    isRedirectionCompleted.current = false;
    isRestored.current = false;
  }

  const attemptFocus = (element: HTMLElement) => {
    if (!element) return false;
    if (!isFocusable(element)) return false;

    ignoreFocusChanges.current = true;

    try {
      element.focus();
      // eslint-disable-next-line no-empty
    } catch {}

    ignoreFocusChanges.current = false;

    return document.activeElement === element;
  };

  const getLastFocusableDescendant = (
    element?: Element,
  ): HTMLElement | null => {
    const node = element ?? rootRef.current;

    if (!node) return null;

    for (const child of Array.from(node.children).reverse()) {
      if (isFocusable(child)) return child as HTMLElement;
      const elFound = getLastFocusableDescendant(child);

      if (!elFound) continue;
      return elFound;
    }

    return null;
  };

  const getFirstFocusableDescendant = (
    element?: Element,
  ): HTMLElement | null => {
    const node = element ?? rootRef.current;

    if (!node) return null;

    for (const child of Array.from(node.children)) {
      if (isFocusable(child)) return child as HTMLElement;
      const elFound = getFirstFocusableDescendant(child);

      if (!elFound) continue;
      return elFound;
    }

    return null;
  };

  if (typeof document !== "undefined") {
    /* eslint-disable react-hooks/rules-of-hooks */
    useEventListener(
      {
        target: document,
        eventType: "keydown",
        handler: useEventCallback<KeyboardEvent>(event => {
          if (!rootRef.current) return;
          if (isRestored.current) return;
          if (!lastFocusableElement.current) return;

          const isTabKey = event.key === "Tab";
          const isShiftTabKey = isTabKey && event.shiftKey;

          if (
            (isTabKey &&
              !isShiftTabKey &&
              event.target === lastFocusableElement.current) ||
            (isShiftTabKey && event.target === firstFocusableElement.current)
          ) {
            event.preventDefault();

            nodeToRestore.current?.focus();
            isRestored.current = true;
          }
        }),
      },
      enabled,
    );
    useEventListener(
      {
        target: document,
        eventType: "focusout",
        handler: useEventCallback<FocusEvent>(event => {
          if (!rootRef.current) return;
          if (ignoreFocusChanges.current) return;
          if (isRestored.current) return;

          if (!nodeToRestore.current)
            nodeToRestore.current = event.relatedTarget as HTMLElement | null;
        }),
      },
      enabled,
    );
    useEventListener(
      {
        target: document,
        eventType: "focusin",
        handler: useEventCallback<FocusEvent>(event => {
          if (ignoreFocusChanges.current) return;
          if (!rootRef.current) return;
          if (contains(rootRef.current, event.target as HTMLElement)) return;
          if (!isRedirectionCompleted.current) {
            if (!lastFocusableElement.current)
              lastFocusableElement.current = getLastFocusableDescendant();

            if (!firstFocusableElement.current)
              firstFocusableElement.current = getFirstFocusableDescendant();

            isRedirectionCompleted.current = true;

            if (!firstFocusableElement.current) return;
            attemptFocus(firstFocusableElement.current);
          }
        }),
      },
      enabled,
    );
    /* eslint-enable react-hooks/rules-of-hooks */
  }

  return React.cloneElement(child, childProps);
};

export default FocusRedirect;
