import * as React from "react";
import {
  logger,
  resolvePropWithRenderContext,
  visuallyHiddenCSSProperties,
} from "../../../internals";
import {
  type MergeElementProps,
  type PropWithRenderContext,
} from "../../../types";
import {
  componentWithForwardedRef,
  useDeterministicId,
  useEventCallback,
  useForkedRefs,
} from "../../../utils";
import { SelectContext } from "../../context";
import { ControllerRoot as ControllerRootSlot } from "../../slots";
import { useComboboxBase } from "./utils";

export type ClassNameProps = {
  /**
   * Determines whether it is focused-visible or not.
   */
  focusedVisible: boolean;
};

type OwnProps = {
  /**
   * The className applied to the component.
   */
  className?: PropWithRenderContext<string, ClassNameProps>;
  /**
   * A value to replace `tabIndex` with.
   */
  overrideTabIndex?: number;
  /**
   * If `true`, the component will be focused automatically.
   *
   * @default false
   */
  autoFocus?: boolean;
};

export type Props = Omit<
  MergeElementProps<"input", OwnProps>,
  | "defaultValue"
  | "defaultChecked"
  | "value"
  | "checked"
  | "children"
  | "autoCapitalize"
  | "autoComplete"
  | "autoCorrect"
  | "spellCheck"
  | "type"
>;

const ControllerBase = (props: Props, ref: React.Ref<HTMLInputElement>) => {
  const {
    className: classNameProp,
    id: idProp,
    overrideTabIndex,
    autoFocus = false,
    onChange,
    onClick,
    onKeyDown,
    ...otherProps
  } = props;

  const ctx = React.useContext(SelectContext);

  const id = useDeterministicId(idProp, "styleless-ui__select__controller");

  const rootRef = React.useRef<HTMLElement>(null);

  const comboboxBase = useComboboxBase<HTMLButtonElement | HTMLInputElement>({
    autoFocus,
    listOpenState: ctx?.isListOpen ?? false,
    disabled: ctx?.disabled ?? false,
    readOnly: ctx?.readOnly ?? false,
    activeDescendant: ctx?.activeDescendant ?? null,
    searchable: ctx?.searchable ?? false,
    onInputChange: onChange,
    onKeyDown,
    getOptionElements: () => {
      const listId = ctx?.elementsRegistry.getElementId("list");
      const listNode = document.getElementById(listId ?? "");

      if (!listNode) return [];

      return Array.from(
        listNode.querySelectorAll<HTMLElement>(`[role='option']`),
      );
    },
    onFilteredEntities: entities => {
      ctx?.setActiveDescendant(null);
      ctx?.setFilteredEntities(entities);
    },
    onActiveDescendantChange: newActiveDescendant => {
      ctx?.setActiveDescendant(newActiveDescendant);
    },
    onListOpenChange: newListOpenState => {
      if (newListOpenState) ctx?.openList();
      else ctx?.closeList();
    },
    onEscapeKeyDown: useEventCallback<React.KeyboardEvent<HTMLElement>>(
      event => {
        event.preventDefault();

        if (ctx?.disabled || ctx?.readOnly) return;

        ctx?.closeList();
      },
    ),
    onBackspaceKeyDown: useEventCallback<React.KeyboardEvent<HTMLElement>>(
      event => {
        if (ctx?.disabled || ctx?.readOnly) {
          event.preventDefault();

          return;
        }

        if (ctx?.searchable) {
          const rootNode = rootRef.current;

          if (rootNode && (rootNode as HTMLInputElement).value.length > 0) {
            return;
          }
        }

        const values = ctx?.selectedValues;

        if (values == null) return;

        if (typeof values === "string") {
          ctx?.clearOptions();
        } else {
          const lastValue = values[values.length - 1];

          if (!lastValue) return;

          ctx?.handleOptionRemove(lastValue);
        }
      },
    ),
    onClick: useEventCallback<React.MouseEvent<HTMLElement>>(event => {
      if (ctx?.disabled || ctx?.readOnly) {
        event.preventDefault();

        return;
      }

      ctx?.toggleList();

      onClick?.(event as React.MouseEvent<HTMLInputElement>);
    }),
  });

  const handleRootRef = useForkedRefs(ref, rootRef, comboboxBase.handleRef);

  React.useEffect(() => {
    ctx?.elementsRegistry.registerElement("combobox", id);

    return () => {
      ctx?.elementsRegistry.unregisterElement("combobox");
    };
  }, [ctx?.elementsRegistry, id]);

  if (!ctx) {
    logger("You have to use this component as a descendant of <Select.Root>.", {
      scope: "Select.Controller",
      type: "error",
    });

    return null;
  }

  const {
    activeDescendant,
    isListOpen,
    labelInfo,
    disabled,
    searchable,
    elementsRegistry,
    readOnly,
  } = ctx;

  const refCallback = (node: HTMLElement | null) => {
    handleRootRef(node);

    if (!node) return;

    const listId = elementsRegistry.getElementId("list");

    if (!listId) return;

    node.setAttribute("aria-controls", listId);
  };

  const controllerProps = {
    id,
    inert: disabled ? "" : undefined,
    ref: refCallback,
    role: "combobox",
    "aria-activedescendant": activeDescendant?.id,
    "aria-expanded": isListOpen,
    "aria-haspopup": "listbox",
    "aria-label": labelInfo.srOnlyLabel,
    "aria-labelledby": labelInfo.labelledBy,
    "aria-autocomplete": searchable ? "list" : "none",
    "data-slot": ControllerRootSlot,
    "data-focus-visible": comboboxBase.isFocusedVisible ? "" : undefined,
    tabIndex:
      typeof overrideTabIndex !== "undefined"
        ? overrideTabIndex
        : disabled
          ? -1
          : 0,
    onClick: comboboxBase.handleClick,
    onBlur: comboboxBase.handleBlur,
    onFocus: comboboxBase.handleFocus,
    onKeyDown: comboboxBase.handleKeyDown,
  };

  const classNameProps: ClassNameProps = {
    focusedVisible: comboboxBase.isFocusedVisible,
  };

  const className = resolvePropWithRenderContext(classNameProp, classNameProps);

  if (!searchable) {
    return (
      <button
        {...(controllerProps as React.ComponentPropsWithRef<"button">)}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data-testid={otherProps["data-testid"]}
        aria-readonly={readOnly}
        aria-disabled={disabled}
        style={{ all: "unset", ...visuallyHiddenCSSProperties }}
      />
    );
  }

  return (
    <input
      {...otherProps}
      {...(controllerProps as React.ComponentPropsWithRef<"input">)}
      autoCapitalize="none"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      readOnly={readOnly}
      disabled={disabled}
      type="text"
      onChange={comboboxBase.handleQueryChange}
      className={className}
    />
  );
};

const Controller = componentWithForwardedRef(
  ControllerBase,
  "Select.Controller",
);

export default Controller;
