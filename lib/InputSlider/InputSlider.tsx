import * as React from "react";
import {
  SystemError,
  SystemKeys,
  resolvePropWithRenderContext,
} from "../internals";
import type { MergeElementProps, PropWithRenderContext } from "../types";
import {
  clamp,
  componentWithForwardedRef,
  getBoundingClientRect,
  inLerp,
  remap,
  useControlledProp,
  useEventCallback,
  useEventListener,
  useForkedRefs,
  useIsMounted,
} from "../utils";
import { InputSliderContext, type InputSliderContextValue } from "./context";
import * as Slots from "./slots";
import type {
  Orientation,
  Positions,
  StopSegment,
  ThumbInfo,
  ThumbState,
  ThumbsInfo,
} from "./types";
import { getNearestThumb, getRelativeValue } from "./utils";

type ActiveThumb = {
  index: ThumbInfo["index"];
  name: ThumbInfo["name"];
  element: HTMLDivElement;
};

export type RenderProps = {
  /**
   * The `value` state of the component.
   */
  value: number | [number, number];
  /**
   * The `disabled` state of the component.
   */
  disabled: boolean;
  /**
   * The `readOnly` state of the component.
   */
  readOnly: boolean;
  /**
   * Determines whether any thumb is being dragged or not.
   */
  dragging: boolean;
  /**
   * The orientation of the component.
   */
  orientation: "horizontal" | "vertical";
  /**
   * The created stop segments associated with `stops` prop.
   */
  stopSegments: StopSegment[];
  /**
   * A helper function which gets the index of a stop segment,
   * then moves the nearest thumb to the position of that stop segment.
   *
   * Only works when there are stop segments created by `stops` prop.
   */
  goToStopSegment: (segmentIdx: number) => void;
};

export type ClassNameProps = Omit<
  RenderProps,
  "goToStopSegment" | "value" | "stopSegments"
>;

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
   * If `true`, the slider will be disabled.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * If `true`, the slider will be read-only.
   *
   * @default false
   */
  readOnly?: boolean;
  /**
   * If `true`, the slider will be a ranged slider.
   */
  multiThumb: boolean;
  /**
   * The orientation of the slider.
   */
  orientation: Orientation;
  /**
   * The minimum allowed value of the slider. Should not be greater than or equal to `max`.
   */
  min: number;
  /**
   * The maximum allowed value of the slider. Should not be less than or equal to `min`.
   */
  max: number;
  /**
   * The granularity with which the slider can step through values.
   * We recommend (max - min) to be evenly divisible by the step.
   *
   * When step is `snap`, the thumb can only be slid onto (snap on)
   * stops provided with the `stops` prop.
   */
  step?: number | "snap";
  /**
   * Stops indicate predetermined values to which the user can move the slider.
   *
   * When stops is a number, evenly-spaced stops will be created
   * (the number indicates the amount of stops to create).
   *
   * When an array of number is provided,
   * each number indicates the position in which a stop is created.
   */
  stops?: number | number[];
  /**
   * A function which returns a string value that provides a user-friendly name
   * for the current value of the slider. This is important for screen reader users.
   */
  setThumbValueText: (thumbValue: number) => string;
};

export type Props = Omit<
  MergeElementProps<"div", OwnProps>,
  | "defaultChecked"
  | "defaultValue"
  | "value"
  | "checked"
  | "onChange"
  | "onChangeCapture"
> &
  (
    | {
        multiThumb: false;
        /**
         * The value of the slider. For ranged sliders, provide an array with two values.
         */
        value?: number;
        /**
         * The default value of the slider. Use when the component is not controlled.
         */
        defaultValue?: number;
        /**
         * Callback fired when the slider's value changes.
         */
        onValueChange?: (value: number) => void;
      }
    | {
        multiThumb: true;
        value?: [number, number];
        defaultValue?: [number, number];
        onValueChange?: (value: [number, number]) => void;
      }
  );

