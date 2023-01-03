// Copyright 2022 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { useCallback, useState } from "react";

import { ResizeCore, ResizeCoreProps } from "./ResizeCore";

import { useDrag } from "@/hooks/useDrag";
import { clamp } from "@/util/clamp";
import { getDirection, Location } from "@/util/spatial";

import "./Resize.css";

export interface ResizePanelProps extends Omit<ResizeCoreProps, "showHandle" | "size"> {
  location: Location;
  initialSize?: number;
  minSize?: number;
  maxSize?: number;
  onResize?: (size: number) => void;
}

interface ResizeState {
  size: number;
  root: number | null;
  marker: number | null;
}

export const Resize = ({
  location = "left",
  minSize = 100,
  maxSize = Infinity,
  initialSize = 200,
  onResize,
  ...props
}: ResizePanelProps): JSX.Element => {
  const [size, setSize] = useState<ResizeState>({
    size: initialSize,
    root: 0,
    marker: 0,
  });

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      setSize((prev) => calcNextSize(e, location, prev, minSize, maxSize));
      onResize?.(size.size);
    },
    [onResize, location, minSize, maxSize, size]
  );

  const dragProps = useDrag({
    onStart: (e) => {
      setSize((prev) => ({
        ...prev,
        root: getDirection(location) === "vertical" ? e.clientX : e.clientY,
        marker: prev.size,
      }));
    },
    onMove: onMouseMove,
    onEnd: () => {
      setSize((prev) => ({ ...prev, root: null, marker: null }));
    },
  });

  return (
    <ResizeCore
      draggable
      location={location}
      size={size.size}
      {...props}
      {...dragProps}
    />
  );
};

export const calcNextSize = (
  e: MouseEvent,
  location: Location,
  prev: ResizeState,
  minSize: number,
  maxSize: number
): ResizeState => {
  if (prev.root === null || prev.marker === null) return prev;
  const curr = getDirection(location) === "vertical" ? e.clientX : e.clientY;
  let mov = curr - prev.root;
  if (location === "right" || location === "bottom") mov *= -1;
  return {
    ...prev,
    size: clamp(prev.marker + mov, minSize, maxSize),
  };
};

export const anyExceedsBounds = (nums: number[], min: number, max: number): boolean => {
  return nums.some((num) => num < min || num > max);
};
