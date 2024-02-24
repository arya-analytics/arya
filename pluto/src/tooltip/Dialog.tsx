// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import {
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
  cloneElement,
  useRef,
  useState,
  useId,
  isValidElement,
  useCallback,
} from "react";

import {
  type dimensions,
  xy,
  location,
  type CrudeTimeSpan,
  box,
  TimeSpan,
  type Destructor,
} from "@synnaxlabs/x";
import { createPortal } from "react-dom";

import { CSS } from "@/css";
import { Text } from "@/text";
import { useConfig } from "@/tooltip/Config";
import { isRenderProp, type RenderProp } from "@/util/renderProp";

import "@/tooltip/Dialog.css";

export interface DialogProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  delay?: CrudeTimeSpan;
  location?: location.Outer | Partial<location.XY>;
  hide?: boolean;
  children: [ReactNode | RenderProp<ContentProps>, ReactElement];
}

interface State {
  location: location.XY;
  position: xy.XY;
  triggerDims: dimensions.Dimensions;
}

export interface ContentProps extends State {}

const SIZE_THRESHOLD = 150;

const Y_LOCATION_PREFERENCES: location.Y[] = ["top", "bottom"];
const X_LOCATION_PREFERENCES: location.X[] = ["left", "right"];
const OUTER_LOCATION_PREFERENCES: location.Outer[] = [
  ...X_LOCATION_PREFERENCES,
  ...Y_LOCATION_PREFERENCES,
];
const LOCATION_PREFERENCES: location.Location[] = [
  ...OUTER_LOCATION_PREFERENCES,
  "center",
];

const LOCATION_TRANSLATIONS: Record<string, (p: xy.XY, container: box.Box) => xy.XY> = {
  [location.xyToString(location.TOP_RIGHT)]: (p, c) => xy.translateX(p, -box.width(c)),
  [location.xyToString(location.TOP_LEFT)]: (p, c) => xy.translateX(p, box.width(c)),
  [location.xyToString(location.BOTTOM_RIGHT)]: (p, c) =>
    xy.translateX(p, -box.width(c)),
  [location.xyToString(location.BOTTOM_LEFT)]: (p, c) => xy.translateX(p, box.width(c)),
};

const bestLocation = <C extends location.Location>(
  container: box.Box,
  window: box.Box,
  options: C[],
): C => {
  for (const location of options) {
    const distance = Math.abs(box.loc(window, location) - box.loc(container, location));
    if (distance > SIZE_THRESHOLD) return location;
  }
  return options[0];
};

export const chooseLocation = (
  cornerOrLocation: location.Outer | Partial<location.XY> | undefined,
  target: box.Box,
  window: box.Box,
): location.XY => {
  const parse = location.location.safeParse(cornerOrLocation);
  const chooseRemainingLocation = (first: location.Location): location.Location => {
    let preferences: location.Location[];
    if (first === "center") {
      preferences = OUTER_LOCATION_PREFERENCES;
    } else if (location.isX(first)) preferences = ["center", ...Y_LOCATION_PREFERENCES];
    else preferences = ["center", ...X_LOCATION_PREFERENCES];
    return location.construct(bestLocation(target, window, preferences));
  };

  if (parse.success) {
    return location.constructXY(parse.data, chooseRemainingLocation(parse.data));
  } else if (cornerOrLocation != null) {
    const v = { ...cornerOrLocation as Partial<location.XY>} ;
    if (v.x == null && v.y != null)
      v.x = chooseRemainingLocation(location.construct(v.y)) as location.X;
    else if (v.y == null && v.x != null)
      v.y = chooseRemainingLocation(location.construct(v.x)) as location.Y;
    else if (v.x == null && v.y == null) {
      v.x = bestLocation(target, window, LOCATION_PREFERENCES) as location.X;
      v.y = chooseRemainingLocation(location.construct(v.x)) as location.Y;
    }
    return location.constructXY(v as location.XY);
  }
  const chosen = bestLocation(target, window, LOCATION_PREFERENCES);
  return location.constructXY(chosen, chooseRemainingLocation(chosen));
};

const getRenderRoot = (target: HTMLElement): HTMLElement => {
  // get the first parent with a transform property or the body
  const el: HTMLElement | null = target;
  // while (el != null) {
  //   if (el.style.transform?.includes("scale")) return el;
  //   el = el.parentElement;
  // }
  return document.body;
};

const resolveTarget = (target: HTMLElement, id: string): HTMLElement => {
  // we want to find the first parent that has the given id
  let el: HTMLElement | null = target;
  while (el != null) {
    if (el.id === id) return el;
    el = el.parentElement;
  }
  return target;
};

