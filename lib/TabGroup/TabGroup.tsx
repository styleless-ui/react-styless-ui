import * as React from "react";
import type { MergeElementProps } from "../types";
import {
  componentWithForwardedRef,
  useControlledProp,
  useForkedRefs,
  useIsMounted,
} from "../utils";
import { TabGroupContext } from "./context";
import { Root as RootSlot } from "./slots";

type OwnProps = {
  /**
   * The content of the tab group.
   */
  children?: React.ReactNode;
  /**
   * The className applied to the component.
   */
  className?: string;
  /**
   * The currently selected tab.
   */
  activeTab?: string;
  /**
   * The default selected tab. Use when the component is not controlled.
   */
  defaultActiveTab?: string;
  /**
   * The Callback is fired when the active tab state changes.
   */
  onActiveTabChange?: (tabValue: string) => void;
  /**
   * Indicates whether the element's orientation is horizontal or vertical.
   * This effects the keyboard interactions.
   *
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical";
  /**
   * If `automatic`, tabs are automatically activated and their panel is displayed when they receive focus.
   * If `manual`, users activate a tab and display its panel by focusing them and pressing `Space` or `Enter`.
   *
   * @default "manual"
   */
  keyboardActivationBehavior?: "manual" | "automatic";
};

export type Props = Omit<
  MergeElementProps<"div", OwnProps>,
  "defaultChecked" | "defaultValue" | "onChange" | "onChangeCapture"
>;

const TabGroupBase = (props: Props, ref: React.Ref<HTMLDivElement>) => {
  const {
    children,
    className,
    onActiveTabChange,
    defaultActiveTab,
    activeTab: activeTabProp,
    keyboardActivationBehavior = "manual",
    orientation = "horizontal",
    ...otherProps
  } = props;

  const isMounted = useIsMounted();

  const rootRef = React.useRef<HTMLDivElement>();
  const handleRootRef = useForkedRefs(ref, rootRef);

  const [activeTab, setActiveTab] = useControlledProp(
    activeTabProp,
    defaultActiveTab,
    "",
  );

  const [forcedTabability, setForcedTabability] = React.useState<string | null>(
    null,
  );

  const handleChange = (tabValue: string) => {
    if (!isMounted()) return;

    setActiveTab(tabValue);
    onActiveTabChange?.(tabValue);
  };

  React.useEffect(() => {
    if (!rootRef.current) return;

    if (activeTab) {
      setForcedTabability(prev => (prev ? null : prev));

      return;
    }

    const tabs = Array.from(
      rootRef.current.querySelectorAll<HTMLElement>('[role="tab"]'),
    );

    const validTabs = tabs.filter(tab => {
      const isDisabled =
        tab.hasAttribute("disabled") ||
        tab.getAttribute("aria-disabled") === "true";

      return !isDisabled;
    });

    setForcedTabability(validTabs?.[0]?.getAttribute("data-entity") ?? null);
  }, [activeTab]);

  return (
    <div
      {...otherProps}
      className={className}
      ref={handleRootRef}
      data-slot={RootSlot}
      data-orientation={orientation}
    >
      <TabGroupContext.Provider
        value={{
          activeTab,
          orientation,
          forcedTabability,
          keyboardActivationBehavior,
          onChange: handleChange,
        }}
      >
        {children}
      </TabGroupContext.Provider>
    </div>
  );
};

const TabGroup = componentWithForwardedRef(TabGroupBase, "TabGroup");

export default TabGroup;
