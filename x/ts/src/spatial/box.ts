// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { unknown, z } from "zod";

import type * as bounds from "@/spatial/bounds";
import type * as dimensions from "@/spatial/dimensions";
import * as direction from "@/spatial/direction";
import * as location from "@/spatial/location";
import * as xy from "@/spatial/xy";

const cssPos = z.union([z.number(), z.string()]);

const cssBox = z.object({
  top: cssPos,
  left: cssPos,
  width: cssPos,
  height: cssPos,
});
const domRect = z.object({
  left: z.number(),
  top: z.number(),
  right: z.number(),
  bottom: z.number(),
});
export const box = z.object({
  one: xy.xy,
  two: xy.xy,
  root: location.corner,
});

export type Box = z.infer<typeof box>;
export type CSS = z.infer<typeof cssBox>;
export type DOMRect = z.infer<typeof domRect>;

type Crude = DOMRect | Box | { getBoundingClientRect: () => DOMRect };

/** A box centered at (0,0) with a width and height of 0. */
export const ZERO = { one: xy.ZERO, two: xy.ZERO, root: location.TOP_LEFT };

/**
 * A box centered at (0,0) with a width and height of 1, and rooted in the
 * bottom left. Note that pixel space is typically rooted in the top left.
 */
export const DECIMAL = { one: xy.ZERO, two: xy.ONE, root: location.BOTTOM_LEFT };

export const copy = (b: Box, root?: location.CornerXY): Box => ({
  one: b.one,
  two: b.two,
  root: root ?? b.root,
});

/**
 * Box represents a general box in 2D space. It typically represents a bounding box
 * for a DOM element, but can also represent a box in clip space or decimal space.
 *
 * It'simportant to note that the behavior of a Box varies depending on its coordinate
 * system.Make sure you're aware of which coordinate system you're using.
 *
 * Many of the properties and methods on a Box access the same semantic value. The
 * different accessors are there for ease of use and semantics.
 */
export const construct = (
  first: number | DOMRect | xy.XY | Box | { getBoundingClientRect: () => DOMRect },
  second?: number | xy.XY | dimensions.Dimensions | dimensions.Signed,
  width: number = 0,
  height: number = 0,
  coordinateRoot?: location.CornerXY,
): Box => {
  const b: Box = {
    one: { ...xy.ZERO },
    two: { ...xy.ZERO },
    root: coordinateRoot ?? location.TOP_LEFT,
  };

  if (typeof first === "number") {
    if (typeof second !== "number")
      throw new Error("Box constructor called with invalid arguments");
    b.one = { x: first, y: second };
    b.two = { x: b.one.x + width, y: b.one.y + height };
    return b;
  }

  if ("one" in first && "two" in first && "root" in first)
    return { ...first, root: coordinateRoot ?? first.root };

  if ("getBoundingClientRect" in first) first = first.getBoundingClientRect();
  if ("left" in first) {
    b.one = { x: first.left, y: first.top };
    b.two = { x: first.right, y: first.bottom };
    return b;
  }

  b.one = first;
  if (second == null) b.two = { x: b.one.x + width, y: b.one.y + height };
  else if (typeof second === "number")
    b.two = { x: b.one.x + second, y: b.one.y + width };
  else if ("width" in second)
    b.two = {
      x: b.one.x + second.width,
      y: b.one.y + second.height,
    };
  else if ("signedWidth" in second)
    b.two = {
      x: b.one.x + second.signedWidth,
      y: b.one.y + second.signedHeight,
    };
  else b.two = second;
  return b;
};

export const resize = (
  b: Box,
  dims: dimensions.Dimensions,
): Box => construct(b.one, dims);

/**
 * Checks if a box contains a point or another box.
 *
 * @param value - The point or box to check.
 * @returns true if the box inclusively contains the point or box and false otherwise.
 */
export const contains = (b: Crude, value: Box | xy.XY): boolean => {
  const b_ = construct(b);
  if ("one" in value)
    return (
      left(value) >= left(b_) &&
      right(value) <= right(b_) &&
      top(value) >= top(b_) &&
      bottom(value) <= bottom(b_)
    );
  return (
    value.x >= left(b_) &&
    value.x <= right(b_) &&
    value.y >= top(b_) &&
    value.y <= bottom(b_)
  );
};

/**
 * @returns true if the given box is semantically equal to this box and false otherwise.
 */
export const equals = (a: Box, b: Box): boolean =>
  xy.equals(a.one, b.one) &&
  xy.equals(a.two, b.two) &&
  location.xyEquals(a.root, b.root);

/**
 * @returns the dimensions of the box. Note that these dimensions are guaranteed to
 * be positive. To get the signed dimensions, use the `signedDims` property.
 */
export const dims = (b: Box): dimensions.Dimensions => ({
  width: width(b),
  height: height(b),
});

/**
 * @returns the dimensions of the box. Note that these dimensions may be negative.
 * To get the unsigned dimensions, use the `dims` property.
 */
export const signedDims = (b: Box): dimensions.Signed => ({
  signedWidth: signedWidth(b),
  signedHeight: signedHeight(b),
});

/**
 * @returns the css representation of the box.
 */
export const css = (b: Box): CSS => ({
  top: top(b),
  left: left(b),
  width: width(b),
  height: height(b),
});

