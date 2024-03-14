// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import {
  type MutableRefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ForwardedRef,
} from "react";

import { box, xy, dimensions, location, scale } from "@synnaxlabs/x";

import { useStateRef } from "@/hooks/ref";
import { useMemoCompare } from "@/memo";
import { Triggers } from "@/triggers";

export interface UseEvent {
  box: box.Box;
  cursor: xy.XY;
  mode: Mode;
  stage: Triggers.Stage;
}

export type UseHandler = (e: UseEvent) => void;

export type UseTriggers = Triggers.ModeConfig<TriggerMode>;

export interface UseRefValue {
  reset: () => void;
}

export interface UseProps {
  triggers?: UseTriggers;
  onChange?: UseHandler;
  resetOnDoubleClick?: boolean;
  threshold?: dimensions.Dimensions;
  initial?: box.Box;
  ref?:
    | MutableRefObject<UseRefValue | undefined>
    | ForwardedRef<UseRefValue | undefined>;
}

export interface UseReturn {
  mode: Mode;
  maskBox: box.Box;
  ref: React.MutableRefObject<HTMLDivElement | null>;
}

const TRUNC_PRECISION = 4;

type StringLiteral<T> = T extends string ? (string extends T ? never : T) : never;

const TRIGGER_MODES = ["zoom", "pan", "select", "zoomReset"] as const;
export const MODES = [...TRIGGER_MODES, "click"] as const;
export type Mode = StringLiteral<(typeof MODES)[number]>;
type TriggerMode = StringLiteral<(typeof TRIGGER_MODES)[number]>;
export const MASK_MODES: Mode[] = ["zoom", "select"];

export const ZOOM_DEFAULT_TRIGGERS: UseTriggers = {
  defaultMode: "zoom",
  zoom: [["MouseLeft"]],
  zoomReset: [["MouseLeft", "Control"]],
  pan: [["MouseLeft", "Shift"]],
  select: [["MouseLeft", "Alt"]],
};

export const PAN_DEFAULT_TRIGGERS: UseTriggers = {
  defaultMode: "pan",
  pan: [["MouseLeft"]],
  zoom: [["MouseLeft", "Shift"]],
  zoomReset: [["MouseLeft", "Control"]],
  select: [["MouseLeft", "Alt"]],
};

export const SELECT_DEFAULT_TRIGGERS: UseTriggers = {
  defaultMode: "select",
  select: [["MouseLeft"]],
  pan: [["MouseLeft", "Shift"]],
  zoom: [["MouseLeft", "Alt"]],
  zoomReset: [["MouseLeft", "Control"]],
};

export const DEFAULT_TRIGGERS: Record<Mode, UseTriggers> = {
  zoom: ZOOM_DEFAULT_TRIGGERS,
  pan: PAN_DEFAULT_TRIGGERS,
  select: SELECT_DEFAULT_TRIGGERS,
  zoomReset: ZOOM_DEFAULT_TRIGGERS,
  click: ZOOM_DEFAULT_TRIGGERS,
};

const purgeMouseTriggers = (triggers: UseTriggers): UseTriggers => {
  const e = Object.entries(triggers) as Array<
    [TriggerMode | "defaultMode", Triggers.Trigger[]]
  >;
  return Object.fromEntries(
    e.map(([key, value]: [string, Triggers.Trigger[]]) => {
      if (key === "defaultMode") return [key, value];
      return [
        key,
        value
          .map((t) => t.filter((k) => k !== "MouseLeft"))
          .filter((t) => t.length > 0),
      ];
    }),
  ) as unknown as UseTriggers;
};

const D = box.construct(0, 0, 1, 1, location.TOP_LEFT);

const DEFAULT_THRESHOLD = { width: 30, height: 50 };