const InputSliderBase = (props: Props, ref: React.Ref<HTMLDivElement>) => {
  const {
    style: styleProp,
    className: classNameProp,
    children: childrenProp,
    max,
    min,
    step,
    stops,
    onValueChange,
    onClick,
    setThumbValueText,
    value: valueProp,
    defaultValue,
    orientation,
    multiThumb = false,
    disabled = false,
    readOnly = false,
    ...otherProps
  } = props;

  if (typeof min === "undefined") {
    throw new SystemError("The `min` property is missing.", "InputSlider");
  }

  if (typeof max === "undefined") {
    throw new SystemError("The `max` property is missing.", "InputSlider");
  }

  if (max < min) {
    throw new SystemError(
      "The `min` property must be less than or equal to `max` property.",
      "InputSlider",
    );
  }

  if (typeof stops === "undefined" && step === "snap") {
    throw new SystemError(
      'When using `step="snap"` you must also provide a valid `stops` property.',
      "InputSlider",
    );
  }

  const [value, setValue] = useControlledProp<number | [number, number]>(
    valueProp,
    defaultValue,
    multiThumb ? [min, max] : max,
  );

  if (multiThumb && !Array.isArray(value)) {
    throw new SystemError(
      "The `value` and `defaultValue` " +
        "should be an array of exactly two numbers when `multiThumb={true}.`",
      "InputSlider",
    );
  }

  if (!multiThumb && typeof value !== "number") {
    throw new SystemError(
      "The `value` and `defaultValue` " +
        "should be a number when `multiThumb={false}.`",
      "InputSlider",
    );
  }

  const valueState = (() => {
    if (Array.isArray(value)) {
      const v0 = clamp(value[0], min, max);
      const v1 = clamp(value[1], min, max);

      if (v0 > v1) {
        throw new SystemError(
          "Invalid `value` provided. (`value[0] > value[1]`)",
          "InputSlider",
        );
      }

      return [v0, v1] as [number, number];
    } else return clamp(value, min, max);
  })();

  const stopSegments: StopSegment[] = React.useMemo(() => {
    if (typeof stops === "number") {
      if (stops === 0) return [];

      const segArr = Array(stops + 1).fill({
        length: 100 / stops,
      }) as StopSegment[];

      return segArr.map((seg, idx) => ({
        length: seg.length * idx,
        index: idx,
      }));
    }

    if (!stops) return [];

    return stops.reduce((result, currentStop, idx) => {
      const segment: StopSegment = {
        length: inLerp(min, max, currentStop) * 100,
        index: idx,
      };

      result.push(segment);

      return result;
    }, [] as StopSegment[]);
  }, [stops, max, min]);

  const isMounted = useIsMounted();

  const activeThumbRef = React.useRef<ActiveThumb | null>(null);

  const [isDragStarted, setIsDragStarted] = React.useState(false);
  const [isClickAllowed, setIsClickAllowed] = React.useState(true);

  const rootRef = React.useRef<HTMLDivElement>(null);
  const handleRootRef = useForkedRefs(ref, rootRef);

  const infimumRef = React.useRef<HTMLDivElement>(null);
  const supremumRef = React.useRef<HTMLDivElement>(null);

  const [infimumState, setInfimumState] = React.useState<ThumbState>({
    active: false,
    zIndex: 1,
  });

  const [supremumState, setSupremumState] = React.useState<ThumbState>({
    active: false,
    zIndex: 1,
  });

  const getThumbsInfo = (): ThumbsInfo => {
    const infimumValue = multiThumb ? (valueState as [number, number])[0] : min;

    const supremumValue = multiThumb
      ? (valueState as [number, number])[1]
      : (valueState as number);

    return {
      infimum: {
        index: 0,
        name: "infimum",
        value: infimumValue,
        minValue: min,
        maxValue: supremumValue,
        ref: infimumRef,
        state: infimumState,
        setState: setInfimumState,
      },
      supremum: {
        index: 1,
        name: "supremum",
        value: supremumValue,
        minValue: infimumValue,
        maxValue: max,
        ref: supremumRef,
        state: supremumState,
        setState: setSupremumState,
      },
    };
  };

  const getPositions = (): Positions => {
    const thumbsInfo = getThumbsInfo();

    const infimum = inLerp(min, max, thumbsInfo.infimum.value) * 100;
    const supremum = inLerp(min, max, thumbsInfo.supremum.value) * 100;

    const range = {
      start: multiThumb ? infimum : 0,
      end: 100 - supremum,
    };

    return { infimum, supremum, range };
  };

  const emitValueChange = (newValue: number | [number, number]) => {
    if (readOnly || disabled || !isMounted()) return;

    setValue(newValue);
    // @ts-expect-error It's fine!
    onValueChange?.(newValue);
  };

  const getActiveThumb = (eventTarget: HTMLDivElement): ActiveThumb => {
    const isInfimum = eventTarget === infimumRef.current;
    const isSupremum = eventTarget === supremumRef.current;

    return {
      element: eventTarget,
      index: isInfimum ? 0 : isSupremum ? 1 : 1,
      name: isInfimum ? "infimum" : isSupremum ? "supremum" : "supremum",
    };
  };

  const getThumbInfo = (index: 0 | 1): ThumbInfo => {
    const thumbsInfo = getThumbsInfo();

    return index === 0 ? thumbsInfo.infimum : thumbsInfo.supremum;
  };

  const handleThumbKeyDown = useEventCallback<
    React.KeyboardEvent<HTMLDivElement>
  >(event => {
    if (readOnly || disabled || !isMounted()) return;

    const increase = [SystemKeys.RIGHT, SystemKeys.UP].includes(event.key);
    const decrease = [SystemKeys.LEFT, SystemKeys.DOWN].includes(event.key);

    const goStart = event.key === SystemKeys.HOME;
    const goEnd = event.key === SystemKeys.END;

    if (!increase && !decrease && !goStart && !goEnd) return;

    event.preventDefault();

    const activeThumb = getActiveThumb(event.currentTarget);
    const thumbInfo = getThumbInfo(activeThumb.index);
    const oppositeThumbInfo = getThumbInfo(
      ((activeThumb.index + 1) % 2) as 0 | 1,
    );

    activeThumbRef.current = null;
    thumbInfo.state.zIndex = 2;
    oppositeThumbInfo.state.zIndex = 1;

    const relativeMin = thumbInfo.minValue;
    const relativeMax = thumbInfo.maxValue;

    let newValue: number;

    if (typeof step === "undefined") {
      if (goStart) newValue = min;
      else if (goEnd) newValue = max;
      else newValue = thumbInfo.value + (increase ? 1 : decrease ? -1 : 0);
    } else if (step === "snap") {
      const stopNums = stopSegments.map(
        segment => (segment.length * max) / 100,
      );

      let nextIdx: number;

      if (goStart) nextIdx = 0;
      else if (goEnd) nextIdx = stopNums.length - 1;
      else {
        const valIdx = stopNums.indexOf(thumbInfo.value);

        nextIdx = clamp(
          increase ? valIdx + 1 : decrease ? valIdx - 1 : 0,
          0,
          stopNums.length - 1,
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      newValue = stopNums[nextIdx]!;
    } else {
      if (goStart) newValue = min;
      else if (goEnd) newValue = max;
      else {
        newValue = thumbInfo.value + (increase ? step : decrease ? -step : 0);
      }
    }

    const relativeValue = clamp(newValue, relativeMin, relativeMax);

    if (multiThumb) {
      const isChanged =
        (value as [number, number])[activeThumb.index] !== relativeValue;

      if (isChanged) {
        emitValueChange(
          activeThumb.index === 0
            ? [relativeValue, (valueState as [number, number])[1]]
            : [(valueState as [number, number])[0], relativeValue],
        );
      }
    } else emitValueChange(relativeValue);
  });

  const handleThumbDragStart = (
    event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
  ) => {
    if (readOnly || disabled || !isMounted()) return;
    if (!rootRef.current) return;

    const activeThumb = getActiveThumb(event.currentTarget);

    activeThumbRef.current = activeThumb;

    setIsDragStarted(true);
    setIsClickAllowed(false);

    const thumb = getThumbInfo(activeThumb.index);
    const oppositeThumb = getThumbInfo(((activeThumb.index + 1) % 2) as 0 | 1);

    thumb.setState({ active: true, zIndex: 2 });
    oppositeThumb.setState(s => ({ ...s, zIndex: 1 }));
  };

  const handleDragEnd = (): void => {
    if (readOnly || disabled || !isMounted()) return;
    if (!activeThumbRef.current) return;

    const activeThumb = activeThumbRef.current;
    const thumb = getThumbInfo(activeThumb.index);

    if (!thumb.state.active) return void (activeThumbRef.current = null);

    setIsDragStarted(false);
    setTimeout(() => setIsClickAllowed(true), 10);

    thumb.setState(s => ({ ...s, active: false }));
    thumb.ref.current?.focus();

    activeThumbRef.current = null;
  };

  const handleDragging = (event: MouseEvent | TouchEvent) => {
    if (readOnly || disabled || !isMounted()) return;
    if (!rootRef.current) return;
    if (!activeThumbRef.current) return;

    const activeThumb = activeThumbRef.current;
    const thumbInfo = getThumbInfo(activeThumb.index);

    if (!thumbInfo.state.active) return;

    if (event.cancelable) {
      event.preventDefault();
      event.stopPropagation();
    }

    let clientXOrY =
      event.type === "touchmove"
        ? (event as TouchEvent).touches[0]?.[
            orientation === "horizontal" ? "clientX" : "clientY"
          ] ?? 0
        : (event as MouseEvent)[
            orientation === "horizontal" ? "clientX" : "clientY"
          ];

    const rect = getBoundingClientRect(rootRef.current);

    const leftOrTop = orientation === "horizontal" ? rect.left : rect.top;
    const widthOrHeight =
      orientation === "horizontal" ? rect.width : rect.height;

    clientXOrY = clientXOrY - leftOrTop;
    clientXOrY = clamp(clientXOrY, 0, widthOrHeight);

    const relativeValue = getRelativeValue(
      clientXOrY,
      widthOrHeight,
      thumbInfo,
      stopSegments,
      { max, min, step, orientation },
    );

    if (multiThumb) {
      const isChanged =
        (value as [number, number])[activeThumb.index] !== relativeValue;

      if (isChanged) {
        emitValueChange(
          activeThumb.index === 0
            ? [relativeValue, (valueState as [number, number])[1]]
            : [(valueState as [number, number])[0], relativeValue],
        );
      }
    } else emitValueChange(relativeValue);
  };

  const handleTrackClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isClickAllowed || readOnly || disabled || !isMounted()) return;
    if (!rootRef.current) return;

    let clientXOrY =
      orientation === "horizontal" ? event.clientX : event.clientY;

    const rect = getBoundingClientRect(rootRef.current);

    const leftOrTop = orientation === "horizontal" ? rect.left : rect.top;
    const widthOrHeight =
      orientation === "horizontal" ? rect.width : rect.height;

    clientXOrY = clientXOrY - leftOrTop;
    clientXOrY = clamp(clientXOrY, 0, widthOrHeight);

    const thumb = getNearestThumb(remap(clientXOrY, 0, widthOrHeight, 0, max), {
      infimum: multiThumb ? getThumbInfo(0) : null,
      supremum: getThumbInfo(1),
    });

    const relativeValue = getRelativeValue(
      clientXOrY,
      widthOrHeight,
      thumb,
      stopSegments,
      { max, min, step, orientation },
    );

    if (multiThumb) {
      const isChanged =
        (value as [number, number])[thumb.index] !== relativeValue;

      if (isChanged) {
        emitValueChange(
          thumb.index === 0
            ? [relativeValue, (valueState as [number, number])[1]]
            : [(valueState as [number, number])[0], relativeValue],
        );
      }
    } else emitValueChange(relativeValue);

    thumb.ref.current?.focus();

    onClick?.(event);
  };

  const goToStopSegment = (segmentIdx: number) => {
    if (readOnly || disabled || !isMounted()) return;
    if (stopSegments.length === 0) return;

    const segment = stopSegments[segmentIdx];

    if (!segment) return;

    const newValue = segment.length;

    const thumb = getNearestThumb(newValue, {
      infimum: multiThumb ? getThumbInfo(0) : null,
      supremum: getThumbInfo(1),
    });

    const relativeMin = thumb.minValue;
    const relativeMax = thumb.maxValue;

    const relativeValue = clamp(newValue, relativeMin, relativeMax);

    if (multiThumb) {
      const isChanged =
        (value as [number, number])[thumb.index] !== relativeValue;

      if (isChanged) {
        emitValueChange(
          thumb.index === 0
            ? [relativeValue, (valueState as [number, number])[1]]
            : [(valueState as [number, number])[0], relativeValue],
        );
      }
    } else emitValueChange(relativeValue);
  };

  const renderProps: RenderProps = {
    value: valueState,
    dragging: isDragStarted,
    disabled,
    readOnly,
    orientation,
    stopSegments,
    goToStopSegment,
  };

  const classNameProps: ClassNameProps = {
    disabled,
    readOnly,
    orientation,
    dragging: isDragStarted,
  };

  const children = resolvePropWithRenderContext(childrenProp, renderProps);
  const className = resolvePropWithRenderContext(classNameProp, classNameProps);

  const style: React.CSSProperties = {
    ...(styleProp ?? {}),
    position: "relative",
    direction: "ltr",
  };

  const context: InputSliderContextValue = {
    disabled,
    readOnly,
    multiThumb,
    orientation,
    getPositions,
    getThumbsInfo,
    handleThumbDragStart,
    handleThumbKeyDown,
    setThumbValueText,
  };

  if (typeof document !== "undefined") {
    /* eslint-disable react-hooks/rules-of-hooks */
    useEventListener({
      target: document,
      eventType: "touchend",
      handler: handleDragEnd,
      options: { passive: false },
    });
    useEventListener({
      target: document,
      eventType: "mouseup",
      handler: handleDragEnd,
      options: { passive: false },
    });
    useEventListener(
      {
        target: document,
        eventType: "touchmove",
        handler: handleDragging,
        options: { passive: false },
      },
      isDragStarted,
    );
    useEventListener(
      {
        target: document,
        eventType: "mousemove",
        handler: handleDragging,
        options: { passive: false },
      },
      isDragStarted,
    );
    /* eslint-enable react-hooks/rules-of-hooks */
  }

  return (
    <div
      {...otherProps}
      // @ts-expect-error React hasn't added `inert` yet
      inert={!disabled ? undefined : ""}
      ref={handleRootRef}
      style={style}
      className={className}
      onClick={handleTrackClick}
      aria-orientation={orientation}
      data-slot={Slots.Root}
      data-orientation={orientation}
      data-multi-thumb={multiThumb ? "" : undefined}
      data-dragging={isDragStarted ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      data-readonly={readOnly ? "" : undefined}
    >
      <InputSliderContext.Provider value={context}>
        {children}
      </InputSliderContext.Provider>
    </div>
  );
};

const InputSlider = componentWithForwardedRef(InputSliderBase, "InputSlider");

export default InputSlider;
