import * as React from "react";
import Popper, { type PopperProps } from "../Popper";
import { FocusTrap, type LabelInfo } from "../internals";
import type { MergeElementProps } from "../types";
import { componentWithForwardedRef } from "../utils";
import type { Props as MenuProps } from "./Menu";

type OwnProps = {
  className?: string;
  children?: React.ReactNode;
  open: boolean;
  keepMounted: boolean;
  trapFocus: boolean;
  alignment: NonNullable<PopperProps["alignment"]>;
  autoPlacement?: PopperProps["autoPlacement"];
  activeDescendantId?: string | null;
  label: LabelInfo;
  onExitTrap?: (event: FocusEvent) => void;
  resolveAnchor: NonNullable<MenuProps["resolveAnchor"]>;
  computationMiddleware?: PopperProps["computationMiddleware"];
};

export type Props = Omit<
  MergeElementProps<"div", OwnProps>,
  "defaultValue" | "defaultChecked"
>;

const BaseMenuBase = (props: Props, ref: React.Ref<HTMLDivElement>) => {
  const {
    className,
    children,
    open,
    keepMounted,
    trapFocus,
    alignment,
    activeDescendantId,
    label,
    autoPlacement = true,
    onExitTrap,
    resolveAnchor,
    computationMiddleware,
    ...otherProps
  } = props;

  const renderContent = () => {
    const renderMenu = () => (
      <div
        {...otherProps}
        // @ts-expect-error React hasn't added `inert` yet
        inert={!open ? "" : undefined}
        tabIndex={-1}
        ref={ref}
        role="menu"
        className={className}
        aria-orientation="vertical"
        aria-activedescendant={activeDescendantId ?? undefined}
        aria-label={label.srOnlyLabel}
        aria-labelledby={label.labelledBy}
        data-open={open ? "" : undefined}
      >
        {children}
      </div>
    );

    if (trapFocus) {
      return (
        <FocusTrap
          enabled={open}
          onExit={onExitTrap}
        >
          {renderMenu()}
        </FocusTrap>
      );
    }

    return renderMenu();
  };

  return (
    <Popper
      autoPlacement={autoPlacement}
      keepMounted={keepMounted}
      open={open}
      resolveAnchor={resolveAnchor}
      computationMiddlewareOrder="afterAutoPlacement"
      computationMiddleware={computationMiddleware}
      offset={0}
      alignment={alignment}
    >
      {renderContent()}
    </Popper>
  );
};

const BaseMenu = componentWithForwardedRef(BaseMenuBase, "BaseMenu");

export default BaseMenu;