export const use = ({
  onChange,
  triggers: initialTriggers,
  initial = D,
  threshold: threshold_ = DEFAULT_THRESHOLD,
  ref,
}: UseProps): UseReturn => {
  const defaultMode = initialTriggers?.defaultMode ?? "zoom";

  const [maskBox, setMaskBox] = useState<box.Box>(box.ZERO);
  const [maskMode, setMaskMode] = useState<Mode>(defaultMode);
  const [stateRef, setStateRef] = useStateRef<box.Box>(initial);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const threshold = dimensions.construct(threshold_);

  useEffect(() => setStateRef(() => box.truncate(initial, 3)), [initial]);
  useEffect(() => setMaskMode(defaultMode), [defaultMode]);

  const [triggerConfig, reducedTriggerConfig, purgedTriggers, reducedPurgedTriggers] =
    useMemoCompare(
      (): [UseTriggers, Triggers.Trigger[], UseTriggers, Triggers.Trigger[]] => {
        const config: UseTriggers = {
          ...DEFAULT_TRIGGERS[defaultMode],
          ...initialTriggers,
        };
        const reducedTriggers = Triggers.flattenConfig(config);
        const mouseTriggers = purgeMouseTriggers(config);
        return [
          config,
          reducedTriggers,
          mouseTriggers,
          Triggers.flattenConfig(mouseTriggers),
        ];
      },
      Triggers.compareModeConfigs,
      [initialTriggers],
    );

  const handleDrag = useCallback<Triggers.DragCallback>(
    ({ box: box_, triggers, stage, cursor }): void => {
      if (canvasRef.current == null) return;
      const mode = Triggers.determineMode<TriggerMode>(triggerConfig, triggers);
      const canvas = box.construct(canvasRef.current);
      if (mode == null) return;

      if (mode === "zoomReset") {
        setMaskBox(box.ZERO);
        onChange?.({ box: box.DECIMAL, mode, stage, cursor });
        return setStateRef(box.DECIMAL);
      }

      if (stage === "end") {
        // This prevents clicks from being registered as a drag
        if (box.width(box_) < 5 && box.height(box_) < 5) {
          if (mode === "zoom") setMaskBox(box.ZERO);
          onChange?.({ box: stateRef.current, mode: "click", stage, cursor });
          return;
        }
        return setStateRef((prev) => {
          if (mode === "pan") {
            const next = handlePan(box_, prev, canvas);
            if (next === null) return prev;
            onChange?.({ box: next, mode, stage, cursor });
            return next;
          }
          const next = handleZoomSelect(box_, prev, canvas);
          if (next === null) return prev;
          onChange?.({ box: next, mode, stage, cursor });

          if (mode === "zoom") {
            setMaskBox(box.ZERO);
            return next;
          }
          return box.truncate(prev, TRUNC_PRECISION);
        });
      }

      if (MASK_MODES.includes(mode)) {
        if (box.height(box_) < 5 && box.width(box_) < 5) return;
        return setMaskBox(
          scale.XY.scale(canvas)
            .clamp(canvas)
            .translate({ x: -box.left(canvas), y: -box.top(canvas) })
            .box(fullSize(threshold, box_, canvas)),
        );
      }

      setMaskBox((prev) => (!box.isZero(prev) ? box.ZERO : prev));
      const next = handlePan(box_, stateRef.current, canvas);
      if (box.equals(next, stateRef.current)) return;
      onChange?.({
        box: next,
        mode,
        stage,
        cursor,
      });
    },
    [
      setMaskBox,
      setMaskMode,
      onChange,
      triggerConfig,
      threshold_.height,
      threshold_.width,
      setStateRef,
      canvasRef,
    ],
  );

  useImperativeHandle(
    ref,
    () => ({
      reset: () => {
        setMaskBox(box.ZERO);
        setStateRef(box.DECIMAL);
        onChange?.({
          box: box.DECIMAL,
          mode: "zoomReset",
          stage: "start",
          cursor: xy.ZERO,
        });
      },
    }),
    [onChange],
  );

  const handleZoomSelect = useCallback(
    (b: box.Box, prev: box.Box, canvas: box.Box): box.Box | null =>
      box.truncate(
        constructScale(prev, canvas).box(fullSize(threshold, b, canvas)),
        TRUNC_PRECISION,
      ),
    [threshold_],
  );

  const t = Triggers.useHeldRef({
    triggers: [["Control"]],
  });

  useEffect(() => {
    const handler = (e: WheelEvent): void => {
      if (canvasRef.current == null) return;
      let sf = 1;
      if (e.deltaY < 0) sf += 0.03;
      else sf -= 0.03;
      const canvasBox = box.construct(canvasRef.current);
      const rawCursor = xy.construct(e);
      if (!box.contains(canvasBox, rawCursor) || e.target !== canvasRef.current) return;
      const s2 = constructScale(stateRef.current, box.construct(canvasRef.current));
      const cursor = s2.pos(xy.construct(e));
      const s = scale.XY.magnify({ x: t.current.held ? 1 : sf, y: sf });
      let next = s.box(stateRef.current);
      next = box.translate(next, {
        x: t.current.held ? 0 : cursor.x * (1 - sf),
        y: cursor.y * (1 - sf),
      });
      setStateRef(next);
      onChange?.({
        stage: "end",
        box: next,
        cursor: xy.construct(e),
        mode: "zoom",
      });
    };
    window.addEventListener("wheel", handler);
    return () => window.removeEventListener("wheel", handler);
  }, [setStateRef, onChange]);

  Triggers.useDrag({
    bound: canvasRef,
    onDrag: handleDrag,
    triggers: reducedTriggerConfig,
    loose: true,
  });

  const handleKeyTrigger = useCallback(
    ({ triggers, stage }: Triggers.UseEvent) => {
      if (stage === "end") return setMaskMode(defaultMode);
      const mode = Triggers.determineMode<TriggerMode>(purgedTriggers, triggers);
      if (mode == null) return;
      setMaskMode(mode);
    },
    [purgedTriggers, defaultMode, onChange],
  );

  Triggers.use({
    triggers: reducedPurgedTriggers,
    callback: handleKeyTrigger,
    region: canvasRef,
  });

  return {
    maskBox,
    ref: canvasRef,
    mode: maskMode,
  };
};

const constructScale = (prev: box.Box, canvas: box.Box): scale.XY =>
  scale.XY.scale(canvas).clamp(canvas).scale(prev);

const handlePan = (b: box.Box, prev: box.Box, canvas: box.Box): box.Box => {
  let dims = box.signedDims(constructScale(prev, canvas).box(b));
  dims = { signedWidth: -dims.signedWidth, signedHeight: -dims.signedHeight };
  return box.truncate(
    scale.XY.translate(xy.construct(dims)).box(prev),
    TRUNC_PRECISION,
  );
};

const fullSize = (
  threshold: dimensions.Dimensions,
  b: box.Box,
  parent: box.Box,
): box.Box => {
  if (box.height(b) <= threshold.height)
    return box.construct(
      box.left(b),
      box.top(parent),
      box.width(b),
      box.height(parent),
    );
  if (box.width(b) <= threshold.width)
    return box.construct(
      box.left(parent),
      box.top(b),
      box.width(parent),
      box.height(b),
    );
  return b;
};
