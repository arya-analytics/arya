// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type CSSProperties, type ReactElement, forwardRef } from "react";

import { box } from "@synnaxlabs/x";

import { CSS } from "@/css";
import { type UseReturn, type Mode } from "@/viewport/use";

import "@/viewport/Mask.css";

type DivProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>;

export interface MaskProps
  extends Omit<UseReturn, "ref">,
    Omit<DivProps, "onDragStart" | "onDragEnd" | "onDrag" | "ref" | "onDoubleClick"> {}

const MODE_CURSORS: Record<Mode, CSSProperties["cursor"]> = {
  select: "pointer",
  zoom: "crosshair",
  pan: "grab",
  zoomReset: "crosshair",
  click: "pointer",
};

export const Mask = forwardRef<HTMLDivElement, MaskProps>(
  (
    { className, mode, maskBox, children, style, ...props },
    ref,
  ): ReactElement | null => (
    <div
      ref={ref}
      className={CSS(CSS.noSelect, CSS.BE("viewport-mask", "container"), className)}
      style={{
        cursor: MODE_CURSORS[mode],
        ...style,
      }}
      {...props}
    >
      <div
        style={{
          ...box.css(maskBox),
          display: box.areaIsZero(maskBox) ? "none" : "block",
        }}
        className={CSS.BE("viewport-mask", "selection")}
      />
      {children}
    </div>
  ),
);
Mask.displayName = "ZoomPanMask";
