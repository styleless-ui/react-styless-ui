import * as React from "react";
import { getLabelInfo, resolvePropWithRenderContext } from "../internals";
import type { MergeElementProps, PropWithRenderContext } from "../types";
import {
  componentWithForwardedRef,
  useControlledProp,
  useDeterministicId,
  useForkedRefs,
} from "../utils";
import { RadioGroupContext } from "./context";
import * as Slots from "./slots";

export type RenderProps = {
  /**
   * The `readOnly` state of the group.
   */
  readOnly: boolean;
  /**
   * The `disabled` state of the group.
   */
  disabled: boolean;
};

export type ClassNameProps = RenderProps;

type OwnProps = {
  /**
   * The content of the group.
   */
  children?: PropWithRenderContext<React.ReactNode, RenderProps>;
  /**
   * The className applied to the component.
   */
  className?: PropWithRenderContext<string, ClassNameProps>;
  /**
   * The label of the group.
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
         * Identifies the element (or elements) that labels the group.
         *
         * @see {@link https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-labelledby MDN Web Docs} for more information.
         */
        labelledBy: string;
      };
  /**
   * The orientation of the group.
   *
   * @default "vertical"
   */
  orientation?: "horizontal" | "vertical";
  /**
   * The value of the selected radio.
   */
  value?: string;
  /**
   * The default value. Use when the component is not controlled.
   */
  defaultValue?: string;
  /**
   * If `true`, the group will be disabled.
   *
   * This will force the descendant radios to be disabled as well.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * If `true`, the group will be read-only.
   *
   * This will force the descendant radios to be read-only as well.
   *
   * @default false
   */
  readOnly?: boolean;
  /**
   * The name of the form control when submitted.
   * Submitted with the form as part of a name/value pair.
   */
  name?: string;
  /**
   * The Callback is fired when the state changes.
   */
  onValueChange?: (selectedValue: string) => void;
};

export type Props = Omit<
  MergeElementProps<"div", OwnProps>,
  "onChange" | "onChangeCapture" | "defaultChecked"
>;

const RadioGroupBase = (props: Props, ref: React.Ref<HTMLDivElement>) => {
  const {
    label,
    id: idProp,
    children: childrenProp,
    className: classNameProp,
    defaultValue,
    value: valueProp,
    disabled,
    readOnly,
    name,
    onValueChange,
    orientation = "vertical",
    ...otherProps
  } = props;

  const rootRef = React.useRef<HTMLDivElement>(null);
  const handleRootRef = useForkedRefs(ref, rootRef);

  const id = useDeterministicId(idProp, "styleless-ui__radio-group");

  const labelInfo = getLabelInfo(label, "RadioGroup", {
    customErrorMessage: [
      "Invalid `label` property.",
      "The `label` property must be in shape of " +
        "`{ screenReaderLabel: string; } | { labelledBy: string; }`",
    ].join("\n"),
  });

  const [value, setValue] = useControlledProp(valueProp, defaultValue, "");
  const [forcedTabability, setForcedTabability] = React.useState<string | null>(
    null,
  );

  const handleValueChange = (newCheckedState: boolean, inputValue: string) => {
    if (disabled || readOnly) return;

    if (!newCheckedState) return;

    setValue(inputValue);
    onValueChange?.(inputValue);
  };

  React.useEffect(() => {
    if (disabled) return;
    if (!rootRef.current) return;

    if (value) {
      setForcedTabability(prev => (prev ? null : prev));

      return;
    }

    const radios = Array.from(
      rootRef.current.querySelectorAll<HTMLElement>('[role="radio"]'),
    );

    const validRadios = radios.filter(radio => {
      const isDisabled =
        radio.hasAttribute("disabled") ||
        radio.getAttribute("aria-disabled") === "true";

      return !isDisabled;
    });

    setForcedTabability(validRadios?.[0]?.getAttribute("data-entity") ?? null);
  }, [value, disabled]);

  const renderProps: RenderProps = {
    disabled: disabled ?? false,
    readOnly: readOnly ?? false,
  };

  const classNameProps: ClassNameProps = renderProps;

  const children = resolvePropWithRenderContext(childrenProp, renderProps);
  const className = resolvePropWithRenderContext(classNameProp, classNameProps);

  return (
    <div
      {...otherProps}
      // @ts-expect-error React hasn't added `inert` yet
      inert={disabled ? "" : undefined}
      id={id}
      ref={handleRootRef}
      className={className}
      role="radiogroup"
      aria-orientation={orientation}
      aria-label={labelInfo.srOnlyLabel}
      aria-labelledby={labelInfo.labelledBy}
      aria-disabled={disabled}
      aria-readonly={readOnly}
      data-slot={Slots.Root}
      data-name={name}
    >
      <RadioGroupContext.Provider
        value={{
          value,
          name,
          readOnly,
          disabled,
          onChange: handleValueChange,
          forcedTabability,
        }}
      >
        {children}
      </RadioGroupContext.Provider>
    </div>
  );
};

const RadioGroup = componentWithForwardedRef(RadioGroupBase, "RadioGroup");

export default RadioGroup;
