import * as React from "react";
import Portal from "../Portal";
import {
  FocusTrap,
  SystemError,
  SystemKeys,
  resolvePropWithRenderContext,
} from "../internals";
import type { MergeElementProps, PropWithRenderContext } from "../types";
import {
  componentWithForwardedRef,
  getScrollingState,
  useDeterministicId,
  useEventListener,
  useIsMounted,
  useOnChange,
  useScrollGuard,
} from "../utils";
import { DialogContext, type DialogContextValue } from "./context";
import { Root as RootSlot } from "./slots";

export type RenderProps = {
  /**
   * The `open` state of the component.
   */
  open: boolean;
};

export type ClassNameProps = RenderProps;

type OwnProps = {
  /**
   * The content of the tab dialog.
   */
  children?: PropWithRenderContext<React.ReactNode, RenderProps>;
  /**
   * The className applied to the component.
   */
  className?: PropWithRenderContext<string, ClassNameProps>;
  /**
   * If `true`, the dialog will be opened.
   */
  open: boolean;
  /**
   * Callback is called when the dialog is about to be closed.
   * This function is required because it will be called when certain interactions occur.
   */
  onClose: () => void;
  /**
   * `alertdialog`: An alert dialog is a modal dialog that
   * interrupts the user's workflow to communicate an
   * important message and acquire a response.
   *
   * `dialog`: A modal dialog is a window overlaid on
   * either the primary window or another dialog window.
   */
  role: "dialog" | "alertdialog";
  /**
   * Used to keep mounting when more control is needed.\
   * Useful when controlling animation with React animation libraries.
   * @default false
   */
  keepMounted?: boolean;
};

export type Props = Omit<
  MergeElementProps<"div", OwnProps>,
  "defaultChecked" | "defaultValue"
>;

const DialogBase = (props: Props, ref: React.Ref<HTMLDivElement>) => {
  const {
    open,
    role,
    id: idProp,
    keepMounted = false,
    children: childrenProp,
    className: classNameProp,
    onClose: emitClose,
    ...otherProps
  } = props;

  if (!emitClose) {
    throw new SystemError("The `onClose` prop needs to be provided.", "Dialog");
  }

  const isMounted = useIsMounted();

  const id = useDeterministicId(idProp, "styleless-ui__dialog");

  const previouslyFocusedElement = React.useRef<HTMLElement | null>(null);

  const { disablePageScroll, enablePageScroll } = useScrollGuard();

  useOnChange(open, currentOpen => {
    if (!isMounted()) return;

    if (currentOpen) {
      previouslyFocusedElement.current =
        document.activeElement as HTMLElement | null;

      const isBodyScrolling = getScrollingState(document.body).vertical;

      if (isBodyScrolling) disablePageScroll();
    } else {
      enablePageScroll();

      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();

        return;
      }

      document.body.focus();
    }
  });

  const renderProps: RenderProps = { open };

  const classNameProps: ClassNameProps = renderProps;

  const children = resolvePropWithRenderContext(childrenProp, renderProps);
  const className = resolvePropWithRenderContext(classNameProp, classNameProps);

  const context: DialogContextValue = { open, role, emitClose };

  if (typeof document !== "undefined") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEventListener(
      {
        target: document,
        eventType: "keydown",
        handler: event => {
          if (event.key === SystemKeys.ESCAPE) {
            event.preventDefault();

            emitClose();
          }
        },
      },
      open,
    );
  }

  if (!keepMounted && !open) return null;

  return (
    <Portal>
      <FocusTrap enabled={open}>
        <div
          data-slot="Portal:Root"
          role="presentation"
          tabIndex={-1}
          aria-hidden={!open}
          style={{ position: "absolute", top: 0, left: 0, right: 0 }}
        >
          <div
            {...otherProps}
            id={id}
            ref={ref}
            className={className}
            data-slot={RootSlot}
            data-open={open ? "" : undefined}
          >
            <DialogContext.Provider value={context}>
              {children}
            </DialogContext.Provider>
          </div>
        </div>
      </FocusTrap>
    </Portal>
  );
};

const Dialog = componentWithForwardedRef(DialogBase, "Dialog");

export default Dialog;