export const dim = (
  b: Crude,
  dir: direction.Crude,
  signed: boolean = false,
): number => {
  const dim: number =
    direction.construct(dir) === "y" ? signedHeight(b) : signedWidth(b);
  return signed ? dim : Math.abs(dim);
};



/** @returns the pont corresponding to the given corner of the box. */
export const xyLoc = (b: Crude, l: location.XY): xy.XY => {
  const b_ = construct(b);
  return {
    x: l.x === "center" ? center(b_).x : loc(b_, l.x),
    y: l.y === "center" ? center(b_).y : loc(b_, l.y),
  };
};

/**
 * @returns a one dimensional coordinate corresponding to the location of the given
 * side of the box i.e. the x coordinate of the left side, the y coordinate of the
 * top side, etc.
 */
export const loc = (b: Crude, loc: location.Location): number => {
  const b_ = construct(b);
  const f = location.xyCouple(b_.root).includes(loc) ? Math.min : Math.max;
  return location.X_LOCATIONS.includes(loc as location.X)
    ? f(b_.one.x, b_.two.x)
    : f(b_.one.y, b_.two.y);
};

export const locPoint = (b: Box, loc_: location.Location): xy.XY => {
  const l = loc(b, loc_);
  if (location.X_LOCATIONS.includes(loc_ as location.X))
    return { x: l, y: center(b).y };
  return { x: center(b).x, y: l };
};

export const isZero = (b: Box): boolean => {
  return b.one.x === b.two.x && b.one.y === b.two.y;
};

export const width = (b: Crude): number => dim(b, "x");

export const height = (b: Crude): number => dim(b, "y");

export const signedWidth = (b: Crude): number => {
  const b_ = construct(b);
  return b_.two.x - b_.one.x;
};

export const signedHeight = (b: Crude): number => {
  const b_ = construct(b);
  return b_.two.y - b_.one.y;
};

export const topLeft = (b: Crude): xy.XY => xyLoc(b, location.TOP_LEFT);

export const topRight = (b: Crude): xy.XY => xyLoc(b, location.TOP_RIGHT);

export const bottomLeft = (b: Crude): xy.XY => xyLoc(b, location.BOTTOM_LEFT);

export const bottomRight = (b: Crude): xy.XY => xyLoc(b, location.BOTTOM_RIGHT);

export const right = (b: Crude): number => loc(b, "right");

export const bottom = (b: Crude): number => loc(b, "bottom");

export const left = (b: Crude): number => loc(b, "left");

export const top = (b: Crude): number => loc(b, "top");

export const center = (b: Crude): xy.XY =>
  xy.translate(topLeft(b), {
    x: signedWidth(b) / 2,
    y: signedHeight(b) / 2,
  });

export const x = (b: Crude): number => {
  const b_ = construct(b);
  return b_.root.x === "left" ? left(b_) : right(b_);
};

export const y = (b: Crude): number => {
  const b_ = construct(b);
  return b_.root.y === "top" ? top(b_) : bottom(b_);
};

export const root = (b: Crude): xy.XY => ({ x: x(b), y: y(b) });

export const xBounds = (b: Crude): bounds.Bounds => {
  const b_ = construct(b);
  return { lower: b_.one.x, upper: b_.two.x };
};

export const yBounds = (b: Crude): bounds.Bounds => {
  const b_ = construct(b);
  return { lower: b_.one.y, upper: b_.two.y };
};

export const reRoot = (b: Box, corner: location.CornerXY): Box => copy(b, corner);

/**
 * Reposition a box so that it is visible within a given bound.
 *
 * @param target The box to reposition - Only works if the root is topLeft
 * @param bound The box to reposition within - Only works if the root is topLeft
 *
 * @returns the repsoitioned box and a boolean indicating if the box was repositioned
 * or not.
 */
export const positionSoVisible = (
  target_: Crude,
  bound_: Crude,
): [Box, boolean] => {
  const target = construct(target_);
  const bound = construct(bound_);
  if (contains(bound, target)) return [target, false];
  let nextPos: xy.XY;
  if (right(target) > width(target))
    nextPos = xy.construct({ x: x(target) - width(target), y: y(target) });
  else nextPos = xy.construct({ x: x(target), y: y(target) - height(target) });
  return [construct(nextPos, dims(target)), true];
};

/**
 * Reposition a box so that it is centered within a given bound.
 *
 * @param target The box to reposition - Only works if the root is topLeft
 * @param bound The box to reposition within - Only works if the root is topLeft
 * @returns the repsoitioned box
 */
export const positionInCenter = (
  target_: Crude,
  bound_: Crude,
): Box => {
  const target = construct(target_);
  const bound = construct(bound_);
  const x_ = x(bound) + (width(bound) - width(target)) / 2;
  const y_ = y(bound) + (height(bound) - height(target)) / 2;
  return construct({ x: x_, y: y_ }, dims(target));
};

export const isBox = (value: unknown): value is Box => {
  if (typeof value !== "object" || value == null) return false;
  return "one" in value && "two" in value && "root" in value;
};

export const aspect = (b: Box): number => width(b) / height(b);

export const translate = (b: Box, t: xy.XY): Box => {
  const b_ = construct(b);
  return construct(
    xy.translate(b_.one, t),
    xy.translate(b_.two, t),
    undefined,
    undefined,
    b_.root,
  );
}