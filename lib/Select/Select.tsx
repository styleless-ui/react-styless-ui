import * as React from "react";
import {
  SystemError,
  getLabelInfo,
  logger,
  resolvePropWithRenderContext,
  visuallyHiddenCSSProperties,
} from "../internals";
import type { MergeElementProps, PropWithRenderContext } from "../types";
import {
  componentWithForwardedRef,
  contains,
  useControlledProp,
  useDeterministicId,
  useEventCallback,
  useEventListener,
  useForkedRefs,
} from "../utils";
import { SelectContext, type SelectContextValue } from "./context";
import { Root as RootSlot } from "./slots";
import { noValueSelected, normalizeValues, useElementsRegistry } from "./utils";

export type RenderProps = {
  /**
   * The `open` state of the component.
   */
  open: boolean;
  /**
   * The `disabled` state of the component.
   */
  disabled: boolean;
  /**
   * The `readOnly` state of the component.
   */
  readOnly: boolean;
  /**
   * Determines whether an option is selected or not.
   */
  hasSelectedValues: boolean;
  /**
   * Determines whether the component's select mode is multiple or not.
   */
  multiple: boolean;
  /**
   * Determines whether the component is searchable or not.
   */
  searchable: boolean;
  /**
   * An array of selected options.
   */
  values: string[];
  /**
   * A helper function exposed for clear button (A button to clear selected values).
   * Should be used as a `onClick` event callback.
   */
  clearValues: (event: React.MouseEvent<HTMLElement>) => void;
  /**
   * A helper function exposed for handling option remove button
   * (A button to remove an specific option from selected values).
   *
   * It gets option's entity value and returns a click event handler.
   */
  makeRemoveOption: (
    optionEntityValue: string,
  ) => (event: React.MouseEvent<HTMLElement>) => void;
};

export type ClassNameProps = Pick<
  RenderProps,
  | "open"
  | "disabled"
  | "hasSelectedValues"
  | "readOnly"
  | "multiple"
  | "searchable"
>;

export type RegisteredElementsKeys = "root" | "trigger" | "list" | "combobox";

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
   * The label of the component.
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
         * Identifies the element (or elements) that labels the component.
         *
         * @see {@link https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-labelledby MDN Web Docs} for more information.
         */
        labelledBy: string;
      };
  /**
   * Used to keep mounting when more control is needed.\
   * Useful when controlling animation with React animation libraries.
   *
   * @default false
   */
  keepMounted?: boolean;
  /**
   * If `true`, the select will be disabled.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * If `true`, the select will be read-only.
   *
   * @default false
   */
  readOnly?: boolean;
  /**
   * If `true`, the select will have a searchbox.
   *
   * @default false
   */
  searchable?: boolean;
  /**
   * If `true`, the select dropdown menu will open.
   *
   * @default false
   */
  open?: boolean;
  /**
   * The default state of `open`. Use when the component's `open` state is not controlled.
   *
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * The name of the form control when submitted.
   * Submitted with the form as part of a name/value pair.
   */
  name?: string;
  /**
   * Callback is called when the dropdown menu is about to be opened.
   */
  onOpen?: () => void;
  /**
   * Callback is called when the dropdown menu is about to be closed.
   */
  onClose?: () => void;
  /**
   * Callback is called when a click interaction occurs outside of the component.
   * Tries to close the dropdown menu as the default behavior when not provided.
   */
  onOutsideClick?: (event: MouseEvent) => void;
  /**
   * If `true`, you would be able to select multiple options.
   *
   * @default false
   */
  multiple: boolean;
};

export type Props = Omit<
  MergeElementProps<"div", OwnProps>,
  "defaultChecked" | "defaultValue" | "onChange" | "onChangeCapture"
> &
  (
    | {
        multiple: false;
        /**
         * The default value. Use when the component's `value` state is not controlled.
         */
        defaultValue?: string;
        /**
         * The value of the select. It should be an array if `multiple={true}`.
         */
        value?: string;
        /**
         * Callback is called when the value changes.
         */
        onValueChange?: (currentValue: string) => void;
      }
    | {
        multiple: true;
        defaultValue?: string[];
        value?: string[];
        onValueChange?: (currentValue: string[]) => void;
      }
  );

