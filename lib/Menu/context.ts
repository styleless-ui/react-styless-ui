import * as React from "react";
import type { PopperProps } from "../Popper";

type ContextValue = {
  id: string;
  activeElement: HTMLElement | null;
  keepMounted: boolean;
  emitClose: () => void;
  emitActiveElementChange: (newActiveElement: HTMLElement | null) => void;
  computationMiddleware: NonNullable<PopperProps["computationMiddleware"]>;
};

const Context = React.createContext<ContextValue | null>(null);

if (process.env.NODE_ENV !== "production") {
  Context.displayName = "Menu.Context";
}

export { Context as MenuContext, type ContextValue as MenuContextValue };
