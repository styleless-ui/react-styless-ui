import * as React from "react";
import { logger, resolvePropWithRenderContext } from "../../../internals";
import type { MergeElementProps, PropWithRenderContext } from "../../../types";
import {
  componentWithForwardedRef,
  useDeterministicId,
  useForkedRefs,
  useIsInitialRenderComplete,
} from "../../../utils";
import { SelectContext } from "../../context";
import { ListRoot as ListRootSlot } from "../../slots";
import { calcSidePlacement } from "./utils";

export type RenderProps = {
  /**
   * The `open` state of the component.
   */
  open: boolean;
};

export type ClassNameProps = RenderProps;

type OwnProps = {
  /**
   * The className applied to the component.
   */
  className?: PropWithRenderContext<string, ClassNameProps>;
  /**
   * The content of the component.
   */
  children?: PropWithRenderContext<React.ReactNode, RenderProps>;
};

export type Props = Omit<MergeElementProps<"div", OwnProps>, "">;

const ListBase = (props: Props, ref: React.Ref<HTMLDivElement>) => {
  const {
    style: styleProp,
    id: idProp,
    className: classNameProp,
    children: childrenProp,
    ...otherProps
  } = props;

  const ctx = React.useContext(SelectContext);

  const id = useDeterministicId(idProp, "styleless-ui__select__list");

  const rootRef = React.useRef<HTMLDivElement>(null);

  const handleRootRef = useForkedRefs(rootRef, ref);

  const [side, setSide] = React.useState<"top" | "bottom">("bottom");

  const isInitialRenderComplete = useIsInitialRenderComplete();

  const previouslyFocusedElement = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const open = ctx?.isListOpen ?? false;

    if (open) {
      previouslyFocusedElement.current =
        document.activeElement as HTMLElement | null;
    } else {
      previouslyFocusedElement.current?.focus();
    }
  }, [ctx?.isListOpen]);

  React.useEffect(() => {
    ctx?.elementsRegistry.registerElement("list", id);

    return () => {
      ctx?.elementsRegistry.unregisterElement("list");
    };
  }, [ctx?.elementsRegistry, id]);

  if (!ctx) {
    logger("You have to use this component as a descendant of <Select.Root>.", {
      scope: "Select.List",
      type: "error",
    });

    return null;
  }

  if (!ctx.keepMounted && !ctx.isListOpen) return null;

  const makeStyle = () => {
    const style: React.CSSProperties = {
      ...(styleProp ?? {}),
      position: "absolute",
    };

    if (side === "bottom") style.top = "100%";
    else style.bottom = "100%";

    return style;
  };

  const refCallback = (node: HTMLDivElement | null) => {
    handleRootRef(node);

    if (!node) return;

    const triggerId = ctx.elementsRegistry.getElementId("trigger");
    const triggerNode = document.getElementById(triggerId ?? "");
    const comboboxId = ctx.elementsRegistry.getElementId("combobox");
    const comboboxNode = document.getElementById(comboboxId ?? "");

    if (ctx.isListOpen || ctx.keepMounted) {
      comboboxNode?.setAttribute("aria-controls", id);
    } else {
      comboboxNode?.removeAttribute("aria-controls");
    }

    if (!isInitialRenderComplete) return;

    if (triggerNode) {
      setSide(calcSidePlacement(triggerNode, node));
    } else {
      logger(
        "You should have `<Select.Trigger>` in your `<Select.Root>` in order to " +
          "use `<Select.List>.`",
        { scope: "Select", type: "error" },
      );
    }
  };

  const renderProps: RenderProps = {
    open: ctx.isListOpen,
  };

  const classNameProps: ClassNameProps = renderProps;

  const children = resolvePropWithRenderContext(childrenProp, renderProps);
  const className = resolvePropWithRenderContext(classNameProp, classNameProps);

  return (
    <div
      {...otherProps}
      // @ts-expect-error React hasn't added `inert` yet
      inert={ctx.disabled ? "" : undefined}
      style={makeStyle()}
      id={id}
      ref={refCallback}
      tabIndex={-1}
      role="listbox"
      aria-multiselectable={ctx.multiple}
      className={className}
      data-slot={ListRootSlot}
      data-open={ctx.isListOpen ? "" : undefined}
    >
      {children}
    </div>
  );
};

const List = componentWithForwardedRef(ListBase, "Select.List");

export default List;