/**
 * A tooltip that appears when the user hovers over an element.
 *
 * @param props - The props for the tooltip. Unlisted props are passed to the underlying
 * div element.
 * @param props.children - A ReactNode to render as the tooltip's content, followed by
 * a ReactElement to attach the tooltip to.
 * @param props.location - The location for the tooltip to appear relative to the
 * element it is attached to. If unspecified, the tooltip automatically chooses a
 * location based on the element's position on the screen.
 * @param props.hide - Force the tooltip to remain hidden, even when the user hovers
 * over the element it is attached to.
 * @default false.
 * @param props.delay - The delay before the tooltip appears, in milliseconds. This prop
 * overrides the value set in Tooltip.Config.
 * @default the value set in Tooltip.Config, which defaults to 500ms.
 */
export const Dialog = ({
  delay,
  children,
  location: cornerOrLocation,
  hide = false,
}: DialogProps): ReactElement => {
  const { startAccelerating, delay: configDelay } = useConfig();
  const parsedDelay = new TimeSpan(delay ?? configDelay);
  const [state, setState] = useState<State | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();
  const visibleCleanup = useRef<Destructor | null>(null);

  const handleVisibleChange = useCallback(
    (e: React.MouseEvent, visible: boolean): void => {
      if (!visible || hide) {
        visibleCleanup.current?.();
        return setState(null);
      }
      startAccelerating();
      const targetBox = box.construct(resolveTarget(e.target as HTMLElement, id));
      if (!box.contains(targetBox, xy.construct(e))) {
        visibleCleanup.current?.();
        return setState(null);
      }
      const window = box.construct(document.documentElement);
      const xyLoc = chooseLocation(cornerOrLocation, targetBox, window);

      let pos = box.xyLoc(targetBox, xyLoc);
      const translate = LOCATION_TRANSLATIONS[location.xyToString(xyLoc)];
      if (translate != null) pos = translate(pos, targetBox);

      const root = box.construct(document.body);
      setState({
        location: xyLoc,
        position: xy.translate(pos, xy.scale(box.topLeft(root), -1)),
        triggerDims: box.dims(targetBox),
      });

      visibleCleanup.current?.();
      const handleMove = (e: MouseEvent): void => {
        const cursor = xy.construct(e);
        if (box.contains(targetBox, cursor)) return;
        setState(null);
        document.removeEventListener("mousemove", handleMove);
        visibleCleanup.current = null;
        if (timeoutRef.current != null) clearTimeout(timeoutRef.current);
      };

      document.addEventListener("mousemove", handleMove);
      visibleCleanup.current = () =>
        document.removeEventListener("mousemove", handleMove);
      document.addEventListener(
        "mousedown",
        () => {
          setState(null);
          visibleCleanup.current?.();
        },
        { once: true },
      );
    },
    [startAccelerating, cornerOrLocation, hide, id, parsedDelay.milliseconds],
  );

  if (hide && state != null) setState(null);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent): void => {
      timeoutRef.current = setTimeout(
        () => handleVisibleChange(e, true),
        parsedDelay.milliseconds,
      );
    },
    [handleVisibleChange, parsedDelay.milliseconds],
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent): void => {
      if (timeoutRef.current != null) clearTimeout(timeoutRef.current);
      handleVisibleChange(e, false);
    },
    [handleVisibleChange],
  );

  const [tip, children_] = children;

  const root = getRenderRoot(document.getElementById(id) ?? document.body);

  return (
    <>
      {state != null &&
        createPortal(
          <div
            className={CSS(
              CSS.B("tooltip"),
              CSS.loc(state.location.x),
              CSS.loc(state.location.y),
            )}
            style={{
              // @ts-expect-error - css
              "--pos-x": CSS.px(state.position.x),
              "--pos-y": CSS.px(state.position.y),
              "--el-width": CSS.px(state.triggerDims.width),
            }}
          >
            {isRenderProp(tip) ? tip(state) : formatTip(tip)}
          </div>,
          root,
        )}
      {cloneElement(children_, {
        id,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onMouseDown: useCallback(
          (e: React.MouseEvent) => {
            handleMouseLeave(e);
            children_.props.onMouseDown?.(e);
          },
          [handleVisibleChange],
        ),
      })}
    </>
  );
};

export const formatTip = (tip: ReactNode): ReactNode => {
  if (typeof tip === "string" || typeof tip === "number" || !isValidElement(tip)) {
    return <Text.Text level="small">{tip as string | number}</Text.Text>;
  }
  return tip;
};
