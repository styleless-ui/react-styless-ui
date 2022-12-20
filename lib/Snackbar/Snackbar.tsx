import * as React from "react";
import { SystemKeys } from "../internals";
import Portal from "../Portal";
import { type MergeElementProps } from "../typings.d";
import {
  componentWithForwardedRef,
  useDeterministicId,
  useEventListener,
  useIsMounted,
  useOnChange,
  usePreviousValue
} from "../utils";
import SnackbarContext from "./context";
import { Root as SnackbarRootSlot } from "./slots";

interface RootBaseProps {
  /**
   * The content of the snackbar.
   */
  children?: React.ReactNode | ((ctx: { openState: boolean }) => string);
  /**
   * The className applied to the snackbar.
   */
  className?: string | ((ctx: { openState: boolean }) => string);
  /**
   * If `true`, the snackbar will be opened.
   */
  open: boolean;
  /**
   * The DOM node reference or selector to focus when the snackbar closes.
   *
   * If not provided, the previously focused element will be focused.
   */
  focusAfterClosed?: React.RefObject<HTMLElement> | string;
  role?: "alert" | "status" | "alertdialog";
  /**
   * Used to keep mounting when more control is needed.\
   * Useful when controlling animation with React animation libraries.
   * @default false
   */
  keepMounted?: boolean;
  /**
   * The time in milliseconds that should elapse before automatically closing the snackbar.
   */
  duration?: number;
  /**
   * The Callback fires when the duration ends.
   */
  onDurationEnd?: () => void;
  /**
   * Callback fired when the `Escape` key is released.
   */
  onEscapeKeyUp?: (event: KeyboardEvent) => void;
}

export type RootProps = Omit<
  MergeElementProps<"div", RootBaseProps>,
  "defaultChecked" | "defaultValue"
>;

const SnackbarBase = (props: RootProps, ref: React.Ref<HTMLDivElement>) => {
  const {
    open,
    duration,
    style,
    onEscapeKeyUp,
    onDurationEnd,
    id: idProp,
    focusAfterClosed,
    role = "alert",
    keepMounted = false,
    children: childrenProp,
    className: classNameProp,
    ...otherProps
  } = props;

  const isMounted = useIsMounted();

  const id = useDeterministicId(idProp, "styleless-ui__snackbar");

  const timeoutRef = React.useRef<number>(NaN);
  const previouslyFocusedElement = React.useRef<HTMLElement | null>(null);

  const prevOpen = usePreviousValue(open);

  React.useEffect(() => {
    if (!open && typeof prevOpen === "boolean" && open !== prevOpen) {
      typeof focusAfterClosed === "string"
        ? document.querySelector<HTMLElement>(focusAfterClosed)?.focus()
        : typeof focusAfterClosed === "object"
        ? focusAfterClosed.current?.focus()
        : previouslyFocusedElement.current
        ? previouslyFocusedElement.current.focus()
        : document.body.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prevOpen]);

  React.useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

  useOnChange(open, openState => {
    if (!isMounted()) return;

    previouslyFocusedElement.current =
      document.activeElement as HTMLElement | null;

    if (openState && duration && onDurationEnd) {
      timeoutRef.current = window.setTimeout(onDurationEnd, duration);
    } else window.clearTimeout(timeoutRef.current);
  });

  const className =
    typeof classNameProp === "function"
      ? classNameProp({ openState: open })
      : classNameProp;

  const children =
    typeof childrenProp === "function"
      ? childrenProp({ openState: open })
      : childrenProp;

  const context = React.useMemo(() => ({ id, role, open }), [id, role, open]);

  if (typeof document !== "undefined") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEventListener(
      {
        target: document,
        eventType: "keyup",
        handler: event => {
          if (event.key === SystemKeys.ESCAPE) onEscapeKeyUp?.(event);
        }
      },
      open && onEscapeKeyUp != null
    );
  }

  return keepMounted || (!keepMounted && open) ? (
    <Portal>
      <div
        data-slot="portal"
        role="presentation"
        tabIndex={-1}
        aria-hidden={!open}
        style={{ position: "absolute", top: 0, left: 0, right: 0 }}
      >
        <div
          {...otherProps}
          style={{ ...(style ?? {}), position: "fixed" }}
          id={id}
          ref={ref}
          data-slot={SnackbarRootSlot}
          className={className}
        >
          <SnackbarContext.Provider value={context}>
            {children}
          </SnackbarContext.Provider>
        </div>
      </div>
    </Portal>
  ) : null;
};

const Snackbar = componentWithForwardedRef(SnackbarBase);

export default Snackbar;