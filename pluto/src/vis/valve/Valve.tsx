// Copyrght 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { ComponentPropsWithoutRef, ReactElement } from "react";

import { CrudeDirection, Dimensions, Direction } from "@synnaxlabs/x";
import { z } from "zod";

import { Aether } from "@/aether";
import { Color } from "@/color";
import { CSS } from "@/css";
import { valve } from "@/vis/valve/aether";

import "@/vis/valve/Valve.css";

export interface ValveProps
  extends Omit<z.input<typeof valve.valveStateZ>, "triggered" | "active">,
    Omit<ComponentPropsWithoutRef<"button">, "color"> {
  color?: Color.Crude;
  label?: string;
  direction?: CrudeDirection;
}

const BASE_VALVE_DIMS = new Dimensions({
  width: 106,
  height: 54,
});

export const Valve = Aether.wrap<ValveProps>(
  valve.Valve.TYPE,
  ({
    aetherKey,
    color,
    style = {},
    className,
    source,
    sink,
    direction = "x",
    ...props
  }): ReactElement => {
    const [, { triggered, active }, setState] = Aether.use({
      aetherKey,
      type: valve.Valve.TYPE,
      schema: valve.valveStateZ,
      initialState: {
        triggered: false,
        active: false,
        source,
        sink,
      },
    });

    const handleClick = (): void =>
      setState((state) => ({ ...state, triggered: !state.triggered }));

    const dir = new Direction(direction);
    const dims = dir.isY ? BASE_VALVE_DIMS.swap() : BASE_VALVE_DIMS;

    // @ts-expect-error
    if (color != null) style[CSS.var("base-color")] = new Color.Color(color).rgbString;
    return (
      <button
        className={CSS(
          className,
          CSS.B("valve"),
          triggered && CSS.BM("valve", "triggered"),
          active && CSS.BM("valve", "active"),
          CSS.dir(direction)
        )}
        onClick={handleClick}
        style={style}
        {...props}
      >
        <svg
          width={dims.width * 0.75}
          height={dims.height * 0.75}
          viewBox={dims.svgViewBox()}
        >
          <path d="M52 25.5L4.88003 2.41121C3.55123 1.7601 2 2.72744 2 4.20719V47.7349C2 49.2287 3.57798 50.1952 4.90865 49.5166L52 25.5ZM52 25.5L99.12 2.41121C100.449 1.7601 102 2.72744 102 4.2072V47.7349C102 49.2287 100.422 50.1952 99.0913 49.5166L52 25.5Z" />
        </svg>
      </button>
    );
  }
);