const SelectBase = (props: Props, ref: React.Ref<HTMLDivElement>) => {
  const {
    style: styleProp,
    id: idProp,
    className: classNameProp,
    children: childrenProp,
    keepMounted = false,
    disabled = false,
    searchable = false,
    readOnly = false,
    name,
    multiple,
    defaultValue,
    value,
    defaultOpen,
    open,
    label,
    onOpen,
    onClose,
    onValueChange,
    onOutsideClick,
    ...otherProps
  } = props;

  if (
    multiple &&
    (typeof value === "string" || typeof defaultValue === "string")
  ) {
    throw new SystemError(
      "`value` and `defaultValue` must be array when `multiple={true}`.",
      "Select",
    );
  }

  const [isListOpen, setIsListOpen] = useControlledProp(
    open,
    defaultOpen,
    false,
  );

  const [selectedValues, setSelectedValues] = useControlledProp(
    value,
    defaultValue,
    multiple ? [] : "",
  );

  const [activeDescendant, setActiveDescendant] =
    React.useState<HTMLElement | null>(null);

  const [filteredEntities, setFilteredEntities] = React.useState<
    null | string[]
  >(null);

  const rootRef = React.useRef<HTMLDivElement | null>(null);

  const handleRootRef = useForkedRefs(rootRef, ref);

  const id = useDeterministicId(idProp, "styleless-ui__select");

  const labelInfo = getLabelInfo(label, "Select", {
    customErrorMessage: [
      "Invalid `label` property.",
      "The `label` property must be in shape of " +
        "`{ screenReaderLabel: string; } | { labelledBy: string; }`",
    ].join("\n"),
  });

  const openList = () => {
    setIsListOpen(true);

    onOpen?.();
  };

  const closeList = () => {
    setIsListOpen(false);
    setActiveDescendant(null);

    onClose?.();
  };

  const toggleList = () => {
    if (isListOpen) closeList();
    else openList();
  };

  const emitValueChange = (newValue: string | string[]) => {
    if (disabled || readOnly) return;

    setSelectedValues(newValue);
    // @ts-expect-error It's fine!
    onValueChange?.(newValue);
  };

  const elementsRegistry = useElementsRegistry<RegisteredElementsKeys>();

  const handleOptionClick = (value: string) => {
    if (disabled || readOnly) return;

    let newValue: string | string[];

    if (!multiple) {
      newValue = value;

      closeList();
    } else {
      const isSelected =
        (selectedValues as string[]).some(v => v === value) ?? false;

      if (isSelected) {
        newValue = (selectedValues as string[]).filter(v => v !== value);
      } else {
        newValue = (selectedValues as string[]).concat(value);
      }
    }

    emitValueChange(newValue);
  };

  const handleOptionRemove = (value: string) => {
    if (disabled || readOnly) return;

    let newValue: string | string[];

    if (!multiple) newValue = "";
    else newValue = (selectedValues as string[]).filter(v => v !== value);

    emitValueChange(newValue);
  };

  const clearOptions = () => {
    if (disabled || readOnly) return;

    let newValue: string | string[];

    if (!multiple) newValue = "";
    else newValue = [];

    emitValueChange(newValue);
  };

  const isAnyOptionSelected = !noValueSelected(selectedValues);

  const closeListAndMaintainFocus = () => {
    const comboboxId = elementsRegistry.getElementId("combobox");
    const comboboxNode = document.getElementById(comboboxId ?? "");

    comboboxNode?.focus();
    closeList();
  };

  const handleClearValues = (event: React.MouseEvent<HTMLElement>) => {
    if (disabled || readOnly) {
      event.preventDefault();

      return;
    }

    event.stopPropagation();

    closeListAndMaintainFocus();
    clearOptions();
  };

  const makeHandleOptionRemove =
    (optionEntityValue: string) => (event: React.MouseEvent<HTMLElement>) => {
      if (disabled || readOnly) {
        event.preventDefault();

        return;
      }

      event.stopPropagation();

      closeListAndMaintainFocus();
      handleOptionRemove(optionEntityValue);
    };

  const values = normalizeValues(selectedValues);

  const renderProps: RenderProps = {
    values,
    disabled,
    searchable,
    multiple,
    readOnly,
    open: isListOpen,
    hasSelectedValues: isAnyOptionSelected,
    clearValues: handleClearValues,
    makeRemoveOption: makeHandleOptionRemove,
  };

  const classNameProps: ClassNameProps = {
    disabled,
    readOnly,
    searchable,
    multiple,
    open: isListOpen,
    hasSelectedValues: isAnyOptionSelected,
  };

  const className = resolvePropWithRenderContext(classNameProp, classNameProps);
  const children = resolvePropWithRenderContext(childrenProp, renderProps);

  if (isListOpen && (disabled || readOnly)) {
    logger(
      "You can't have an opened select menu when `disabled={true}` or `readOnly={true}`.",
      {
        scope: "Select",
        type: "warn",
      },
    );

    closeList();
  }

  const context: SelectContextValue = {
    readOnly,
    disabled,
    isListOpen,
    multiple,
    searchable,
    keepMounted,
    activeDescendant,
    selectedValues,
    elementsRegistry,
    labelInfo,
    isAnyOptionSelected,
    filteredEntities,
    closeListAndMaintainFocus,
    setFilteredEntities,
    setActiveDescendant,
    openList,
    closeList,
    toggleList,
    clearOptions,
    handleOptionClick,
    handleOptionRemove,
  };

  React.useEffect(() => {
    const { registerElement, unregisterElement } = elementsRegistry;

    registerElement("root", id);

    return () => {
      unregisterElement("root");
    };
  }, [elementsRegistry, id]);

  if (typeof document !== "undefined") {
    /* eslint-disable react-hooks/rules-of-hooks */
    useEventListener(
      {
        target: document,
        eventType: "click",
        handler: useEventCallback<MouseEvent>(event => {
          if (disabled || readOnly) return;
          if (!event.target) return;
          if (!rootRef.current) return;
          if (rootRef.current === event.target) return;
          if (contains(rootRef.current, event.target as HTMLElement)) return;

          if (onOutsideClick) onOutsideClick(event);
          else closeList();
        }),
      },
      isListOpen,
    );
    /* eslint-enable react-hooks/rules-of-hooks */
  }

  const style: React.CSSProperties = {
    ...(styleProp ?? {}),
    position: "relative",
  };

  const dataAttrs = {
    "data-slot": RootSlot,
    "data-open": isListOpen ? "" : undefined,
    "data-disabled": disabled ? "" : undefined,
    "data-readonly": readOnly ? "" : undefined,
  };

  const renderHiddenInput = () => {
    if (!name) return null;
    if (selectedValues.length === 0) return null;

    const renderOptions = () => {
      if (!multiple) return <option value={selectedValues as string} />;

      return (selectedValues as string[]).map(value => (
        <option
          key={value}
          value={value}
        />
      ));
    };

    return (
      <select
        // @ts-expect-error React hasn't added `inert` yet
        inert=""
        onFocus={e => void (e.preventDefault(), e.stopPropagation())}
        onChange={() => void 0}
        style={visuallyHiddenCSSProperties}
        aria-hidden="true"
        tabIndex={-1}
        multiple={multiple}
        disabled={disabled}
        value={selectedValues}
        name={name}
      >
        {renderOptions()}
      </select>
    );
  };

  return (
    <div
      {...otherProps}
      // @ts-expect-error React hasn't added `inert` yet
      inert={disabled ? "" : undefined}
      style={style}
      id={id}
      ref={handleRootRef}
      className={className}
      {...dataAttrs}
    >
      <SelectContext.Provider value={context}>
        {children}
      </SelectContext.Provider>
      {renderHiddenInput()}
    </div>
  );
};

const Select = componentWithForwardedRef(SelectBase, "Select");

export default Select;
