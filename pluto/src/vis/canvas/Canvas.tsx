// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import {
  type CanvasHTMLAttributes,
  type DetailedHTMLProps,
  type ReactElement,
  useCallback,
  useRef,
  useEffect,
} from "react";

import { box, runtime, scale, xy } from "@synnaxlabs/x";

import { Aether } from "@/aether";
import { CSS } from "@/css";
import { type UseResizeHandler, useResize } from "@/hooks";
import { canvas } from "@/vis/canvas/aether";

import "@/vis/canvas/Canvas.css";

type HTMLCanvasProps = DetailedHTMLProps<
  CanvasHTMLAttributes<HTMLCanvasElement>,
  HTMLCanvasElement
>;

export interface CanvasProps extends Omit<HTMLCanvasProps, "ref"> {
  resizeDebounce?: number;
}

const ZERO_PROPS = { region: box.ZERO, dpr: 1, os: runtime.getOS() as runtime.OS };

interface Canvases {
  gl: HTMLCanvasElement | null;
  lower2d: HTMLCanvasElement | null;
  upper2d: HTMLCanvasElement | null;
  bootstrapped: boolean;
}

const ZERO_CANVASES: Canvases = {
  gl: null,
  lower2d: null,
  upper2d: null,
  bootstrapped: false,
};

export const Canvas = Aether.wrap<CanvasProps>(
  canvas.Canvas.TYPE,
  ({
    children,
    resizeDebounce: debounce = 100,
    className,
    aetherKey,
    ...props
  }): ReactElement => {
    const [{ path }, { bootstrapped, dpr }, setState] = Aether.use({
      aetherKey,
      type: canvas.Canvas.TYPE,
      schema: canvas.canvasStateZ,
      initialState: ZERO_PROPS,
    });

    const canvases = useRef<Canvases>({ ...ZERO_CANVASES });

    const handleResize = useCallback(
      (region: box.Box) => {
        if (canvases.current.bootstrapped)
          setState(() => ({
            bootstrapped: true,
            region,
            dpr: window.devicePixelRatio,
            os: runtime.getOS({ default: "Windows" }) as runtime.OS,
          }));
      },
      [setState],
    );

    const resizeRef = useResize(handleResize, { debounce });

    useEffect(() => {
      // Handle device pixel ratio change i.e. when the user moves the window to a
      // different display.
      const handleChange = (): void => {
        if (window.devicePixelRatio === dpr) return;
        setState((p) => ({ ...p, dpr: window.devicePixelRatio }));
      };
      window
        .matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
        .addEventListener("change", handleChange, { once: true });
    }, [dpr]);

    const refCallback = useCallback(
      (el: HTMLCanvasElement | null) => {
        resizeRef(el);
        if (el == null) return;

        // Store the canvas
        if (el.className.includes("gl")) canvases.current.gl = el;
        else if (el.className.includes("upper2d")) canvases.current.upper2d = el;
        else canvases.current.lower2d = el;
        const { gl, lower2d, upper2d, bootstrapped } = canvases.current;

        if (gl == null || lower2d == null || upper2d == null || bootstrapped) return;

        // Bootstrap the canvas
        canvases.current.bootstrapped = true;
        const glCanvas = gl.transferControlToOffscreen();
        const upper2dCanvas = upper2d.transferControlToOffscreen();
        const lower2dCanvas = lower2d.transferControlToOffscreen();
        setState(
          {
            glCanvas,
            upper2dCanvas,
            lower2dCanvas,
            bootstrap: true,
            bootstrapped: false,
            region: box.construct(gl),
            dpr: window.devicePixelRatio,
            os: runtime.getOS({ default: "Windows" }) as runtime.OS,
          },
          [glCanvas, upper2dCanvas, lower2dCanvas],
        );
      },
      [setState],
    );

    return (
      <>
        <canvas
          ref={refCallback}
          className={CSS(CSS.BM("canvas", "lower2d"), className)}
          {...props}
        />
        <canvas
          ref={refCallback}
          className={CSS(CSS.BM("canvas", "gl"), className)}
          {...props}
        />
        <canvas
          ref={refCallback}
          className={CSS(CSS.BM("canvas", "upper2d"), className)}
          {...props}
        />
        <Aether.Composite path={path}>{bootstrapped && children}</Aether.Composite>
      </>
    );
  },
);

export const useRegion = (f: UseResizeHandler): React.RefCallback<HTMLElement> =>
  useResize(
    useCallback(
      (b, el) => {
        const canvas = document.querySelector(".pluto-canvas--lower2d");
        if (canvas == null) return;
        const b2 = box.construct(canvas);
        b = scale.XY.translate(xy.scale(box.topLeft(b2), -1)).box(b);
        f(b, el);
      },
      [f],
    ),
  );
