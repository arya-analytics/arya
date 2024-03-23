// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { z } from "zod";

import { Case } from "@/case";
import {
  location,
  type Location,
  xLocation,
  yLocation,
  DIRECTIONS,
  X_LOCATIONS,
  Y_LOCATIONS,
  CENTER_LOCATIONS,
  type XLocation,
  type OuterLocation,
  type YLocation,
  outerLocation,
  type Direction,
  crudeLocation,
  type CrudeLocation,
  centerlocation,
  type CenterLocation,
} from "@/spatial/base";

export {
  location,
  type Location,
  X_LOCATIONS,
  Y_LOCATIONS,
  CENTER_LOCATIONS,
  outerLocation as outer,
};

export const x = xLocation;
export const y = yLocation;

export type X = XLocation;
export type Y = YLocation;
export type Outer = OuterLocation;
export type Center = CenterLocation;

const SWAPPED: Record<Location, Location> = {
  top: "bottom",
  right: "left",
  bottom: "top",
  left: "right",
  center: "center",
};

const ROTATE_90: Record<Location, Location> = {
  top: "left",
  right: "top",
  bottom: "right",
  left: "bottom",
  center: "center",
};

export const crude = crudeLocation;

export type Crude = CrudeLocation;

export const construct = (cl: Crude): Location => {
  if (cl instanceof String) return cl as Location;
  if (!DIRECTIONS.includes(cl as Direction)) return cl as Location;
  else if (cl === "x") return "left";
  else return "top";
};

export const swap = (cl: Crude): Location => SWAPPED[construct(cl)];

export const rotate90 = (cl: Crude): Location => ROTATE_90[construct(cl)];

export const direction = (cl: Crude): Direction => {
  const l = construct(cl);
  if (l === "top" || l === "bottom") return "y";
  return "x";
};

export const xy = z.object({
  x: xLocation.or(centerlocation),
  y: yLocation.or(centerlocation),
});
export const corner = z.object({ x: xLocation, y: yLocation });

export type XY = z.infer<typeof xy>;
export type CornerXY = z.infer<typeof corner>;
export type CornerXYString = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

export const TOP_LEFT: CornerXY = Object.freeze({ x: "left", y: "top" });
export const TOP_RIGHT: CornerXY = Object.freeze({ x: "right", y: "top" });
export const BOTTOM_LEFT: CornerXY = Object.freeze({ x: "left", y: "bottom" });
export const BOTTOM_RIGHT: CornerXY = Object.freeze({ x: "right", y: "bottom" });
export const CENTER: XY = Object.freeze({ x: "center", y: "center" });
export const TOP_CENTER: XY = Object.freeze({ x: "center", y: "top" });
export const BOTTOM_CENTER: XY = Object.freeze({ x: "center", y: "bottom" });
export const RIGHT_CENTER: XY = Object.freeze({ x: "right", y: "center" });
export const LEFT_CENTER: XY = Object.freeze({ x: "left", y: "center" });
export const XY_LOCATIONS: readonly XY[] = Object.freeze([
  LEFT_CENTER,
  RIGHT_CENTER,
  TOP_CENTER,
  BOTTOM_CENTER,
  TOP_LEFT,
  TOP_RIGHT,
  BOTTOM_LEFT,
  BOTTOM_RIGHT,
  CENTER,
]);

export const xyEquals = (a: XY, b: XY): boolean => a.x === b.x && a.y === b.y;

export const xyMatches = (a: XY, l: Partial<XY> | Location): boolean => {
  if (typeof l === "object") {
    let ok = true;
    if ("x" in l) {
      const ok_ = a.x === l.x;
      if (!ok_) ok = false;
    }
    if ("y" in l) {
      const ok_ = a.y === l.y;
      if (!ok_) ok = false;
    }
    return ok;
  }
  return a.x === l || a.y === l;
};

export const xyCouple = (a: XY): [Location, Location] => [a.x, a.y];

export const isX = (a: Crude): a is XLocation | CenterLocation =>
  direction(construct(a)) === "x";

export const isY = (a: Crude): a is YLocation => direction(construct(a)) === "y";

export const xyToString = (a: XY): string => `${a.x}${Case.capitalize(a.y)}`;

export const constructXY = (x: Crude | XY, y?: Crude): XY => {
  let parsedX: Location;
  let parsedY: Location;
  if (typeof x === "object" && "x" in x) {
    parsedX = x.x;
    parsedY = x.y;
  } else {
    parsedX = construct(x);
    parsedY = construct(y ?? x);
  }
  if (
    direction(parsedX) === direction(parsedY) &&
    parsedX !== "center" &&
    parsedY !== "center"
  )
    throw new Error(
      `[XYLocation] - encountered two locations with the same direction: ${parsedX.toString()} - ${parsedY.toString()}`,
    );
  const xy = { ...CENTER };
  if (parsedX === "center") {
    if (isX(parsedY)) [xy.x, xy.y] = [parsedY, parsedX];
    else [xy.x, xy.y] = [parsedX, parsedY];
  } else if (parsedY === "center") {
    if (isX(parsedX)) [xy.x, xy.y] = [parsedX, parsedY];
    else [xy.x, xy.y] = [parsedY, parsedX];
  } else if (isX(parsedX)) [xy.x, xy.y] = [parsedX, parsedY as YLocation];
  else [xy.x, xy.y] = [parsedY as XLocation, parsedX as YLocation];
  return xy;
};
