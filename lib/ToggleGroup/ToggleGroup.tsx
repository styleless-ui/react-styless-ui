import * as React from "react";
import { Root as ToggleRootSlot } from "../Toggle/slots";
import { SystemError, getLabelInfo } from "../internals";
import type { MergeElementProps } from "../types";
import {
  componentWithForwardedRef,
  useControlledProp,
  useDeterministicId,
  useForkedRefs,
} from "../utils";
import { ToggleGroupContext } from "./context";
import * as Slots from "./slots";

type OwnProps = {
  /**
   * The content of the group.
   */
  children?: React.ReactNode;
  /**
   * The className applied to the component.
   */
  className?: string;
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
   * Determines whether a single or multiple items can be active at a time.
   */
  multiple: boolean;
  /**
   * If `automatic`, toggles are automatically activated when they receive focus.
   * If `manual`, users activate a toggle by focusing them and pressing `Space` or `Enter`.
   */
  keyboardActivationBehavior?: "manual" | "automatic";
};

export type Props = Omit<
  MergeElementProps<"div", OwnProps>,
  "checked" | "defaultChecked" | "onChange" | "onChangeCapture"
> &
  (
    | {
        multiple: true;
        /**
         * The value of the active toggles.
         */
        value?: string[];
        /**
         * The default value. Use when the component is not controlled.
         */
        defaultValue?: string[];
        /**
         * The Callback is fired when the state changes.
         */
        onValueChange?: (activeItems: string[]) => void;
      }
    | {
        multiple: false;
        value?: string;
        defaultValue?: string;
        onValueChange?: (activeItems: string) => void;
      }
  );

const ToggleGroupBase = (props: Props, ref: React.Ref<HTMLDivElement>) => {
  const {
    label,
    children,
    id: idProp,
    className,
    defaultValue,
    value: valueProp,
    multiple = false,
    keyboardActivationBehavior,
    onValueChange,
    ...otherProps
  } = props;

  const rootRef = React.useRef<HTMLDivElement>(null);
  const handleRootRef = useForkedRefs(ref, rootRef);

  const id = useDeterministicId(idProp, "styleless-ui__toggle-group");

  const labelInfo = getLabelInfo(label, "ToggleGroup");

  const [value, setValue] = useControlledProp(
    valueProp,
    defaultValue,
    multiple ? [] : "",
  );

  const [forcedTabability, setForcedTabability] = React.useState<string | null>(
    null,
  );

  if (multiple && !Array.isArray(value)) {
    throw new SystemError(
      "The `value` and `defaultValue` " +
        "should be an empty array or array of strings when `multiple={true}.`",
      "ToggleGroup",
    );
  }

  if (!multiple && typeof value !== "string") {
    throw new SystemError(
      "The `value` and `defaultValue` " +
        "should be string when `multiple={false}.`",
      "ToggleGroup",
    );
  }

  const handleChange = (newActiveState: boolean, toggleValue: string) => {
    const newValue = multiple
      ? !newActiveState
        ? (value as string[]).filter(v => v !== toggleValue)
        : (value as string[]).concat(toggleValue)
      : newActiveState
        ? toggleValue
        : "";

    setValue(newValue);
    // @ts-expect-error It's fine!
    onValueChange?.(newValue);
  };

  React.useEffect(() => {
    if (!rootRef.current) return;

    if (value.length > 0) {
      setForcedTabability(prev => (prev ? null : prev));

      return;
    }

    const toggles = Array.from(
      rootRef.current.querySelectorAll<HTMLElement>(
        `[data-slot='${ToggleRootSlot}']`,
      ),
    );

    const validToggles = toggles.filter(toggle => {
      const isDisabled =
        toggle.hasAttribute("disabled") ||
        toggle.getAttribute("aria-disabled") === "true";

      return !isDisabled;
    });

    setForcedTabability(validToggles?.[0]?.getAttribute("data-entity") ?? null);
  }, [value]);

  return (
    <div
      {...otherProps}
      id={id}
      ref={handleRootRef}
      className={className}
      role="group"
      aria-label={labelInfo.srOnlyLabel}
      aria-labelledby={labelInfo.labelledBy}
      data-slot={Slots.Root}
    >
      <ToggleGroupContext.Provider
        value={{
          multiple,
          value,
          forcedTabability,
          keyboardActivationBehavior: keyboardActivationBehavior ?? "manual",
          onChange: handleChange,
        }}
      >
        {children}
      </ToggleGroupContext.Provider>
    </div>
  );
};

const ToggleGroup = componentWithForwardedRef(ToggleGroupBase, "ToggleGroup");

export default ToggleGroup;
