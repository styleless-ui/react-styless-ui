import * as React from "react";
import { type LabelInfo } from "../internals";
import type { RegisteredElementsKeys } from "./Select";
import type { ElementsRegistry } from "./utils";

type ContextValue = {
  isListOpen: boolean;
  disabled: boolean;
  readOnly: boolean;
  keepMounted: boolean;
  multiple: boolean;
  searchable: boolean;
  isAnyOptionSelected: boolean;
  activeDescendant: HTMLElement | null;
  selectedValues: string | string[];
  labelInfo: LabelInfo;
  filteredEntities: null | string[];
  elementsRegistry: ElementsRegistry<RegisteredElementsKeys>;
  closeListAndMaintainFocus: () => void;
  setActiveDescendant: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  setFilteredEntities: React.Dispatch<React.SetStateAction<null | string[]>>;
  openList: () => void;
  closeList: () => void;
  toggleList: () => void;
  clearOptions: () => void;
  handleOptionClick: (value: string) => void;
  handleOptionRemove: (value: string) => void;
};

const Context = React.createContext<ContextValue | null>(null);

if (process.env.NODE_ENV !== "production") {
  Context.displayName = "Select";
}

export { Context as SelectContext, type ContextValue as SelectContextValue };
