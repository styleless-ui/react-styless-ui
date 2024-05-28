import { clamp, lerp, remap } from "../utils";
import type { Props } from "./InputSlider";
import type { StopSegment, ThumbInfo } from "./types";

export const findNearestValue = (vals: number[], target: number) => {
  const midIdx = Math.floor(vals.length / 2);

  let diff = Infinity;
  let nominee = target;

  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  const nominate = (idx: number) => {
    const val = vals[idx]!;
    const newDiff = Math.abs(target - val);

    if (diff > newDiff) {
      diff = newDiff;
      nominee = val;
    }
  };

  if (vals[midIdx]! < target) {
    for (let idx = midIdx; idx < vals.length; idx++) nominate(idx);
  } else {
    for (let idx = 0; idx <= midIdx; idx++) nominate(idx);
  }
  /* eslint-enable @typescript-eslint/no-non-null-assertion */

  return nominee;
};

export const getRelativeValue = (
  clientXOrY: number,
  parentWidthOrHeight: number,
  thumbInfo: ThumbInfo,
  segments: StopSegment[],
  requiredProps: Pick<Props, "max" | "min" | "step" | "orientation">,
) => {
  const { max, min, step, orientation } = requiredProps;

  let newValue: number;

  if (orientation === "horizontal") {
    newValue = remap(clientXOrY, 0, parentWidthOrHeight, min, max);
  } else {
    newValue = remap(clientXOrY, 0, parentWidthOrHeight, max, min);
  }

  if (typeof step === "number" && step) {
    newValue = Math.floor(newValue / step) * step;
  }

  if (step === "snap") {
    const stopNums = segments
      .sort()
      .map(segment => lerp(min, max, segment.length / 100));

    newValue = findNearestValue(stopNums, newValue);
  }

  const relativeMin = thumbInfo.minValue;
  const relativeMax = thumbInfo.maxValue;

  return clamp(newValue, relativeMin, relativeMax);
};

export const getNearestThumb = (
  value: number,
  thumbInfos: { infimum: ThumbInfo | null; supremum: ThumbInfo },
): ThumbInfo => {
  const { infimum, supremum } = thumbInfos;

  if (!infimum) return { ...supremum, index: 1 };

  const infDiff = Math.abs(infimum.value - value);
  const supDiff = Math.abs(supremum.value - value);

  return infDiff <= supDiff
    ? { ...infimum, index: 0 }
    : { ...supremum, index: 1 };
};
