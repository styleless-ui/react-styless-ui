import { getWindow } from "./dom";

type Direction = "rtl" | "ltr";

const getDirection = (element: HTMLElement) => {
  const context = getWindow(element);

  return context.getComputedStyle(element).direction as Direction;
};

export default getDirection;
