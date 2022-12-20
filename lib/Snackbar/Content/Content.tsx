import * as React from "react";
import FocusTrap from "../../FocusTrap";
import { type MergeElementProps } from "../../typings.d";
import {
  componentWithForwardedRef,
  setRef,
  useDeterministicId
} from "../../utils";
import SnackbarContext from "../context";
import {
  Content as SnackbarContentSlot,
  Action as SnackbarActionSlot
} from "../slots";

interface ContentBaseProps {
  /**
   * The content of the component.
   */
  children?: React.ReactNode;
  /**
   * The className applied to the component.
   */
  className?: string;
}

export type ContentProps = Omit<
  MergeElementProps<"div", ContentBaseProps>,
  "defaultChecked" | "defaultValue"
>;

const SnackbarContentBase = (
  props: ContentProps,
  ref: React.Ref<HTMLDivElement>
) => {
  const { className, children, id: idProp, ...otherProps } = props;

  const snackbarCtx = React.useContext(SnackbarContext);

  const id = useDeterministicId(idProp, "styleless-ui__snackbar-content");

  const [isTrappable, setIsTrappable] = React.useState(false);

  const refCallback = (node: HTMLDivElement | null) => {
    setRef(ref, node);

    if (!node) return;

    const actionEl = node.querySelector(`[data-slot="${SnackbarActionSlot}"]`);
    if (!actionEl) return setIsTrappable(false);

    setIsTrappable(true);
  };

  return (
    <FocusTrap enabled={snackbarCtx?.open && isTrappable}>
      <div
        {...otherProps}
        id={id}
        ref={refCallback}
        className={className}
        role={snackbarCtx?.role}
        data-slot={SnackbarContentSlot}
        aria-atomic="true"
        aria-live={
          snackbarCtx
            ? snackbarCtx.role === "alert"
              ? "assertive"
              : "polite"
            : "off"
        }
      >
        {children}
      </div>
    </FocusTrap>
  );
};

const SnackbarContent = componentWithForwardedRef(SnackbarContentBase);

export default SnackbarContent;
