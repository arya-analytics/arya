// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import {
  type CSSProperties,
  type DetailedHTMLProps,
  type HTMLAttributes,
  type PropsWithChildren,
  type ReactElement,
  createContext,
  useCallback,
  useContext as reactUseContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { location, type Destructor, deep, direction, box } from "@synnaxlabs/x";
import { type z } from "zod";

import { Aether } from "@/aether";
import { type Color } from "@/color";
import { CSS } from "@/css";
import { useEffectCompare } from "@/hooks";
import { useMemoDeepEqualProps } from "@/memo";
import { type Viewport } from "@/viewport";
import { Canvas } from "@/vis/canvas";
import { lineplot } from "@/vis/lineplot/aether";
import {
  type GridEntrySpec,
  filterGridEntries,
  type GridSpec,
} from "@/vis/lineplot/aether/grid";

import "@/vis/lineplot/LinePlot.css";

type HTMLDivProps = DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;

export interface LinePlotContextValue {
  setGridEntry: (meta: GridEntrySpec) => void;
  removeGridEntry: (key: string) => void;
  setLine: (meta: LineSpec) => void;
  removeLine: (key: string) => void;
  lines: LineSpec[];
  setViewport: (viewport: Viewport.UseEvent) => void;
  addViewportHandler: (handler: Viewport.UseHandler) => Destructor;
  setHold: (hold: boolean) => void;
}

const Context = createContext<LinePlotContextValue | null>(null);

export const useContext = (component: string): LinePlotContextValue => {
  const ctx = reactUseContext(Context);
  if (ctx == null)
    throw new Error(`Cannot to use ${component} as a non-child of LinePlot.`);
  return ctx;
};

export const useViewport = (handle: Viewport.UseHandler): void => {
  const ctx = useContext("Viewport");
  const { addViewportHandler } = ctx;
  useEffect(() => addViewportHandler(handle), [addViewportHandler, handle]);
};

export const useGridEntry = (meta: GridEntrySpec, component: string): CSSProperties => {
  const { setGridEntry, removeGridEntry } = useContext(component);
  const { key } = meta;
  useEffectCompare(
    () => {
      location.outer.parse(meta.loc);
      setGridEntry(meta);
    },
    ([a], [b]) => deep.equal(a, b),
    [meta],
  );
  useEffect(() => {
    return () => removeGridEntry(key);
  }, []);
  const dir = direction.swap(location.direction(meta.loc));
  const gridArea =
    dir === "x"
      ? `axis-start-${key} / plot-start / axis-end-${key} / plot-end`
      : `plot-start / axis-start-${key} / plot-end / axis-end-${key}`;
  return { gridArea };
};

export interface LineSpec {
  key: string;
  color: Color.Crude;
  label: string;
}

type LineState = LineSpec[];

export interface LinePlotProps
  extends PropsWithChildren,
    Pick<z.input<typeof lineplot.linePlotStateZ>, "clearOverScan" | "hold">,
    HTMLDivProps {
  resizeDebounce?: number;
  onHold?: (hold: boolean) => void;
}

export const LinePlot = Aether.wrap<LinePlotProps>(
  "LinePlot",
  ({
    aetherKey,
    style,
    resizeDebounce: debounce = 0,
    clearOverScan,
    children,
    hold,
    ...props
  }): ReactElement => {
    const [lines, setLines] = useState<LineState>([]);

    const memoProps = useMemoDeepEqualProps({ clearOverScan, hold });

    const [{ path }, { grid }, setState] = Aether.use({
      aetherKey,
      type: lineplot.LinePlot.TYPE,
      schema: lineplot.linePlotStateZ,
      initialState: {
        container: box.ZERO,
        viewport: box.DECIMAL,
        grid: {},
        ...memoProps,
      },
    });

    useEffect(() => setState((prev) => ({ ...prev, ...memoProps })), [memoProps]);

    const viewportHandlers = useRef<Map<Viewport.UseHandler, null>>(new Map());

    const addViewportHandler = useCallback(
      (handler: Viewport.UseHandler) => {
        viewportHandlers.current.set(handler, null);
        return () => viewportHandlers.current.delete(handler);
      },
      [viewportHandlers],
    );

    const setViewport: Viewport.UseHandler = useCallback(
      (args) => {
        const { mode, box, stage } = args;
        if (
          (mode === "pan" && stage !== "start") ||
          mode === "zoom" ||
          (mode === "zoomReset" && stage === "start")
        )
          setState((prev) => ({ ...prev, viewport: box }));
        viewportHandlers.current.forEach((_, handler) => handler(args));
      },
      [setState],
    );

    // We use a single resize handler for both the container and plotting region because
    // the container is guaranteed to only resize if the plotting region does. This allows
    // us to save a window observer.
    const handleResize = useCallback(
      (container: box.Box) => setState((prev) => ({ ...prev, container })),
      [setState],
    );

    const ref = Canvas.useRegion(handleResize);

    const setGridEntry: LinePlotContextValue["setGridEntry"] = useCallback(
      (meta: GridEntrySpec) =>
        setState((prev) => ({
          ...prev,
          grid: { ...prev.grid, [meta.key]: meta },
        })),
      [setState],
    );

    const removeGridEntry = useCallback(
      (key: string) =>
        setState((prev) => {
          const { [key]: _, ...grid } = prev.grid;
          return { ...prev, grid };
        }),
      [setState],
    );

    const setLine = useCallback(
      (meta: LineSpec) => {
        setLines((prev) => [...prev.filter(({ key }) => key !== meta.key), meta]);
      },
      [setLines, setViewport],
    );

    const removeLine = useCallback(
      (key: string) => setLines((prev) => prev.filter(({ key: k }) => k !== key)),
      [setLine],
    );

    const cssGrid = useMemo(() => buildPlotGrid(grid), [grid]);

    const setHold = useCallback(
      (hold: boolean) => {
        setState((prev) => ({ ...prev, hold }));
        props.onHold?.(hold);
      },
      [setState, props.onHold],
    );

    const contextValue = useMemo<LinePlotContextValue>(
      () => ({
        lines,
        setGridEntry,
        removeGridEntry,
        setLine,
        removeLine,
        setViewport,
        addViewportHandler,
        setHold,
      }),
      [
        lines,
        setGridEntry,
        removeGridEntry,
        setLine,
        removeLine,
        setViewport,
        addViewportHandler,
        setHold,
      ],
    );

    return (
      <div
        className={CSS.B("line-plot")}
        style={{ ...style, ...cssGrid }}
        ref={ref}
        {...props}
      >
        <Context.Provider value={contextValue}>
          <Aether.Composite path={path}>{children}</Aether.Composite>
        </Context.Provider>
      </div>
    );
  },
);

const buildPlotGrid = (grid: GridSpec): CSSProperties => {
  const b = CSS.newGridBuilder();
  filterGridEntries("top", grid).forEach(({ key, size }) =>
    b.row(`axis-start-${key}`, `axis-end-${key}`, size),
  );
  b.row("plot-start", "plot-end", "minmax(0, 1fr)");
  filterGridEntries("bottom", grid).forEach(({ key, size }) =>
    b.row(`axis-start-${key}`, `axis-end-${key}`, size),
  );
  filterGridEntries("left", grid).forEach(({ key, size }) =>
    b.col(`axis-start-${key}`, `axis-end-${key}`, size),
  );
  b.col("plot-start", "plot-end", "minmax(0, 1fr)");
  filterGridEntries("right", grid).forEach(({ key, size }) =>
    b.col(`axis-start-${key}`, `axis-end-${key}`, size),
  );
  return b.build();
};
