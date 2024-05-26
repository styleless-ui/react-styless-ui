import * as React from "react";

export const normalizeValues = (value: string | string[] | undefined) => {
  if (value == null) return [];

  if (typeof value === "string") {
    if (value.length === 0) return [];

    return [value];
  }

  return value;
};

export const noValueSelected = (value: string | string[] | undefined) =>
  normalizeValues(value).length === 0;

type Registry<Key extends string> = Map<Key, string>;

export type ElementsRegistry<Key extends string> = {
  registerElement: (key: Key, id: string) => void;
  unregisterElement: (key: Key) => void;
  getElementId: (key: Key) => string | undefined;
  getRegistry: () => Registry<Key>;
};

export const useElementsRegistry = <
  Key extends string = string,
>(): ElementsRegistry<Key> => {
  const registryRef = React.useRef(new Map() as Registry<Key>);

  return React.useMemo(() => {
    type T = ElementsRegistry<Key>;

    const getRegistry = () => registryRef.current;

    const registerElement: T["registerElement"] = (key, id) => {
      const registry = getRegistry();

      registry.set(key, id);
    };

    const unregisterElement: T["unregisterElement"] = (key: Key) => {
      const registry = getRegistry();

      registry.delete(key);
    };

    const getElementId: T["getElementId"] = (key: Key) => {
      const registry = getRegistry();

      return registry.get(key);
    };

    return {
      registerElement,
      unregisterElement,
      getElementId,
      getRegistry,
    };
  }, []);
};
